<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AnalyticsEvent extends Model
{
    use HasFactory;

    protected $table = 'analytics_events';

    public const UPDATED_AT = null;

    protected $fillable = [
        'event_type',
        'path',
        'project_id',
        'visitor_hash',
        'referrer_url',
        'referrer_domain',
        'referrer_category',
        'device_type',
        'locale',
        'idempotency_key',
        'is_bot',
        'created_at',
    ];

    protected $casts = [
        'is_bot' => 'boolean',
        'created_at' => 'datetime',
    ];

    /**
     * Relationship to project if associated with a project view.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class, 'project_id');
    }
}
