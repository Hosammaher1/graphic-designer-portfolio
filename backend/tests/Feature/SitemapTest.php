<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class SitemapTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    public function test_sitemap_returns_valid_xml_with_correct_content_type(): void
    {
        $response = $this->get('/sitemap.xml');

        $response->assertStatus(200);
        $this->assertStringContainsString('xml', $response->headers->get('Content-Type'));

        $xml = simplexml_load_string($response->getContent());
        $this->assertNotFalse($xml, 'Sitemap response should be valid parseable XML.');
        $this->assertEquals('urlset', $xml->getName());
    }

    public function test_sitemap_includes_static_routes_with_hreflang_symmetry(): void
    {
        $response = $this->get('/sitemap.xml');
        $content = $response->getContent();

        // Must include all static pages for Arabic and English
        $this->assertStringContainsString('/ar/', $content);
        $this->assertStringContainsString('/en/', $content);
        $this->assertStringContainsString('/ar/work', $content);
        $this->assertStringContainsString('/en/work', $content);
        $this->assertStringContainsString('/ar/about', $content);
        $this->assertStringContainsString('/en/about', $content);
        $this->assertStringContainsString('/ar/contact', $content);
        $this->assertStringContainsString('/en/contact', $content);

        // Hreflang alternate links
        $this->assertStringContainsString('hreflang="ar"', $content);
        $this->assertStringContainsString('hreflang="en"', $content);
        $this->assertStringContainsString('hreflang="x-default"', $content);
    }

    public function test_sitemap_includes_published_projects_and_excludes_draft_and_trashed(): void
    {
        $user = User::factory()->create(['is_admin' => true]);
        $category = Category::create([
            'slug' => 'branding',
            'name' => 'الهويات البصرية',
            'name_ar' => 'الهويات البصرية',
            'name_en' => 'Branding',
        ]);

        // 1. Published project with snapshot
        $publishedProject = Project::create([
            'slug' => 'published-brand-identity',
            'title' => 'مشروع هوية منشورة',
            'status' => 'published',
            'published_at' => now()->subDays(5),
            'published_snapshot' => [
                'title' => 'مشروع هوية منشورة',
                'slug' => 'published-brand-identity',
                'translations' => [
                    'ar' => ['title' => 'مشروع هوية منشورة'],
                    'en' => ['title' => 'Published Brand Identity'],
                ],
            ],
        ]);

        // 2. Draft project (should NOT appear)
        $draftProject = Project::create([
            'slug' => 'draft-secret-project',
            'title' => 'مشروع مسودة سري',
            'status' => 'draft',
            'published_snapshot' => null,
        ]);

        // 3. Trashed project (should NOT appear)
        $trashedProject = Project::create([
            'slug' => 'trashed-old-project',
            'title' => 'مشروع محذوف',
            'status' => 'published',
            'published_snapshot' => ['title' => 'مشروع محذوف'],
        ]);
        $trashedProject->delete(); // Soft delete

        $response = $this->get('/sitemap.xml');
        $content = $response->getContent();

        // Published project must be present in both languages
        $this->assertStringContainsString('/ar/projects/published-brand-identity', $content);
        $this->assertStringContainsString('/en/projects/published-brand-identity', $content);

        // Draft and Trashed must be strictly excluded
        $this->assertStringNotContainsString('draft-secret-project', $content);
        $this->assertStringNotContainsString('trashed-old-project', $content);
    }

    public function test_sitemap_headers_and_caching(): void
    {
        $response = $this->get('/sitemap.xml');
        $response->assertStatus(200);

        // Cache control header present
        $this->assertNotEmpty($response->headers->get('Cache-Control'));

        // Cache hit test
        $this->assertTrue(Cache::has('sitemap_xml'));
    }

    public function test_artisan_sitemap_generate_command(): void
    {
        Cache::forget('sitemap_xml');
        $this->assertFalse(Cache::has('sitemap_xml'));

        $this->artisan('sitemap:generate')
            ->assertExitCode(0);

        $this->assertTrue(Cache::has('sitemap_xml'));
    }

    public function test_project_mutation_invalidates_sitemap_cache(): void
    {
        // Populate cache
        $this->get('/sitemap.xml');
        $this->assertTrue(Cache::has('sitemap_xml'));

        // Mutating a project triggers booted saved listener
        $project = Project::create([
            'slug' => 'dynamic-cache-check',
            'title' => 'اختبار الكاش التلقائي',
            'status' => 'published',
            'published_at' => now(),
        ]);

        $this->assertFalse(Cache::has('sitemap_xml'), 'Cache should be invalidated when a project is created or saved.');

        // Re-cache
        $this->get('/sitemap.xml');
        $this->assertTrue(Cache::has('sitemap_xml'));

        // Soft deleting should also invalidate cache
        $project->delete();
        $this->assertFalse(Cache::has('sitemap_xml'), 'Cache should be invalidated when a project is deleted.');
    }
}
