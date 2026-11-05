<?php

namespace Tests\Unit\Services;

use App\Services\Media\CloudinaryMediaStorage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class CloudinaryMediaStorageTest extends TestCase
{
    private CloudinaryMediaStorage $storage;

    protected function setUp(): void
    {
        parent::setUp();

        $this->storage = new CloudinaryMediaStorage(
            cloudName: 'test-cloud',
            apiKey: 'test-api-key-12345',
            apiSecret: 'test-api-secret-67890'
        );
    }

    public function test_upload_sends_authenticated_signed_multipart_request_and_returns_metadata(): void
    {
        Http::fake([
            'https://api.cloudinary.com/v1_1/test-cloud/image/upload' => Http::response([
                'public_id'   => 'portfolio/test-asset-uuid',
                'bytes'       => 204800,
                'width'       => 1200,
                'height'      => 800,
                'secure_url'  => 'https://res.cloudinary.com/test-cloud/image/upload/v1730500000/portfolio/test-asset-uuid.jpg',
            ], 200),
        ]);

        $file = UploadedFile::fake()->create('brand-identity.jpg', 200, 'image/jpeg');

        $result = $this->storage->upload($file);

        $this->assertEquals('cloudinary', $result['provider']);
        $this->assertEquals(1200, $result['width']);
        $this->assertEquals(800, $result['height']);
        $this->assertEquals(204800, $result['bytes']);
        $this->assertEquals('image/jpeg', $result['mime_type']);
        $this->assertEquals('https://res.cloudinary.com/test-cloud/image/upload/v1730500000/portfolio/test-asset-uuid.jpg', $result['original_url']);
        $this->assertArrayHasKey('thumbnail', $result['variants']);
        $this->assertArrayHasKey('medium', $result['variants']);
        $this->assertArrayHasKey('full', $result['variants']);
        $this->assertArrayHasKey('webp', $result['variants']);
        $this->assertFalse($result['has_watermark']);

        Http::assertSent(function ($request) {
            return str_contains($request->url(), 'test-cloud/image/upload')
                && $request->isMultipart();
        });
    }

    public function test_upload_throws_exception_on_provider_error_and_does_not_return_false_success(): void
    {
        Http::fake([
            'https://api.cloudinary.com/v1_1/test-cloud/image/upload' => Http::response([
                'error' => ['message' => 'Invalid signature or credentials.'],
            ], 401),
        ]);

        $file = UploadedFile::fake()->create('editorial.png', 150, 'image/png');

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Cloudinary upload failed: Invalid signature or credentials.');

        $this->storage->upload($file);
    }

    public function test_delete_sends_authenticated_signed_request_and_returns_true_on_ok(): void
    {
        Http::fake([
            'https://api.cloudinary.com/v1_1/test-cloud/image/destroy' => Http::response([
                'result' => 'ok',
            ], 200),
        ]);

        $result = $this->storage->delete('portfolio/valid-asset-id');

        $this->assertTrue($result);

        Http::assertSent(function ($request) {
            return str_contains($request->url(), 'test-cloud/image/destroy')
                && $request['public_id'] === 'portfolio/valid-asset-id'
                && $request['api_key'] === 'test-api-key-12345'
                && ! empty($request['signature']);
        });
    }

    public function test_delete_returns_false_on_provider_rejection(): void
    {
        Http::fake([
            'https://api.cloudinary.com/v1_1/test-cloud/image/destroy' => Http::response([
                'result' => 'error',
            ], 400),
        ]);

        $result = $this->storage->delete('portfolio/failing-asset-id');

        $this->assertFalse($result);
    }

    public function test_upload_rejects_files_exceeding_size_limit_before_network_call(): void
    {
        Http::fake();

        $file = UploadedFile::fake()->create('massive.jpg', 27000, 'image/jpeg'); // 27MB > 25MB

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('File exceeds maximum allowed size of 25MB.');

        $this->storage->upload($file);

        Http::assertNothingSent();
    }

    public function test_upload_rejects_disallowed_mime_type_before_network_call(): void
    {
        Http::fake();

        $file = UploadedFile::fake()->create('malicious.php', 100, 'text/plain');

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Disallowed file format');

        $this->storage->upload($file);

        Http::assertNothingSent();
    }

    public function test_upload_throws_when_credentials_are_missing(): void
    {
        $unconfiguredStorage = new CloudinaryMediaStorage();
        $file = UploadedFile::fake()->create('test.jpg', 50, 'image/jpeg');

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Cloudinary credentials (cloud_name, api_key, api_secret) are not configured.');

        $unconfiguredStorage->upload($file);
    }

    public function test_delete_throws_when_credentials_are_missing(): void
    {
        $unconfiguredStorage = new CloudinaryMediaStorage();

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Cloudinary credentials (cloud_name, api_key, api_secret) are not configured.');

        $unconfiguredStorage->delete('portfolio/some-id');
    }

    public function test_delivery_and_watermarked_urls_generate_proper_transformations_without_secret(): void
    {
        $deliveryUrl = $this->storage->getDeliveryUrl('portfolio/my-asset', ['width' => 1024, 'quality' => 'auto']);
        $this->assertStringContainsString('w_1024', $deliveryUrl);
        $this->assertStringContainsString('q_auto', $deliveryUrl);
        $this->assertStringContainsString('portfolio/my-asset', $deliveryUrl);
        $this->assertStringNotContainsString('test-api-secret-67890', $deliveryUrl);

        $watermarkUrl = $this->storage->getWatermarkedUrl('portfolio/my-asset', 'Mohammed Maher');
        $this->assertStringContainsString('l_text:Arial_36', $watermarkUrl);
        $this->assertStringContainsString('portfolio/my-asset', $watermarkUrl);
        $this->assertStringNotContainsString('test-api-secret-67890', $watermarkUrl);
    }
}
