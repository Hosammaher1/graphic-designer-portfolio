<?php

namespace Tests\Feature\Media;

use App\Services\Media\CloudinaryMediaStorage;
use App\Services\Media\FakeMediaStorage;
use App\Services\Media\MediaStorageInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MediaStorageTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('media_test');
    }

    /**
     * Valid 1x1 PNG bytes (68 bytes) to avoid needing PHP GD extension.
     */
    private function fake1x1Png(string $filename = 'test.png'): UploadedFile
    {
        $rawPng = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
        $tempPath = tempnam(sys_get_temp_dir(), 'test_img_');
        file_put_contents($tempPath, $rawPng);

        return new UploadedFile($tempPath, $filename, 'image/png', null, true);
    }

    public function test_fake_media_storage_uploads_image_and_returns_structured_metadata(): void
    {
        $storage = new FakeMediaStorage();
        $file = $this->fake1x1Png('branding-mockup.png');

        $result = $storage->upload($file);

        $this->assertEquals('local', $result['provider']);
        $this->assertNotEmpty($result['provider_id']);
        $this->assertStringContainsString('branding-mockup', $result['file_name']);
        $this->assertEquals('image/png', $result['mime_type']);
        $this->assertEquals(1, $result['width']);
        $this->assertEquals(1, $result['height']);
        $this->assertArrayHasKey('thumbnail', $result['variants']);
        $this->assertArrayHasKey('medium', $result['variants']);
        $this->assertArrayHasKey('full', $result['variants']);
        $this->assertArrayHasKey('webp', $result['variants']);
    }

    public function test_media_storage_rejects_disallowed_mime_types(): void
    {
        $storage = new FakeMediaStorage();
        $file = UploadedFile::fake()->create('script.php', 100, 'text/x-php');

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Disallowed file format');

        $storage->upload($file);
    }

    public function test_media_storage_rejects_files_exceeding_max_file_size(): void
    {
        $storage = new FakeMediaStorage();
        // 20MB file when max is 15MB
        $file = UploadedFile::fake()->create('huge.jpg', 20480, 'image/jpeg');

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('exceeds maximum allowed size');

        $storage->upload($file);
    }

    public function test_media_storage_generates_safe_sanitized_file_names(): void
    {
        $storage = new FakeMediaStorage();
        $file = UploadedFile::fake()->create('../../unsafe name #1!.jpg', 100, 'image/jpeg');

        $result = $storage->upload($file);

        $this->assertStringNotContainsString('..', $result['file_name']);
        $this->assertStringNotContainsString('#', $result['file_name']);
        $this->assertStringNotContainsString(' ', $result['file_name']);
    }

    public function test_media_storage_deletes_asset(): void
    {
        $storage = new FakeMediaStorage();
        $file = UploadedFile::fake()->create('to-delete.jpg', 100, 'image/jpeg');

        $uploaded = $storage->upload($file);
        $this->assertTrue($storage->delete($uploaded['provider_id']));
    }

    public function test_media_storage_generates_delivery_and_watermark_urls(): void
    {
        $storage = new FakeMediaStorage();
        $providerId = 'portfolio/test-asset-123';

        $deliveryUrl = $storage->getDeliveryUrl($providerId, ['width' => 800, 'quality' => 'auto']);
        $this->assertStringContainsString($providerId, $deliveryUrl);
        $this->assertStringContainsString('w_800', $deliveryUrl);

        $watermarkUrl = $storage->getWatermarkedUrl($providerId, 'Mohammed Maher');
        $this->assertStringContainsString($providerId, $watermarkUrl);
        $this->assertStringContainsString('watermark', $watermarkUrl);
    }

    public function test_cloudinary_adapter_does_not_expose_api_secret_in_urls_or_metadata(): void
    {
        $storage = new CloudinaryMediaStorage(
            cloudName: 'demo-cloud',
            apiKey: '123456789',
            apiSecret: 'SECRET_KEY_MUST_NEVER_LEAK'
        );

        $url = $storage->getDeliveryUrl('sample-id');
        $this->assertStringNotContainsString('SECRET_KEY_MUST_NEVER_LEAK', $url);

        $watermarked = $storage->getWatermarkedUrl('sample-id', 'Mohammed Maher');
        $this->assertStringNotContainsString('SECRET_KEY_MUST_NEVER_LEAK', $watermarked);
    }

    public function test_service_container_resolves_media_storage_interface(): void
    {
        $resolved = app(MediaStorageInterface::class);
        $this->assertInstanceOf(MediaStorageInterface::class, $resolved);
    }
}
