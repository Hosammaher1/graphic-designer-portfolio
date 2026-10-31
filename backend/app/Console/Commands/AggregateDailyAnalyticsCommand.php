<?php

namespace App\Console\Commands;

use App\Services\Analytics\AnalyticsAggregationService;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class AggregateDailyAnalyticsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'analytics:aggregate-daily {--date= : Specific date to aggregate (YYYY-MM-DD)} {--days=1 : Number of past days to aggregate}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Aggregate raw analytics events into daily summary rollups';

    /**
     * Execute the console command.
     */
    public function handle(AnalyticsAggregationService $service): int
    {
        $explicitDate = $this->option('date');

        if ($explicitDate) {
            $dates = [$explicitDate];
        } else {
            $days = max(1, (int) $this->option('days'));
            $dates = [];
            for ($i = 1; $i <= $days; $i++) {
                $dates[] = Carbon::yesterday()->subDays($i - 1)->toDateString();
            }
        }

        foreach ($dates as $date) {
            $this->info("Aggregating analytics for date: {$date}...");
            $count = $service->aggregateForDate($date);
            $this->info("Completed date {$date}: {$count} rollup dimension(s) upserted.");
        }

        return 0;
    }
}
