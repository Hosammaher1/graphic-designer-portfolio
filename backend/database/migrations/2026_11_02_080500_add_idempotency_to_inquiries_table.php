<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inquiries', function (Blueprint $table) {
            $table->string('idempotency_key_hash', 64)->nullable()->unique();
            $table->string('request_fingerprint', 64)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('inquiries', function (Blueprint $table) {
            $table->dropUnique(['idempotency_key_hash']);
            $table->dropColumn(['idempotency_key_hash', 'request_fingerprint']);
        });
    }
};
