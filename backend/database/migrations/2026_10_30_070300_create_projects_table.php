<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 150)->unique();
            $table->enum('status', ['draft', 'published', 'archived'])->default('draft')->index();
            $table->boolean('is_featured')->default(false)->index();
            $table->timestamp('published_at')->nullable()->index();
            $table->smallInteger('year')->nullable();
            $table->string('client', 255)->nullable();
            $table->foreignId('cover_media_id')->nullable()->constrained('media_assets')->nullOnDelete();
            $table->unsignedInteger('view_count')->default(0);
            $table->json('published_snapshot')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('project_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->string('locale', 5)->index();
            $table->string('title', 255);
            $table->text('summary')->nullable();
            $table->longText('description')->nullable();
            $table->string('seo_title', 255)->nullable();
            $table->text('seo_description')->nullable();
            $table->timestamps();

            $table->unique(['project_id', 'locale']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_translations');
        Schema::dropIfExists('projects');
    }
};
