<?php

namespace App\Services\Media;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
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

    /**
     * Compute Cloudinary SHA1 signature for parameters.
     * All parameters are sorted alphabetically by key and joined as key=value&...
     * without URL-encoding, followed directly by the API secret.
     */
    public function computeSignature(array $params): string
    {
        ksort($params);
        $toSign = [];
        foreach ($params as $key => $value) {
            if ($value !== null && $value !== '') {
                $toSign[] = "{$key}={$value}";
            }
        }

        return sha1(implode('&', $toSign) . $this->apiSecret);
    }

    /**
     * Upload an asset to Cloudinary and return normalized metadata.
     * Authenticates with Cloudinary REST API using signed requests.
     */
    public function upload(UploadedFile $file, array $options = []): array
    {
        // 1. Pre-transfer validation
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

        if (! $this->cloudName || ! $this->apiKey || ! $this->apiSecret) {
            throw new \RuntimeException('Cloudinary credentials (cloud_name, api_key, api_secret) are not configured.');
        }

        $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $safeName = Str::slug($originalName) . '-' . Str::random(8) . '.' . ($file->getClientOriginalExtension() ?: 'jpg');
        $providerId = 'portfolio/' . Str::uuid();

        $timestamp = time();
        $paramsToSign = [
            'public_id' => $providerId,
            'timestamp' => (string) $timestamp,
        ];

        if (! empty($options['folder'])) {
            $paramsToSign['folder'] = (string) $options['folder'];
        }

        $signature = $this->computeSignature($paramsToSign);

        $endpoint = "https://api.cloudinary.com/v1_1/{$this->cloudName}/image/upload";

        $multipartData = [
            [
                'name'     => 'file',
                'contents' => fopen($file->getRealPath(), 'r'),
                'filename' => $safeName,
            ],
            [
                'name'     => 'api_key',
                'contents' => $this->apiKey,
            ],
            [
                'name'     => 'timestamp',
                'contents' => (string) $timestamp,
            ],
            [
                'name'     => 'public_id',
                'contents' => $providerId,
            ],
            [
                'name'     => 'signature',
                'contents' => $signature,
            ],
        ];

        if (! empty($options['folder'])) {
            $multipartData[] = [
                'name'     => 'folder',
                'contents' => (string) $options['folder'],
            ];
        }

        try {
            $response = Http::timeout(25)
                ->retry(2, 200, throw: false)
                ->asMultipart()
                ->post($endpoint, $multipartData);
        } catch (\Throwable $e) {
            Log::error('Cloudinary upload network failure.', [
                'provider_id' => $providerId,
                'error_type'  => get_class($e),
                'error_msg'   => $e->getMessage(),
            ]);
            throw new \RuntimeException('Cloudinary media upload failed due to network connection error.');
        }

        if (! $response->successful()) {
            $errorMessage = $response->json('error.message') ?? 'Unknown Cloudinary error';
            Log::error('Cloudinary upload rejected.', [
                'status'      => $response->status(),
                'provider_id' => $providerId,
                'message'     => $errorMessage,
            ]);
            throw new \RuntimeException("Cloudinary upload failed: {$errorMessage}");
        }

        $result = $response->json();
        $actualBytes = $result['bytes'] ?? $file->getSize();
        $actualWidth = $result['width'] ?? $width;
        $actualHeight = $result['height'] ?? $height;
        $secureUrl = $result['secure_url'] ?? "https://res.cloudinary.com/{$this->cloudName}/image/upload/{$providerId}";

        $baseUrl = "https://res.cloudinary.com/{$this->cloudName}/image/upload";

        return [
            'provider'      => 'cloudinary',
            'provider_id'   => $providerId,
            'file_name'     => $safeName,
            'mime_type'     => $mime,
            'bytes'         => $actualBytes,
            'width'         => $actualWidth,
            'height'        => $actualHeight,
            'original_url'  => $secureUrl,
            'variants'      => [
                'thumbnail' => "{$baseUrl}/c_fill,w_300,h_300,q_auto,f_auto/{$providerId}",
                'medium'    => "{$baseUrl}/c_limit,w_800,q_auto,f_auto/{$providerId}",
                'full'      => "{$baseUrl}/c_limit,w_1920,q_auto,f_auto/{$providerId}",
                'webp'      => "{$baseUrl}/f_webp,q_auto/{$providerId}",
            ],
            'has_watermark' => false,
        ];
    }

    /**
     * Delete an asset from Cloudinary using authenticated destroy API.
     */
    public function delete(string $providerId): bool
    {
        if (! $this->cloudName || ! $this->apiKey || ! $this->apiSecret) {
            throw new \RuntimeException('Cloudinary credentials (cloud_name, api_key, api_secret) are not configured.');
        }

        $timestamp = time();
        $paramsToSign = [
            'public_id' => $providerId,
            'timestamp' => (string) $timestamp,
        ];

        $signature = $this->computeSignature($paramsToSign);

        $endpoint = "https://api.cloudinary.com/v1_1/{$this->cloudName}/image/destroy";

        try {
            $response = Http::timeout(15)
                ->retry(2, 200, throw: false)
                ->asForm()
                ->post($endpoint, [
                    'public_id' => $providerId,
                    'api_key'   => $this->apiKey,
                    'timestamp' => (string) $timestamp,
                    'signature' => $signature,
                ]);
        } catch (\Throwable $e) {
            Log::error('Cloudinary destroy network failure.', [
                'provider_id' => $providerId,
                'error_type'  => get_class($e),
                'error_msg'   => $e->getMessage(),
            ]);
            return false;
        }

        if (! $response->successful()) {
            Log::error('Cloudinary destroy request rejected.', [
                'status'      => $response->status(),
                'provider_id' => $providerId,
            ]);
            return false;
        }

        $result = $response->json('result');

        return in_array($result, ['ok', 'not found'], true);
    }

    /**
     * Generate an optimized delivery URL with on-the-fly transformations.
     */
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

    /**
     * Generate a watermarked delivery URL.
     */
    public function getWatermarkedUrl(string $providerId, string $watermarkText = ''): string
    {
        $cloud = $this->cloudName ?: 'demo';
        $text = rawurlencode($watermarkText ?: 'Mohammed Maher');
        $watermarkTransform = "l_text:Arial_36:{$text},g_south_east,x_20,y_20,o_60,q_auto,f_auto";

        return "https://res.cloudinary.com/{$cloud}/image/upload/{$watermarkTransform}/{$providerId}";
    }
}
