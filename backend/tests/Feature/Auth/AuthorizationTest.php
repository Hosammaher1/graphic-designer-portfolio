<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthorizationTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $regularUser;
    protected User $otherUser;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed admin user
        $this->admin = User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@mohammed-portfolio.test',
            'password' => Hash::make('AdminSecret123!'),
            'is_admin' => true,
        ]);

        // Regular non-admin user
        $this->regularUser = User::factory()->create([
            'name' => 'Regular User',
            'email' => 'user@example.com',
            'password' => Hash::make('UserSecret123!'),
            'is_admin' => false,
        ]);

        // Another user to test malicious object ID bypass
        $this->otherUser = User::factory()->create([
            'name' => 'Other User',
            'email' => 'other@example.com',
            'password' => Hash::make('OtherSecret123!'),
            'is_admin' => false,
        ]);
    }

    public function test_unauthenticated_request_to_admin_routes_returns_401(): void
    {
        $response = $this->getJson('/api/v1/admin/users');
        $response->assertStatus(401);

        $postResponse = $this->postJson('/api/v1/admin/users', [
            'name' => 'Test',
            'email' => 'test@example.com',
        ]);
        $postResponse->assertStatus(401);
    }

    public function test_regular_non_admin_user_cannot_access_admin_routes_returns_403(): void
    {
        $response = $this->actingAs($this->regularUser, 'sanctum')
            ->getJson('/api/v1/admin/users');

        $response->assertStatus(403)
            ->assertJson([
                'status' => 'error',
                'message' => 'Forbidden. Administrator access required.',
            ]);
    }

    public function test_authenticated_admin_is_authorized_for_admin_endpoints(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/admin/users');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'data' => [
                    'users' => [
                        '*' => ['id', 'name', 'email', 'is_admin'],
                    ],
                ],
            ]);
    }

    public function test_malicious_object_id_cannot_bypass_policy_returns_403(): void
    {
        // Regular user attempts to view/modify other user's record via admin or direct route
        $response = $this->actingAs($this->regularUser, 'sanctum')
            ->getJson("/api/v1/admin/users/{$this->otherUser->id}");

        $response->assertStatus(403);

        $putResponse = $this->actingAs($this->regularUser, 'sanctum')
            ->putJson("/api/v1/admin/users/{$this->otherUser->id}", [
                'name' => 'Compromised Name',
            ]);

        $putResponse->assertStatus(403);
    }

    public function test_admin_can_view_specific_user_by_id(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/v1/admin/users/{$this->otherUser->id}");

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'user' => [
                        'id' => $this->otherUser->id,
                        'email' => $this->otherUser->email,
                    ],
                ],
            ]);
    }

    public function test_admin_cannot_delete_themselves(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/v1/admin/users/{$this->admin->id}");

        $response->assertStatus(403)
            ->assertJson([
                'status' => 'error',
                'message' => 'Cannot delete the active administrator account.',
            ]);
    }
}
