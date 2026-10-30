<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('media_assets', function (Blueprint $table) {
            $table->id();
            $table->enum('provider', ['cloudinary', 'local'])->default('cloudinary');
            $table->string('provider_id', 255)->nullable();
            $table->string('file_name', 255);
            $table->string('mime_type', 100);
            $table->unsignedBigInteger('bytes');
            $table->unsignedInteger('width')->nullable();
            $table->unsignedInteger('height')->nullable();
            $table->text('original_url')->nullable();
            $table->json('variants')->nullable();
            $table->boolean('has_watermark')->default(false);
            $table->unsignedInteger('reference_count')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('media_assets');
    }
};
