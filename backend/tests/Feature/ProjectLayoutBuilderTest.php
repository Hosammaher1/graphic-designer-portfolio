<?php

namespace Tests\Feature;

use App\Models\MediaAsset;
use App\Models\Project;
use App\Models\ProjectMedia;
use App\Models\User;
use App\Services\Publishing\ProjectPublishingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProjectLayoutBuilderTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected Project $project;
    protected MediaAsset $projectAsset;
    protected MediaAsset $unrelatedAsset;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminUser = User::factory()->create(['is_admin' => true]);

        $this->project = Project::create([
            'slug' => 'brand-identity-case-study',
            'status' => 'draft',
            'year' => 2026,
            'client' => 'Creative Studio',
        ]);

        $this->project->translations()->create([
            'locale' => 'ar',
            'title' => 'دراسة حالة الهوية البصرية',
            'description' => 'وصف افتراضي للمشروع',
        ]);
        $this->project->translations()->create([
            'locale' => 'en',
            'title' => 'Brand Identity Case Study',
            'description' => 'Default project description',
        ]);

        // Media asset attached to this project
        $this->projectAsset = MediaAsset::create([
            'provider' => 'local',
            'provider_id' => 'brand-logo',
            'file_name' => 'brand-logo.jpg',
            'mime_type' => 'image/jpeg',
            'bytes' => 102400,
            'original_url' => 'https://res.cloudinary.com/demo/image/upload/brand-logo.jpg',
        ]);

        ProjectMedia::create([
            'project_id' => $this->project->id,
            'media_asset_id' => $this->projectAsset->id,
            'sort_order' => 1,
            'is_cover' => true,
        ]);

        // Unrelated media asset belonging to a private draft project
        $this->unrelatedAsset = MediaAsset::create([
            'provider' => 'local',
            'provider_id' => 'secret-internal',
            'file_name' => 'secret-internal.jpg',
            'mime_type' => 'image/jpeg',
            'bytes' => 102400,
            'original_url' => 'https://res.cloudinary.com/demo/image/upload/secret-internal.jpg',
        ]);
    }

    public function test_admin_can_save_valid_project_layout_blocks(): void
    {
        $payload = [
            'layout_blocks' => [
                [
                    'id' => 'blk-proj-heading',
                    'type' => 'heading',
                    'version' => 1,
                    'data' => [
                        'text' => 'مفهوم الهوية وفلسفة الألوان',
                        'level' => 'h2',
                    ],
                    'settings' => [],
                ],
                [
                    'id' => 'blk-proj-image',
                    'type' => 'image',
                    'version' => 1,
                    'data' => [
                        'media_asset_id' => $this->projectAsset->id,
                        'url' => $this->projectAsset->path,
                        'alt' => 'شعار العلامة التجارية',
                    ],
                    'settings' => [],
                ],
            ],
        ];

        $response = $this->actingAs($this->adminUser)
            ->putJson("/api/v1/admin/projects/{$this->project->id}/layout", $payload);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('project.layout_blocks.0.type', 'heading')
            ->assertJsonPath('project.layout_blocks.1.type', 'image');

        $this->project->refresh();
        $this->assertCount(2, $this->project->layout_blocks);
    }

    public function test_rejects_disallowed_global_blocks_on_projects(): void
    {
        // 'category_preview' and 'featured_work' are global page blocks disallowed in project layout
        $payload = [
            'layout_blocks' => [
                [
                    'id' => 'blk-invalid-cat',
                    'type' => 'category_preview',
                    'version' => 1,
                    'data' => [],
                    'settings' => [],
                ],
            ],
        ];

        $response = $this->actingAs($this->adminUser)
            ->putJson("/api/v1/admin/projects/{$this->project->id}/layout", $payload);

        $response->assertStatus(422)
            ->assertJsonPath('restricted_type', true);
    }

    public function test_rejects_media_assets_not_belonging_to_project_or_published(): void
    {
        $payload = [
            'layout_blocks' => [
                [
                    'id' => 'blk-forbidden-image',
                    'type' => 'image',
                    'version' => 1,
                    'data' => [
                        'media_asset_id' => $this->unrelatedAsset->id, // Private unattached asset
                        'url' => $this->unrelatedAsset->path,
                    ],
                    'settings' => [],
                ],
            ],
        ];

        $response = $this->actingAs($this->adminUser)
            ->putJson("/api/v1/admin/projects/{$this->project->id}/layout", $payload);

        $response->assertStatus(422)
            ->assertJsonPath('media_permission_denied', true);
    }

    public function test_published_snapshot_isolation_for_project_layout(): void
    {
        // 1. Set initial layout blocks and publish project
        $this->project->update([
            'layout_blocks' => [
                [
                    'id' => 'blk-v1',
                    'type' => 'heading',
                    'version' => 1,
                    'data' => ['text' => 'النسخة الأصلية المنشورة'],
                    'settings' => [],
                ],
            ],
        ]);

        $publishingService = app(ProjectPublishingService::class);
        $publishingService->publish($this->project);

        $this->project->refresh();
        $this->assertEquals(
            'النسخة الأصلية المنشورة',
            $this->project->published_snapshot['layout_blocks'][0]['data']['text']
        );

        // 2. Update layout_blocks draft
        $this->actingAs($this->adminUser)
            ->putJson("/api/v1/admin/projects/{$this->project->id}/layout", [
                'layout_blocks' => [
                    [
                        'id' => 'blk-v2',
                        'type' => 'heading',
                        'version' => 1,
                        'data' => ['text' => 'مسودة جديدة غير منشورة مطلقا'],
                        'settings' => [],
                    ],
                ],
            ])
            ->assertStatus(200);

        // 3. Verify public snapshot is NOT mutated
        $this->project->refresh();
        $this->assertEquals(
            'النسخة الأصلية المنشورة',
            $this->project->published_snapshot['layout_blocks'][0]['data']['text']
        );

        // 4. Public endpoint returns published snapshot
        $publicRes = $this->getJson("/api/v1/projects/{$this->project->slug}");
        $publicRes->assertStatus(200);
        $this->assertEquals(
            'النسخة الأصلية المنشورة',
            $publicRes->json('data.project.layout_blocks.0.data.text')
        );
        $this->assertStringNotContainsString(
            'مسودة جديدة غير منشورة مطلقا',
            json_encode($publicRes->json())
        );
    }
}
