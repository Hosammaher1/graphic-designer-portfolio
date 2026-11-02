<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('journey_milestones', function (Blueprint $table) {
            $table->id();
            $table->string('year', 50);
            $table->string('role_en');
            $table->string('role_ar');
            $table->string('company_en')->nullable();
            $table->string('company_ar')->nullable();
            $table->string('location_en')->nullable();
            $table->string('location_ar')->nullable();
            $table->text('description_en');
            $table->text('description_ar');
            $table->string('icon_name', 50)->default('Award');
            $table->string('image_url')->nullable();
            $table->json('tags')->nullable();
            $table->json('achievements')->nullable();
            $table->integer('sort_order')->default(0)->index();
            $table->boolean('is_visible')->default(true)->index();
            $table->boolean('is_published')->default(true)->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('journey_milestones');
    }
};
