<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Project;
use App\Models\ProjectTranslation;
use App\Models\Tool;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SearchQueryTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed sample projects for search tests
        $this->seedSearchProjects();
    }

    protected function seedSearchProjects(): void
    {
        // 1. Published Project 1: Luxury Branding
        $p1 = Project::create([
            'slug' => 'luxury-branding-concept',
            'status' => 'published',
            'published_at' => now()->subDays(2),
            'year' => 2026,
            'client' => 'Al-Majd Group',
            'published_snapshot' => [
                'translations' => [
                    'ar' => ['title' => 'تصميم هوية بصرية فاخرة', 'summary' => 'مشروع متكامل لتطوير هوية فاخرة لشركة المجد.'],
                    'en' => ['title' => 'Luxury Branding Concept', 'summary' => 'Comprehensive luxury brand identity for Al-Majd.'],
                ],
                'categories' => [['slug' => 'branding', 'name' => 'الهوية البصرية']],
                'tools' => [['slug' => 'illustrator', 'name' => 'Adobe Illustrator']],
            ],
        ]);
        ProjectTranslation::create([
            'project_id' => $p1->id,
            'locale' => 'ar',
            'title' => 'تصميم هوية بصرية فاخرة',
            'summary' => 'مشروع متكامل لتطوير هوية فاخرة لشركة المجد.',
            'description' => 'تفاصيل الهوية البصرية وشعار العلامة التجارية الفاخرة.',
        ]);
        ProjectTranslation::create([
            'project_id' => $p1->id,
            'locale' => 'en',
            'title' => 'Luxury Branding Concept',
            'summary' => 'Comprehensive luxury brand identity for Al-Majd.',
            'description' => 'Detailed luxury branding with corporate guidelines.',
        ]);

        // 2. Published Project 2: Modern Packaging
        $p2 = Project::create([
            'slug' => 'modern-coffee-packaging',
            'status' => 'published',
            'published_at' => now()->subDays(1),
            'year' => 2025,
            'client' => 'Buna Roasters',
            'published_snapshot' => [
                'translations' => [
                    'ar' => ['title' => 'تصميم تغليف قهوة مختصة', 'summary' => 'تصميم أكياس وبوكسات قهوة مختصة عصرية.'],
                    'en' => ['title' => 'Modern Coffee Packaging', 'summary' => 'Specialty coffee box and pouch packaging.'],
                ],
                'categories' => [['slug' => 'packaging', 'name' => 'تصميم التغليف']],
                'tools' => [['slug' => 'photoshop', 'name' => 'Adobe Photoshop']],
            ],
        ]);
        ProjectTranslation::create([
            'project_id' => $p2->id,
            'locale' => 'ar',
            'title' => 'تصميم تغليف قهوة مختصة',
            'summary' => 'تصميم أكياس وبوكسات قهوة مختصة عصرية.',
            'description' => 'أحدث أساليب التغليف الصديق للبيئة مع طباعة رقائق معدنية.',
        ]);
        ProjectTranslation::create([
            'project_id' => $p2->id,
            'locale' => 'en',
            'title' => 'Modern Coffee Packaging',
            'summary' => 'Specialty coffee box and pouch packaging.',
            'description' => 'Sustainable packaging design with foil stamping.',
        ]);

        // 3. Draft Project: Should NEVER appear in public search
        $p3 = Project::create([
            'slug' => 'secret-branding-draft',
            'status' => 'draft',
            'published_at' => null,
            'year' => 2026,
            'client' => 'Confidential Client',
        ]);
        ProjectTranslation::create([
            'project_id' => $p3->id,
            'locale' => 'ar',
            'title' => 'مشروع هوية سرية مسودة',
            'summary' => 'هذه مسودة لهوية سرية يجب ألا تظهر أبداً في البحث العام.',
        ]);
        ProjectTranslation::create([
            'project_id' => $p3->id,
            'locale' => 'en',
            'title' => 'Secret Branding Draft',
            'summary' => 'Unpublished confidential brand identity concept.',
        ]);

        // 4. Soft-deleted / Trashed Project: Should NEVER appear in public search
        $p4 = Project::create([
            'slug' => 'deleted-luxury-project',
            'status' => 'published',
            'published_at' => now()->subMonths(1),
            'year' => 2024,
            'published_snapshot' => [
                'translations' => [
                    'ar' => ['title' => 'مشروع محذوف هوية', 'summary' => 'مشروع قديم تم حذفه.'],
                    'en' => ['title' => 'Deleted Luxury Project', 'summary' => 'Old trashed project.'],
                ],
            ],
        ]);
        ProjectTranslation::create([
            'project_id' => $p4->id,
            'locale' => 'ar',
            'title' => 'مشروع محذوف هوية',
            'summary' => 'مشروع قديم تم حذفه.',
        ]);
        $p4->delete(); // Soft delete
    }

    public function test_can_search_with_english_query(): void
    {
        $response = $this->getJson('/api/v1/search?q=coffee&locale=en');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.query', 'coffee')
            ->assertJsonPath('data.meta.total', 1)
            ->assertJsonPath('data.projects.0.slug', 'modern-coffee-packaging')
            ->assertJsonPath('data.projects.0.title', 'Modern Coffee Packaging');
    }

    public function test_can_search_with_arabic_query(): void
    {
        $response = $this->getJson('/api/v1/search?q=تغليف&locale=ar');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.meta.total', 1)
            ->assertJsonPath('data.projects.0.slug', 'modern-coffee-packaging')
            ->assertJsonPath('data.projects.0.title', 'تصميم تغليف قهوة مختصة');
    }

    public function test_arabic_normalization_matches_alef_variations(): void
    {
        // Project 1 summary has 'المجد' and title has 'هوية'
        // Search with without hamza 'المجد' vs 'ألمجد'
        $response1 = $this->getJson('/api/v1/search?q=المجد&locale=ar');
        $response1->assertStatus(200)
            ->assertJsonPath('data.meta.total', 1)
            ->assertJsonPath('data.projects.0.slug', 'luxury-branding-concept');

        // Search with hamza 'ألمجد' should also match 'المجد'
        $response2 = $this->getJson('/api/v1/search?q=ألمجد&locale=ar');
        $response2->assertStatus(200)
            ->assertJsonPath('data.meta.total', 1)
            ->assertJsonPath('data.projects.0.slug', 'luxury-branding-concept');
    }

    public function test_case_insensitive_matching_for_english_queries(): void
    {
        // Search in ALL CAPS
        $response = $this->getJson('/api/v1/search?q=LUXURY&locale=en');

        $response->assertStatus(200)
            ->assertJsonPath('data.meta.total', 1)
            ->assertJsonPath('data.projects.0.slug', 'luxury-branding-concept');
    }

    public function test_draft_and_trashed_projects_are_strictly_excluded(): void
    {
        // Search for 'branding' which exists in published, draft, and deleted
        $response = $this->getJson('/api/v1/search?q=branding&locale=en');

        $response->assertStatus(200)
            ->assertJsonPath('data.meta.total', 1)
            ->assertJsonPath('data.projects.0.slug', 'luxury-branding-concept');

        $slugs = collect($response->json('data.projects'))->pluck('slug')->all();
        $this->assertNotContains('secret-branding-draft', $slugs);
        $this->assertNotContains('deleted-luxury-project', $slugs);
    }

    public function test_search_pagination_works_deterministically(): void
    {
        $response = $this->getJson('/api/v1/search?q=concept&per_page=1&page=1');

        $response->assertStatus(200)
            ->assertJsonPath('data.meta.per_page', 1)
            ->assertJsonPath('data.meta.current_page', 1)
            ->assertJsonPath('data.meta.total', 1);

        $this->assertCount(1, $response->json('data.projects'));
    }

    public function test_sql_injection_resistance(): void
    {
        $maliciousQueries = [
            "' OR '1'='1",
            "'; DROP TABLE projects; --",
            "1' UNION SELECT * FROM users --",
            "admin'--",
            "%' OR '1'='1' --",
        ];

        foreach ($maliciousQueries as $maliciousQuery) {
            $response = $this->getJson('/api/v1/search?q=' . urlencode($maliciousQuery));

            $response->assertStatus(200)
                ->assertJsonPath('status', 'success');

            // No unapproved projects should leak
            $slugs = collect($response->json('data.projects'))->pluck('slug')->all();
            $this->assertNotContains('secret-branding-draft', $slugs);
            $this->assertNotContains('deleted-luxury-project', $slugs);
        }
    }

    public function test_empty_or_whitespace_query_returns_empty_results_cleanly(): void
    {
        $response = $this->getJson('/api/v1/search?q=' . urlencode('   '));

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.meta.total', 0)
            ->assertJsonPath('data.projects', []);
    }
}
