<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pages', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 100)->unique();
            $table->string('title_ar')->nullable();
            $table->string('title_en')->nullable();
            $table->unsignedBigInteger('published_version_id')->nullable()->index();
            $table->unsignedBigInteger('current_draft_version_id')->nullable()->index();
            $table->unsignedInteger('lock_version')->default(1);
            $table->timestamps();
        });

        Schema::create('page_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('page_id')->constrained('pages')->cascadeOnDelete();
            $table->unsignedInteger('version_number');
            $table->string('status', 20)->default('draft')->index(); // draft, published, archived
            $table->json('blocks');
            $table->json('metadata')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['page_id', 'version_number']);
        });

        Schema::table('pages', function (Blueprint $table) {
            $table->foreign('published_version_id')
                ->references('id')
                ->on('page_versions')
                ->nullOnDelete();

            $table->foreign('current_draft_version_id')
                ->references('id')
                ->on('page_versions')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('pages', function (Blueprint $table) {
            $table->dropForeign(['published_version_id']);
            $table->dropForeign(['current_draft_version_id']);
        });

        Schema::dropIfExists('page_versions');
        Schema::dropIfExists('pages');
    }
};
