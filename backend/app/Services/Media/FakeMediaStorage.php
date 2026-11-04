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
        $mime = null;
        try {
            $mime = @$file->getMimeType();
        } catch (\Throwable $e) {
            $mime = $file->getClientMimeType();
        }
        if (! $mime) {
            $mime = $file->getClientMimeType();
        }
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

        $providerId = 'media/' . $safeName;

        // 5. Store file in local storage (support both public disk and test fake)
        $diskName = app()->runningUnitTests() && config()->has('filesystems.disks.media_test') ? 'media_test' : 'public';
        $disk = Storage::disk($diskName);

        $subPath = $diskName === 'media_test' ? 'uploads' : 'media';
        $stored = $disk->putFileAs($subPath, $file, $safeName);
        if (! $stored) {
            $disk->put($subPath . '/' . $safeName, file_get_contents($file->getRealPath()));
        }

        $baseUrl = '/storage/media/' . $safeName;

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
        $clean = str_starts_with($providerId, 'local/') ? substr($providerId, 6) : $providerId;
        $diskName = app()->runningUnitTests() && config()->has('filesystems.disks.media_test') ? 'media_test' : 'public';
        $disk = Storage::disk($diskName);
        $subPath = $diskName === 'media_test' ? 'uploads/' : 'media/';
        $cleanPath = str_starts_with($clean, 'media/') ? substr($clean, 6) : (str_starts_with($clean, 'uploads/') ? substr($clean, 8) : $clean);
        $disk->delete($subPath . $cleanPath);

        return true;
    }

    public function getDeliveryUrl(string $providerId, array $transformations = []): string
    {
        $base = '';
        if (str_starts_with($providerId, 'http://') || str_starts_with($providerId, 'https://')) {
            $base = $providerId;
        } elseif (str_starts_with($providerId, 'local/')) {
            $base = '/storage/' . substr($providerId, 6);
        } elseif (str_starts_with($providerId, '/storage/')) {
            $base = $providerId;
        } elseif (str_starts_with($providerId, 'media/')) {
            $base = '/storage/' . $providerId;
        } else {
            $base = '/storage/media/' . ltrim($providerId, '/');
        }

        $query = [];
        if (! empty($transformations['width'])) {
            $query[] = 'w_' . (int) $transformations['width'];
        }
        if (! empty($transformations['quality'])) {
            $query[] = 'q_' . $transformations['quality'];
        }
        foreach ($transformations as $k => $v) {
            if ($k !== 'width' && $k !== 'quality') {
                $query[] = urlencode($k) . '=' . urlencode((string) $v);
            }
        }

        if (! empty($query)) {
            $separator = str_contains($base, '?') ? '&' : '?';
            return $base . $separator . implode('&', $query);
        }

        return $base;
    }

    public function getWatermarkedUrl(string $providerId, string $watermarkText = ''): string
    {
        $deliveryUrl = $this->getDeliveryUrl($providerId);
        $text = rawurlencode($watermarkText ?: 'Mohammed Maher');
        $separator = str_contains($deliveryUrl, '?') ? '&' : '?';

        return $deliveryUrl . $separator . 'watermark=1&text=' . $text;
    }
}
