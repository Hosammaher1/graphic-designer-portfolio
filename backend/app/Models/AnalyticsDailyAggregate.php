<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AnalyticsDailyAggregate extends Model
{
    use HasFactory;

    protected $table = 'analytics_daily_aggregates';

    protected $fillable = [
        'date',
        'dimension_type',
        'dimension_value',
        'total_views',
        'unique_visitors',
    ];

    protected $casts = [
        'date' => 'date',
        'total_views' => 'integer',
        'unique_visitors' => 'integer',
    ];
}
