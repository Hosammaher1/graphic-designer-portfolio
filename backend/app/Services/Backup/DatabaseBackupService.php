<?php

namespace App\Services\Backup;

use App\Models\MediaAsset;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

class DatabaseBackupService
{
    private const CIPHER = 'AES-256-CBC';

    /**
     * Create an encrypted MySQL database backup and enforce retention policy.
     *
     * @param string|null $disk
     * @param string|null $encryptionKey
     * @param int $retentionDays
     * @return array
     */
    public function createBackup(?string $disk = null, ?string $encryptionKey = null, int $retentionDays = 7): array
    {
        $diskName = $disk ?? config('backup.disk', 'backups');
        $rawKey = $encryptionKey ?? config('backup.encryption_key') ?? config('app.key');

        if (empty($rawKey)) {
            throw new \RuntimeException('Backup encryption key is missing. Set BACKUP_ENCRYPTION_KEY or APP_KEY.');
        }

        try {
            // 1. Export database SQL dump
            $sql = $this->exportSql();

            // 2. Generate metadata manifest
            $manifest = $this->generateManifest($sql);

            // 3. Package and encrypt payload
            $encryptedContent = $this->encryptPayload([
                'manifest' => $manifest,
                'sql' => $sql,
            ], $rawKey);

            // 4. Save to target storage disk
            $filename = 'portfolio_backup_' . now()->format('Y-m-d_His') . '.enc';
            Storage::disk($diskName)->put($filename, $encryptedContent);

            $bytes = strlen($encryptedContent);

            // 5. Enforce retention policy
            $purged = $this->purgeOldBackups($diskName, $retentionDays);

            Log::info("Database backup created successfully: {$filename} ({$bytes} bytes). Purged " . count($purged) . " old backups.");

            return [
                'filename' => $filename,
                'disk' => $diskName,
                'bytes' => $bytes,
                'manifest' => $manifest,
                'purged' => $purged,
            ];
        } catch (\Throwable $e) {
            $this->handleBackupFailure($e, $diskName);
            throw $e;
        }
    }

    /**
     * Decrypt and verify an encrypted backup package.
     *
     * @param string $encryptedPayload
     * @param string $encryptionKey
     * @return array
     */
    public function decryptBackup(string $encryptedPayload, string $encryptionKey): array
    {
        $envelope = json_decode($encryptedPayload, true);
        if (!is_array($envelope) || !isset($envelope['iv'], $envelope['hmac'], $envelope['ciphertext'])) {
            throw new \RuntimeException('Invalid backup archive envelope format.');
        }

        $iv = base64_decode($envelope['iv'], true);
        $ciphertext = base64_decode($envelope['ciphertext'], true);
        $hmac = $envelope['hmac'];

        if ($iv === false || $ciphertext === false || strlen($iv) !== 16) {
            throw new \RuntimeException('Corrupted backup archive IV or ciphertext.');
        }

        $derivedKey = hash('sha256', $encryptionKey, true);

        // Verify HMAC (Encrypt-then-MAC authentication)
        $expectedHmac = hash_hmac('sha256', $iv . $ciphertext, $derivedKey);
        if (!hash_equals($expectedHmac, $hmac)) {
            throw new \RuntimeException('HMAC verification failed: invalid encryption key or tampered payload.');
        }

        // Decrypt ciphertext
        $decryptedJson = openssl_decrypt($ciphertext, self::CIPHER, $derivedKey, OPENSSL_RAW_DATA, $iv);
        if ($decryptedJson === false) {
            throw new \RuntimeException('Decryption failed with provided key.');
        }

        $package = json_decode($decryptedJson, true);
        if (!is_array($package) || !isset($package['sql'], $package['manifest'])) {
            throw new \RuntimeException('Decrypted package missing SQL or manifest payload.');
        }

        // Verify SHA-256 integrity checksum
        $actualChecksum = hash('sha256', $package['sql']);
        if (!hash_equals($package['manifest']['checksum'], $actualChecksum)) {
            throw new \RuntimeException('Backup integrity check failed: SHA-256 checksum mismatch.');
        }

        return $package;
    }

