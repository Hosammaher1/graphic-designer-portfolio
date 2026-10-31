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
        Schema::create('consent_records', function (Blueprint $table) {
            $table->id();
            // Pseudonymous unique token - strictly NO user_id, email, or raw IP address
            $table->string('consent_token', 64)->unique();
            $table->enum('status', ['accepted', 'rejected', 'customized', 'withdrawn'])->default('rejected');
            $table->boolean('analytics_allowed')->default(false);
            $table->boolean('personalization_allowed')->default(false);
            $table->string('policy_version', 16)->default('1.0');
            $table->timestamp('withdrawn_at')->nullable();
            $table->timestamp('expires_at')->nullable()->index();
            $table->timestamps();

            $table->index(['status', 'expires_at']);
        });

        Schema::create('visitor_preferences', function (Blueprint $table) {
            $table->id();
            // Associated pseudonymous token only
            $table->string('consent_token', 64)->index();
            $table->foreignId('category_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->string('preference_key', 64)->nullable();
            $table->unsignedInteger('interactions_count')->default(1);
            $table->timestamp('last_interacted_at')->nullable();
            $table->timestamps();

            $table->foreign('consent_token')
                ->references('consent_token')
                ->on('consent_records')
                ->cascadeOnDelete();

            $table->index(['consent_token', 'category_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('visitor_preferences');
        Schema::dropIfExists('consent_records');
    }
};
