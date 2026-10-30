<?php

namespace Tests\Feature;

use App\Models\Page;
use App\Models\PageVersion;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class PageSecurePreviewTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected Page $page;
    protected PageVersion $draftVersion;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminUser = User::factory()->create([
            'is_admin' => true,
        ]);

        $this->page = Page::create([
            'slug' => 'brand-strategy',
            'title_ar' => 'استراتيجية العلامة التجارية',
            'title_en' => 'Brand Strategy',
            'lock_version' => 1,
        ]);

        $this->draftVersion = PageVersion::create([
            'page_id' => $this->page->id,
            'version_number' => 1,
            'status' => 'draft',
            'blocks' => [
                [
                    'id' => 'blk-preview-hero',
                    'type' => 'hero',
                    'version' => 1,
                    'data' => [
                        'title' => 'عنوان مسودة سرية قيد المراجعة',
                    ],
                    'settings' => [],
                ],
            ],
        ]);

        $this->page->update([
            'current_draft_version_id' => $this->draftVersion->id,
        ]);
    }

    public function test_authenticated_admin_can_access_preview_with_security_headers(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->getJson("/api/v1/admin/pages/{$this->page->slug}/preview");

        $response->assertStatus(200)
            ->assertJsonPath('page.slug', 'brand-strategy')
            ->assertJsonPath('draft_version.status', 'draft')
            ->assertJsonPath('blocks.0.data.title', 'عنوان مسودة سرية قيد المراجعة');

        // Verify strict security and no-index headers
        $response->assertHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
        $this->assertStringContainsString('no-store', $response->headers->get('Cache-Control'));
    }

    public function test_anonymous_request_without_signature_is_denied(): void
    {
        $response = $this->getJson("/api/v1/pages/{$this->page->slug}/preview");

        $response->assertStatus(403);
    }

    public function test_anonymous_request_with_valid_signed_url_is_authorized(): void
    {
        $signedUrl = URL::temporarySignedRoute(
            'api.v1.pages.preview.signed',
            now()->addMinutes(30),
            ['slug' => $this->page->slug]
        );

        $response = $this->getJson($signedUrl);

        $response->assertStatus(200)
            ->assertJsonPath('page.slug', 'brand-strategy')
            ->assertJsonPath('blocks.0.data.title', 'عنوان مسودة سرية قيد المراجعة');

        $response->assertHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
    }

    public function test_expired_signed_url_is_denied(): void
    {
        // Travel 31 minutes into the future
        Carbon::setTestNow(now());

        $signedUrl = URL::temporarySignedRoute(
            'api.v1.pages.preview.signed',
            now()->addMinutes(30),
            ['slug' => $this->page->slug]
        );

        Carbon::setTestNow(now()->addMinutes(35));

        $response = $this->getJson($signedUrl);

        $response->assertStatus(403);

        Carbon::setTestNow(); // Reset time
    }

    public function test_tampered_signature_is_denied(): void
    {
        $signedUrl = URL::temporarySignedRoute(
            'api.v1.pages.preview.signed',
            now()->addMinutes(30),
            ['slug' => $this->page->slug]
        );

        // Tamper with signature parameter
        $tamperedUrl = $signedUrl . 'invalid';

        $response = $this->getJson($tamperedUrl);

        $response->assertStatus(403);
    }

    public function test_admin_can_generate_signed_preview_url(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->postJson("/api/v1/admin/pages/{$this->page->slug}/preview-url");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'preview_url',
                'expires_at',
            ]);

        $previewUrl = $response->json('preview_url');
        $this->assertStringContainsString('signature=', $previewUrl);
        $this->assertStringContainsString('expires=', $previewUrl);
    }
}
