<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class ErrorHandlingAndRedactingTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Register transient test routes simulating internal system failures
        Route::get('/api/v1/test-system-failure', function () {
            throw new \RuntimeException('Internal system failure in D:\\programming\\mohammed-Portfolio\\backend\\app\\Secret.php: API_SECRET_KEY_123456');
        });

        Route::get('/api/v1/test-database-failure', function () {
            throw new QueryException(
                'mysql',
                'SELECT * FROM users WHERE secret_token = "TOP_SECRET_AUTH_TOKEN_999"',
                [],
                new \Exception('SQLSTATE[HY000] [2002] Connection refused')
            );
        });
    }

    /**
     * Test production error response masks database exceptions, SQL queries, and table details.
     */
    public function test_production_error_response_masks_database_exception_and_sql_query(): void
    {
        Config::set('app.debug', false);

        $response = $this->getJson('/api/v1/test-database-failure');

        $response->assertStatus(500);
        $response->assertJson([
            'status' => 'error',
            'code' => 500,
        ]);

        $content = $response->getContent();

        // Must NOT leak database queries, credentials, or SQL column names
        $this->assertStringNotContainsString('TOP_SECRET_AUTH_TOKEN_999', $content);
        $this->assertStringNotContainsString('SELECT * FROM users', $content);
        $this->assertStringNotContainsString('SQLSTATE', $content);
        $this->assertStringNotContainsString('secret_token', $content);

        // Must NOT leak stack traces, file paths, or line numbers
        $this->assertStringNotContainsString('trace', $content);
        $this->assertStringNotContainsString('.php', $content);
    }

    /**
     * Test production error response masks unhandled exceptions, server paths, and tokens.
     */
    public function test_production_error_response_masks_unhandled_runtime_exceptions(): void
    {
        Config::set('app.debug', false);

        $response = $this->getJson('/api/v1/test-system-failure');

        $response->assertStatus(500);
        $response->assertJson([
            'status' => 'error',
            'code' => 500,
        ]);

        $content = $response->getContent();

        // Must NOT leak internal tokens or full local server paths
        $this->assertStringNotContainsString('API_SECRET_KEY_123456', $content);
        $this->assertStringNotContainsString('mohammed-Portfolio', $content);
        $this->assertStringNotContainsString('D:\\programming', $content);
        $this->assertStringNotContainsString('trace', $content);
    }

    /**
     * Test 404 endpoint returns standardized JSON error format.
     */
    public function test_not_found_endpoint_returns_consistent_json_structure(): void
    {
        $response = $this->getJson('/api/v1/non-existent-endpoint-route-xyz');

        $response->assertStatus(404);
        $response->assertJsonStructure([
            'status',
            'message',
            'code',
        ]);
        $response->assertJson([
            'status' => 'error',
            'code' => 404,
        ]);
    }

    /**
     * Test 401 unauthenticated response returns standardized JSON error format.
     */
    public function test_unauthenticated_request_returns_consistent_json_structure(): void
    {
        $response = $this->getJson('/api/v1/admin/profile');

        $response->assertStatus(401);
        $response->assertJsonStructure([
            'status',
            'message',
            'code',
        ]);
        $response->assertJson([
            'status' => 'error',
            'code' => 401,
        ]);
    }

    /**
     * Test 405 method not allowed returns standardized JSON error format.
     */
    public function test_method_not_allowed_returns_consistent_json_structure(): void
    {
        // /api/v1/projects is GET only; sending POST should trigger 405
        $response = $this->postJson('/api/v1/projects');

        $response->assertStatus(405);
        $response->assertJsonStructure([
            'status',
            'message',
            'code',
        ]);
        $response->assertJson([
            'status' => 'error',
            'code' => 405,
        ]);
    }

    public function test_arabic_accept_language_localizes_safe_not_found_and_server_errors(): void
    {
        Config::set('app.debug', false);

        $notFound = $this->withHeader('Accept-Language', 'ar,en;q=0.8')
            ->getJson('/api/v1/non-existent-endpoint-route-xyz');
        $notFound->assertStatus(404);
        $notFound->assertJsonPath('message', 'المورد غير موجود.');
        $this->assertStringNotContainsString('non-existent-endpoint-route-xyz', $notFound->getContent());

        $failure = $this->withHeader('Accept-Language', 'ar,en;q=0.8')
            ->getJson('/api/v1/test-system-failure');
        $failure->assertStatus(500);
        $failure->assertJsonPath('message', 'حدث خطأ داخلي في الخادم.');
        $this->assertStringNotContainsString('API_SECRET_KEY_123456', $failure->getContent());
    }

    public function test_arabic_admin_forbidden_response_uses_error_contract(): void
    {
        $this->actingAs(User::factory()->make(['is_admin' => false]), 'sanctum');

        $response = $this->withHeader('Accept-Language', 'ar')
            ->getJson('/api/v1/admin/profile');

        $response->assertStatus(403);
        $response->assertJsonPath('message', 'غير مسموح بهذا الإجراء.');
        $response->assertJsonPath('code', 403);
    }
}
