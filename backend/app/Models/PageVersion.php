<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PageVersion extends Model
{
    use HasFactory;

    protected $fillable = [
        'page_id',
        'version_number',
        'status',
        'blocks',
        'metadata',
        'created_by',
    ];

    protected $casts = [
        'page_id' => 'integer',
        'version_number' => 'integer',
        'blocks' => 'array',
        'metadata' => 'array',
        'created_by' => 'integer',
    ];

    public function page(): BelongsTo
    {
        return $this->belongsTo(Page::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
