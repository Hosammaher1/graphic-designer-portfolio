<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Database\Seeders\AdminUserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class AdminSeedTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_seeder_creates_admin_user_idempotently(): void
    {
        // Set environment variables for test
        config([
            'portfolio.admin_email' => 'admin@mohammed-portfolio.test',
            'portfolio.admin_name' => 'Mohammed Admin',
            'portfolio.admin_password' => 'SecureP@ssw0rd!2026',
        ]);

        // Run seeder first time
        $this->seed(AdminUserSeeder::class);

        // Assert exactly 1 user exists with the configured email
        $this->assertDatabaseCount('users', 1);
        $this->assertDatabaseHas('users', [
            'email' => 'admin@mohammed-portfolio.test',
            'name' => 'Mohammed Admin',
        ]);

        $admin = User::where('email', 'admin@mohammed-portfolio.test')->first();
        $this->assertNotNull($admin);
        $this->assertTrue(Hash::check('SecureP@ssw0rd!2026', $admin->password));

        // Run seeder second time (test idempotency)
        $this->seed(AdminUserSeeder::class);

        // Must still be exactly 1 user, no duplicates created
        $this->assertDatabaseCount('users', 1);
    }

    public function test_admin_seeder_throws_or_uses_secure_bootstrap_if_no_password(): void
    {
        // When no password or random key is supplied in environment, seeder must not hardcode default passwords
        config([
            'portfolio.admin_email' => 'admin2@mohammed-portfolio.test',
            'portfolio.admin_name' => 'Mohammed Admin 2',
            'portfolio.admin_password' => null,
        ]);

        // Running without password should generate a temporary secure string or throw RuntimeException
        $this->seed(AdminUserSeeder::class);

        $admin = User::where('email', 'admin2@mohammed-portfolio.test')->first();
        $this->assertNotNull($admin);
        // Password must be hashed and non-empty, and not equal to common insecure defaults
        $this->assertNotEmpty($admin->password);
        $this->assertFalse(Hash::check('password', $admin->password));
        $this->assertFalse(Hash::check('admin', $admin->password));
        $this->assertFalse(Hash::check('12345678', $admin->password));
    }

    public function test_no_public_registration_endpoint_exists(): void
    {
        // Assert no registration routes are exposed publicly
        $routes = collect(Route::getRoutes()->getRoutesByName())->keys();
        $this->assertFalse($routes->contains('register'));
        $this->assertFalse($routes->contains('api.register'));
        $this->assertFalse($routes->contains('api.v1.register'));

        // Direct HTTP POST to standard registration endpoints must return 404 or 405
        $response = $this->postJson('/api/v1/register', [
            'name' => 'Hacker',
            'email' => 'hacker@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);
        $response->assertStatus(404);

        $webResponse = $this->post('/register', [
            'name' => 'Hacker',
            'email' => 'hacker@example.com',
            'password' => 'password123',
        ]);
        $webResponse->assertStatus(404);
    }
}
