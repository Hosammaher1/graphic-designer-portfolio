<?php

namespace App\Console\Commands;

use App\Models\Project;
use App\Models\ProjectMedia;
use App\Services\AuditLogger;
use App\Services\Media\MediaStorageInterface;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class PurgeTrashedProjects extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'projects:purge-trash {--days=30 : Minimum days in trash before permanent purge} {--dry-run : Simulate purge without deleting}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Permanently purge soft-deleted projects older than cutoff and clean up unshared media assets.';

    /**
     * Execute the console command.
     */
    public function handle(MediaStorageInterface $storage): int
    {
        $days = (int) $this->option('days');
        $isDryRun = (bool) $this->option('dry-run');
        $cutoff = now()->subDays($days);

        $expiredProjects = Project::onlyTrashed()
            ->where('deleted_at', '<=', $cutoff)
            ->with(['media.mediaAsset', 'translations'])
            ->get();

        $this->info("Found {$expiredProjects->count()} projects trashed on or before {$cutoff->toIso8601String()}.");

        $purgedCount = 0;
        $failedAssetDeletions = 0;

        foreach ($expiredProjects as $project) {
            if ($isDryRun) {
                $this->line(" [Dry-run] Would purge project #{$project->id} ({$project->slug}) trashed at {$project->deleted_at}");
                $purgedCount++;
                continue;
            }

            // Prune unshared media
            foreach ($project->media as $pm) {
                $asset = $pm->mediaAsset;
                if (! $asset) {
                    continue;
                }

                // Check if this media asset is attached to any other project (active or trashed)
                $isShared = ProjectMedia::where('media_asset_id', $asset->id)
                    ->where('project_id', '!=', $project->id)
                    ->exists();

                if (! $isShared) {
                    $deleted = false;
                    $attempts = 0;
                    $maxAttempts = 3;

                    while (! $deleted && $attempts < $maxAttempts) {
                        $attempts++;
                        try {
                            if ($asset->provider_id) {
                                $deleted = $storage->delete($asset->provider_id);
                            } else {
                                $deleted = true;
                            }
                        } catch (\Throwable $e) {
                            Log::warning("Provider error deleting media asset {$asset->id} (attempt {$attempts}/{$maxAttempts}).", [
                                'exception_type' => get_class($e),
                            ]);
                            if ($attempts >= $maxAttempts) {
                                $failedAssetDeletions++;
                            }
                        }
                    }

                    if ($deleted) {
                        try {
                            $asset->delete();
                        } catch (\Throwable $e) {
                            Log::warning("Could not delete MediaAsset model {$asset->id}.", [
                                'exception_type' => get_class($e),
                            ]);
                        }
                    }
                }
            }

            // Detach pivots and permanently delete project
            $projectId = $project->id;
            $projectSlug = $project->slug;
            $deletedAt = $project->deleted_at;

            $project->categories()->detach();
            $project->tools()->detach();
            $project->media()->delete();
            $project->translations()->forceDelete();
            $project->forceDelete();

            $purgedCount++;

            AuditLogger::log('project.purged_by_schedule', [
                'project_id'    => $projectId,
                'slug'          => $projectSlug,
                'days_cutoff'   => $days,
                'trashed_at'    => $deletedAt?->toIso8601String(),
                'purged_at'     => now()->toIso8601String(),
            ]);
        }

        $this->info("Purged {$purgedCount} expired projects. Failed asset deletions: {$failedAssetDeletions}.");

        return Command::SUCCESS;
    }
}
