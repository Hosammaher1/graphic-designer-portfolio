<?php

namespace Tests\Feature\Projects;

use App\Models\AuditLog;
use App\Models\Category;
use App\Models\CategoryTranslation;
use App\Models\MediaAsset;
use App\Models\Project;
use App\Models\ProjectMedia;
use App\Models\ProjectTranslation;
use App\Models\Tool;
use App\Models\User;
use App\Services\Media\MediaStorageInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Mockery;
use Tests\TestCase;

class ProjectTrashTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['is_admin' => true]);
    }

    public function test_soft_deleted_projects_are_hidden_from_public_and_admin_index_but_visible_in_trash(): void
    {
        $admin = $this->admin();

        $active = Project::factory()->create(['slug' => 'active-project', 'status' => 'published']);
        ProjectTranslation::factory()->create(['project_id' => $active->id, 'locale' => 'en', 'title' => 'Active Project']);

        $trashed = Project::factory()->create(['slug' => 'trashed-project', 'status' => 'published']);
        ProjectTranslation::factory()->create(['project_id' => $trashed->id, 'locale' => 'en', 'title' => 'Trashed Project']);
        $trashed->delete(); // Soft delete

        // 1. Admin normal list excludes trashed
        $adminIndex = $this->actingAs($admin)->getJson('/api/v1/admin/projects');
        $adminIndex->assertStatus(200)
            ->assertJsonPath('data.projects.total', 1)
            ->assertJsonPath('data.projects.data.0.slug', 'active-project');

        // 2. Public API excludes trashed
        $publicIndex = $this->getJson('/api/v1/projects');
        $publicIndex->assertStatus(200)
            ->assertJsonMissing(['slug' => 'trashed-project']);

        $publicShow = $this->getJson('/api/v1/projects/trashed-project');
        $publicShow->assertStatus(404);

        // 3. Admin trash endpoint lists trashed
        $trashResponse = $this->actingAs($admin)->getJson('/api/v1/admin/projects/trash');
        $trashResponse->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.projects.total', 1)
            ->assertJsonPath('data.projects.data.0.slug', 'trashed-project');
    }

    public function test_admin_can_restore_soft_deleted_project(): void
    {
        $admin = $this->admin();
        $project = Project::factory()->create(['slug' => 'to-restore', 'status' => 'draft']);
        ProjectTranslation::factory()->create(['project_id' => $project->id, 'locale' => 'en', 'title' => 'Restore Me']);
        $project->delete();

        $this->assertSoftDeleted('projects', ['id' => $project->id]);

        $response = $this->actingAs($admin)->postJson("/api/v1/admin/projects/{$project->id}/restore");
        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.project.slug', 'to-restore');

        $this->assertNotSoftDeleted('projects', ['id' => $project->id]);

        // Audit log verified
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'project.restored',
            'user_id' => $admin->id,
        ]);
    }

    public function test_admin_can_force_delete_project_and_unshared_media_is_pruned_while_shared_is_preserved(): void
    {
        $admin = $this->admin();

        $mockStorage = Mockery::mock(MediaStorageInterface::class);
        $this->app->instance(MediaStorageInterface::class, $mockStorage);

        // Unique asset: should be deleted from storage
        $uniqueAsset = MediaAsset::factory()->create(['provider_id' => 'portfolio/unique_123']);
        // Shared asset: attached to both projects, should NOT be deleted from storage
        $sharedAsset = MediaAsset::factory()->create(['provider_id' => 'portfolio/shared_456']);

        $projectA = Project::factory()->create(['slug' => 'project-a']);
        ProjectTranslation::factory()->create(['project_id' => $projectA->id, 'locale' => 'en', 'title' => 'Project A']);
        ProjectMedia::factory()->create(['project_id' => $projectA->id, 'media_asset_id' => $uniqueAsset->id]);
        ProjectMedia::factory()->create(['project_id' => $projectA->id, 'media_asset_id' => $sharedAsset->id]);

        $projectB = Project::factory()->create(['slug' => 'project-b']);
        ProjectTranslation::factory()->create(['project_id' => $projectB->id, 'locale' => 'en', 'title' => 'Project B']);
        ProjectMedia::factory()->create(['project_id' => $projectB->id, 'media_asset_id' => $sharedAsset->id]);

        $projectA->delete();

        // Expectations: delete called ONLY for unique asset, NEVER for shared asset
        $mockStorage->shouldReceive('delete')
            ->once()
            ->with('portfolio/unique_123')
            ->andReturn(true);

        $mockStorage->shouldNotReceive('delete')
            ->with('portfolio/shared_456');

        $response = $this->actingAs($admin)->deleteJson("/api/v1/admin/projects/{$projectA->id}/force");
        $response->assertStatus(200)
            ->assertJsonPath('status', 'success');

        // Project A is completely gone from DB
        $this->assertDatabaseMissing('projects', ['id' => $projectA->id]);
        $this->assertDatabaseMissing('project_translations', ['project_id' => $projectA->id]);
        $this->assertDatabaseMissing('media_assets', ['id' => $uniqueAsset->id]);

        // Shared asset is preserved in DB for Project B
        $this->assertDatabaseHas('media_assets', ['id' => $sharedAsset->id]);
        $this->assertDatabaseHas('projects', ['id' => $projectB->id]);

        // Audit log verified
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'project.force_deleted',
            'user_id' => $admin->id,
        ]);
    }

    public function test_scheduled_purge_command_only_purges_projects_older_than_cutoff(): void
    {
        $mockStorage = Mockery::mock(MediaStorageInterface::class);
        $mockStorage->shouldReceive('delete')->andReturn(true);
        $this->app->instance(MediaStorageInterface::class, $mockStorage);

        // Project 1: deleted 35 days ago (should be purged)
        $expired = Project::factory()->create(['slug' => 'expired-proj']);
        ProjectTranslation::factory()->create(['project_id' => $expired->id, 'locale' => 'en', 'title' => 'Expired']);
        $expired->delete();
        Project::withTrashed()->where('id', $expired->id)->update(['deleted_at' => now()->subDays(35)]);

        // Project 2: deleted 10 days ago (should be kept)
        $recent = Project::factory()->create(['slug' => 'recent-proj']);
        ProjectTranslation::factory()->create(['project_id' => $recent->id, 'locale' => 'en', 'title' => 'Recent']);
        $recent->delete();
        Project::withTrashed()->where('id', $recent->id)->update(['deleted_at' => now()->subDays(10)]);

        // Run command with default 30-day cutoff
        $exitCode = Artisan::call('projects:purge-trash', ['--days' => 30]);
        $this->assertEquals(0, $exitCode);

        // Expired project is completely deleted
        $this->assertDatabaseMissing('projects', ['id' => $expired->id]);

        // Recent project is still in database (trashed)
        $this->assertSoftDeleted('projects', ['id' => $recent->id]);

        // Audit log recorded for purge
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'project.purged_by_schedule',
        ]);
    }

    public function test_scheduled_purge_retries_provider_failure_gracefully_without_fatal_error(): void
    {
        $mockStorage = Mockery::mock(MediaStorageInterface::class);
        $this->app->instance(MediaStorageInterface::class, $mockStorage);

        $asset = MediaAsset::factory()->create(['provider_id' => 'portfolio/flakey_asset']);
        $expired = Project::factory()->create(['slug' => 'flakey-proj']);
        ProjectMedia::factory()->create(['project_id' => $expired->id, 'media_asset_id' => $asset->id]);
        $expired->delete();
        Project::withTrashed()->where('id', $expired->id)->update(['deleted_at' => now()->subDays(40)]);

        // Provider throws exception on delete attempt
        $mockStorage->shouldReceive('delete')
            ->times(3)
            ->with('portfolio/flakey_asset')
            ->andThrow(new \RuntimeException('Cloudinary connection timeout'));

        // Command should handle retries and not crash
        $exitCode = Artisan::call('projects:purge-trash', ['--days' => 30]);
        $this->assertEquals(0, $exitCode);

        // Project itself is purged despite provider failure
        $this->assertDatabaseMissing('projects', ['id' => $expired->id]);
    }

    public function test_unauthenticated_cannot_access_trash_restore_or_force_delete(): void
    {
        $project = Project::factory()->create();
        $project->delete();

        $this->getJson('/api/v1/admin/projects/trash')->assertStatus(401);
        $this->postJson("/api/v1/admin/projects/{$project->id}/restore")->assertStatus(401);
        $this->deleteJson("/api/v1/admin/projects/{$project->id}/force")->assertStatus(401);
    }
}
