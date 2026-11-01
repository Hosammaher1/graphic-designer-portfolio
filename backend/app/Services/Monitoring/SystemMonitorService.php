<?php

namespace App\Services\Monitoring;

use App\Mail\SystemAlertMail;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;

class SystemMonitorService
{
    /**
     * Collect current health metrics across system subsystems.
     *
     * @return array
     */
    public function checkMetrics(): array
    {
        $thresholds = config('monitoring.thresholds');

        // 1. Database check
        $db = $this->checkDatabase($thresholds['db_latency_max_ms']);

        // 2. Disk headroom check
        $disk = $this->checkDiskSpace($thresholds['disk_free_min_percent']);

        // 3. Memory usage check
        $memory = $this->checkMemoryUsage($thresholds['memory_max_percent']);

        // 4. Failed jobs check
        $failedJobs = $this->checkFailedJobs($thresholds['max_failed_jobs']);

        // 5. Configured public API and SSR uptime probes
        $uptime = $this->checkUptime();

        // Violations collector
        $violations = [];

        if (!$db['healthy']) {
            $violations['database_down'] = [
                'severity' => 'critical',
                'title' => 'Database Unresponsive or Down',
                'message' => 'The MySQL database failed ping connectivity checks.',
            ];
        } elseif ($db['latency_ms'] > $thresholds['db_latency_max_ms']) {
            $violations['database_high_latency'] = [
                'severity' => 'warning',
                'title' => 'High Database Query Latency',
                'message' => "Database ping latency is {$db['latency_ms']}ms (threshold: {$thresholds['db_latency_max_ms']}ms).",
            ];
        }

        if ($disk['free_percent'] !== null && $disk['free_percent'] < $thresholds['disk_free_min_percent']) {
            $violations['low_disk_space'] = [
                'severity' => ($disk['free_percent'] < 5.0) ? 'critical' : 'warning',
                'title' => 'Low Disk Space Warning',
                'message' => "Available storage disk headroom is only {$disk['free_percent']}% (threshold: {$thresholds['disk_free_min_percent']}%).",
            ];
        }

        if ($memory['usage_percent'] !== null && $memory['usage_percent'] > $thresholds['memory_max_percent']) {
            $violations['high_memory_usage'] = [
                'severity' => 'warning',
                'title' => 'High Memory Usage Warning',
                'message' => "Application memory utilization is at {$memory['usage_percent']}% (threshold: {$thresholds['memory_max_percent']}%).",
            ];
        }

        if ($failedJobs['count'] > $thresholds['max_failed_jobs']) {
            $violations['failed_jobs_detected'] = [
                'severity' => 'warning',
                'title' => 'Background Queue Job Failures',
                'message' => "There are {$failedJobs['count']} failed background queue jobs awaiting review.",
            ];
        }

        foreach ($uptime as $service => $probe) {
            if (!$probe['healthy']) {
                $violations["{$service}_unavailable"] = [
                    'severity' => 'critical',
                    'title' => strtoupper($service) . ' Health Check Failed',
                    'message' => "The configured {$service} endpoint did not return a successful response.",
                ];
            }
        }

        $overallStatus = empty($violations) ? 'healthy' : (collect($violations)->contains('severity', 'critical') ? 'critical' : 'warning');

        return [
            'status' => $overallStatus,
            'timestamp' => now()->toIso8601String(),
            'metrics' => [
                'database' => $db,
                'disk' => $disk,
                'memory' => $memory,
                'failed_jobs' => $failedJobs,
                'uptime' => $uptime,
            ],
            'violations' => $violations,
        ];
    }

