<?php

namespace App\Console\Commands;

use App\Services\Backup\DatabaseRestoreService;
use Illuminate\Console\Command;

class RestoreDatabaseCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'backup:restore
                            {file? : Archive file name (or latest)}
                            {--connection= : Target database connection name}
                            {--key= : Decryption key}
                            {--disk= : Storage disk}
                            {--verify-only : Verify archive decryptability and checksum without restoring}
                            {--force : Force execution without confirmation prompt}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Restore MySQL database from an encrypted backup archive and verify row counts';

    /**
     * Execute the console command.
     */
    public function handle(DatabaseRestoreService $restoreService): int
    {
        $file = $this->argument('file');
        $connection = $this->option('connection');
        $key = $this->option('key');
        $disk = $this->option('disk');
        $verifyOnly = (bool) $this->option('verify-only');
        $force = (bool) $this->option('force');

        if (!$verifyOnly && !$force && app()->isProduction()) {
            if (!$this->confirm('WARNING: You are about to restore a database in production! Do you wish to proceed?')) {
                $this->warn('Restore operation cancelled.');
                return Command::FAILURE;
            }
        }

        $mode = $verifyOnly ? 'Verification Drill (Dry Run)' : 'Database Restore';
        $this->info("Starting {$mode}...");

        try {
            $result = $restoreService->restoreFromArchive(
                archiveFilename: $file,
                connection: $connection,
                encryptionKey: $key,
                disk: $disk,
                verifyOnly: $verifyOnly
            );

            if ($verifyOnly) {
                $this->info("Backup archive verified successfully!");
                $this->table(
                    ['Property', 'Value'],
                    [
                        ['Archive', $result['filename']],
                        ['Database In Manifest', $result['manifest']['database']],
                        ['Generated At', $result['manifest']['generated_at']],
                        ['Tables in Manifest', count($result['manifest']['tables'])],
                        ['Media Assets Count', $result['manifest']['media_assets_count']],
                        ['SHA-256 Checksum', 'MATCH (Verified)'],
                    ]
                );
                return Command::SUCCESS;
            }

            $this->info("Database restore completed successfully!");
            $this->table(
                ['Property', 'Value'],
                [
                    ['Archive', $result['filename']],
                    ['Target Database', $result['database']],
                    ['Target Connection', $result['connection']],
                    ['Duration', $result['duration_seconds'] . 's'],
                    ['All Table Counts Matched', $result['all_counts_matched'] ? 'YES (100% Integrity)' : 'NO (Mismatches found)'],
                ]
            );

            if (!$result['all_counts_matched']) {
                $this->warn('Some table counts differed between the backup manifest and restored database.');
            }

            return $result['all_counts_matched'] ? Command::SUCCESS : Command::FAILURE;
        } catch (\Throwable $e) {
            $this->error("Restore failed: " . $e->getMessage());
            return Command::FAILURE;
        }
    }
}