    /**
     * Purge backup archives older than the specified retention window (default 7 days).
     *
     * @param string $disk
     * @param int $retentionDays
     * @return array List of purged filenames
     */
    public function purgeOldBackups(string $disk, int $retentionDays = 7): array
    {
        $files = Storage::disk($disk)->files();
        $cutoffDate = now()->subDays($retentionDays)->startOfDay();
        $purged = [];

        foreach ($files as $file) {
            if (!str_ends_with($file, '.enc')) {
                continue;
            }

            $fileDate = null;

            // Extract date from standard filename: portfolio_backup_YYYY-MM-DD_HHmmss.enc
            if (preg_match('/portfolio_backup_(\d{4}-\d{2}-\d{2})_\d{6}\.enc$/', $file, $matches)) {
                try {
                    $fileDate = Carbon::createFromFormat('Y-m-d', $matches[1])->startOfDay();
                } catch (\Throwable $e) {
                    $fileDate = null;
                }
            }

            // Fallback to disk last-modified timestamp
            if (!$fileDate) {
                try {
                    $timestamp = Storage::disk($disk)->lastModified($file);
                    $fileDate = Carbon::createFromTimestamp($timestamp)->startOfDay();
                } catch (\Throwable $e) {
                    continue;
                }
            }

            if ($fileDate && $fileDate->lt($cutoffDate)) {
                Storage::disk($disk)->delete($file);
                $purged[] = $file;
                Log::info("Purged expired backup: {$file} (Retention: {$retentionDays} days).");
            }
        }

        return $purged;
    }

    /**
     * Generate portable SQL dump of all database tables.
     *
     * @return string
     */
    public function exportSql(): string
    {
        $pdo = DB::connection()->getPdo();
        $dbName = DB::connection()->getDatabaseName();

        $output = "-- --------------------------------------------------------\n";
        $output .= "-- Graphic Designer Portfolio Automated Database Dump\n";
        $output .= "-- Database: `{$dbName}`\n";
        $output .= "-- Generated: " . now()->toIso8601String() . "\n";
        $output .= "-- --------------------------------------------------------\n\n";
        $output .= "SET FOREIGN_KEY_CHECKS=0;\n";
        $output .= "SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';\n";
        $output .= "SET NAMES utf8mb4;\n\n";

        // Query all base tables
        $tables = [];
        $stmt = $pdo->query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");
        while ($row = $stmt->fetch(\PDO::FETCH_NUM)) {
            $tables[] = $row[0];
        }

        foreach ($tables as $table) {
            // Drop & Create table
            $createStmt = $pdo->query("SHOW CREATE TABLE `{$table}`");
            $createRow = $createStmt->fetch(\PDO::FETCH_ASSOC);
            $createSql = $createRow['Create Table'] ?? null;

            if ($createSql) {
                $output .= "-- --------------------------------------------------------\n";
                $output .= "-- Table structure for table `{$table}`\n";
                $output .= "-- --------------------------------------------------------\n";
                $output .= "DROP TABLE IF EXISTS `{$table}`;\n";
                $output .= "{$createSql};\n\n";
            }

            // Table data
            $dataStmt = $pdo->query("SELECT * FROM `{$table}`");
            $rows = $dataStmt->fetchAll(\PDO::FETCH_ASSOC);

            if (!empty($rows)) {
                $output .= "-- Dumping data for table `{$table}`\n";
                $columns = array_keys($rows[0]);
                $quotedColumns = array_map(fn($col) => "`{$col}`", $columns);
                $columnList = implode(', ', $quotedColumns);

                $chunkSize = 100;
                $chunks = array_chunk($rows, $chunkSize);

                foreach ($chunks as $chunk) {
                    $insertValues = [];
                    foreach ($chunk as $row) {
                        $escapedValues = [];
                        foreach ($row as $val) {
                            if (is_null($val)) {
                                $escapedValues[] = 'NULL';
                            } elseif (is_numeric($val) && !is_string($val)) {
                                $escapedValues[] = $val;
                            } else {
                                $escapedValues[] = $pdo->quote((string) $val);
                            }
                        }
                        $insertValues[] = '(' . implode(', ', $escapedValues) . ')';
                    }
                    $output .= "INSERT INTO `{$table}` ({$columnList}) VALUES\n" . implode(",\n", $insertValues) . ";\n";
                }
                $output .= "\n";
            }
        }

        $output .= "SET FOREIGN_KEY_CHECKS=1;\n";
        $output .= "-- Dump completed on " . now()->toIso8601String() . "\n";

        return $output;
    }

