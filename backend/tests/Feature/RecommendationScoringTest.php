<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Project;
use App\Models\ProjectTranslation;
use App\Models\Tool;
use App\Services\Recommendations\RecommendationService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RecommendationScoringTest extends TestCase
{
    use RefreshDatabase;

    protected Category $catBranding;
    protected Category $catPackaging;
    protected Category $catDigital;

    protected Tool $toolIllustrator;
    protected Tool $toolPhotoshop;
    protected Tool $toolFigma;

    protected Project $targetProject;

    protected function setUp(): void
    {
        parent::setUp();

        Carbon::setTestNow('2026-10-31 12:00:00');
        $this->seedRecommendationData();
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    protected function seedRecommendationData(): void
    {
        // 1. Setup Taxonomy
        $this->catBranding = Category::create(['slug' => 'branding', 'sort_order' => 1]);
        $this->catPackaging = Category::create(['slug' => 'packaging', 'sort_order' => 2]);
        $this->catDigital = Category::create(['slug' => 'digital', 'sort_order' => 3]);

        $this->toolIllustrator = Tool::create(['name' => 'Illustrator', 'slug' => 'illustrator']);
        $this->toolPhotoshop = Tool::create(['name' => 'Photoshop', 'slug' => 'photoshop']);
        $this->toolFigma = Tool::create(['name' => 'Figma', 'slug' => 'figma']);

        // 2. Target Project: Branding, Illustrator + Figma, published 10 days ago, 100 views
        $this->targetProject = $this->createPublishedProject(
            'target-project',
            [$this->catBranding],
            [$this->toolIllustrator, $this->toolFigma],
            now()->subDays(10),
            100
        );

        // 3. Candidate 1 (High match): Shared Category + Both shared tools, published 2 days ago, 500 views
        $this->createPublishedProject(
            'candidate-high-match',
            [$this->catBranding],
            [$this->toolIllustrator, $this->toolFigma],
            now()->subDays(2),
            500
        );

        // 4. Candidate 2 (Medium match): Shared Category only, 1 shared tool, published 30 days ago, 200 views
        $this->createPublishedProject(
            'candidate-medium-match',
            [$this->catBranding],
            [$this->toolIllustrator],
            now()->subDays(30),
            200
        );

        // 5. Candidate 3 (Low match): Different Category (Packaging), 1 shared tool (Illustrator), published 100 days ago, 50 views
        $this->createPublishedProject(
            'candidate-low-match',
            [$this->catPackaging],
            [$this->toolIllustrator],
            now()->subDays(100),
            50
        );

        // 6. Draft Project (Shares category & tools): Must be strictly excluded
        $draft = Project::create([
            'slug' => 'draft-project',
            'status' => 'draft',
            'year' => 2026,
            'client' => 'Draft Client',
            'view_count' => 9999,
        ]);
        $draft->categories()->attach([$this->catBranding->id]);
        $draft->tools()->attach([$this->toolIllustrator->id, $this->toolFigma->id]);
        ProjectTranslation::create(['project_id' => $draft->id, 'locale' => 'ar', 'title' => 'مسودة سرية']);

        // 7. Soft-deleted Project: Must be strictly excluded
        $deleted = $this->createPublishedProject(
            'deleted-project',
            [$this->catBranding],
            [$this->toolIllustrator],
            now()->subDays(1),
            9999
        );
        $deleted->delete();
    }

    protected function createPublishedProject(
        string $slug,
        array $categories,
        array $tools,
        Carbon $publishedAt,
        int $viewCount
    ): Project {
        $project = Project::create([
            'slug' => $slug,
            'status' => 'published',
            'published_at' => $publishedAt,
            'year' => $publishedAt->year,
            'client' => 'Test Client',
            'view_count' => $viewCount,
            'published_snapshot' => [
                'translations' => [
                    'ar' => ['title' => "مشروع {$slug}", 'summary' => "ملخص {$slug}"],
                    'en' => ['title' => "Project {$slug}", 'summary' => "Summary {$slug}"],
                ],
                'categories' => collect($categories)->map(fn($c) => ['slug' => $c->slug])->all(),
                'tools' => collect($tools)->map(fn($t) => ['slug' => $t->slug])->all(),
            ],
        ]);

        $project->categories()->attach(collect($categories)->pluck('id'));
        $project->tools()->attach(collect($tools)->pluck('id'));

        ProjectTranslation::create([
            'project_id' => $project->id,
            'locale' => 'ar',
            'title' => "مشروع {$slug}",
            'summary' => "ملخص {$slug}",
        ]);
        ProjectTranslation::create([
            'project_id' => $project->id,
            'locale' => 'en',
            'title' => "Project {$slug}",
            'summary' => "Summary {$slug}",
        ]);

        return $project;
    }

    public function test_scoring_weights_prioritize_shared_categories_and_tools(): void
    {
        $service = app(RecommendationService::class);
        $recommendations = $service->getRecommendationsForProject($this->targetProject, 3);

        $this->assertNotEmpty($recommendations);

        // Candidate High Match must rank 1st because it matches Category + 2 Tools + high recency
        $this->assertEquals('candidate-high-match', $recommendations[0]['slug']);

        // Candidate Medium Match must rank 2nd
        $this->assertEquals('candidate-medium-match', $recommendations[1]['slug']);

        // Candidate Low Match must rank 3rd
        $this->assertEquals('candidate-low-match', $recommendations[2]['slug']);

        // Assert scores are monotonically descending
        $this->assertGreaterThanOrEqual($recommendations[1]['score'], $recommendations[0]['score']);
        $this->assertGreaterThanOrEqual($recommendations[2]['score'], $recommendations[1]['score']);
    }

    public function test_excludes_current_project_from_recommendations(): void
    {
        $service = app(RecommendationService::class);
        $recommendations = $service->getRecommendationsForProject($this->targetProject, 10);

        $slugs = collect($recommendations)->pluck('slug')->all();
        $this->assertNotContains('target-project', $slugs);
    }

    public function test_excludes_draft_and_trashed_projects(): void
    {
        $service = app(RecommendationService::class);
        $recommendations = $service->getRecommendationsForProject($this->targetProject, 10);

        $slugs = collect($recommendations)->pluck('slug')->all();
        $this->assertNotContains('draft-project', $slugs);
        $this->assertNotContains('deleted-project', $slugs);
    }

    public function test_ranking_is_deterministic_with_tiebreaker(): void
    {
        $service = app(RecommendationService::class);

        // Run recommendation scoring multiple times
        $run1 = $service->getRecommendationsForProject($this->targetProject, 3);
        $run2 = $service->getRecommendationsForProject($this->targetProject, 3);

        $this->assertEquals(
            collect($run1)->pluck('id')->all(),
            collect($run2)->pluck('id')->all()
        );
    }

    public function test_no_duplicate_results_returned(): void
    {
        $service = app(RecommendationService::class);
        $recommendations = $service->getRecommendationsForProject($this->targetProject, 5);

        $ids = collect($recommendations)->pluck('id')->all();
        $this->assertEquals(count($ids), count(array_unique($ids)));
    }

    public function test_recommendation_endpoint_returns_json_with_metadata(): void
    {
        $response = $this->getJson("/api/v1/projects/{$this->targetProject->slug}/recommendations?limit=3&locale=en");

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.target_slug', 'target-project')
            ->assertJsonPath('data.recommendations.0.slug', 'candidate-high-match')
            ->assertJsonStructure([
                'status',
                'data' => [
                    'target_slug',
                    'count',
                    'weights',
                    'recommendations' => [
                        '*' => [
                            'id',
                            'slug',
                            'title',
                            'summary',
                            'score',
                        ],
                    ],
                ],
            ]);
    }

    public function test_invalid_or_nonexistent_project_slug_returns_404(): void
    {
        $response = $this->getJson('/api/v1/projects/nonexistent-project-slug/recommendations');

        $response->assertStatus(404);
    }
}
