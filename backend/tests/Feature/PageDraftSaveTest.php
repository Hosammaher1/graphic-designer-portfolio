<?php

namespace Tests\Feature;

use App\Models\Page;
use App\Models\PageVersion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PageDraftSaveTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();
        $this->adminUser = User::factory()->create([
            'is_admin' => true,
        ]);
    }

    public function test_admin_can_save_new_page_draft(): void
    {
        $payload = [
            'lock_version' => 1,
            'title_ar' => 'الصفحة الرئيسية',
            'title_en' => 'Home Page',
            'blocks' => [
                [
                    'id' => 'blk-hero-1',
                    'type' => 'hero',
                    'version' => 1,
                    'data' => [
                        'title' => 'واجهة استثنائية',
                        'subtitle' => 'تصاميم إبداعية',
                        'cta_text' => 'عرض الأعمال',
                        'cta_url' => '/ar/work',
                        'align' => 'center',
                    ],
                    'settings' => [
                        'bg_theme' => 'surface',
                        'padding_y' => 'lg',
                    ],
                ],
            ],
        ];

        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/v1/admin/pages/home/draft', $payload);

        $response->assertStatus(200)
            ->assertJsonPath('page.slug', 'home')
            ->assertJsonPath('page.lock_version', 2)
            ->assertJsonPath('draft_version.version_number', 1)
            ->assertJsonPath('draft_version.status', 'draft');

        $this->assertDatabaseHas('pages', [
            'slug' => 'home',
            'lock_version' => 2,
        ]);

        $this->assertDatabaseHas('page_versions', [
            'version_number' => 1,
            'status' => 'draft',
        ]);
    }

    public function test_stale_update_conflict_returns_409(): void
    {
        $page = Page::create([
            'slug' => 'about',
            'title_ar' => 'من نحن',
            'title_en' => 'About Us',
            'lock_version' => 5,
        ]);

        $stalePayload = [
            'lock_version' => 3, // Outdated lock_version
            'blocks' => [
                [
                    'id' => 'blk-text-1',
                    'type' => 'text',
                    'version' => 1,
                    'data' => [
                        'body' => 'محتوى متأخر عن النسخة الحالية',
                    ],
                    'settings' => [],
                ],
            ],
        ];

        $response = $this->actingAs($this->adminUser)
            ->postJson("/api/v1/admin/pages/{$page->slug}/draft", $stalePayload);

        $response->assertStatus(409)
            ->assertJsonPath('conflict', true)
            ->assertJsonPath('current_lock_version', 5);
    }

    public function test_draft_save_does_not_mutate_active_published_version(): void
    {
        $page = Page::create([
            'slug' => 'services',
            'title_ar' => 'الخدمات',
            'title_en' => 'Services',
            'lock_version' => 1,
        ]);

        $publishedVersion = PageVersion::create([
            'page_id' => $page->id,
            'version_number' => 1,
            'status' => 'published',
            'blocks' => [
                [
                    'id' => 'blk-orig-hero',
                    'type' => 'hero',
                    'version' => 1,
                    'data' => [
                        'title' => 'النسخة الأصلية المنشورة للعامة',
                    ],
                    'settings' => [],
                ],
            ],
        ]);

        $page->update([
            'published_version_id' => $publishedVersion->id,
            'current_draft_version_id' => $publishedVersion->id,
        ]);

        $newDraftPayload = [
            'lock_version' => 1,
            'blocks' => [
                [
                    'id' => 'blk-draft-hero',
                    'type' => 'hero',
                    'version' => 1,
                    'data' => [
                        'title' => 'مسودة جديدة تماماً قيد التعديل والمراجعة',
                    ],
                    'settings' => [],
                ],
            ],
        ];

        $response = $this->actingAs($this->adminUser)
            ->postJson("/api/v1/admin/pages/{$page->slug}/draft", $newDraftPayload);

        $response->assertStatus(200);

        // Reload page from fresh DB
        $page->refresh();

        // Active published version pointer MUST NOT CHANGE
        $this->assertEquals($publishedVersion->id, $page->published_version_id);

        // Published version snapshot in page_versions MUST RETAIN original title
        $this->assertEquals(
            'النسخة الأصلية المنشورة للعامة',
            $publishedVersion->fresh()->blocks[0]['data']['title']
        );

        // Current draft pointer points to newly created version 2
        $this->assertNotEquals($page->current_draft_version_id, $publishedVersion->id);
        $latestDraft = PageVersion::find($page->current_draft_version_id);
        $this->assertEquals(2, $latestDraft->version_number);
        $this->assertEquals('draft', $latestDraft->status);
        $this->assertEquals(
            'مسودة جديدة تماماً قيد التعديل والمراجعة',
            $latestDraft->blocks[0]['data']['title']
        );
    }

    public function test_unauthenticated_request_is_denied(): void
    {
        $response = $this->postJson('/api/v1/admin/pages/home/draft', [
            'lock_version' => 1,
            'blocks' => [],
        ]);

        $response->assertStatus(401);
    }

    public function test_invalid_block_payload_is_rejected_with_422(): void
    {
        $payload = [
            'lock_version' => 1,
            'blocks' => [
                [
                    'id' => 'blk-unsafe',
                    'type' => 'hero',
                    'version' => 1,
                    'data' => [
                        'title' => '<script>alert("XSS")</script>',
                    ],
                    'settings' => [
                        'bg_theme' => 'invalid-evil-theme',
                    ],
                ],
            ],
        ];

        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/v1/admin/pages/home/draft', $payload);

        $response->assertStatus(422);
    }
}
