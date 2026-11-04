<?php

namespace Tests\Feature\Projects;

use App\Models\MediaAsset;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProjectImageFlowTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['is_admin' => true]);
    }

    private function fakePng(string $filename = 'test.png'): UploadedFile
    {
        $rawPng = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
        $tempPath = tempnam(sys_get_temp_dir(), 'test_img_');
        file_put_contents($tempPath, $rawPng);

        return new UploadedFile($tempPath, $filename, 'image/png', null, true);
    }

    public function test_admin_can_upload_image_and_create_project_with_cover_and_gallery(): void
    {
        $admin = $this->admin();

        // 1. Upload Cover Image
        $coverFile = $this->fakePng('cover-art.png');
        $coverUploadRes = $this->actingAs($admin)->postJson('/api/v1/admin/media/upload', [
            'file' => $coverFile,
        ]);
        $coverUploadRes->assertStatus(201);
        $coverAssetId = $coverUploadRes->json('data.asset.id');
        $this->assertNotNull($coverAssetId);

        // 2. Upload Gallery Image
        $galleryFile = $this->fakePng('gallery-art.png');
        $galleryUploadRes = $this->actingAs($admin)->postJson('/api/v1/admin/media/upload', [
            'file' => $galleryFile,
        ]);
        $galleryUploadRes->assertStatus(201);
        $galleryAssetId = $galleryUploadRes->json('data.asset.id');
        $this->assertNotNull($galleryAssetId);

        // 3. Create Project with cover_media_id and media_items
        $projectPayload = [
            'slug'           => 'luxury-branding-test',
            'status'         => 'published',
            'is_featured'    => true,
            'year'           => 2026,
            'client'         => 'Al Dayah Studio',
            'cover_media_id' => $coverAssetId,
            'media_items'    => [
                [
                    'media_asset_id' => $coverAssetId,
                    'is_cover'       => true,
                    'sort_order'     => 1,
                    'caption_en'     => 'Hero Brand Packaging',
                    'caption_ar'     => 'تصميم التغليف الرئيسي',
                ],
                [
                    'media_asset_id' => $galleryAssetId,
                    'is_cover'       => false,
                    'sort_order'     => 2,
                    'caption_en'     => 'Typography Detail',
                    'caption_ar'     => 'تفاصيل التيبوغرافيا',
                ],
            ],
            'translations'   => [
                [
                    'locale'      => 'en',
                    'title'       => 'Luxury Branding Suite',
                    'summary'     => 'Complete visual identity system.',
                    'description' => 'Detailed creative case study.',
                ],
                [
                    'locale'      => 'ar',
                    'title'       => 'هوية تجارية فاخرة',
                    'summary'     => 'نظام متكامل للهوية البصرية.',
                    'description' => 'دراسة حالة إبداعية مفصلة.',
                ],
            ],
        ];

        $createRes = $this->actingAs($admin)->postJson('/api/v1/admin/projects', $projectPayload);
        $createRes->assertStatus(201);
        $createdData = $createRes->json('data.project');

        $this->assertNotEmpty($createdData['cover_url']);
        $this->assertCount(2, $createdData['media']);
        $this->assertEquals($coverAssetId, $createdData['cover_media_id']);

        // 4. Verify Public Projects Index (Unauthenticated Visitor)
        $publicIndexRes = $this->getJson('/api/v1/projects?locale=en');
        $publicIndexRes->assertStatus(200);

        $publicProjects = $publicIndexRes->json('data.projects.data');
        $matched = collect($publicProjects)->firstWhere('slug', 'luxury-branding-test');
        $this->assertNotNull($matched);
        $this->assertNotEmpty($matched['cover_url'], 'Public project index must include cover_url');

        // 5. Verify Public Project Detail (Unauthenticated Visitor)
        $publicShowRes = $this->getJson('/api/v1/projects/luxury-branding-test?locale=en');
        $publicShowRes->assertStatus(200);
        $publicProject = $publicShowRes->json('data.project');

        $this->assertNotEmpty($publicProject['cover_url'], 'Public project detail must include cover_url');
        $this->assertCount(2, $publicProject['media'], 'Public project detail must include media gallery items');
        $this->assertNotEmpty($publicProject['media'][0]['display_url']);
        $this->assertNotEmpty($publicProject['media'][1]['display_url']);
        $this->assertEquals('Typography Detail', $publicProject['media'][1]['caption_en']);
    }

    public function test_updating_project_media_refreshes_public_snapshot(): void
    {
        $admin = $this->admin();

        $asset1 = MediaAsset::create([
            'provider'     => 'local',
            'provider_id'  => 'media/test-1.png',
            'file_name'    => 'test-1.png',
            'mime_type'    => 'image/png',
            'bytes'        => 1024,
            'original_url' => '/storage/media/test-1.png',
        ]);

        $asset2 = MediaAsset::create([
            'provider'     => 'local',
            'provider_id'  => 'media/test-2.png',
            'file_name'    => 'test-2.png',
            'mime_type'    => 'image/png',
            'bytes'        => 2048,
            'original_url' => '/storage/media/test-2.png',
        ]);

        $project = Project::create([
            'slug'           => 'update-media-test',
            'status'         => 'published',
            'cover_media_id' => $asset1->id,
        ]);
        $project->translations()->create([
            'locale' => 'en',
            'title'  => 'Initial Title',
        ]);
        app(\App\Services\Publishing\ProjectPublishingService::class)->publish($project);

        // Update project: switch cover to asset2 and add both to gallery
        $updateRes = $this->actingAs($admin)->putJson("/api/v1/admin/projects/{$project->id}", [
            'cover_media_id' => $asset2->id,
            'media_items'    => [
                [
                    'media_asset_id' => $asset2->id,
                    'is_cover'       => true,
                    'sort_order'     => 1,
                    'caption_en'     => 'New Cover',
                ],
                [
                    'media_asset_id' => $asset1->id,
                    'is_cover'       => false,
                    'sort_order'     => 2,
                    'caption_en'     => 'Old Cover Now Gallery',
                ],
            ],
        ]);
        $updateRes->assertStatus(200);

        // Verify updated public detail
        $publicShowRes = $this->getJson('/api/v1/projects/update-media-test?locale=en');
        $publicShowRes->assertStatus(200);
        $publicProject = $publicShowRes->json('data.project');

        $this->assertEquals('/storage/media/test-2.png', $publicProject['cover_url']);
        $this->assertCount(2, $publicProject['media']);
        $this->assertEquals('/storage/media/test-2.png', $publicProject['media'][0]['display_url']);
        $this->assertEquals('/storage/media/test-1.png', $publicProject['media'][1]['display_url']);
    }

    public function test_public_can_fetch_uploaded_media_file_unauthenticated(): void
    {
        $rawPng = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
        $fileName = 'public_access_test_' . uniqid() . '.png';
        Storage::disk('public')->put('media/' . $fileName, $rawPng);

        $response = $this->get('/storage/media/' . $fileName);
        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'image/png');

        // Cleanup
        Storage::disk('public')->delete('media/' . $fileName);
    }
}
