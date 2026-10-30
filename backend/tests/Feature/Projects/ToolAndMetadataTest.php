<?php

namespace Tests\Feature\Projects;

use App\Models\Project;
use App\Models\Tool;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ToolAndMetadataTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['is_admin' => true]);
    }

    public function test_admin_can_create_and_list_tools(): void
    {
        $admin = $this->admin();

        $createResponse = $this->actingAs($admin)->postJson('/api/v1/admin/tools', [
            'name'     => 'Figma',
            'slug'     => 'figma',
            'icon_url' => 'https://example.com/icons/figma.svg',
        ]);

        $createResponse->assertStatus(201)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.tool.name', 'Figma')
            ->assertJsonPath('data.tool.slug', 'figma');

        $this->assertDatabaseHas('tools', ['slug' => 'figma']);

        $listResponse = $this->actingAs($admin)->getJson('/api/v1/admin/tools');
        $listResponse->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonCount(1, 'data.tools');
    }

    public function test_duplicate_tool_slug_returns_422(): void
    {
        $admin = $this->admin();
        Tool::factory()->create(['slug' => 'photoshop']);

        $response = $this->actingAs($admin)->postJson('/api/v1/admin/tools', [
            'name' => 'Adobe Photoshop',
            'slug' => 'photoshop',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['slug']);
    }

    public function test_admin_can_update_and_delete_tool(): void
    {
        $admin = $this->admin();
        $tool = Tool::factory()->create(['name' => 'Old Name', 'slug' => 'old-tool']);

        $updateResponse = $this->actingAs($admin)->putJson('/api/v1/admin/tools/' . $tool->id, [
            'name' => 'New Name',
            'slug' => 'new-tool',
        ]);

        $updateResponse->assertStatus(200)
            ->assertJsonPath('data.tool.name', 'New Name');

        $this->assertDatabaseHas('tools', ['slug' => 'new-tool']);

        $deleteResponse = $this->actingAs($admin)->deleteJson('/api/v1/admin/tools/' . $tool->id);
        $deleteResponse->assertStatus(200);
        $this->assertDatabaseMissing('tools', ['id' => $tool->id]);
    }

    public function test_project_list_can_be_filtered_by_year(): void
    {
        $admin = $this->admin();
        Project::factory()->create(['slug' => 'proj-2024', 'year' => 2024]);
        Project::factory()->create(['slug' => 'proj-2025', 'year' => 2025]);

        $response = $this->actingAs($admin)->getJson('/api/v1/admin/projects?year=2024');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data.projects.data')
            ->assertJsonPath('data.projects.data.0.slug', 'proj-2024');
    }

    public function test_project_list_can_be_filtered_by_tool(): void
    {
        $admin = $this->admin();
        $toolA = Tool::factory()->create(['slug' => 'tool-a']);
        $toolB = Tool::factory()->create(['slug' => 'tool-b']);

        $projA = Project::factory()->create(['slug' => 'proj-with-tool-a']);
        $projB = Project::factory()->create(['slug' => 'proj-with-tool-b']);

        $projA->tools()->attach($toolA->id);
        $projB->tools()->attach($toolB->id);

        $response = $this->actingAs($admin)->getJson('/api/v1/admin/projects?tool_id=' . $toolA->id);

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data.projects.data')
            ->assertJsonPath('data.projects.data.0.slug', 'proj-with-tool-a');
    }

    public function test_duplicate_tool_relation_is_prevented(): void
    {
        $project = Project::factory()->create();
        $tool = Tool::factory()->create();

        $project->tools()->attach($tool->id);

        $this->expectException(QueryException::class);
        $project->tools()->attach($tool->id);
    }

    public function test_unauthenticated_cannot_manage_tools(): void
    {
        $response = $this->postJson('/api/v1/admin/tools', ['name' => 'Test', 'slug' => 'test']);
        $response->assertStatus(401);
    }
}
