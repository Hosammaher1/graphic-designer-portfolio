<?php

namespace App\Console\Commands;

use App\Services\Backup\DatabaseBackupService;
use Illuminate\Console\Command;

class BackupDatabaseCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'backup:run
                            {--disk= : The storage disk where backup should be placed}
                            {--key= : Secret encryption key (defaults to BACKUP_ENCRYPTION_KEY or APP_KEY)}
                            {--retention=7 : Number of days to retain backups before purging}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create an encrypted MySQL database backup archive and enforce retention policy';

    /**
     * Execute the console command.
     */
    public function handle(DatabaseBackupService $backupService): int
    {
        $disk = $this->option('disk') ?: config('backup.disk', 'backups');
        $key = $this->option('key') ?: config('backup.encryption_key');
        $retention = (int) ($this->option('retention') ?: config('backup.retention_days', 7));

        $this->info("Starting automated database backup (Disk: {$disk}, Retention: {$retention} days)...");

        try {
            $result = $backupService->createBackup($disk, $key, $retention);

            $this->info("Backup completed successfully!");
            $this->table(
                ['Property', 'Value'],
                [
                    ['Filename', $result['filename']],
                    ['Storage Disk', $result['disk']],
                    ['Archive Size', number_format($result['bytes']) . ' bytes'],
                    ['Database', $result['manifest']['database']],
                    ['Tables Exported', count($result['manifest']['tables'])],
                    ['Media Assets', $result['manifest']['media_assets_count']],
                    ['Checksum (SHA-256)', substr($result['manifest']['checksum'], 0, 16) . '...'],
                    ['Purged Archives', count($result['purged'])],
                ]
            );

            return Command::SUCCESS;
        } catch (\Throwable $e) {
            $this->error("Backup failed: " . $e->getMessage());
            return Command::FAILURE;
        }
    }
}
