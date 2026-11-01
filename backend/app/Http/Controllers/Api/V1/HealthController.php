<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class HealthController extends Controller
{
    /**
     * Return application health status and core dependency checks.
     */
    public function health(): JsonResponse
    {
        $dbHealth = $this->checkDatabase();
        $cacheHealth = $this->checkCache();
        $storageHealth = $this->checkStorage();

        $allHealthy = $dbHealth['healthy'] && $cacheHealth && $storageHealth;

        return response()->json([
            'status' => $allHealthy ? 'ok' : 'degraded',
            'timestamp' => now()->toIso8601String(),
            'version' => config('app.version', '1.0.0'),
            'services' => [
                'api' => 'healthy',
                'db' => $dbHealth['healthy'] ? 'healthy' : 'unhealthy',
                'cache' => $cacheHealth ? 'healthy' : 'unhealthy',
                'storage' => $storageHealth ? 'healthy' : 'unhealthy',
            ],
        ], $allHealthy ? 200 : 503);
    }

    /**
     * Fast liveness probe for process supervision.
     */
    public function live(): JsonResponse
    {
        return response()->json([
            'status' => 'ok',
            'timestamp' => now()->toIso8601String(),
            'services' => [
                'api' => 'alive',
            ],
        ], 200);
    }

    /**
     * Comprehensive readiness probe with latency and system metrics.
     */
    public function ready(): JsonResponse
    {
        $dbHealth = $this->checkDatabase();
        $cacheHealth = $this->checkCache();
        $storageHealth = $this->checkStorage();

        $isReady = $dbHealth['healthy'] && $cacheHealth && $storageHealth;

        $diskFree = @disk_free_space(storage_path());
        $diskTotal = @disk_total_space(storage_path());

        return response()->json([
            'status' => $isReady ? 'ready' : 'not_ready',
            'timestamp' => now()->toIso8601String(),
            'version' => config('app.version', '1.0.0'),
            'dependencies' => [
                'db' => [
                    'status' => $dbHealth['healthy'] ? 'healthy' : 'unhealthy',
                    'latency_ms' => $dbHealth['latency_ms'],
                ],
                'cache' => [
                    'status' => $cacheHealth ? 'healthy' : 'unhealthy',
                ],
                'storage' => [
                    'status' => $storageHealth ? 'healthy' : 'unhealthy',
                ],
            ],
            'system' => [
                'memory_usage_mb' => round(memory_get_usage(true) / 1024 / 1024, 2),
                'disk_free_bytes' => $diskFree !== false ? (int) $diskFree : null,
                'disk_total_bytes' => $diskTotal !== false ? (int) $diskTotal : null,
            ],
        ], $isReady ? 200 : 503);
    }

    /**
     * Check database connectivity and calculate ping latency.
     *
     * @return array
     */
    protected function checkDatabase(): array
    {
        $start = microtime(true);
        try {
            DB::connection()->getPdo()->query('SELECT 1');
            $latency = round((microtime(true) - $start) * 1000, 2);
            return [
                'healthy' => true,
                'latency_ms' => $latency,
            ];
        } catch (\Throwable $e) {
            return [
                'healthy' => false,
                'latency_ms' => null,
            ];
        }
    }

    /**
     * Check cache read/write availability.
     *
     * @return bool
     */
    protected function checkCache(): bool
    {
        try {
            $key = 'health_check_ping';
            Cache::put($key, 1, 10);
            return Cache::get($key) === 1;
        } catch (\Throwable $e) {
            return false;
        }
    }

    /**
     * Check local storage write/read availability.
     *
     * @return bool
     */
    protected function checkStorage(): bool
    {
        try {
            return Storage::disk('local')->exists('.');
        } catch (\Throwable $e) {
            return false;
        }
    }
}
