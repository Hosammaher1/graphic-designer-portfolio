<?php

namespace Tests\Feature\Projects;

use App\Models\Category;
use App\Models\CategoryTranslation;
use App\Models\MediaAsset;
use App\Models\Project;
use App\Models\ProjectMedia;
use App\Models\ProjectTranslation;
use App\Models\Tool;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicProjectsApiTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['is_admin' => true]);
    }

    public function test_admin_can_publish_and_unpublish_project(): void
    {
        $admin = $this->admin();
        $project = Project::factory()->create(['status' => 'draft']);
        ProjectTranslation::factory()->create(['project_id' => $project->id, 'locale' => 'ar', 'title' => 'مشروع أولي']);
        ProjectTranslation::factory()->create(['project_id' => $project->id, 'locale' => 'en', 'title' => 'Initial Project']);

        // Publish
        $response = $this->actingAs($admin)->postJson("/api/v1/admin/projects/{$project->id}/publish");
        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.project.status', 'published');

        $fresh = $project->fresh();
        $this->assertEquals('published', $fresh->status);
        $this->assertNotNull($fresh->published_at);
        $this->assertIsArray($fresh->published_snapshot);
        $this->assertEquals('مشروع أولي', $fresh->published_snapshot['translations']['ar']['title']);

        // Unpublish
        $unpublishResponse = $this->actingAs($admin)->postJson("/api/v1/admin/projects/{$project->id}/unpublish");
        $unpublishResponse->assertStatus(200)
            ->assertJsonPath('data.project.status', 'draft');

        $this->assertEquals('draft', $project->fresh()->status);
    }

    public function test_public_projects_index_strictly_excludes_draft_and_trashed_projects(): void
    {
        $admin = $this->admin();

        // 1. Published project
        $published = Project::factory()->create(['slug' => 'published-work', 'status' => 'draft']);
        ProjectTranslation::factory()->create(['project_id' => $published->id, 'locale' => 'ar', 'title' => 'عمل منشور']);
        ProjectTranslation::factory()->create(['project_id' => $published->id, 'locale' => 'en', 'title' => 'Published Work']);
        $this->actingAs($admin)->postJson("/api/v1/admin/projects/{$published->id}/publish");

        // 2. Draft project
        $draft = Project::factory()->create(['slug' => 'draft-work', 'status' => 'draft']);
        ProjectTranslation::factory()->create(['project_id' => $draft->id, 'locale' => 'ar', 'title' => 'مسودة سرية']);

        // 3. Trashed project
        $trashed = Project::factory()->create(['slug' => 'trashed-work', 'status' => 'draft']);
        $this->actingAs($admin)->postJson("/api/v1/admin/projects/{$trashed->id}/publish");
        $trashed->delete();

        // Anonymous public request
        $response = $this->getJson('/api/v1/projects?locale=ar');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonCount(1, 'data.projects.data')
            ->assertJsonPath('data.projects.data.0.slug', 'published-work');
    }

    public function test_public_project_detail_returns_404_for_draft_projects(): void
    {
        $draft = Project::factory()->create(['slug' => 'hidden-draft', 'status' => 'draft']);

        $response = $this->getJson('/api/v1/projects/hidden-draft');

        $response->assertStatus(404);
    }

    public function test_public_api_reads_from_immutable_snapshot_so_draft_edits_never_leak(): void
    {
        $admin = $this->admin();

        // 1. Create and publish project
        $project = Project::factory()->create(['slug' => 'snapshot-test', 'status' => 'draft']);
        $transAr = ProjectTranslation::factory()->create([
            'project_id' => $project->id,
            'locale'     => 'ar',
            'title'      => 'العنوان الأصلي المنشور',
        ]);
        $transEn = ProjectTranslation::factory()->create([
            'project_id' => $project->id,
            'locale'     => 'en',
            'title'      => 'Original Published Title',
        ]);

        $this->actingAs($admin)->postJson("/api/v1/admin/projects/{$project->id}/publish");

        // 2. Admin edits the draft translation without publishing
        $transAr->update(['title' => 'عنوان مسودة سري مسرب!']);
        $transEn->update(['title' => 'Secret Leaked Draft Title!']);

        // 3. Public API request must still return the immutable published snapshot!
        $publicAr = $this->getJson('/api/v1/projects/snapshot-test?locale=ar');
        $publicAr->assertStatus(200)
            ->assertJsonPath('data.project.title', 'العنوان الأصلي المنشور');

        $publicEn = $this->getJson('/api/v1/projects/snapshot-test?locale=en');
        $publicEn->assertStatus(200)
            ->assertJsonPath('data.project.title', 'Original Published Title');

        // 4. Admin re-publishes project
        $this->actingAs($admin)->postJson("/api/v1/admin/projects/{$project->id}/publish");

        // 5. Public API now reflects newly published version
        $updatedPublic = $this->getJson('/api/v1/projects/snapshot-test?locale=ar');
        $updatedPublic->assertStatus(200)
            ->assertJsonPath('data.project.title', 'عنوان مسودة سري مسرب!');
    }

    public function test_admin_can_preview_draft_project_with_noindex_header(): void
    {
        $admin = $this->admin();
        $project = Project::factory()->create(['slug' => 'preview-project', 'status' => 'draft']);
        ProjectTranslation::factory()->create(['project_id' => $project->id, 'locale' => 'en', 'title' => 'Draft In Progress']);

        // Unauthenticated visitor is blocked from preview
        $anonResponse = $this->getJson("/api/v1/admin/projects/{$project->id}/preview");
        $anonResponse->assertStatus(401);

        // Authenticated admin can preview draft
        $authResponse = $this->actingAs($admin)->getJson("/api/v1/admin/projects/{$project->id}/preview");
        $authResponse->assertStatus(200)
            ->assertHeader('X-Robots-Tag', 'noindex, nofollow')
            ->assertHeader('Cache-Control', 'no-store, private')
            ->assertJsonPath('data.project.title', 'Draft In Progress');
    }

    public function test_public_detail_view_increments_view_count(): void
    {
        $admin = $this->admin();
        $project = Project::factory()->create(['slug' => 'view-counter-proj', 'status' => 'draft', 'view_count' => 5]);
        ProjectTranslation::factory()->create(['project_id' => $project->id, 'locale' => 'en', 'title' => 'Popular Work']);
        $this->actingAs($admin)->postJson("/api/v1/admin/projects/{$project->id}/publish");

        $this->getJson('/api/v1/projects/view-counter-proj');

        $this->assertEquals(6, $project->fresh()->view_count);
    }
}
