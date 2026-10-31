<?php

namespace App\Console\Commands;

use App\Models\ConsentRecord;
use App\Models\VisitorPreference;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class PurgeExpiredConsentCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'consent:purge-expired';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Purge expired and old withdrawn consent records along with associated visitor preferences';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Starting expired consent and visitor preferences purge...');

        $expiredTokensQuery = ConsentRecord::query()
            ->where(function ($q) {
                $q->where('expires_at', '<', now())
                    ->orWhere(function ($sub) {
                        $sub->whereNotNull('withdrawn_at')
                            ->where('withdrawn_at', '<', now()->subDays(30));
                    });
            });

        $expiredTokens = (clone $expiredTokensQuery)->pluck('consent_token');
        $count = $expiredTokens->count();

        if ($count === 0) {
            $this->info('No expired or obsolete consent records found.');
            return 0;
        }

        DB::transaction(function () use ($expiredTokens, $expiredTokensQuery) {
            // Delete associated preferences
            VisitorPreference::whereIn('consent_token', $expiredTokens)->delete();

            // Delete consent records
            $expiredTokensQuery->delete();
        });

        $this->info("Purged {$count} expired/withdrawn consent record(s).");
        return 0;
    }
}
