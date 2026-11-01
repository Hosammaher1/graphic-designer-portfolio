<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class RateLimitingHardeningTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test API general rate limiter enforces 60 requests/minute.
     */
    public function test_api_general_rate_limit_allows_60_and_throttles_61st(): void
    {
        $ip = '127.0.0.1';
        RateLimiter::clear("api_general:{$ip}");

        for ($i = 1; $i <= 60; $i++) {
            $response = $this->getJson('/api/v1/categories');
            $this->assertNotEquals(429, $response->status(), "Request {$i} should not be throttled");
        }

        $blocked = $this->getJson('/api/v1/categories');
        $blocked->assertStatus(429);
        $this->assertTrue($blocked->headers->has('Retry-After'));
    }

    /**
     * Test public contact endpoint enforces 3 submissions per minute.
     */
    public function test_contact_rate_limit_allows_3_and_throttles_4th_per_minute(): void
    {
        $ip = '127.0.0.1';
        RateLimiter::clear("contact:{$ip}");

        $payload = [
            'name' => 'Alice Designer',
            'email' => 'alice@example.com',
            'service' => 'Branding',
            'message' => 'Hello from rate limit test message.',
            'timestamp' => time() - 5,
        ];

        for ($i = 1; $i <= 3; $i++) {
            $response = $this->postJson('/api/v1/contact', $payload);
            $this->assertNotEquals(429, $response->status(), "Submission {$i} should not be throttled");
        }

        $blocked = $this->postJson('/api/v1/contact', $payload);
        $blocked->assertStatus(429);
        $this->assertTrue($blocked->headers->has('Retry-After'));
    }

    /**
     * Test authentication login endpoint enforces 5 attempts per IP/email.
     */
    public function test_auth_login_rate_limit_enforces_5_attempts_per_ip_and_email(): void
    {
        $email = 'bruteforce@example.com';
        $ip = '192.168.1.100';

        RateLimiter::clear(strtolower($email) . '|' . $ip);
        RateLimiter::clear("auth_login:" . strtolower($email) . '|' . $ip);

        for ($i = 1; $i <= 5; $i++) {
            $response = $this->withServerVariables(['REMOTE_ADDR' => $ip])
                ->postJson('/api/v1/auth/login', [
                    'email' => $email,
                    'password' => 'wrong-password',
                ]);
            $this->assertNotEquals(429, $response->status(), "Login attempt {$i} should not be throttled");
        }

        $blocked = $this->withServerVariables(['REMOTE_ADDR' => $ip])
            ->postJson('/api/v1/auth/login', [
                'email' => $email,
                'password' => 'wrong-password',
            ]);
        $blocked->assertStatus(429);
        $this->assertTrue($blocked->headers->has('Retry-After'));

        // Different email from same IP should not be blocked immediately
        $differentUser = $this->withServerVariables(['REMOTE_ADDR' => $ip])
            ->postJson('/api/v1/auth/login', [
                'email' => 'legitimate@example.com',
                'password' => 'wrong-password',
            ]);
        $this->assertEquals(401, $differentUser->status());
    }

    /**
     * Test admin write rate limiter enforces 30 mutations/minute while permitting reads.
     */
    public function test_admin_write_rate_limit_enforces_30_mutations_and_allows_reads(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $this->actingAs($admin, 'sanctum');

        RateLimiter::clear("admin_write:{$admin->id}");

        // Reads are allowed without counting towards the write limit
        for ($i = 1; $i <= 5; $i++) {
            $readResponse = $this->getJson('/api/v1/admin/categories');
            $readResponse->assertStatus(200);
        }

        // Perform 30 write operations
        for ($i = 1; $i <= 30; $i++) {
            $response = $this->postJson('/api/v1/admin/categories', [
                'slug' => "category-{$i}-" . uniqid(),
                'translations' => [
                    ['locale' => 'en', 'name' => "Category {$i}"],
                    ['locale' => 'ar', 'name' => "تصنيف {$i}"],
                ],
            ]);
            $this->assertNotEquals(429, $response->status(), "Write mutation {$i} should not be throttled");
        }

        // 31st write operation is throttled
        $blocked = $this->postJson('/api/v1/admin/categories', [
            'slug' => 'category-blocked-' . uniqid(),
            'translations' => [
                ['locale' => 'en', 'name' => 'Category Blocked'],
                ['locale' => 'ar', 'name' => 'تصنيف محظور'],
            ],
        ]);
        $blocked->assertStatus(429);
        $this->assertTrue($blocked->headers->has('Retry-After'));

        // Read requests remain accessible even when write limit is hit
        $readAfter = $this->getJson('/api/v1/admin/categories');
        $readAfter->assertStatus(200);
    }
}
