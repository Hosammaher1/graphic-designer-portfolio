<?php

namespace Tests\Feature\Projects;

use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublishIdempotencyTest extends TestCase
{
    use RefreshDatabase;

    public function test_replaying_publish_key_does_not_create_another_snapshot(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $project = Project::factory()->create(['status' => 'draft']);
        $url = "/api/v1/admin/projects/{$project->id}/publish";

        $first = $this->actingAs($admin, 'sanctum')->postJson($url, [], ['Idempotency-Key' => 'publish-request-123']);
        $first->assertOk();
        $this->assertSame(1, $project->fresh()->published_snapshot['version']);

        $replay = $this->actingAs($admin, 'sanctum')->postJson($url, [], ['Idempotency-Key' => 'publish-request-123']);
        $replay->assertOk();
        $this->assertSame(1, $project->fresh()->published_snapshot['version']);

        $newRequest = $this->actingAs($admin, 'sanctum')->postJson($url, [], ['Idempotency-Key' => 'publish-request-456']);
        $newRequest->assertOk();
        $this->assertSame(2, $project->fresh()->published_snapshot['version']);

        $staleReplay = $this->actingAs($admin, 'sanctum')->postJson($url, [], ['Idempotency-Key' => 'publish-request-123']);
        $staleReplay->assertStatus(409);
        $this->assertSame(2, $project->fresh()->published_snapshot['version']);
    }
}
