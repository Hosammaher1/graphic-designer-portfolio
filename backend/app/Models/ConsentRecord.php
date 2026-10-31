<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class ConsentRecord extends Model
{
    use HasFactory;

    protected $table = 'consent_records';

    protected $fillable = [
        'consent_token',
        'status',
        'analytics_allowed',
        'personalization_allowed',
        'policy_version',
        'withdrawn_at',
        'expires_at',
    ];

    protected $casts = [
        'analytics_allowed' => 'boolean',
        'personalization_allowed' => 'boolean',
        'withdrawn_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    /**
     * Generate a pseudonymous consent token.
     */
    public static function generateToken(): string
    {
        return 'c_' . Str::random(40);
    }

    /**
     * Scope active non-expired records.
     */
    public function scopeActive($query)
    {
        return $query->where('expires_at', '>', now())
            ->whereNull('withdrawn_at');
    }

    /**
     * Relationship to visitor preferences.
     */
    public function preferences(): HasMany
    {
        return $this->hasMany(VisitorPreference::class, 'consent_token', 'consent_token');
    }
}
