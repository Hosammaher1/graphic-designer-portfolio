<?php

namespace App\Services\Media;

use Illuminate\Http\UploadedFile;

interface MediaStorageInterface
{
    /**
     * Upload an asset and return normalized metadata.
     *
     * @param  UploadedFile  $file
     * @param  array  $options
     * @return array{
     *   provider: string,
     *   provider_id: string,
     *   file_name: string,
     *   mime_type: string,
     *   bytes: int,
     *   width: int|null,
     *   height: int|null,
     *   original_url: string,
     *   variants: array<string, string>,
     *   has_watermark: bool
     * }
     */
    public function upload(UploadedFile $file, array $options = []): array;

    /**
     * Delete an asset from storage provider.
     */
    public function delete(string $providerId): bool;

    /**
     * Generate an optimized display URL with optional transformations.
     */
    public function getDeliveryUrl(string $providerId, array $transformations = []): string;

    /**
     * Generate a watermarked delivery URL for display.
     */
    public function getWatermarkedUrl(string $providerId, string $watermarkText = ''): string;
}
