<?php

namespace Tests\Feature\Projects;

use App\Models\MediaAsset;
use App\Models\Project;
use App\Models\ProjectMedia;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProjectMediaOrderingTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['is_admin' => true]);
    }

    public function test_admin_can_attach_media_to_project(): void
    {
        $admin = $this->admin();
        $project = Project::factory()->create();
        $asset = MediaAsset::factory()->create();

        $response = $this->actingAs($admin)->postJson("/api/v1/admin/projects/{$project->id}/media", [
            'media_asset_id' => $asset->id,
            'caption_ar'     => 'صورة المعرض الأولى',
            'caption_en'     => 'First Gallery Image',
            'is_cover'       => true,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.project_media.is_cover', true);

        $this->assertDatabaseHas('project_media', [
            'project_id'     => $project->id,
            'media_asset_id' => $asset->id,
            'is_cover'       => true,
        ]);

        $this->assertEquals($asset->id, $project->fresh()->cover_media_id);
    }

    public function test_deterministic_sort_order_reorders_media_items(): void
    {
        $admin = $this->admin();
        $project = Project::factory()->create();
        $assetA = MediaAsset::factory()->create();
        $assetB = MediaAsset::factory()->create();
        $assetC = MediaAsset::factory()->create();

        $pmA = ProjectMedia::factory()->create(['project_id' => $project->id, 'media_asset_id' => $assetA->id, 'sort_order' => 1]);
        $pmB = ProjectMedia::factory()->create(['project_id' => $project->id, 'media_asset_id' => $assetB->id, 'sort_order' => 2]);
        $pmC = ProjectMedia::factory()->create(['project_id' => $project->id, 'media_asset_id' => $assetC->id, 'sort_order' => 3]);

        // Reorder: C(1), A(2), B(3)
        $response = $this->actingAs($admin)->patchJson("/api/v1/admin/projects/{$project->id}/media/reorder", [
            'items' => [
                ['id' => $pmC->id, 'sort_order' => 1],
                ['id' => $pmA->id, 'sort_order' => 2],
                ['id' => $pmB->id, 'sort_order' => 3],
            ],
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success');

        $this->assertEquals(1, $pmC->fresh()->sort_order);
        $this->assertEquals(2, $pmA->fresh()->sort_order);
        $this->assertEquals(3, $pmB->fresh()->sort_order);
    }

    public function test_setting_cover_image_ensures_exactly_one_cover(): void
    {
        $admin = $this->admin();
        $project = Project::factory()->create();
        $assetA = MediaAsset::factory()->create();
        $assetB = MediaAsset::factory()->create();

        $pmA = ProjectMedia::factory()->create(['project_id' => $project->id, 'media_asset_id' => $assetA->id, 'is_cover' => true]);
        $pmB = ProjectMedia::factory()->create(['project_id' => $project->id, 'media_asset_id' => $assetB->id, 'is_cover' => false]);
        $project->update(['cover_media_id' => $assetA->id]);

        // Set B as cover
        $response = $this->actingAs($admin)->putJson("/api/v1/admin/projects/{$project->id}/media/{$pmB->id}/cover");

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success');

        $this->assertFalse((bool) $pmA->fresh()->is_cover);
        $this->assertTrue((bool) $pmB->fresh()->is_cover);
        $this->assertEquals($assetB->id, $project->fresh()->cover_media_id);
    }

    public function test_cross_project_media_reorder_is_denied(): void
    {
        $admin = $this->admin();
        $project1 = Project::factory()->create();
        $project2 = Project::factory()->create();

        $pm1 = ProjectMedia::factory()->create(['project_id' => $project1->id]);
        $pm2 = ProjectMedia::factory()->create(['project_id' => $project2->id]);

        $response = $this->actingAs($admin)->patchJson("/api/v1/admin/projects/{$project1->id}/media/reorder", [
            'items' => [
                ['id' => $pm1->id, 'sort_order' => 1],
                ['id' => $pm2->id, 'sort_order' => 2], // Belongs to project 2!
            ],
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('status', 'error');
    }

    public function test_cannot_set_cover_for_media_belonging_to_another_project(): void
    {
        $admin = $this->admin();
        $project1 = Project::factory()->create();
        $project2 = Project::factory()->create();

        $foreignPm = ProjectMedia::factory()->create(['project_id' => $project2->id]);

        $response = $this->actingAs($admin)->putJson("/api/v1/admin/projects/{$project1->id}/media/{$foreignPm->id}/cover");

        $response->assertStatus(404);
    }

    public function test_detaching_media_from_project_removes_pivot_record(): void
    {
        $admin = $this->admin();
        $project = Project::factory()->create();
        $asset = MediaAsset::factory()->create();
        $pm = ProjectMedia::factory()->create([
            'project_id'     => $project->id,
            'media_asset_id' => $asset->id,
            'is_cover'       => true,
        ]);
        $project->update(['cover_media_id' => $asset->id]);

        $response = $this->actingAs($admin)->deleteJson("/api/v1/admin/projects/{$project->id}/media/{$pm->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('project_media', ['id' => $pm->id]);
        $this->assertDatabaseHas('media_assets', ['id' => $asset->id]); // MediaAsset preserved!
        $this->assertNull($project->fresh()->cover_media_id);
    }

    public function test_unauthenticated_cannot_modify_project_media(): void
    {
        $project = Project::factory()->create();

        $response = $this->postJson("/api/v1/admin/projects/{$project->id}/media", [
            'media_asset_id' => 1,
        ]);

        $response->assertStatus(401);
    }
}
