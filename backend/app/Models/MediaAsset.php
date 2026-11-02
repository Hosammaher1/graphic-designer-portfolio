<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MediaAsset extends Model
{
    use HasFactory;

    protected $table = 'media_assets';

    protected $fillable = [
        'provider',
        'provider_id',
        'file_name',
        'mime_type',
        'bytes',
        'width',
        'height',
        'original_url',
        'variants',
        'has_watermark',
        'reference_count',
        'pending_delete_at',
    ];

    protected $casts = [
        'bytes' => 'integer',
        'width' => 'integer',
        'height' => 'integer',
        'variants' => 'array',
        'has_watermark' => 'boolean',
        'reference_count' => 'integer',
        'pending_delete_at' => 'datetime',
    ];

    public function projectMedia(): HasMany
    {
        return $this->hasMany(ProjectMedia::class, 'media_asset_id');
    }

    public function projects(): BelongsToMany
    {
        return $this->belongsToMany(Project::class, 'project_media', 'media_asset_id', 'project_id');
    }
}
