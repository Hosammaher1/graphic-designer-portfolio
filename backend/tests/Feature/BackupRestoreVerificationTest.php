<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\MediaAsset;
use App\Models\Project;
use App\Models\User;
use App\Services\Backup\DatabaseBackupService;
use App\Services\Backup\DatabaseRestoreService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class BackupRestoreVerificationTest extends TestCase
{
    use RefreshDatabase;

    protected DatabaseBackupService $backupService;
    protected DatabaseRestoreService $restoreService;
    protected string $testKey = 'drill-test-secret-key-12345678901';

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('backups');
        $this->backupService = app(DatabaseBackupService::class);
        $this->restoreService = app(DatabaseRestoreService::class);
    }

    public function test_verify_only_validates_archive_integrity_without_modifications(): void
    {
        User::factory()->create(['email' => 'restore-author@test.com']);
        $cat = Category::factory()->create();

        $backupResult = $this->backupService->createBackup(
            disk: 'backups',
            encryptionKey: $this->testKey,
            retentionDays: 7
        );

        $verifyResult = $this->restoreService->restoreFromArchive(
            archiveFilename: $backupResult['filename'],
            encryptionKey: $this->testKey,
            disk: 'backups',
            verifyOnly: true
        );

        $this->assertEquals('verified', $verifyResult['status']);
        $this->assertTrue($verifyResult['verified_only']);
        $this->assertTrue($verifyResult['checksum_verified']);
        $this->assertEquals($backupResult['filename'], $verifyResult['filename']);
        $this->assertArrayHasKey('tables', $verifyResult['manifest']);
    }

    public function test_restore_from_archive_restores_tables_and_verifies_row_counts(): void
    {
        // 1. Seed known data
        $seededUser = User::factory()->create(['email' => 'restored-designer@test.com']);
        $seededCat = Category::factory()->create(['slug' => 'branding-restore-test']);
        $seededProject = Project::factory()->create(['slug' => 'restored-brand-identity', 'status' => 'published']);

        // 2. Create encrypted backup
        $backupResult = $this->backupService->createBackup(
            disk: 'backups',
            encryptionKey: $this->testKey,
            retentionDays: 7
        );

        // 3. Mutate / truncate database to simulate disaster
        DB::table('users')->where('email', 'restored-designer@test.com')->delete();
        DB::table('categories')->where('slug', 'branding-restore-test')->delete();
        DB::table('projects')->where('slug', 'restored-brand-identity')->delete();

        $this->assertDatabaseMissing('users', ['email' => 'restored-designer@test.com']);
        $this->assertDatabaseMissing('categories', ['slug' => 'branding-restore-test']);
        $this->assertDatabaseMissing('projects', ['slug' => 'restored-brand-identity']);

        // 4. Execute restore
        $restoreResult = $this->restoreService->restoreFromArchive(
            archiveFilename: $backupResult['filename'],
            connection: config('database.default'),
            encryptionKey: $this->testKey,
            disk: 'backups',
            verifyOnly: false
        );

        // 5. Assert full integrity verification
        $this->assertEquals('verified', $restoreResult['status']);
        $this->assertTrue($restoreResult['all_counts_matched']);
        $this->assertGreaterThan(0, $restoreResult['duration_seconds']);

        // Assert data was fully restored
        $this->assertDatabaseHas('users', ['email' => 'restored-designer@test.com']);
        $this->assertDatabaseHas('categories', ['slug' => 'branding-restore-test']);
        $this->assertDatabaseHas('projects', ['slug' => 'restored-brand-identity']);
    }

    public function test_restore_fails_with_invalid_decryption_key(): void
    {
        $backupResult = $this->backupService->createBackup(
            disk: 'backups',
            encryptionKey: $this->testKey,
            retentionDays: 7
        );

        $this->expectException(\RuntimeException::class);
        $this->restoreService->restoreFromArchive(
            archiveFilename: $backupResult['filename'],
            encryptionKey: 'wrong-key-00000000000000000000',
            disk: 'backups',
            verifyOnly: true
        );
    }

    public function test_restore_fails_when_archive_is_tampered(): void
    {
        $backupResult = $this->backupService->createBackup(
            disk: 'backups',
            encryptionKey: $this->testKey,
            retentionDays: 7
        );

        $content = Storage::disk('backups')->get($backupResult['filename']);
        $envelope = json_decode($content, true);
        $envelope['ciphertext'] = base64_encode('malicious_tampered_sql');
        Storage::disk('backups')->put($backupResult['filename'], json_encode($envelope));

        $this->expectException(\RuntimeException::class);
        $this->restoreService->restoreFromArchive(
            archiveFilename: $backupResult['filename'],
            encryptionKey: $this->testKey,
            disk: 'backups',
            verifyOnly: true
        );
    }

    public function test_artisan_command_verify_only_executes_successfully(): void
    {
        Config::set('backup.disk', 'backups');
        Config::set('backup.encryption_key', $this->testKey);

        $backupResult = $this->backupService->createBackup(
            disk: 'backups',
            encryptionKey: $this->testKey,
            retentionDays: 7
        );

        $this->artisan('backup:restore', [
            'file' => $backupResult['filename'],
            '--verify-only' => true,
            '--disk' => 'backups',
            '--key' => $this->testKey,
        ])
            ->expectsOutputToContain('Backup archive verified successfully!')
            ->assertSuccessful();
    }

    public function test_artisan_command_restore_forces_execution_and_reports_table_integrity(): void
    {
        Config::set('backup.disk', 'backups');
        Config::set('backup.encryption_key', $this->testKey);

        $backupResult = $this->backupService->createBackup(
            disk: 'backups',
            encryptionKey: $this->testKey,
            retentionDays: 7
        );

        $this->artisan('backup:restore', [
            'file' => $backupResult['filename'],
            '--force' => true,
            '--disk' => 'backups',
            '--key' => $this->testKey,
        ])
            ->expectsOutputToContain('Database restore completed successfully!')
            ->expectsOutputToContain('All Table Counts Matched')
            ->assertSuccessful();
    }
}
