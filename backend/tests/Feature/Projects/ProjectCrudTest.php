<?php

namespace Tests\Feature\Projects;

use App\Models\Category;
use App\Models\MediaAsset;
use App\Models\Project;
use App\Models\ProjectTranslation;
use App\Models\Tool;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProjectCrudTest extends TestCase
{
    use RefreshDatabase;

    private function adminUser(): User
    {
        return User::factory()->create(['is_admin' => true]);
    }

    // --- CREATE ---

    public function test_admin_can_create_project_with_translations(): void
    {
        $admin = $this->adminUser();

        $response = $this->actingAs($admin)->postJson('/api/v1/admin/projects', [
            'slug' => 'logo-collection',
            'status' => 'draft',
            'year' => 2026,
            'client' => 'Startup Inc.',
            'is_featured' => false,
            'translations' => [
                ['locale' => 'ar', 'title' => 'مجموعة شعارات', 'summary' => 'تصاميم عدة', 'description' => 'وصف طويل للمجموعة'],
                ['locale' => 'en', 'title' => 'Logo Collection', 'summary' => 'Multiple brand logos', 'description' => 'Detailed description'],
            ],
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.project.slug', 'logo-collection')
            ->assertJsonPath('data.project.status', 'draft')
            ->assertJsonPath('data.project.translations.0.title', 'مجموعة شعارات');

        $this->assertDatabaseHas('projects', ['slug' => 'logo-collection']);
        $this->assertDatabaseHas('project_translations', ['locale' => 'ar', 'title' => 'مجموعة شعارات']);
        $this->assertDatabaseHas('project_translations', ['locale' => 'en', 'title' => 'Logo Collection']);
    }

    public function test_duplicate_slug_returns_422(): void
    {
        $admin = $this->adminUser();
        Project::factory()->create(['slug' => 'existing-slug']);

        $response = $this->actingAs($admin)->postJson('/api/v1/admin/projects', [
            'slug' => 'existing-slug',
            'status' => 'draft',
            'translations' => [
                ['locale' => 'ar', 'title' => 'عنوان'],
                ['locale' => 'en', 'title' => 'Title'],
            ],
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['slug']);
    }

    public function test_invalid_status_returns_422(): void
    {
        $admin = $this->adminUser();

        $response = $this->actingAs($admin)->postJson('/api/v1/admin/projects', [
            'slug' => 'some-slug',
            'status' => 'invalid_value',
            'translations' => [
                ['locale' => 'ar', 'title' => 'عنوان'],
                ['locale' => 'en', 'title' => 'Title'],
            ],
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }

    public function test_unauthenticated_cannot_create_project(): void
    {
        $response = $this->postJson('/api/v1/admin/projects', [
            'slug' => 'no-auth',
            'status' => 'draft',
        ]);

        $response->assertStatus(401);
    }

    // --- READ ---

    public function test_admin_can_list_projects_with_pagination(): void
    {
        $admin = $this->adminUser();
        Project::factory()->count(3)->create();

        $response = $this->actingAs($admin)->getJson('/api/v1/admin/projects');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonStructure([
                'data' => [
                    'projects' => ['data', 'total', 'per_page', 'current_page'],
                ],
            ]);
    }

    public function test_admin_can_read_single_project_with_translations(): void
    {
        $admin = $this->adminUser();
        $project = Project::factory()->create(['slug' => 'readable-project']);
        ProjectTranslation::factory()->create(['project_id' => $project->id, 'locale' => 'ar', 'title' => 'مقروء']);
        ProjectTranslation::factory()->create(['project_id' => $project->id, 'locale' => 'en', 'title' => 'Readable']);

        $response = $this->actingAs($admin)->getJson('/api/v1/admin/projects/' . $project->id);

        $response->assertStatus(200)
            ->assertJsonPath('data.project.slug', 'readable-project')
            ->assertJsonCount(2, 'data.project.translations');
    }

    public function test_reading_non_existent_project_returns_404(): void
    {
        $admin = $this->adminUser();

        $response = $this->actingAs($admin)->getJson('/api/v1/admin/projects/9999');

        $response->assertStatus(404);
    }

    // --- UPDATE ---

    public function test_admin_can_update_project_slug_and_translations(): void
    {
        $admin = $this->adminUser();
        $project = Project::factory()->create(['slug' => 'old-slug']);
        ProjectTranslation::factory()->create(['project_id' => $project->id, 'locale' => 'ar', 'title' => 'قديم']);
        ProjectTranslation::factory()->create(['project_id' => $project->id, 'locale' => 'en', 'title' => 'Old Title']);

        $response = $this->actingAs($admin)->putJson('/api/v1/admin/projects/' . $project->id, [
            'slug' => 'new-slug',
            'status' => 'draft',
            'translations' => [
                ['locale' => 'ar', 'title' => 'جديد', 'summary' => 'ملخص'],
                ['locale' => 'en', 'title' => 'New Title', 'summary' => 'Summary'],
            ],
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.project.slug', 'new-slug');

        $this->assertDatabaseHas('projects', ['slug' => 'new-slug']);
        $this->assertDatabaseHas('project_translations', ['title' => 'جديد']);
    }

    // --- DELETE (Soft) ---

    public function test_admin_can_soft_delete_project(): void
    {
        $admin = $this->adminUser();
        $project = Project::factory()->create();

        $response = $this->actingAs($admin)->deleteJson('/api/v1/admin/projects/' . $project->id);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success');

        $this->assertSoftDeleted('projects', ['id' => $project->id]);
    }

    public function test_unauthenticated_cannot_delete_project(): void
    {
        $project = Project::factory()->create();

        $response = $this->deleteJson('/api/v1/admin/projects/' . $project->id);

        $response->assertStatus(401);
    }

    // --- CATEGORIES & TOOLS ATTACH ---

    public function test_admin_can_attach_categories_and_tools_to_project(): void
    {
        $admin = $this->adminUser();
        $project = Project::factory()->create();
        $category = Category::factory()->create();
        $tool = Tool::factory()->create();

        $response = $this->actingAs($admin)->patchJson('/api/v1/admin/projects/' . $project->id . '/relationships', [
            'category_ids' => [$category->id],
            'tool_ids' => [$tool->id],
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('category_project', ['project_id' => $project->id, 'category_id' => $category->id]);
        $this->assertDatabaseHas('project_tool', ['project_id' => $project->id, 'tool_id' => $tool->id]);
    }
}
