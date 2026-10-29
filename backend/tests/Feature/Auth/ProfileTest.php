<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminUser = User::factory()->create([
            'name' => 'Mohammed Admin',
            'email' => 'admin@mohammed-portfolio.test',
            'password' => Hash::make('CurrentPassword123!'),
            'is_admin' => true,
        ]);
    }

    public function test_admin_can_view_profile_and_password_is_never_echoed(): void
    {
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->getJson('/api/v1/admin/profile');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'user' => [
                        'id' => $this->adminUser->id,
                        'name' => 'Mohammed Admin',
                        'email' => 'admin@mohammed-portfolio.test',
                    ],
                ],
            ]);

        // Assert response never contains password field or hash
        $content = $response->getContent();
        $this->assertStringNotContainsString('password', $content);
        $this->assertStringNotContainsString('CurrentPassword123!', $content);
    }

    public function test_updating_password_requires_correct_current_password(): void
    {
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->putJson('/api/v1/admin/profile/password', [
                'current_password' => 'IncorrectOldPassword!',
                'password' => 'NewStrongP@ss1234',
                'password_confirmation' => 'NewStrongP@ss1234',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['current_password']);

        // Password in database remains unchanged
        $this->adminUser->refresh();
        $this->assertTrue(Hash::check('CurrentPassword123!', $this->adminUser->password));
    }

    public function test_updating_password_enforces_strong_new_password(): void
    {
        // Too short password
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->putJson('/api/v1/admin/profile/password', [
                'current_password' => 'CurrentPassword123!',
                'password' => 'short',
                'password_confirmation' => 'short',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);

        // Confirmation mismatch
        $mismatchResponse = $this->actingAs($this->adminUser, 'sanctum')
            ->putJson('/api/v1/admin/profile/password', [
                'current_password' => 'CurrentPassword123!',
                'password' => 'NewStrongP@ss1234',
                'password_confirmation' => 'DifferentP@ss5678',
            ]);

        $mismatchResponse->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    public function test_updating_password_successfully_changes_credentials_without_echoing_password(): void
    {
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->putJson('/api/v1/admin/profile/password', [
                'current_password' => 'CurrentPassword123!',
                'password' => 'BrandNewStrongP@ss999',
                'password_confirmation' => 'BrandNewStrongP@ss999',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Password updated successfully.',
            ]);

        // Response payload never echoes passwords
        $content = $response->getContent();
        $this->assertStringNotContainsString('BrandNewStrongP@ss999', $content);
        $this->assertStringNotContainsString('CurrentPassword123!', $content);

        // Database now has updated hash
        $this->adminUser->refresh();
        $this->assertTrue(Hash::check('BrandNewStrongP@ss999', $this->adminUser->password));
        $this->assertFalse(Hash::check('CurrentPassword123!', $this->adminUser->password));
    }
}
