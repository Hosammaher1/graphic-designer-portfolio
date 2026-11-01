<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\MediaAsset;
use App\Models\Project;
use App\Models\User;
use App\Services\Backup\DatabaseBackupService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class BackupDatabaseTest extends TestCase
{
    use RefreshDatabase;

    protected DatabaseBackupService $backupService;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('backups');
        $this->backupService = app(DatabaseBackupService::class);
    }

    public function test_creates_encrypted_backup_archive_with_manifest_and_sql_dump(): void
    {
        // Seed sample data to verify table dump and media count
        $user = User::factory()->create(['email' => 'designer@mohammed-portfolio.test']);
        $cat = Category::factory()->create();
        $project = Project::factory()->create(['status' => 'published']);
        $media = MediaAsset::factory()->create();

        $result = $this->backupService->createBackup(
            disk: 'backups',
            encryptionKey: 'test-secret-backup-key-1234567890123456',
            retentionDays: 7
        );

        $this->assertArrayHasKey('filename', $result);
        $this->assertArrayHasKey('manifest', $result);
        $this->assertArrayHasKey('bytes', $result);
        $this->assertStringEndsWith('.enc', $result['filename']);

        // Assert file exists on backups disk
        Storage::disk('backups')->assertExists($result['filename']);

        // Verify manifest metadata
        $manifest = $result['manifest'];
        $this->assertArrayHasKey('generated_at', $manifest);
        $this->assertArrayHasKey('database', $manifest);
        $this->assertArrayHasKey('checksum', $manifest);
        $this->assertArrayHasKey('tables', $manifest);
        $this->assertGreaterThanOrEqual(1, $manifest['media_assets_count']);
        $this->assertEquals('aes-256-cbc', $manifest['encryption_cipher']);
    }

    public function test_backup_can_be_decrypted_with_correct_key_and_verifies_checksum(): void
    {
        $key = 'my-super-secret-backup-key-32ch';
        User::factory()->create(['email' => 'backup-verify@test.com']);

        $backupResult = $this->backupService->createBackup(
            disk: 'backups',
            encryptionKey: $key,
            retentionDays: 7
        );

        $encryptedContent = Storage::disk('backups')->get($backupResult['filename']);
        $decrypted = $this->backupService->decryptBackup($encryptedContent, $key);

        $this->assertArrayHasKey('sql', $decrypted);
        $this->assertArrayHasKey('manifest', $decrypted);

        // Verify SQL contents contain tables and data
        $this->assertStringContainsString('CREATE TABLE', $decrypted['sql']);
        $this->assertStringContainsString('users', $decrypted['sql']);
        $this->assertStringContainsString('backup-verify@test.com', $decrypted['sql']);

        // Verify checksum integrity
        $calculatedChecksum = hash('sha256', $decrypted['sql']);
        $this->assertEquals($decrypted['manifest']['checksum'], $calculatedChecksum);
    }

    public function test_decryption_fails_with_invalid_key_or_tampered_payload(): void
    {
        $key = 'correct-key-12345678901234567890';
        $wrongKey = 'wrong-key-09876543210987654321';

        $backupResult = $this->backupService->createBackup(
            disk: 'backups',
            encryptionKey: $key,
            retentionDays: 7
        );

        $encryptedContent = Storage::disk('backups')->get($backupResult['filename']);

        // 1. Wrong key fails
        $this->expectException(\RuntimeException::class);
        $this->backupService->decryptBackup($encryptedContent, $wrongKey);
    }

    public function test_tampered_payload_is_rejected_due_to_hmac_mismatch(): void
    {
        $key = 'secure-key-12345678901234567890';
        $backupResult = $this->backupService->createBackup(
            disk: 'backups',
            encryptionKey: $key,
            retentionDays: 7
        );

        $encryptedContent = Storage::disk('backups')->get($backupResult['filename']);
        $decoded = json_decode($encryptedContent, true);
        $this->assertNotNull($decoded);

        // Tamper with ciphertext
        $decoded['ciphertext'] = base64_encode('tampered-malicious-bytes');
        $tamperedContent = json_encode($decoded);

        $this->expectException(\RuntimeException::class);
        $this->backupService->decryptBackup($tamperedContent, $key);
    }

    public function test_retention_policy_purges_backups_older_than_7_days(): void
    {
        // Create an old backup file (simulate 10 days old)
        $oldFilename = 'portfolio_backup_2026-01-01_120000.enc';
        Storage::disk('backups')->put($oldFilename, 'old-dummy-encrypted-data');

        // Create a recent backup
        $recentFilename = 'portfolio_backup_' . now()->format('Y-m-d_His') . '.enc';
        Storage::disk('backups')->put($recentFilename, 'recent-dummy-encrypted-data');

        $purged = $this->backupService->purgeOldBackups('backups', retentionDays: 7);

        $this->assertContains($oldFilename, $purged);
        Storage::disk('backups')->assertMissing($oldFilename);
        Storage::disk('backups')->assertExists($recentFilename);
    }

    public function test_artisan_command_executes_successfully_and_outputs_summary(): void
    {
        Config::set('backup.disk', 'backups');
        Config::set('backup.encryption_key', 'artisan-command-test-key-1234567');

        $this->artisan('backup:run', ['--disk' => 'backups'])
            ->expectsOutputToContain('Backup completed successfully')
            ->assertSuccessful();

        $files = Storage::disk('backups')->files();
        $this->assertNotEmpty($files);
        $this->assertStringEndsWith('.enc', $files[0]);
    }

    public function test_backup_failure_triggers_critical_alert_and_error_logging(): void
    {
        Log::shouldReceive('error')->atLeast()->once();

        // Pass invalid disk that throws exception
        try {
            $this->backupService->createBackup(disk: 'non_existent_disk');
        } catch (\Throwable $e) {
            // Expected exception
        }
    }

    public function test_backup_failure_log_and_webhook_do_not_include_exception_secret(): void
    {
        Config::set('backup.alert_webhook', 'https://alerts.example.test/hook');
        \Illuminate\Support\Facades\Http::fake();
        Log::spy();

        $service = new class extends \App\Services\Backup\DatabaseBackupService {
            public function simulateFailure(\Throwable $exception): void
            {
                $this->handleBackupFailure($exception, 'backups');
            }
        };
        $service->simulateFailure(new \RuntimeException('Provider password=private-backup-secret'));

        Log::shouldHaveReceived('error')->withArgs(function ($message, $context) {
            return !str_contains(json_encode([$message, $context]), 'private-backup-secret');
        })->once();
        \Illuminate\Support\Facades\Http::assertSent(function ($request) {
            return !str_contains(json_encode($request->data()), 'private-backup-secret');
        });
    }
}