    /**
     * Generate metadata manifest.
     *
     * @param string $sql
     * @return array
     */
    public function generateManifest(string $sql): array
    {
        $dbName = DB::connection()->getDatabaseName();
        $pdo = DB::connection()->getPdo();

        $tables = [];
        $stmt = $pdo->query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");
        while ($row = $stmt->fetch(\PDO::FETCH_NUM)) {
            $tableName = $row[0];
            $countStmt = $pdo->query("SELECT COUNT(*) FROM `{$tableName}`");
            $tables[$tableName] = (int) $countStmt->fetchColumn();
        }

        $mediaAssetsCount = 0;
        if (Schema::hasTable('media_assets')) {
            $mediaAssetsCount = (int) DB::table('media_assets')->count();
        }

        return [
            'manifest_version' => 1,
            'generated_at' => now()->toIso8601String(),
            'database' => $dbName,
            'app_version' => config('app.version', '1.0.0'),
            'checksum' => hash('sha256', $sql),
            'tables' => $tables,
            'media_assets_count' => $mediaAssetsCount,
            'encryption_cipher' => 'aes-256-cbc',
        ];
    }

    /**
     * Encrypt package using AES-256-CBC and HMAC authentication.
     *
     * @param array $package
     * @param string $encryptionKey
     * @return string
     */
    protected function encryptPayload(array $package, string $encryptionKey): string
    {
        $rawJson = json_encode($package, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        $iv = random_bytes(16);
        $derivedKey = hash('sha256', $encryptionKey, true);

        $ciphertext = openssl_encrypt($rawJson, self::CIPHER, $derivedKey, OPENSSL_RAW_DATA, $iv);
        if ($ciphertext === false) {
            throw new \RuntimeException('Failed to encrypt backup payload with OpenSSL.');
        }

        $hmac = hash_hmac('sha256', $iv . $ciphertext, $derivedKey);

        return json_encode([
            'version' => 1,
            'cipher' => self::CIPHER,
            'iv' => base64_encode($iv),
            'hmac' => $hmac,
            'ciphertext' => base64_encode($ciphertext),
        ], JSON_PRETTY_PRINT);
    }

    /**
     * Handle backup failure by logging and sending alerts.
     *
     * @param \Throwable $e
     * @param string $disk
     */
    protected function handleBackupFailure(\Throwable $e, string $disk): void
    {
        $errorMessage = 'CRITICAL: Automated database backup failed.';
        Log::error($errorMessage, [
            'exception_type' => get_class($e),
            'disk' => $disk,
            'timestamp' => now()->toIso8601String(),
        ]);

        $alertWebhook = config('backup.alert_webhook');
        if ($alertWebhook) {
            try {
                \Illuminate\Support\Facades\Http::timeout(5)->post($alertWebhook, [
                    'text' => $errorMessage,
                    'timestamp' => now()->toIso8601String(),
                ]);
            } catch (\Throwable $alertError) {
                Log::warning('Failed to dispatch backup alert webhook.', [
                    'exception_type' => get_class($alertError),
                ]);
            }
        }
    }
}
