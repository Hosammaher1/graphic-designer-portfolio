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
        Schema::create('analytics_events', function (Blueprint $table) {
            $table->id();
            $table->enum('event_type', ['page_view', 'project_view', 'custom'])->default('page_view');
            $table->string('path', 255)->index();
            $table->foreignId('project_id')->nullable()->constrained('projects')->nullOnDelete();
            // Cryptographic daily salted hash - NEVER store raw IP address
            $table->string('visitor_hash', 64)->index();
            $table->string('referrer_url', 500)->nullable();
            $table->string('referrer_domain', 100)->nullable()->index();
            $table->enum('referrer_category', ['direct', 'search', 'social', 'external'])->default('direct')->index();
            $table->enum('device_type', ['desktop', 'mobile', 'tablet', 'unknown'])->default('unknown');
            $table->string('locale', 5)->default('ar');
            $table->string('idempotency_key', 64)->nullable()->unique();
            $table->boolean('is_bot')->default(false);
            $table->timestamp('created_at')->useCurrent()->index();

            $table->index(['event_type', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('analytics_events');
    }
};
