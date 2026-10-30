<?php

namespace App\Services\Media;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FakeMediaStorage implements MediaStorageInterface
{
    private const MAX_BYTES = 15728640; // 15MB

    private const ALLOWED_MIMES = [
        'image/jpeg',
        'image/png',
        'image/webp',
    ];

    public function upload(UploadedFile $file, array $options = []): array
    {
        // 1. Validate file size
        if ($file->getSize() > self::MAX_BYTES) {
            throw new \InvalidArgumentException('File exceeds maximum allowed size of 15MB.');
        }

        // 2. Validate MIME type
        $mime = $file->getMimeType();
        if (! in_array($mime, self::ALLOWED_MIMES, true)) {
            throw new \InvalidArgumentException("Disallowed file format [{$mime}]. Allowed formats: JPG, PNG, WebP.");
        }

        // 3. Extract dimensions if image
        $width = null;
        $height = null;
        $imageSize = @getimagesize($file->getRealPath());
        if ($imageSize) {
            $width = $imageSize[0];
            $height = $imageSize[1];
        }

        // 4. Sanitize file name
        $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $extension = $file->getClientOriginalExtension() ?: 'jpg';
        $safeName = Str::slug($originalName) . '-' . Str::random(8) . '.' . strtolower($extension);

        $providerId = 'local/' . Str::uuid();

        // 5. Store file in local fake storage
        Storage::disk('media_test')->putFileAs('uploads', $file, $safeName);

        $baseUrl = config('app.url', 'http://localhost') . '/storage/media/' . $safeName;

        return [
            'provider'      => 'local',
            'provider_id'   => $providerId,
            'file_name'     => $safeName,
            'mime_type'     => $mime,
            'bytes'         => $file->getSize(),
            'width'         => $width,
            'height'        => $height,
            'original_url'  => $baseUrl,
            'variants'      => [
                'thumbnail' => $baseUrl . '?variant=thumbnail&w=300',
                'medium'    => $baseUrl . '?variant=medium&w=800',
                'full'      => $baseUrl . '?variant=full&w=1920',
                'webp'      => $baseUrl . '?format=webp',
            ],
            'has_watermark' => false,
        ];
    }

    public function delete(string $providerId): bool
    {
        return true;
    }

    public function getDeliveryUrl(string $providerId, array $transformations = []): string
    {
        $params = [];
        if (! empty($transformations['width'])) {
            $params[] = 'w_' . $transformations['width'];
        }
        if (! empty($transformations['quality'])) {
            $params[] = 'q_' . $transformations['quality'];
        }
        $query = ! empty($params) ? '?' . implode('&', $params) : '';

        return "http://localhost/media/{$providerId}{$query}";
    }

    public function getWatermarkedUrl(string $providerId, string $watermarkText = ''): string
    {
        $text = urlencode($watermarkText ?: 'Mohammed Maher');

        return "http://localhost/media/{$providerId}?watermark={$text}";
    }
}
