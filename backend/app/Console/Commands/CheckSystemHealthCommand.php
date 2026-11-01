<?php

namespace App\Console\Commands;

use App\Services\Monitoring\SystemMonitorService;
use Illuminate\Console\Command;

class CheckSystemHealthCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'monitor:check
                            {--alert : Send email and webhook alerts on threshold violations}
                            {--force : Bypass cooldown and force alert dispatch}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Monitor DB, disk, PHP memory, queue, and configured HTTP probes; dispatch alerts';

    /**
     * Execute the console command.
     */
    public function handle(SystemMonitorService $monitorService): int
    {
        $sendAlerts = (bool) $this->option('alert');
        $force = (bool) $this->option('force');

        $this->info('Collecting system health metrics...');

        $result = $monitorService->evaluateAndAlert(sendNotifications: $sendAlerts, forceAlert: $force);

        $metrics = $result['metrics'];

        $this->table(
            ['Subsystem', 'Status', 'Details'],
            [
                ['Database', $metrics['database']['status'], 'Latency: ' . ($metrics['database']['latency_ms'] ?? 'N/A') . 'ms'],
                ['Disk Space', $metrics['disk']['status'], 'Free: ' . ($metrics['disk']['free_percent'] ?? 'N/A') . '%'],
                ['Memory', $metrics['memory']['status'], 'Usage: ' . ($metrics['memory']['usage_percent'] ?? 'N/A') . '%'],
                ['Failed Jobs', $metrics['failed_jobs']['status'], 'Count: ' . $metrics['failed_jobs']['count']],
            ]
        );

        if (!empty($result['dispatched_alerts'])) {
            $this->warn('Dispatched ' . count($result['dispatched_alerts']) . ' alert(s):');
            foreach ($result['dispatched_alerts'] as $alert) {
                $this->line(" - [{$alert['severity']}] {$alert['title']}: {$alert['message']}");
            }
        }

        if (!empty($result['deduplicated_alerts'])) {
            $this->comment('Deduplicated (cooldown active): ' . implode(', ', $result['deduplicated_alerts']));
        }

        if (!empty($result['recoveries'])) {
            $this->info('Dispatched ' . count($result['recoveries']) . ' recovery notification(s)!');
        }

        $this->info("Overall System Status: " . strtoupper($result['status']));

        return ($result['status'] === 'critical') ? Command::FAILURE : Command::SUCCESS;
    }
}
