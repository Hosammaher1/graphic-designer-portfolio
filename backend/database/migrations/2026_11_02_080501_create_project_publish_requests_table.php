<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('project_publish_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->string('key_hash', 64);
            $table->unsignedInteger('snapshot_version');
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['project_id', 'key_hash']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_publish_requests');
    }
};
