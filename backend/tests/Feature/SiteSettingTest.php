<?php

namespace Tests\Feature;

use App\Models\SiteSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SiteSettingTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminUser = User::factory()->create([
            'is_admin' => true,
        ]);
    }

    public function test_public_endpoint_returns_default_settings_when_table_empty(): void
    {
        $response = $this->getJson('/api/v1/settings?locale=en');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonStructure([
                'status',
                'data' => [
                    'settings' => [
                        'profile',
                        'branding',
                        'hero',
                        'about',
                        'skills',
                        'contact',
                        'preferences',
                    ],
                ],
            ]);

        $this->assertEquals('Mohammed Maher Aldaya', $response->json('data.settings.profile.name'));
    }

    public function test_unauthenticated_user_cannot_access_or_update_admin_settings(): void
    {
        $this->getJson('/api/v1/admin/settings')
            ->assertStatus(401);

        $this->putJson('/api/v1/admin/settings', [
            'profile' => ['name' => 'Hacker Name'],
        ])->assertStatus(401);
    }

    public function test_admin_can_fetch_and_update_settings_and_changes_reflect_publicly(): void
    {
        $this->actingAs($this->adminUser, 'sanctum');

        $getRes = $this->getJson('/api/v1/admin/settings');
        $getRes->assertStatus(200)
            ->assertJsonPath('status', 'success');

        // Update settings
        $updatePayload = [
            'profile' => [
                'name' => 'Hosam Maher Updated',
                'bioEn' => 'Custom updated bio from test',
                'email' => 'studio@newdomain.com',
            ],
            'hero' => [
                'titleStartEn' => 'Visionary',
                'titleAccentEn' => 'Architect',
            ],
            'about' => [
                'statProjects' => '100+',
            ],
        ];

        $putRes = $this->putJson('/api/v1/admin/settings', $updatePayload);
        $putRes->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.settings.profile.name', 'Hosam Maher Updated')
            ->assertJsonPath('data.settings.hero.titleStartEn', 'Visionary')
            ->assertJsonPath('data.settings.about.statProjects', '100+');

        // Verify public endpoint immediately reflects the updated settings
        $publicRes = $this->getJson('/api/v1/settings?locale=en');
        $publicRes->assertStatus(200)
            ->assertJsonPath('data.settings.profile.name', 'Hosam Maher Updated')
            ->assertJsonPath('data.settings.hero.titleStartEn', 'Visionary')
            ->assertJsonPath('data.settings.about.statProjects', '100+');
    }
}
