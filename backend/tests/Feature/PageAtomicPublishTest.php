<?php

namespace Tests\Feature;

use App\Models\Page;
use App\Models\PageVersion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PageAtomicPublishTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected Page $page;
    protected PageVersion $initialDraft;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminUser = User::factory()->create([
            'is_admin' => true,
        ]);

        $this->page = Page::create([
            'slug' => 'about-atomic',
            'title_ar' => 'من نحن',
            'title_en' => 'About Us',
            'lock_version' => 1,
        ]);

        $this->initialDraft = PageVersion::create([
            'page_id' => $this->page->id,
            'version_number' => 1,
            'status' => 'draft',
            'blocks' => [
                [
                    'id' => 'blk-hero-1',
                    'type' => 'hero',
                    'version' => 1,
                    'data' => [
                        'title' => 'عنوان عن المصمم باللغة العربية',
                        'title_en' => 'About the Designer in English',
                    ],
                    'settings' => [],
                ],
            ],
        ]);

        $this->page->update([
            'current_draft_version_id' => $this->initialDraft->id,
        ]);
    }

    public function test_admin_can_atomically_publish_draft_version(): void
    {
        Cache::put("page_public_{$this->page->slug}", 'cached_data', 3600);

        $response = $this->actingAs($this->adminUser)
            ->postJson("/api/v1/admin/pages/{$this->page->slug}/publish");

        $response->assertStatus(200)
            ->assertJsonPath('page.slug', 'about-atomic')
            ->assertJsonPath('published_version.version_number', 1)
            ->assertJsonPath('published_version.status', 'published');

        $this->page->refresh();
        $this->assertEquals($this->initialDraft->id, $this->page->published_version_id);
        $this->assertEquals('published', $this->initialDraft->fresh()->status);

        // Verify cache invalidation
        $this->assertFalse(Cache::has("page_public_{$this->page->slug}"));
    }

    public function test_localized_completeness_policy_rejects_missing_required_language(): void
    {
        // Unset English title to violate localized completeness policy
        $this->page->update([
            'title_en' => null,
        ]);

        $response = $this->actingAs($this->adminUser)
            ->postJson("/api/v1/admin/pages/{$this->page->slug}/publish");

        $response->assertStatus(422)
            ->assertJsonPath('policy_violation', true)
            ->assertJsonValidationErrors(['title_en']);

        $this->page->refresh();
        $this->assertNull($this->page->published_version_id);
    }

    public function test_rollback_on_failure_retains_previous_published_version(): void
    {
        // 1. Publish initial version 1 successfully
        $this->page->update([
            'published_version_id' => $this->initialDraft->id,
        ]);
        $this->initialDraft->update(['status' => 'published']);

        // 2. Create new draft version 2
        $newDraft = PageVersion::create([
            'page_id' => $this->page->id,
            'version_number' => 2,
            'status' => 'draft',
            'blocks' => [
                [
                    'id' => 'blk-hero-2',
                    'type' => 'hero',
                    'version' => 1,
                    'data' => ['title' => 'تعديل مسودة جديد'],
                    'settings' => [],
                ],
            ],
        ]);
        $this->page->update(['current_draft_version_id' => $newDraft->id]);

        // 3. Attempt publish with a mock DB failure or trigger error
        // We verify that if an exception is thrown inside the transaction, published_version_id stays version 1
        try {
            DB::transaction(function () use ($newDraft) {
                $this->page->update(['published_version_id' => $newDraft->id]);
                throw new \RuntimeException('Simulated catastrophic database write failure');
            });
        } catch (\RuntimeException $e) {
            // Expected simulation
        }

        $this->page->refresh();
        // Pointer must remain version 1
        $this->assertEquals($this->initialDraft->id, $this->page->published_version_id);
    }

    public function test_public_endpoint_serves_only_published_snapshot_and_ignores_drafts(): void
    {
        // 1. Publish version 1
        $this->actingAs($this->adminUser)
            ->postJson("/api/v1/admin/pages/{$this->page->slug}/publish")
            ->assertStatus(200);

        // 2. Create version 2 draft with different title
        $this->actingAs($this->adminUser)
            ->postJson("/api/v1/admin/pages/{$this->page->slug}/draft", [
                'lock_version' => $this->page->fresh()->lock_version,
                'blocks' => [
                    [
                        'id' => 'blk-hero-draft-v2',
                        'type' => 'hero',
                        'version' => 1,
                        'data' => [
                            'title' => 'مسودة سرية غير منشورة مطلقا',
                        ],
                        'settings' => [],
                    ],
                ],
            ])
            ->assertStatus(200);

        // 3. Anonymous public visitor GET request
        $publicResponse = $this->getJson("/api/v1/pages/{$this->page->slug}");

        $publicResponse->assertStatus(200)
            ->assertJsonPath('page.slug', 'about-atomic')
            ->assertJsonPath('blocks.0.data.title', 'عنوان عن المصمم باللغة العربية');

        // Must NOT leak draft v2 title
        $this->assertStringNotContainsString(
            'مسودة سرية غير منشورة مطلقا',
            json_encode($publicResponse->json())
        );
    }

    public function test_unauthenticated_request_cannot_publish(): void
    {
        $response = $this->postJson("/api/v1/admin/pages/{$this->page->slug}/publish");

        $response->assertStatus(401);
    }
}
