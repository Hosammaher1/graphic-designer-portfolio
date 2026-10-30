<?php

namespace App\Services\Media;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;

class CloudinaryMediaStorage implements MediaStorageInterface
{
    private const MAX_BYTES = 15728640; // 15MB

    private const ALLOWED_MIMES = [
        'image/jpeg',
        'image/png',
        'image/webp',
    ];

    public function __construct(
        private readonly ?string $cloudName = null,
        private readonly ?string $apiKey = null,
        private readonly ?string $apiSecret = null
    ) {
    }

    public function upload(UploadedFile $file, array $options = []): array
    {
        if ($file->getSize() > self::MAX_BYTES) {
            throw new \InvalidArgumentException('File exceeds maximum allowed size of 15MB.');
        }

        $mime = $file->getMimeType();
        if (! in_array($mime, self::ALLOWED_MIMES, true)) {
            throw new \InvalidArgumentException("Disallowed file format [{$mime}]. Allowed formats: JPG, PNG, WebP.");
        }

        $width = null;
        $height = null;
        $imageSize = @getimagesize($file->getRealPath());
        if ($imageSize) {
            $width = $imageSize[0];
            $height = $imageSize[1];
        }

        $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $safeName = Str::slug($originalName) . '-' . Str::random(8) . '.' . ($file->getClientOriginalExtension() ?: 'jpg');
        $providerId = 'portfolio/' . Str::uuid();

        $cloud = $this->cloudName ?: 'demo';
        $baseUrl = "https://res.cloudinary.com/{$cloud}/image/upload";

        return [
            'provider'      => 'cloudinary',
            'provider_id'   => $providerId,
            'file_name'     => $safeName,
            'mime_type'     => $mime,
            'bytes'         => $file->getSize(),
            'width'         => $width,
            'height'        => $height,
            'original_url'  => "{$baseUrl}/{$providerId}",
            'variants'      => [
                'thumbnail' => "{$baseUrl}/c_fill,w_300,h_300,q_auto,f_auto/{$providerId}",
                'medium'    => "{$baseUrl}/c_limit,w_800,q_auto,f_auto/{$providerId}",
                'full'      => "{$baseUrl}/c_limit,w_1920,q_auto,f_auto/{$providerId}",
                'webp'      => "{$baseUrl}/f_webp,q_auto/{$providerId}",
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
        $cloud = $this->cloudName ?: 'demo';
        $transforms = [];

        if (! empty($transformations['width'])) {
            $transforms[] = 'w_' . (int) $transformations['width'];
        }
        if (! empty($transformations['quality'])) {
            $transforms[] = 'q_' . $transformations['quality'];
        } else {
            $transforms[] = 'q_auto';
        }
        $transforms[] = 'f_auto';

        $transformString = implode(',', $transforms);

        return "https://res.cloudinary.com/{$cloud}/image/upload/{$transformString}/{$providerId}";
    }

    public function getWatermarkedUrl(string $providerId, string $watermarkText = ''): string
    {
        $cloud = $this->cloudName ?: 'demo';
        $text = rawurlencode($watermarkText ?: 'Mohammed Maher');
        $watermarkTransform = "l_text:Arial_36:{$text},g_south_east,x_20,y_20,o_60,q_auto,f_auto";

        return "https://res.cloudinary.com/{$cloud}/image/upload/{$watermarkTransform}/{$providerId}";
    }
}
