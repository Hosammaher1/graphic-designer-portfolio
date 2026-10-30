<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Project extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'slug',
        'status',
        'is_featured',
        'published_at',
        'year',
        'client',
        'cover_media_id',
        'view_count',
        'enable_watermark',
        'published_snapshot',
    ];

    protected $casts = [
        'is_featured' => 'boolean',
        'enable_watermark' => 'boolean',
        'published_at' => 'datetime',
        'year' => 'integer',
        'view_count' => 'integer',
        'published_snapshot' => 'array',
    ];

    // --- Relationships ---

    public function translations(): HasMany
    {
        return $this->hasMany(ProjectTranslation::class);
    }

    public function translation(?string $locale = null): ?ProjectTranslation
    {
        $locale = $locale ?: app()->getLocale();

        return $this->translations->firstWhere('locale', $locale)
            ?? $this->translations->firstWhere('locale', 'ar')
            ?? $this->translations->first();
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class, 'category_project');
    }

    public function tools(): BelongsToMany
    {
        return $this->belongsToMany(Tool::class, 'project_tool');
    }

    public function media(): HasMany
    {
        return $this->hasMany(ProjectMedia::class)->orderBy('sort_order');
    }

    public function coverMedia(): BelongsTo
    {
        return $this->belongsTo(MediaAsset::class, 'cover_media_id');
    }

    // --- Scopes ---

    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }
}
