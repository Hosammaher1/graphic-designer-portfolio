<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('analytics_daily_aggregates', function (Blueprint $table) {
            $table->id();
            $table->date('date')->index();
            $table->enum('dimension_type', ['overview', 'project', 'page', 'referrer_category', 'device'])->index();
            $table->string('dimension_value', 255)->default('total')->index();
            $table->unsignedBigInteger('total_views')->default(0);
            $table->unsignedBigInteger('unique_visitors')->default(0);
            $table->timestamps();

            // Compound unique index for idempotent daily upserts
            $table->unique(['date', 'dimension_type', 'dimension_value'], 'idx_daily_agg_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('analytics_daily_aggregates');
    }
};
