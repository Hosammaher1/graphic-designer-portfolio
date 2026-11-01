<?php

namespace App\Services\Backup;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class DatabaseRestoreService
{
    public function __construct(
        protected DatabaseBackupService $backupService
    ) {
    }

    /**
     * Restore database from an encrypted backup archive.
     *
     * @param string|null $archiveFilename Archive file name or null for latest
     * @param string|null $connection Database connection name to restore into
     * @param string|null $encryptionKey Secret decryption key
     * @param string|null $disk Storage disk
     * @param bool $verifyOnly Only verify decryptability and checksum without executing SQL
     * @return array
     */
    public function restoreFromArchive(
        ?string $archiveFilename = null,
        ?string $connection = null,
        ?string $encryptionKey = null,
        ?string $disk = null,
        bool $verifyOnly = false
    ): array {
        $diskName = $disk ?? config('backup.disk', 'backups');
        $rawKey = $encryptionKey ?? config('backup.encryption_key') ?? config('app.key');

        if (empty($rawKey)) {
            throw new \RuntimeException('Decryption key is missing. Set BACKUP_ENCRYPTION_KEY or APP_KEY.');
        }

        // 1. Resolve archive filename
        $filename = $archiveFilename;
        if (empty($filename) || $filename === 'latest') {
            $files = collect(Storage::disk($diskName)->files())
                ->filter(fn($f) => str_ends_with($f, '.enc'))
                ->sortDesc()
                ->values();

            if ($files->isEmpty()) {
                throw new \RuntimeException("No backup archives (.enc) found on disk [{$diskName}].");
            }
            $filename = $files->first();
        }

        if (!Storage::disk($diskName)->exists($filename)) {
            throw new \RuntimeException("Backup archive [{$filename}] does not exist on disk [{$diskName}].");
        }

        $encryptedContent = Storage::disk($diskName)->get($filename);

        // 2. Decrypt and verify HMAC + Checksum integrity
        $package = $this->backupService->decryptBackup($encryptedContent, $rawKey);
        $manifest = $package['manifest'];
        $sql = $package['sql'];

        if ($verifyOnly) {
            Log::info("Backup archive [{$filename}] verified successfully (Verify-only mode).");
            return [
                'status' => 'verified',
                'verified_only' => true,
                'filename' => $filename,
                'manifest' => $manifest,
                'checksum_verified' => true,
            ];
        }

        // 3. Execute SQL restore against target connection
        $targetConnection = $connection ?? config('database.default');
        $startTime = microtime(true);

        $pdo = DB::connection($targetConnection)->getPdo();
        $dbName = DB::connection($targetConnection)->getDatabaseName();

        $this->executeSqlStatements($pdo, $sql);

        // 4. Validate post-restore table row counts against manifest
        $tableVerification = [];
        $allMatched = true;

        foreach ($manifest['tables'] as $tableName => $expectedCount) {
            try {
                $countStmt = $pdo->query("SELECT COUNT(*) FROM `{$tableName}`");
                $actualCount = (int) $countStmt->fetchColumn();
                $matched = ($actualCount === (int) $expectedCount);

                $tableVerification[$tableName] = [
                    'expected' => (int) $expectedCount,
                    'actual' => $actualCount,
                    'matched' => $matched,
                ];

                if (!$matched) {
                    $allMatched = false;
                }
            } catch (\Throwable $e) {
                $tableVerification[$tableName] = [
                    'expected' => (int) $expectedCount,
                    'actual' => null,
                    'matched' => false,
                    'error' => $e->getMessage(),
                ];
                $allMatched = false;
            }
        }

        $duration = round(microtime(true) - $startTime, 3);
        Log::info("Database restore drill completed in {$duration}s on database [{$dbName}]. All tables matched: " . ($allMatched ? 'YES' : 'NO'));

        return [
            'status' => $allMatched ? 'verified' : 'completed_with_mismatches',
            'filename' => $filename,
            'database' => $dbName,
            'connection' => $targetConnection,
            'manifest' => $manifest,
            'table_verification' => $tableVerification,
            'all_counts_matched' => $allMatched,
            'duration_seconds' => $duration,
        ];
    }

    /**
     * Parse and execute multiple SQL statements safely.
     *
     * @param \PDO $pdo
     * @param string $sql
     */
    protected function executeSqlStatements(\PDO $pdo, string $sql): void
    {
        // Split SQL statements on semicolon followed by newline
        $lines = explode("\n", $sql);
        $statement = '';

        foreach ($lines as $line) {
            $trimmed = trim($line);
            if ($trimmed === '' || str_starts_with($trimmed, '--') || str_starts_with($trimmed, '/*')) {
                continue;
            }

            $statement .= $line . "\n";

            if (str_ends_with($trimmed, ';')) {
                $pdo->exec($statement);
                $statement = '';
            }
        }

        if (trim($statement) !== '') {
            $pdo->exec($statement);
        }
    }
}
