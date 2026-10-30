<?php

namespace Tests\Feature\Media;

use App\Models\MediaAsset;
use App\Models\Project;
use App\Models\User;
use App\Services\Media\WatermarkService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WatermarkTransformationTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['is_admin' => true]);
    }

    public function test_watermark_service_generates_watermarked_url_when_enabled(): void
    {
        $service = app(WatermarkService::class);
        $asset = MediaAsset::factory()->create([
            'provider_id'  => 'portfolio/test-brand-logo',
            'original_url' => 'https://example.com/originals/logo.png',
        ]);
        $project = Project::factory()->create([
            'enable_watermark' => true,
        ]);

        $displayUrl = $service->resolveDisplayUrl($asset, $project);

        $this->assertStringContainsString('watermark', $displayUrl);
        $this->assertStringContainsString('portfolio/test-brand-logo', $displayUrl);
        // Original reference MUST remain intact and untouched
        $this->assertEquals('https://example.com/originals/logo.png', $asset->fresh()->original_url);
    }

    public function test_watermark_service_returns_clean_url_when_watermark_disabled_for_project(): void
    {
        $service = app(WatermarkService::class);
        $asset = MediaAsset::factory()->create([
            'provider_id' => 'portfolio/clean-brand-logo',
        ]);
        $project = Project::factory()->create([
            'enable_watermark' => false,
        ]);

        $displayUrl = $service->resolveDisplayUrl($asset, $project);

        $this->assertStringNotContainsString('watermark', $displayUrl);
        $this->assertStringContainsString('portfolio/clean-brand-logo', $displayUrl);
    }

    public function test_admin_can_toggle_project_watermark_via_api(): void
    {
        $admin = $this->admin();
        $project = Project::factory()->create(['enable_watermark' => false]);

        $response = $this->actingAs($admin)->patchJson("/api/v1/admin/projects/{$project->id}/watermark", [
            'enable_watermark' => true,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.project.enable_watermark', true);

        $this->assertTrue((bool) $project->fresh()->enable_watermark);
    }

    public function test_admin_can_toggle_individual_media_asset_watermark_via_api(): void
    {
        $admin = $this->admin();
        $asset = MediaAsset::factory()->create(['has_watermark' => false]);

        $response = $this->actingAs($admin)->patchJson("/api/v1/admin/media/{$asset->id}/watermark", [
            'has_watermark' => true,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.asset.has_watermark', true);

        $this->assertTrue((bool) $asset->fresh()->has_watermark);
    }

    public function test_unauthenticated_cannot_toggle_watermark(): void
    {
        $project = Project::factory()->create();

        $response = $this->patchJson("/api/v1/admin/projects/{$project->id}/watermark", [
            'enable_watermark' => true,
        ]);

        $response->assertStatus(401);
    }
}
