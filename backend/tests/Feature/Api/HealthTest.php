<?php

namespace Tests\Feature\Api;

use Tests\TestCase;

class HealthTest extends TestCase
{
    /**
     * Test health endpoint returns deterministic 200 JSON with no sensitive info.
     */
    public function test_health_check_returns_ok_status_and_deterministic_json(): void
    {
        $response = $this->getJson('/api/v1/health');

        $response->assertStatus(200);

        $response->assertJsonStructure([
            'status',
            'timestamp',
            'version',
            'services' => [
                'api',
            ],
        ]);

        $response->assertJson([
            'status' => 'ok',
            'services' => [
                'api' => 'healthy',
            ],
        ]);

        // Gate check: verify no sensitive info is leaked
        $content = $response->getContent();
        $this->assertStringNotContainsString('password', strtolower($content));
        $this->assertStringNotContainsString('app_key', strtolower($content));
        $this->assertStringNotContainsString('secret', strtolower($content));
        $this->assertStringNotContainsString('database', strtolower($content));
    }
}
