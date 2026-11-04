<?php

namespace App\Services\Media;

use App\Models\MediaAsset;
use App\Models\Project;

class WatermarkService
{
    public function __construct(
        private readonly MediaStorageInterface $storage
    ) {
    }

    /**
     * Resolves the appropriate delivery URL for an asset, applying watermarking
     * only when enabled on the asset itself or on the associated project.
     * Original assets are protected and never overwritten.
     */
    public function resolveDisplayUrl(MediaAsset $asset, ?Project $project = null, array $options = []): string
    {
        $shouldWatermark = (bool) $asset->has_watermark || ($project && (bool) $project->enable_watermark);

        if ($shouldWatermark) {
            $watermarkText = $options['watermark_text'] ?? config('portfolio.watermark_text', 'Mohammed Maher');
            $url = $this->storage->getWatermarkedUrl($asset->provider_id, $watermarkText);
            return $url ?: ($asset->original_url ?? '');
        }

        $url = $this->storage->getDeliveryUrl($asset->provider_id, $options['transformations'] ?? []);
        return $url ?: ($asset->original_url ?? '');
    }
}
