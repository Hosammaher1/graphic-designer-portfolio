<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Project;
use App\Models\ProjectTranslation;
use App\Models\Tool;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SearchFilterSortTest extends TestCase
{
    use RefreshDatabase;

    protected Category $catBranding;
    protected Category $catPackaging;
    protected Category $catDigital;

    protected Tool $toolIllustrator;
    protected Tool $toolPhotoshop;
    protected Tool $toolFigma;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seedFilterSortData();
    }

    protected function seedFilterSortData(): void
    {
        // Categories
        $this->catBranding = Category::create(['slug' => 'branding', 'sort_order' => 1]);
        $this->catPackaging = Category::create(['slug' => 'packaging', 'sort_order' => 2]);
        $this->catDigital = Category::create(['slug' => 'digital', 'sort_order' => 3]);

        // Tools
        $this->toolIllustrator = Tool::create(['name' => 'Adobe Illustrator', 'slug' => 'illustrator']);
        $this->toolPhotoshop = Tool::create(['name' => 'Adobe Photoshop', 'slug' => 'photoshop']);
        $this->toolFigma = Tool::create(['name' => 'Figma', 'slug' => 'figma']);

        // 1. Project A: Branding, 2026, 1500 views, Illustrator + Figma, published 1 day ago
        $pA = Project::create([
            'slug' => 'project-a-branding',
            'status' => 'published',
            'published_at' => now()->subDays(1),
            'year' => 2026,
            'client' => 'Client Alpha',
            'view_count' => 1500,
            'published_snapshot' => [
                'translations' => [
                    'ar' => ['title' => 'مشروع أ - هوية فاخرة', 'summary' => 'هوية تجارية رقمية'],
                    'en' => ['title' => 'Project A - Luxury Brand', 'summary' => 'Digital brand identity'],
                ],
                'categories' => [['slug' => 'branding']],
                'tools' => [['slug' => 'illustrator'], ['slug' => 'figma']],
            ],
        ]);
        $pA->categories()->attach([$this->catBranding->id]);
        $pA->tools()->attach([$this->toolIllustrator->id, $this->toolFigma->id]);
        ProjectTranslation::create(['project_id' => $pA->id, 'locale' => 'ar', 'title' => 'مشروع أ - هوية فاخرة', 'summary' => 'هوية تجارية رقمية']);
        ProjectTranslation::create(['project_id' => $pA->id, 'locale' => 'en', 'title' => 'Project A - Luxury Brand', 'summary' => 'Digital brand identity']);

        // 2. Project B: Packaging, 2025, 3000 views, Photoshop + Illustrator, published 3 days ago
        $pB = Project::create([
            'slug' => 'project-b-packaging',
            'status' => 'published',
            'published_at' => now()->subDays(3),
            'year' => 2025,
            'client' => 'Client Beta',
            'view_count' => 3000,
            'published_snapshot' => [
                'translations' => [
                    'ar' => ['title' => 'مشروع ب - تغليف عصير', 'summary' => 'تغليف عبوات عصير'],
                    'en' => ['title' => 'Project B - Juice Pack', 'summary' => 'Juice bottle packaging'],
                ],
                'categories' => [['slug' => 'packaging']],
                'tools' => [['slug' => 'photoshop'], ['slug' => 'illustrator']],
            ],
        ]);
        $pB->categories()->attach([$this->catPackaging->id]);
        $pB->tools()->attach([$this->toolPhotoshop->id, $this->toolIllustrator->id]);
        ProjectTranslation::create(['project_id' => $pB->id, 'locale' => 'ar', 'title' => 'مشروع ب - تغليف عصير', 'summary' => 'تغليف عبوات عصير']);
        ProjectTranslation::create(['project_id' => $pB->id, 'locale' => 'en', 'title' => 'Project B - Juice Pack', 'summary' => 'Juice bottle packaging']);

        // 3. Project C: Digital, 2024, 500 views, Figma, published 5 days ago
        $pC = Project::create([
            'slug' => 'project-c-digital',
            'status' => 'published',
            'published_at' => now()->subDays(5),
            'year' => 2024,
            'client' => 'Client Gamma',
            'view_count' => 500,
            'published_snapshot' => [
                'translations' => [
                    'ar' => ['title' => 'مشروع ج - واجهات تفاعلية', 'summary' => 'تصميم واجهات تطبيقات'],
                    'en' => ['title' => 'Project C - UI Design', 'summary' => 'Mobile app UI design'],
                ],
                'categories' => [['slug' => 'digital']],
                'tools' => [['slug' => 'figma']],
            ],
        ]);
        $pC->categories()->attach([$this->catDigital->id]);
        $pC->tools()->attach([$this->toolFigma->id]);
        ProjectTranslation::create(['project_id' => $pC->id, 'locale' => 'ar', 'title' => 'مشروع ج - واجهات تفاعلية', 'summary' => 'تصميم واجهات تطبيقات']);
        ProjectTranslation::create(['project_id' => $pC->id, 'locale' => 'en', 'title' => 'Project C - UI Design', 'summary' => 'Mobile app UI design']);
    }

    public function test_filter_by_single_category(): void
    {
        $response = $this->getJson('/api/v1/search?category=branding');

        $response->assertStatus(200)
            ->assertJsonPath('data.meta.total', 1)
            ->assertJsonPath('data.projects.0.slug', 'project-a-branding');
    }

    public function test_filter_by_single_tool(): void
    {
        $response = $this->getJson('/api/v1/search?tool=figma');

        $response->assertStatus(200)
            ->assertJsonPath('data.meta.total', 2);

        $slugs = collect($response->json('data.projects'))->pluck('slug')->all();
        $this->assertContains('project-a-branding', $slugs);
        $this->assertContains('project-c-digital', $slugs);
    }

    public function test_filter_by_year(): void
    {
        $response = $this->getJson('/api/v1/search?year=2025');

        $response->assertStatus(200)
            ->assertJsonPath('data.meta.total', 1)
            ->assertJsonPath('data.projects.0.slug', 'project-b-packaging');
    }

    public function test_combined_filters_returns_intersection(): void
    {
        // Category=branding AND tool=illustrator AND year=2026
        $response = $this->getJson('/api/v1/search?category=branding&tool=illustrator&year=2026');

        $response->assertStatus(200)
            ->assertJsonPath('data.meta.total', 1)
            ->assertJsonPath('data.projects.0.slug', 'project-a-branding');
    }

    public function test_combined_filters_with_no_matches_returns_clean_empty_result(): void
    {
        // Category=packaging AND tool=figma (no projects have both)
        $response = $this->getJson('/api/v1/search?category=packaging&tool=figma');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.meta.total', 0)
            ->assertJsonPath('data.projects', []);
    }

    public function test_sort_by_newest_orders_by_published_at_desc(): void
    {
        $response = $this->getJson('/api/v1/search?sort=newest');

        $response->assertStatus(200);
        $slugs = collect($response->json('data.projects'))->pluck('slug')->all();

        // Project A (sub 1 day), Project B (sub 3 days), Project C (sub 5 days)
        $this->assertEquals(['project-a-branding', 'project-b-packaging', 'project-c-digital'], $slugs);
    }

    public function test_sort_by_oldest_orders_by_published_at_asc(): void
    {
        $response = $this->getJson('/api/v1/search?sort=oldest');

        $response->assertStatus(200);
        $slugs = collect($response->json('data.projects'))->pluck('slug')->all();

        // Project C (sub 5 days), Project B (sub 3 days), Project A (sub 1 day)
        $this->assertEquals(['project-c-digital', 'project-b-packaging', 'project-a-branding'], $slugs);
    }

    public function test_sort_by_most_viewed_orders_by_view_count_desc(): void
    {
        $response = $this->getJson('/api/v1/search?sort=most_viewed');

        $response->assertStatus(200);
        $slugs = collect($response->json('data.projects'))->pluck('slug')->all();

        // Project B (3000), Project A (1500), Project C (500)
        $this->assertEquals(['project-b-packaging', 'project-a-branding', 'project-c-digital'], $slugs);
    }

    public function test_sort_maintains_stable_deterministic_ordering_with_tiebreaker(): void
    {
        // When projects have identical year/views, tiebreaker 'id desc' keeps ordering deterministic
        $response1 = $this->getJson('/api/v1/search?sort=newest&per_page=2&page=1');
        $response2 = $this->getJson('/api/v1/search?sort=newest&per_page=2&page=2');

        $response1->assertStatus(200);
        $response2->assertStatus(200);

        $page1Slugs = collect($response1->json('data.projects'))->pluck('slug')->all();
        $page2Slugs = collect($response2->json('data.projects'))->pluck('slug')->all();

        // No duplicates across pages
        $intersect = array_intersect($page1Slugs, $page2Slugs);
        $this->assertEmpty($intersect);
    }

    public function test_invalid_sort_parameter_is_rejected_with_422(): void
    {
        $response = $this->getJson('/api/v1/search?sort=invalid_column_injection');

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['sort'])
            ->assertJsonPath('errors.sort.0', 'The selected sort is invalid.');
    }

    public function test_public_projects_index_also_validates_and_supports_sorting(): void
    {
        // Verify /api/v1/projects endpoint supports same sorting allowlist
        $responseValid = $this->getJson('/api/v1/projects?sort=most_viewed');
        $responseValid->assertStatus(200);
        $slugs = collect($responseValid->json('data.projects.data'))->pluck('slug')->all();
        $this->assertEquals(['project-b-packaging', 'project-a-branding', 'project-c-digital'], $slugs);

        // Invalid sort on projects endpoint returns 422
        $responseInvalid = $this->getJson('/api/v1/projects?sort=unapproved');
        $responseInvalid->assertStatus(422)
            ->assertJsonValidationErrors(['sort']);
    }
}
