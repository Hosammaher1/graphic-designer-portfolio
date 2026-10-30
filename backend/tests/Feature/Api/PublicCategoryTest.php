<?php

namespace Tests\Feature\Api;

use App\Models\Category;
use App\Models\CategoryTranslation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicCategoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_list_active_categories_with_translations(): void
    {
        $cat1 = Category::factory()->create(['slug' => 'branding', 'is_active' => true, 'sort_order' => 1]);
        CategoryTranslation::create([
            'category_id' => $cat1->id,
            'locale'      => 'en',
            'name'        => 'Branding Identity',
            'description' => 'Visual branding',
        ]);
        CategoryTranslation::create([
            'category_id' => $cat1->id,
            'locale'      => 'ar',
            'name'        => 'الهوية البصرية',
            'description' => 'تصميم الهويات',
        ]);

        $inactive = Category::factory()->create(['slug' => 'hidden-cat', 'is_active' => false]);

        $responseEn = $this->getJson('/api/v1/categories?locale=en');
        $responseEn->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonCount(1, 'data.categories')
            ->assertJsonPath('data.categories.0.slug', 'branding')
            ->assertJsonPath('data.categories.0.name', 'Branding Identity');

        $responseAr = $this->getJson('/api/v1/categories?locale=ar');
        $responseAr->assertStatus(200)
            ->assertJsonPath('data.categories.0.name', 'الهوية البصرية');
    }
}
