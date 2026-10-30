<?php

namespace Tests\Feature\Projects;

use App\Models\Category;
use App\Models\CategoryTranslation;
use App\Models\MediaAsset;
use App\Models\Project;
use App\Models\ProjectMedia;
use App\Models\ProjectTranslation;
use App\Models\Tool;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProjectSchemaTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_project_with_translations_categories_tools_and_media_using_factories(): void
    {
        $project = Project::factory()->create([
            'slug' => 'brand-identity-mohammed',
            'status' => 'draft',
            'year' => 2026,
            'client' => 'Creative Agency',
        ]);

        $arTranslation = ProjectTranslation::factory()->create([
            'project_id' => $project->id,
            'locale' => 'ar',
            'title' => 'هوية بصرية استثنائية',
            'summary' => 'مشروع تصميم هوية بصرية كاملة',
            'description' => 'تفاصيل الهوية البصرية والعناصر الفنية المستخدمة.',
            'seo_title' => 'هوية بصرية | محمد ماهر',
            'seo_description' => 'تصميم هوية بصرية احترافية.',
        ]);

        $enTranslation = ProjectTranslation::factory()->create([
            'project_id' => $project->id,
            'locale' => 'en',
            'title' => 'Exceptional Brand Identity',
            'summary' => 'Full corporate branding design project',
            'description' => 'Detailed case study on visual identity system.',
            'seo_title' => 'Brand Identity | Mohammed Maher',
            'seo_description' => 'Professional visual branding case study.',
        ]);

        $category = Category::factory()->create(['slug' => 'branding', 'sort_order' => 1]);
        CategoryTranslation::factory()->create([
            'category_id' => $category->id,
            'locale' => 'ar',
            'name' => 'الهوية البصرية',
        ]);
        CategoryTranslation::factory()->create([
            'category_id' => $category->id,
            'locale' => 'en',
            'name' => 'Visual Identity',
        ]);

        $tool = Tool::factory()->create(['name' => 'Adobe Illustrator', 'slug' => 'adobe-illustrator']);

        $media = MediaAsset::factory()->create([
            'file_name' => 'mockup-1.jpg',
            'mime_type' => 'image/jpeg',
            'width' => 1920,
            'height' => 1080,
            'bytes' => 204800,
        ]);

        // Attach category and tool
        $project->categories()->attach($category->id);
        $project->tools()->attach($tool->id);

        // Attach media via pivot
        ProjectMedia::factory()->create([
            'project_id' => $project->id,
            'media_asset_id' => $media->id,
            'sort_order' => 1,
            'is_cover' => true,
            'caption_ar' => 'نموذج الشعار الأساسي',
            'caption_en' => 'Primary logo mockup',
        ]);

        $project->update(['cover_media_id' => $media->id]);

        $this->assertDatabaseHas('projects', [
            'id' => $project->id,
            'slug' => 'brand-identity-mohammed',
            'status' => 'draft',
            'cover_media_id' => $media->id,
        ]);

        $this->assertCount(2, $project->fresh()->translations);
        $this->assertEquals('هوية بصرية استثنائية', $project->fresh()->translation('ar')?->title);
        $this->assertEquals('Exceptional Brand Identity', $project->fresh()->translation('en')?->title);
        $this->assertCount(1, $project->fresh()->categories);
        $this->assertCount(1, $project->fresh()->tools);
        $this->assertCount(1, $project->fresh()->media);
        $this->assertEquals($media->id, $project->fresh()->coverMedia?->id);
    }

    public function test_project_slug_must_be_unique(): void
    {
        Project::factory()->create(['slug' => 'unique-portfolio-item']);

        $this->expectException(QueryException::class);
        Project::factory()->create(['slug' => 'unique-portfolio-item']);
    }

    public function test_project_translation_enforces_unique_locale_per_project(): void
    {
        $project = Project::factory()->create(['slug' => 'project-locales']);

        ProjectTranslation::factory()->create([
            'project_id' => $project->id,
            'locale' => 'ar',
            'title' => 'عنوان عربي أول',
        ]);

        $this->expectException(QueryException::class);
        ProjectTranslation::factory()->create([
            'project_id' => $project->id,
            'locale' => 'ar',
            'title' => 'عنوان عربي مكرر',
        ]);
    }

    public function test_cascade_delete_removes_translations_and_pivots_on_hard_delete(): void
    {
        $project = Project::factory()->create();
        $translation = ProjectTranslation::factory()->create(['project_id' => $project->id, 'locale' => 'en']);
        $category = Category::factory()->create();
        $project->categories()->attach($category->id);

        $this->assertDatabaseHas('project_translations', ['id' => $translation->id]);
        $this->assertDatabaseHas('category_project', ['project_id' => $project->id]);

        // Force delete the project
        $project->forceDelete();

        $this->assertDatabaseMissing('projects', ['id' => $project->id]);
        $this->assertDatabaseMissing('project_translations', ['id' => $translation->id]);
        $this->assertDatabaseMissing('category_project', ['project_id' => $project->id]);
        $this->assertDatabaseHas('categories', ['id' => $category->id]); // Category itself remains intact
    }

    public function test_soft_delete_preserves_project_and_filters_out_trashed_records_by_default(): void
    {
        $project = Project::factory()->create(['status' => 'draft']);

        $project->delete();

        $this->assertSoftDeleted('projects', ['id' => $project->id]);
        $this->assertCount(0, Project::all());
        $this->assertCount(1, Project::withTrashed()->get());

        // Restore project
        $project->restore();
        $this->assertCount(1, Project::all());
    }

    public function test_category_ordering_and_translations(): void
    {
        $catB = Category::factory()->create(['slug' => 'packaging', 'sort_order' => 20]);
        $catA = Category::factory()->create(['slug' => 'typography', 'sort_order' => 10]);

        $ordered = Category::orderBy('sort_order', 'asc')->pluck('slug')->toArray();
        $this->assertEquals(['typography', 'packaging'], $ordered);
    }

    public function test_published_snapshot_can_store_and_retrieve_frozen_published_representation(): void
    {
        $snapshot = [
            'version' => 1,
            'published_at' => now()->toIso8601String(),
            'title' => [
                'ar' => 'هوية منشورة',
                'en' => 'Published Identity',
            ],
            'categories' => ['branding', 'print'],
            'tools' => ['Illustrator', 'Photoshop'],
            'media' => [
                ['id' => 10, 'url' => 'https://res.cloudinary.com/demo/image/upload/sample.jpg', 'is_cover' => true],
            ],
        ];

        $project = Project::factory()->create([
            'status' => 'published',
            'published_snapshot' => $snapshot,
        ]);

        $fresh = $project->fresh();
        $this->assertIsArray($fresh->published_snapshot);
        $this->assertEquals('هوية منشورة', $fresh->published_snapshot['title']['ar']);
        $this->assertEquals('Published Identity', $fresh->published_snapshot['title']['en']);
        $this->assertEquals(10, $fresh->published_snapshot['media'][0]['id']);
    }

    public function test_tool_unique_pivot_prevents_duplicate_relations(): void
    {
        $project = Project::factory()->create();
        $tool = Tool::factory()->create();

        $project->tools()->attach($tool->id);

        $this->expectException(QueryException::class);
        $project->tools()->attach($tool->id);
    }
}
