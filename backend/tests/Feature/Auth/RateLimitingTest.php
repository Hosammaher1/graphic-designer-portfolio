<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class RateLimitingTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminUser = User::factory()->create([
            'email' => 'admin@mohammed-portfolio.test',
            'password' => Hash::make('CorrectPassword123!'),
            'is_admin' => true,
        ]);

        RateLimiter::clear('admin@mohammed-portfolio.test|127.0.0.1');
    }

    public function test_repeated_failed_logins_trigger_429_too_many_requests(): void
    {
        // Attempt 5 failed logins
        for ($i = 0; $i < 5; $i++) {
            $response = $this->postJson('/api/v1/auth/login', [
                'email' => 'admin@mohammed-portfolio.test',
                'password' => 'WrongPassword!',
            ]);
            $response->assertStatus(401);
        }

        // The 6th attempt must be rejected with 429 Too Many Requests
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@mohammed-portfolio.test',
            'password' => 'WrongPassword!',
        ]);

        $response->assertStatus(429)
            ->assertJson([
                'status' => 'error',
            ])
            ->assertJsonStructure(['status', 'message', 'retry_after']);
    }

    public function test_successful_login_clears_rate_limiter_attempts(): void
    {
        // 2 failed attempts
        for ($i = 0; $i < 2; $i++) {
            $this->postJson('/api/v1/auth/login', [
                'email' => 'admin@mohammed-portfolio.test',
                'password' => 'WrongPassword!',
            ]);
        }

        // Successful login
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@mohammed-portfolio.test',
            'password' => 'CorrectPassword123!',
        ]);
        $response->assertStatus(200);

        // Subsequent attempt with wrong password starts fresh counter (not blocked)
        $nextResponse = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@mohammed-portfolio.test',
            'password' => 'WrongPassword!',
        ]);
        $nextResponse->assertStatus(401); // 401 not 429
    }

    public function test_auth_event_logging_redacts_passwords_and_secrets(): void
    {
        Log::shouldReceive('warning')
            ->atLeast()->once()
            ->withArgs(function ($message, $context = []) {
                $contextString = json_encode($context);
                // Ensure the sensitive password string is never logged
                return strpos($contextString, 'SuperSecretPlaintextPassword!') === false
                    && isset($context['ip'])
                    && isset($context['email']);
            });

        $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@mohammed-portfolio.test',
            'password' => 'SuperSecretPlaintextPassword!',
        ]);
    }
}
