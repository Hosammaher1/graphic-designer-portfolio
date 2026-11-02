<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JourneyMilestone extends Model
{
    use HasFactory;

    protected $fillable = [
        'year',
        'role_en',
        'role_ar',
        'company_en',
        'company_ar',
        'location_en',
        'location_ar',
        'description_en',
        'description_ar',
        'icon_name',
        'image_url',
        'tags',
        'achievements',
        'sort_order',
        'is_visible',
        'is_published',
    ];

    protected $casts = [
        'tags' => 'array',
        'achievements' => 'array',
        'sort_order' => 'integer',
        'is_visible' => 'boolean',
        'is_published' => 'boolean',
    ];

    /**
     * Scope for public display: only published and visible milestones ordered by sort_order.
     */
    public function scopePubliclyVisible(Builder $query): Builder
    {
        return $query->where('is_published', true)
            ->where('is_visible', true)
            ->orderBy('sort_order', 'asc')
            ->orderBy('id', 'asc');
    }

    /**
     * Format milestone data for client response according to locale.
     */
    public function toLocalizedArray(string $locale = 'ar'): array
    {
        $isAr = $locale === 'ar';

        return [
            'id' => $this->id,
            'year' => $this->year,
            'role' => [
                'en' => $this->role_en,
                'ar' => $this->role_ar,
            ],
            'company' => [
                'en' => $this->company_en ?? '',
                'ar' => $this->company_ar ?? '',
            ],
            'location' => [
                'en' => $this->location_en ?? '',
                'ar' => $this->location_ar ?? '',
            ],
            'description' => [
                'en' => $this->description_en,
                'ar' => $this->description_ar,
            ],
            'iconName' => $this->icon_name,
            'imageUrl' => $this->image_url,
            'tags' => $this->tags ?? [],
            'achievements' => $this->achievements ?? [],
            'sort_order' => $this->sort_order,
            'is_visible' => $this->is_visible,
            'is_published' => $this->is_published,
            'activeRole' => $isAr ? $this->role_ar : $this->role_en,
            'activeCompany' => $isAr ? ($this->company_ar ?? $this->company_en ?? '') : ($this->company_en ?? ''),
            'activeDescription' => $isAr ? $this->description_ar : $this->description_en,
        ];
    }
}
