<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectMedia extends Model
{
    use HasFactory;

    protected $table = 'project_media';

    protected $fillable = [
        'project_id',
        'media_asset_id',
        'sort_order',
        'is_cover',
        'caption_ar',
        'caption_en',
    ];

    protected $casts = [
        'sort_order' => 'integer',
        'is_cover' => 'boolean',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function mediaAsset(): BelongsTo
    {
        return $this->belongsTo(MediaAsset::class, 'media_asset_id');
    }
}
