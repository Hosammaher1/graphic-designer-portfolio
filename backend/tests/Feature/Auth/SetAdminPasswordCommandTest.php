<?php

namespace Tests\Feature\Auth;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class SetAdminPasswordCommandTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminUser = User::factory()->create([
            'name' => 'Studio Admin',
            'email' => 'admin@portfolio.test',
            'password' => Hash::make('InitialSecret987!'),
            'is_admin' => true,
        ]);
    }

    public function test_can_update_existing_admin_password_with_hidden_inputs(): void
    {
        $newPassword = 'SecureAdminPass2026!';

        $this->artisan('admin:set-password', ['email' => 'admin@portfolio.test'])
            ->expectsOutputToContain('Found existing administrator account: Studio Admin (admin@portfolio.test)')
            ->expectsQuestion('New administrator password (hidden)', $newPassword)
            ->expectsQuestion('Confirm new administrator password (hidden)', $newPassword)
            ->expectsOutputToContain('✓ Administrator password for [admin@portfolio.test] has been securely configured.')
            ->assertExitCode(0);

        // Verify password in database is hashed and matches
        $this->adminUser->refresh();
        $this->assertTrue(Hash::check($newPassword, $this->adminUser->password));
        $this->assertFalse(Hash::check('InitialSecret987!', $this->adminUser->password));

        // Verify Auth::attempt succeeds with new credentials
        $this->assertTrue(Auth::attempt([
            'email' => 'admin@portfolio.test',
            'password' => $newPassword,
        ]));

        // Verify login endpoint succeeds with new credentials
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@portfolio.test',
            'password' => $newPassword,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'user' => [
                        'email' => 'admin@portfolio.test',
                    ],
                ],
            ]);

        // Old password must be rejected
        $failedResponse = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@portfolio.test',
            'password' => 'InitialSecret987!',
        ]);

        $failedResponse->assertStatus(401);
    }

    public function test_rejects_mismatched_password_confirmation(): void
    {
        $this->artisan('admin:set-password', ['email' => 'admin@portfolio.test'])
            ->expectsQuestion('New administrator password (hidden)', 'StrongPassword123!')
            ->expectsQuestion('Confirm new administrator password (hidden)', 'MismatchedPassword123!')
            ->expectsOutputToContain('Password confirmation does not match.')
            ->assertExitCode(1);

        // Verify original password is unchanged
        $this->adminUser->refresh();
        $this->assertTrue(Hash::check('InitialSecret987!', $this->adminUser->password));
    }

    public function test_rejects_weak_password(): void
    {
        // Too short (< 8 characters)
        $this->artisan('admin:set-password', ['email' => 'admin@portfolio.test'])
            ->expectsQuestion('New administrator password (hidden)', 'Ab1!')
            ->expectsQuestion('Confirm new administrator password (hidden)', 'Ab1!')
            ->expectsOutputToContain('Password does not meet strength requirements:')
            ->assertExitCode(1);

        // Missing numbers
        $this->artisan('admin:set-password', ['email' => 'admin@portfolio.test'])
            ->expectsQuestion('New administrator password (hidden)', 'LettersOnlyUppercase')
            ->expectsQuestion('Confirm new administrator password (hidden)', 'LettersOnlyUppercase')
            ->expectsOutputToContain('Password does not meet strength requirements:')
            ->assertExitCode(1);

        // Missing uppercase letters
        $this->artisan('admin:set-password', ['email' => 'admin@portfolio.test'])
            ->expectsQuestion('New administrator password (hidden)', 'lowercase12345')
            ->expectsQuestion('Confirm new administrator password (hidden)', 'lowercase12345')
            ->expectsOutputToContain('Password does not meet strength requirements:')
            ->assertExitCode(1);
    }

    public function test_can_create_new_administrator_when_not_found(): void
    {
        $newEmail = 'newadmin@mohammedmaher.design';
        $newPassword = 'NewAdminPass2026!';

        $this->artisan('admin:set-password', [
            'email' => $newEmail,
            '--create' => true,
        ])
            ->expectsQuestion('Enter administrator full name', 'Mohammed Maher Aldaya')
            ->expectsOutputToContain('Initializing new administrator account: Mohammed Maher Aldaya (newadmin@mohammedmaher.design)')
            ->expectsQuestion('New administrator password (hidden)', $newPassword)
            ->expectsQuestion('Confirm new administrator password (hidden)', $newPassword)
            ->expectsOutputToContain('✓ Administrator password for [newadmin@mohammedmaher.design] has been securely configured.')
            ->assertExitCode(0);

        $createdUser = User::where('email', $newEmail)->first();
        $this->assertNotNull($createdUser);
        $this->assertEquals('Mohammed Maher Aldaya', $createdUser->name);
        $this->assertTrue($createdUser->is_admin);
        $this->assertNotNull($createdUser->email_verified_at);
        $this->assertTrue(Hash::check($newPassword, $createdUser->password));
    }

    public function test_updates_existing_account_without_creating_duplicates(): void
    {
        $newPassword = 'UpdatedAdminPass2026!';

        $this->artisan('admin:set-password', ['email' => 'admin@portfolio.test'])
            ->expectsQuestion('New administrator password (hidden)', $newPassword)
            ->expectsQuestion('Confirm new administrator password (hidden)', $newPassword)
            ->assertExitCode(0);

        // Ensure user count for this email remains 1
        $this->assertEquals(1, User::where('email', 'admin@portfolio.test')->count());
    }

    public function test_audit_log_records_cli_action_without_plaintext_password(): void
    {
        $newPassword = 'AuditTestPass2026!';

        $this->artisan('admin:set-password', ['email' => 'admin@portfolio.test'])
            ->expectsQuestion('New administrator password (hidden)', $newPassword)
            ->expectsQuestion('Confirm new administrator password (hidden)', $newPassword)
            ->assertExitCode(0);

        $auditLog = AuditLog::where('action', 'admin.password.cli_set')->latest()->first();
        $this->assertNotNull($auditLog);
        $this->assertEquals($this->adminUser->id, $auditLog->user_id);

        $payload = json_encode($auditLog->details);
        $this->assertStringNotContainsString($newPassword, $payload);
        $this->assertArrayNotHasKey('password', $auditLog->details);
        $this->assertArrayNotHasKey('raw_password', $auditLog->details);
        $this->assertArrayNotHasKey('password_confirmation', $auditLog->details);
    }

    public function test_unauthenticated_users_are_denied_access_to_protected_admin_routes(): void
    {
        $response = $this->getJson('/api/v1/admin/profile');
        $response->assertStatus(401);

        $projectsResponse = $this->getJson('/api/v1/admin/projects');
        $projectsResponse->assertStatus(401);
    }
}
