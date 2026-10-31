<?php

namespace App\Console\Commands;

use App\Models\AnalyticsEvent;
use Illuminate\Console\Command;

class PurgeRawAnalyticsEventsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'analytics:purge-raw-events {--days=30 : Purge raw events older than X days}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Purge raw analytics events older than the configured TTL retention threshold';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $days = max(1, (int) $this->option('days'));
        $cutoff = now()->subDays($days);

        $this->info("Purging raw analytics events created before: {$cutoff->toIso8601String()} ({$days} days retention)...");

        $deletedCount = AnalyticsEvent::where('created_at', '<', $cutoff)->delete();

        $this->info("Purged {$deletedCount} raw analytics event(s).");
        return 0;
    }
}