    /**
     * Evaluate system health, deduplicate active alerts, and notify when issues arise or recover.
     *
     * @param bool $sendNotifications
     * @param bool $forceAlert
     * @return array
     */
    public function evaluateAndAlert(bool $sendNotifications = true, bool $forceAlert = false): array
    {
        $evaluation = $this->checkMetrics();
        $violations = $evaluation['violations'];
        $cooldownMinutes = (int) config('monitoring.cooldown_minutes', 30);

        $dispatchedAlerts = [];
        $deduplicatedAlerts = [];
        $recoveries = [];

        if (!$sendNotifications || !config('monitoring.enabled', true)) {
            return [
                'status' => $evaluation['status'],
                'metrics' => $evaluation['metrics'],
                'violations_count' => count($violations),
                'dispatched_alerts' => [],
                'deduplicated_alerts' => [],
                'recoveries' => [],
            ];
        }

        // Known possible violation keys
        $allTrackedKeys = ['database_down', 'database_high_latency', 'low_disk_space', 'high_memory_usage', 'failed_jobs_detected', 'api_unavailable', 'ssr_unavailable'];

        // 1. Process active violations
        foreach ($violations as $key => $alert) {
            $alertKey = "system_alert_cooldown_{$key}";
            $inCooldown = Cache::has($alertKey) && !$forceAlert;

            if ($inCooldown) {
                $deduplicatedAlerts[] = $key;
                Log::info("Alert [{$key}] suppressed due to active cooldown window.");
            } else {
                $alertPayload = array_merge($alert, [
                    'key' => $key,
                    'timestamp' => now()->toIso8601String(),
                ]);

                if (!$this->sendAlertNotification($alertPayload)) {
                    Log::error("System alert [{$key}] has no successful delivery destination.");
                    continue;
                }

                // Set cooldown and mark active
                Cache::put($alertKey, true, now()->addMinutes($cooldownMinutes));
                Cache::put("system_alert_active_{$key}", $alertPayload, now()->addDays(7));

                $dispatchedAlerts[] = $alertPayload;
                Log::warning("Dispatched system alert: [{$alert['severity']}] {$alert['title']}");
            }
        }

        // 2. Process recoveries: previously active violations that are no longer violated
        foreach ($allTrackedKeys as $key) {
            $activeKey = "system_alert_active_{$key}";
            if (Cache::has($activeKey) && !isset($violations[$key])) {
                $previousAlert = Cache::get($activeKey);
                $recoveryPayload = [
                    'key' => $key,
                    'severity' => 'recovery',
                    'title' => "RECOVERED: " . ($previousAlert['title'] ?? $key),
                    'message' => "The alert condition for [{$key}] has returned to normal healthy parameters.",
                    'timestamp' => now()->toIso8601String(),
                ];

                if (!$this->sendAlertNotification($recoveryPayload)) {
                    Log::error("System recovery [{$key}] has no successful delivery destination.");
                    continue;
                }

                // Clear active and cooldown cache states
                Cache::forget($activeKey);
                Cache::forget("system_alert_cooldown_{$key}");

                $recoveries[] = $recoveryPayload;
                Log::info("System alert recovered: [{$key}] returned to normal state.");
            }
        }

        return [
            'status' => $evaluation['status'],
            'metrics' => $evaluation['metrics'],
            'violations_count' => count($violations),
            'dispatched_alerts' => $dispatchedAlerts,
            'deduplicated_alerts' => $deduplicatedAlerts,
            'recoveries' => $recoveries,
        ];
    }

    /**
     * Dispatch alert through email and optional webhook.
     *
     * @param array $alert
     */
    protected function sendAlertNotification(array $alert): bool
    {
        $delivered = false;
        $recipientEmail = config('monitoring.alert_email');
        if (!empty($recipientEmail)) {
            try {
                Mail::to($recipientEmail)->send(new SystemAlertMail($alert));
                $delivered = true;
            } catch (\Throwable $e) {
                Log::error('Failed to deliver system alert email.');
            }
        }

        $webhookUrl = config('monitoring.alert_webhook');
        if (!empty($webhookUrl)) {
            try {
                $response = Http::timeout(5)->post($webhookUrl, [
                    'text' => "[{$alert['severity']}] Mohammed Portfolio: {$alert['title']} - {$alert['message']}",
                    'alert' => $alert,
                ]);
                $delivered = $response->successful() || $delivered;
            } catch (\Throwable $e) {
                Log::error('Failed to deliver system alert webhook.');
            }
        }

        return $delivered;
    }

