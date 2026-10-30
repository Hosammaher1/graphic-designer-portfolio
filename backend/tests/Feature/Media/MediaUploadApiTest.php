<?php

namespace Tests\Feature\Media;

use App\Models\MediaAsset;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MediaUploadApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('media_test');
    }

    private function admin(): User
    {
        return User::factory()->create(['is_admin' => true]);
    }

    private function fake1x1Png(string $filename = 'test.png'): UploadedFile
    {
        $rawPng = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
        $tempPath = tempnam(sys_get_temp_dir(), 'test_img_');
        file_put_contents($tempPath, $rawPng);

        return new UploadedFile($tempPath, $filename, 'image/png', null, true);
    }

    public function test_admin_can_upload_single_image_and_persists_media_asset(): void
    {
        $admin = $this->admin();
        $file = $this->fake1x1Png('hero-image.png');

        $response = $this->actingAs($admin)->postJson('/api/v1/admin/media/upload', [
            'file' => $file,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.asset.mime_type', 'image/png');

        $this->assertDatabaseHas('media_assets', [
            'mime_type' => 'image/png',
        ]);
    }

    public function test_admin_can_upload_batch_images(): void
    {
        $admin = $this->admin();
        $files = [
            $this->fake1x1Png('img-1.png'),
            $this->fake1x1Png('img-2.png'),
        ];

        $response = $this->actingAs($admin)->postJson('/api/v1/admin/media/upload-batch', [
            'files' => $files,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonCount(2, 'data.assets');

        $this->assertDatabaseCount('media_assets', 2);
    }

    public function test_upload_rejects_disallowed_mime_type(): void
    {
        $admin = $this->admin();
        $file = UploadedFile::fake()->create('malicious.php', 50, 'application/x-php');

        $response = $this->actingAs($admin)->postJson('/api/v1/admin/media/upload', [
            'file' => $file,
        ]);

        $response->assertStatus(422);
    }

    public function test_unauthenticated_cannot_upload_media(): void
    {
        $file = $this->fake1x1Png('photo.png');

        $response = $this->postJson('/api/v1/admin/media/upload', [
            'file' => $file,
        ]);

        $response->assertStatus(401);
    }

    public function test_admin_can_delete_media_asset(): void
    {
        $admin = $this->admin();
        $asset = MediaAsset::factory()->create();

        $response = $this->actingAs($admin)->deleteJson('/api/v1/admin/media/' . $asset->id);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success');

        $this->assertDatabaseMissing('media_assets', ['id' => $asset->id]);
    }
}
