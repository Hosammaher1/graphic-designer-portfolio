<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
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
}
