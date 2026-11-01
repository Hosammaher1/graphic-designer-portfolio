<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class HealthCheckEndpointTest extends TestCase
{
    /**
     * Test basic health endpoint returns 200 and healthy services.
     */
    public function test_health_endpoint_returns_ok_and_checks_dependencies(): void
    {
        $response = $this->getJson('/api/v1/health');

        $response->assertStatus(200);
        $response->assertJson([
            'status' => 'ok',
            'services' => [
                'api' => 'healthy',
                'db' => 'healthy',
                'cache' => 'healthy',
                'storage' => 'healthy',
            ],
        ]);

        $content = $response->getContent();
        // Strict secret and information exposure prevention
        $this->assertStringNotContainsString('password', strtolower($content));
        $this->assertStringNotContainsString('root', strtolower($content));
        $this->assertStringNotContainsString('secret', strtolower($content));
        $this->assertStringNotContainsString('app_key', strtolower($content));
    }

    /**
     * Test web route /health also returns health status.
     */
    public function test_web_route_health_returns_ok(): void
    {
        $response = $this->getJson('/health');
        $response->assertStatus(200);
        $response->assertJsonPath('status', 'ok');
    }

    /**
     * Test liveness probe endpoint returns 200 alive.
     */
    public function test_liveness_probe_returns_200_alive(): void
    {
        $response = $this->getJson('/api/v1/health/live');

        $response->assertStatus(200);
        $response->assertJson([
            'status' => 'ok',
            'services' => [
                'api' => 'alive',
            ],
        ]);
    }

    /**
     * Test readiness probe returns detailed metrics including latency.
     */
    public function test_readiness_probe_returns_metrics_and_latencies(): void
    {
        $response = $this->getJson('/api/v1/health/ready');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'status',
            'timestamp',
            'version',
            'dependencies' => [
                'db' => ['status', 'latency_ms'],
                'cache' => ['status'],
                'storage' => ['status'],
            ],
            'system' => [
                'memory_usage_mb',
            ],
        ]);
        $response->assertJsonPath('status', 'ready');
        $response->assertJsonPath('dependencies.db.status', 'healthy');
    }

    /**
     * Test degraded response (HTTP 503) when database connection fails.
     */
    public function test_health_returns_503_degraded_when_database_fails(): void
    {
        // Disconnect and mock DB failure
        DB::shouldReceive('connection->getPdo->query')
            ->andThrow(new \PDOException('Connection refused'));

        $response = $this->getJson('/api/v1/health');

        $response->assertStatus(503);
        $response->assertJson([
            'status' => 'degraded',
            'services' => [
                'api' => 'healthy',
                'db' => 'unhealthy',
            ],
        ]);

        // Zero disclosure of exception details or connection strings
        $content = $response->getContent();
        $this->assertStringNotContainsString('PDOException', $content);
        $this->assertStringNotContainsString('Connection refused', $content);
    }

    public function test_cache_failure_marks_health_and_readiness_unavailable_without_exposing_error(): void
    {
        Cache::partialMock()->shouldReceive('put')
            ->with('health_check_ping', 1, 10)
            ->andThrow(new \RuntimeException('private cache connection string'));

        $health = $this->getJson('/api/v1/health');
        $health->assertStatus(503)->assertJsonPath('status', 'degraded');
        $health->assertJsonPath('services.cache', 'unhealthy');

        $ready = $this->getJson('/api/v1/health/ready');
        $ready->assertStatus(503)->assertJsonPath('status', 'not_ready');
        $ready->assertJsonPath('dependencies.cache.status', 'unhealthy');
        $this->assertStringNotContainsString('private cache connection string', $ready->getContent());

        $this->getJson('/api/v1/health/live')->assertStatus(200);
    }

    public function test_storage_failure_marks_health_and_readiness_unavailable_without_exposing_error(): void
    {
        Storage::partialMock()->shouldReceive('disk')
            ->with('local')
            ->andThrow(new \RuntimeException('private storage path'));

        $health = $this->getJson('/api/v1/health');
        $health->assertStatus(503)->assertJsonPath('status', 'degraded');
        $health->assertJsonPath('services.storage', 'unhealthy');

        $ready = $this->getJson('/api/v1/health/ready');
        $ready->assertStatus(503)->assertJsonPath('status', 'not_ready');
        $ready->assertJsonPath('dependencies.storage.status', 'unhealthy');
        $this->assertStringNotContainsString('private storage path', $ready->getContent());

        $this->getJson('/api/v1/health/live')->assertStatus(200);
    }
}
