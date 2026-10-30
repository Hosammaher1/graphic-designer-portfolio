<?php

namespace Tests\Feature\Projects;

use App\Models\Category;
use App\Models\CategoryTranslation;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['is_admin' => true]);
    }

    public function test_admin_can_create_category_with_translations(): void
    {
        $response = $this->actingAs($this->admin())->postJson('/api/v1/admin/categories', [
            'slug'       => 'branding',
            'sort_order' => 10,
            'is_active'  => true,
            'translations' => [
                ['locale' => 'ar', 'name' => 'الهوية البصرية'],
                ['locale' => 'en', 'name' => 'Visual Identity'],
            ],
        ]);

        $response->assertStatus(201)->assertJsonPath('status', 'success');
        $this->assertDatabaseHas('categories', ['slug' => 'branding']);
        $this->assertDatabaseHas('category_translations', ['locale' => 'ar', 'name' => 'الهوية البصرية']);
    }

    public function test_duplicate_category_slug_returns_422(): void
    {
        Category::factory()->create(['slug' => 'design']);

        $response = $this->actingAs($this->admin())->postJson('/api/v1/admin/categories', [
            'slug'       => 'design',
            'translations' => [['locale' => 'en', 'name' => 'Design']],
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['slug']);
    }

    public function test_reorder_updates_sort_order_atomically(): void
    {
        $a = Category::factory()->create(['slug' => 'cat-a', 'sort_order' => 5]);
        $b = Category::factory()->create(['slug' => 'cat-b', 'sort_order' => 10]);

        $response = $this->actingAs($this->admin())->patchJson('/api/v1/admin/categories/reorder', [
            'order' => [
                ['id' => $a->id, 'sort_order' => 20],
                ['id' => $b->id, 'sort_order' => 5],
            ],
        ]);

        $response->assertStatus(200)->assertJsonPath('status', 'success');
        $this->assertDatabaseHas('categories', ['id' => $a->id, 'sort_order' => 20]);
        $this->assertDatabaseHas('categories', ['id' => $b->id, 'sort_order' => 5]);
    }

    public function test_deleting_category_does_not_delete_associated_projects(): void
    {
        $admin = $this->admin();
        $category = Category::factory()->create();
        $project  = Project::factory()->create();
        $project->categories()->attach($category->id);

        $this->actingAs($admin)->deleteJson('/api/v1/admin/categories/' . $category->id);

        $this->assertDatabaseMissing('categories', ['id' => $category->id]);
        $this->assertDatabaseHas('projects', ['id' => $project->id]);
    }

    public function test_unauthenticated_cannot_manage_categories(): void
    {
        $response = $this->postJson('/api/v1/admin/categories', ['slug' => 'test']);
        $response->assertStatus(401);
    }
}
