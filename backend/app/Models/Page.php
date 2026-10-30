<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Page extends Model
{
    use HasFactory;

    protected $fillable = [
        'slug',
        'title_ar',
        'title_en',
        'published_version_id',
        'current_draft_version_id',
        'lock_version',
    ];

    protected $casts = [
        'lock_version' => 'integer',
        'published_version_id' => 'integer',
        'current_draft_version_id' => 'integer',
    ];

    public function publishedVersion(): BelongsTo
    {
        return $this->belongsTo(PageVersion::class, 'published_version_id');
    }

    public function currentDraftVersion(): BelongsTo
    {
        return $this->belongsTo(PageVersion::class, 'current_draft_version_id');
    }

    public function versions(): HasMany
    {
        return $this->hasMany(PageVersion::class)->orderBy('version_number', 'desc');
    }
}
