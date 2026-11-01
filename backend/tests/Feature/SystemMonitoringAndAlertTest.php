<?php

namespace Tests\Feature;

use App\Mail\SystemAlertMail;
use App\Services\Monitoring\SystemMonitorService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class SystemMonitoringAndAlertTest extends TestCase
{
    protected SystemMonitorService $monitorService;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
        Mail::fake();
        Config::set('monitoring.enabled', true);
        Config::set('monitoring.alert_email', 'alerts@example.test');
        $this->monitorService = app(SystemMonitorService::class);
    }

    public function test_collects_system_health_metrics_accurately(): void
    {
        $metrics = $this->monitorService->checkMetrics();

        $this->assertArrayHasKey('status', $metrics);
        $this->assertArrayHasKey('timestamp', $metrics);
        $this->assertArrayHasKey('metrics', $metrics);

        $data = $metrics['metrics'];
        $this->assertArrayHasKey('database', $data);
        $this->assertArrayHasKey('disk', $data);
        $this->assertArrayHasKey('memory', $data);
        $this->assertArrayHasKey('failed_jobs', $data);

        $this->assertTrue($data['database']['healthy']);
    }

    public function test_dispatches_alert_when_threshold_is_violated(): void
    {
        // Set low disk threshold artificially to 100% to force violation
        Config::set('monitoring.thresholds.disk_free_min_percent', 100.0);

        $result = $this->monitorService->evaluateAndAlert(sendNotifications: true);

        $this->assertNotEmpty($result['dispatched_alerts']);
        $this->assertContains('low_disk_space', collect($result['dispatched_alerts'])->pluck('key')->all());

        // Verify SystemAlertMail was sent
        Mail::assertSent(SystemAlertMail::class, function (SystemAlertMail $mail) {
            return $mail->alertData['key'] === 'low_disk_space';
        });
    }

    public function test_alert_deduplication_suppresses_subsequent_alerts_within_cooldown(): void
    {
        Config::set('monitoring.thresholds.disk_free_min_percent', 100.0);
        Config::set('monitoring.cooldown_minutes', 30);

        // 1. First run dispatches alert
        $firstRun = $this->monitorService->evaluateAndAlert(sendNotifications: true);
        $this->assertNotEmpty($firstRun['dispatched_alerts']);
        Mail::assertSent(SystemAlertMail::class, 1);

        // 2. Second immediate run suppresses alert (deduplicated)
        $secondRun = $this->monitorService->evaluateAndAlert(sendNotifications: true);
        $this->assertEmpty($secondRun['dispatched_alerts']);
        $this->assertContains('low_disk_space', $secondRun['deduplicated_alerts']);

        // Still only 1 email sent
        Mail::assertSent(SystemAlertMail::class, 1);
    }

    public function test_check_without_notifications_does_not_suppress_later_alert_delivery(): void
    {
        Config::set('monitoring.thresholds.disk_free_min_percent', 100.0);

        $this->monitorService->evaluateAndAlert(sendNotifications: false);
        Mail::assertNothingSent();

        $result = $this->monitorService->evaluateAndAlert(sendNotifications: true);

        $this->assertContains('low_disk_space', collect($result['dispatched_alerts'])->pluck('key')->all());
        Mail::assertSent(SystemAlertMail::class, 1);
    }

    public function test_disabled_monitoring_does_not_send_or_suppress_a_later_alert(): void
    {
        Config::set('monitoring.thresholds.disk_free_min_percent', 100.0);
        Config::set('monitoring.enabled', false);

        $disabled = $this->monitorService->evaluateAndAlert(sendNotifications: true);
        $this->assertEmpty($disabled['dispatched_alerts']);
        Mail::assertNothingSent();

        Config::set('monitoring.enabled', true);
        $enabled = $this->monitorService->evaluateAndAlert(sendNotifications: true);
        $this->assertContains('low_disk_space', collect($enabled['dispatched_alerts'])->pluck('key')->all());
        Mail::assertSent(SystemAlertMail::class, 1);
    }

    public function test_missing_delivery_destination_does_not_start_alert_cooldown(): void
    {
        Config::set('monitoring.thresholds.disk_free_min_percent', 100.0);
        Config::set('monitoring.alert_email', null);
        Config::set('monitoring.alert_webhook', null);

        $undelivered = $this->monitorService->evaluateAndAlert(sendNotifications: true);
        $this->assertEmpty($undelivered['dispatched_alerts']);

        Config::set('monitoring.alert_email', 'alerts@example.test');
        $delivered = $this->monitorService->evaluateAndAlert(sendNotifications: true);
        $this->assertContains('low_disk_space', collect($delivered['dispatched_alerts'])->pluck('key')->all());
        Mail::assertSent(SystemAlertMail::class, 1);
    }

    public function test_api_outage_alerts_once_and_sends_recovery_after_probe_succeeds(): void
    {
        Config::set('monitoring.health_urls.api', 'https://api.example.test/health');
        Config::set('monitoring.health_urls.ssr', 'https://site.example.test/ar/');
        $apiHealthy = false;
        Http::fake(function ($request) use (&$apiHealthy) {
            return Http::response('', str_contains($request->url(), 'api.example.test') && !$apiHealthy ? 503 : 200);
        });

        $outage = $this->monitorService->evaluateAndAlert(sendNotifications: true);
        $this->assertContains('api_unavailable', collect($outage['dispatched_alerts'])->pluck('key')->all());
        $this->assertFalse($outage['metrics']['uptime']['api']['healthy']);
        $this->assertTrue($outage['metrics']['uptime']['ssr']['healthy']);
        Mail::assertSent(SystemAlertMail::class, 1);

        $repeat = $this->monitorService->evaluateAndAlert(sendNotifications: true);
        $this->assertContains('api_unavailable', $repeat['deduplicated_alerts']);
        Mail::assertSent(SystemAlertMail::class, 1);

        $apiHealthy = true;
        $recovered = $this->monitorService->evaluateAndAlert(sendNotifications: true);
        $this->assertContains('api_unavailable', collect($recovered['recoveries'])->pluck('key')->all());
        Mail::assertSent(SystemAlertMail::class, 2);
    }

    public function test_recovery_notice_is_dispatched_when_violation_clears(): void
    {
        // 1. Force low disk violation
        Config::set('monitoring.thresholds.disk_free_min_percent', 100.0);
        $this->monitorService->evaluateAndAlert(sendNotifications: true);
        Mail::assertSent(SystemAlertMail::class, 1);

        // 2. Clear violation by resetting threshold to 0%
        Config::set('monitoring.thresholds.disk_free_min_percent', 0.0);
        $recoveryRun = $this->monitorService->evaluateAndAlert(sendNotifications: true);

        $this->assertNotEmpty($recoveryRun['recoveries']);
        $this->assertEquals('low_disk_space', $recoveryRun['recoveries'][0]['key']);
        $this->assertEquals('recovery', $recoveryRun['recoveries'][0]['severity']);

        // Recovery email sent (Total 2: 1 alert + 1 recovery)
        Mail::assertSent(SystemAlertMail::class, 2);
    }

    public function test_artisan_command_monitor_check_executes_successfully(): void
    {
        $this->artisan('monitor:check', ['--alert' => true])
            ->expectsOutputToContain('Collecting system health metrics...')
            ->assertSuccessful();
    }

    public function test_log_channel_configuration_supports_daily_rotation(): void
    {
        $loggingConfig = config('logging.channels.daily');

        $this->assertNotNull($loggingConfig);
        $this->assertEquals('daily', $loggingConfig['driver']);
        $this->assertEquals(14, $loggingConfig['days']);
    }
}