    /**
     * Check database connectivity and latency.
     */
    protected function checkDatabase(float $thresholdMs): array
    {
        $start = microtime(true);
        try {
            DB::connection()->getPdo()->query('SELECT 1');
            $latency = round((microtime(true) - $start) * 1000, 2);
            return [
                'healthy' => true,
                'latency_ms' => $latency,
                'status' => ($latency > $thresholdMs) ? 'warning' : 'healthy',
            ];
        } catch (\Throwable $e) {
            return [
                'healthy' => false,
                'latency_ms' => null,
                'status' => 'critical',
            ];
        }
    }

    /**
     * Probe configured public endpoints without logging URLs or response bodies.
     */
    protected function checkUptime(): array
    {
        $results = [];

        foreach (['api', 'ssr'] as $service) {
            $url = config("monitoring.health_urls.{$service}");
            if (!is_string($url) || $url === '') {
                continue;
            }

            try {
                $response = Http::timeout(5)->get($url);
                $results[$service] = [
                    'healthy' => $response->successful(),
                    'status_code' => $response->status(),
                ];
            } catch (\Throwable $e) {
                $results[$service] = [
                    'healthy' => false,
                    'status_code' => null,
                ];
            }
        }

        return $results;
    }

    /**
     * Check storage disk space.
     */
    protected function checkDiskSpace(float $thresholdPercent): array
    {
        try {
            $path = storage_path();
            $free = @disk_free_space($path);
            $total = @disk_total_space($path);

            if ($free === false || $total === false || $total <= 0) {
                return ['free_percent' => null, 'status' => 'unknown'];
            }

            $freePercent = round(($free / $total) * 100, 2);

            return [
                'free_bytes' => (int) $free,
                'total_bytes' => (int) $total,
                'free_percent' => $freePercent,
                'status' => ($freePercent < $thresholdPercent) ? 'warning' : 'healthy',
            ];
        } catch (\Throwable $e) {
            return ['free_percent' => null, 'status' => 'unknown'];
        }
    }

    /**
     * Check PHP process memory usage against limit.
     */
    protected function checkMemoryUsage(float $thresholdPercent): array
    {
        $usage = memory_get_usage(true);
        $limitStr = ini_get('memory_limit');

        if (empty($limitStr) || $limitStr === '-1') {
            return [
                'usage_bytes' => $usage,
                'usage_percent' => null,
                'status' => 'healthy',
            ];
        }

        $limitBytes = $this->parseSizeToBytes($limitStr);
        if ($limitBytes <= 0) {
            return ['usage_bytes' => $usage, 'usage_percent' => null, 'status' => 'healthy'];
        }

        $percent = round(($usage / $limitBytes) * 100, 2);

        return [
            'usage_bytes' => $usage,
            'limit_bytes' => $limitBytes,
            'usage_percent' => $percent,
            'status' => ($percent > $thresholdPercent) ? 'warning' : 'healthy',
        ];
    }

    /**
     * Check failed jobs count in the queue.
     */
    protected function checkFailedJobs(int $threshold): array
    {
        try {
            if (Schema::hasTable('failed_jobs')) {
                $count = (int) DB::table('failed_jobs')->count();
                return [
                    'count' => $count,
                    'status' => ($count > $threshold) ? 'warning' : 'healthy',
                ];
            }
        } catch (\Throwable $e) {
            // Table doesn't exist
        }

        return ['count' => 0, 'status' => 'healthy'];
    }

    /**
     * Convert ini memory strings (e.g. 512M, 1G) to bytes.
     */
    protected function parseSizeToBytes(string $val): int
    {
        $val = trim($val);
        $last = strtolower($val[strlen($val) - 1]);
        $num = (int) $val;

        switch ($last) {
            case 'g':
                $num *= 1024 * 1024 * 1024;
                break;
            case 'm':
                $num *= 1024 * 1024;
                break;
            case 'k':
                $num *= 1024;
                break;
        }

        return $num;
    }
}
