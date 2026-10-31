<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VisitorPreference extends Model
{
    use HasFactory;

    protected $table = 'visitor_preferences';

    protected $fillable = [
        'consent_token',
        'category_id',
        'preference_key',
        'interactions_count',
        'last_interacted_at',
    ];

    protected $casts = [
        'interactions_count' => 'integer',
        'last_interacted_at' => 'datetime',
    ];

    /**
     * Relationship to consent record.
     */
    public function consentRecord(): BelongsTo
    {
        return $this->belongsTo(ConsentRecord::class, 'consent_token', 'consent_token');
    }

    /**
     * Relationship to category.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'category_id');
    }
}
