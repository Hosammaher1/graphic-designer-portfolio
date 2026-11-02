<?php

namespace Tests\Feature;

use App\Models\JourneyMilestone;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class JourneyMilestoneTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected User $regularUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminUser = User::factory()->create([
            'email' => 'admin@mohammed-portfolio.test',
            'is_admin' => true,
        ]);

        $this->regularUser = User::factory()->create([
            'email' => 'regular@mohammed-portfolio.test',
            'is_admin' => false,
        ]);
    }

    public function test_public_endpoint_returns_only_published_and_visible_milestones_localized(): void
    {
        // 1. Published and visible
        JourneyMilestone::create([
            'year' => '2023',
            'role_en' => 'Lead Designer',
            'role_ar' => 'رئيس المصممين',
            'company_en' => 'Apex Agency',
            'company_ar' => 'وكالة أبكس',
            'description_en' => 'Designed innovative branding systems.',
            'description_ar' => 'تصميم هويات متكاملة.',
            'icon_name' => 'Award',
            'sort_order' => 1,
            'is_visible' => true,
            'is_published' => true,
        ]);

        // 2. Draft (not published)
        JourneyMilestone::create([
            'year' => '2024',
            'role_en' => 'Creative Director',
            'role_ar' => 'المدير الإبداعي',
            'description_en' => 'Draft milestone.',
            'description_ar' => 'مسودة إنجاز.',
            'sort_order' => 2,
            'is_visible' => true,
            'is_published' => false,
        ]);

        // 3. Hidden
        JourneyMilestone::create([
            'year' => '2025',
            'role_en' => 'Consultant',
            'role_ar' => 'مستشار',
            'description_en' => 'Hidden milestone.',
            'description_ar' => 'إنجاز مخفي.',
            'sort_order' => 3,
            'is_visible' => false,
            'is_published' => true,
        ]);

        // Test Arabic response
        $responseAr = $this->getJson('/api/v1/journey?locale=ar');
        $responseAr->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonCount(1, 'data.milestones')
            ->assertJsonPath('data.milestones.0.activeRole', 'رئيس المصممين')
            ->assertJsonPath('data.milestones.0.activeCompany', 'وكالة أبكس');

        // Test English response
        $responseEn = $this->getJson('/api/v1/journey?locale=en');
        $responseEn->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonCount(1, 'data.milestones')
            ->assertJsonPath('data.milestones.0.activeRole', 'Lead Designer')
            ->assertJsonPath('data.milestones.0.activeCompany', 'Apex Agency');
    }

    public function test_unauthorized_access_to_admin_journey_routes_is_rejected(): void
    {
        // Unauthenticated access
        $this->getJson('/api/v1/admin/journey')->assertStatus(401);
        $this->postJson('/api/v1/admin/journey', [])->assertStatus(401);
        $this->getJson('/api/v1/admin/journey/1')->assertStatus(401);
        $this->putJson('/api/v1/admin/journey/1', [])->assertStatus(401);
        $this->deleteJson('/api/v1/admin/journey/1')->assertStatus(401);
        $this->postJson('/api/v1/admin/journey/reorder', ['order' => [1]])->assertStatus(401);
        $this->postJson('/api/v1/admin/journey/1/publish')->assertStatus(401);

        // Non-admin authenticated user
        $this->actingAs($this->regularUser)
            ->getJson('/api/v1/admin/journey')
            ->assertStatus(403);

        $this->actingAs($this->regularUser)
            ->postJson('/api/v1/admin/journey', [
                'year' => '2024',
                'role_en' => 'Role',
                'role_ar' => 'وظيفة',
                'description_en' => 'Desc',
                'description_ar' => 'وصف',
            ])
            ->assertStatus(403);
    }

    public function test_admin_can_retrieve_all_milestones_including_drafts(): void
    {
        JourneyMilestone::create([
            'year' => '2023',
            'role_en' => 'Published Role',
            'role_ar' => 'دور منشور',
            'description_en' => 'Published Desc',
            'description_ar' => 'وصف منشور',
            'is_published' => true,
            'is_visible' => true,
        ]);

        JourneyMilestone::create([
            'year' => '2024',
            'role_en' => 'Draft Role',
            'role_ar' => 'دور مسودة',
            'description_en' => 'Draft Desc',
            'description_ar' => 'وصف مسودة',
            'is_published' => false,
            'is_visible' => false,
        ]);

        $response = $this->actingAs($this->adminUser)
            ->getJson('/api/v1/admin/journey');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonCount(2, 'data.milestones');
    }

    public function test_admin_can_create_milestone_with_validation(): void
    {
        // Validation failure
        $badResponse = $this->actingAs($this->adminUser)
            ->postJson('/api/v1/admin/journey', []);
        $badResponse->assertStatus(422)
            ->assertJsonValidationErrors(['year', 'role_en', 'role_ar', 'description_en', 'description_ar']);

        // Success
        $payload = [
            'year' => '2025',
            'role_en' => 'Senior Art Director',
            'role_ar' => 'مدير فني أول',
            'company_en' => 'Luxury Studio Paris',
            'company_ar' => 'استوديو باريس الفاخر',
            'location_en' => 'Paris / Remote',
            'location_ar' => 'باريس / عن بعد',
            'description_en' => 'Leading luxury brand packaging and 3D spatial experiences.',
            'description_ar' => 'قيادة تصاميم التغليف الفاخر والتجارب المكانية ثلاثية الأبعاد.',
            'icon_name' => 'Sparkles',
            'image_url' => 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
            'tags' => ['Luxury', '3D', 'Art Direction'],
            'achievements' => [
                ['en' => 'Won Pentawards Silver 2025', 'ar' => 'الفوز بجائزة بنتاوردز الفضية 2025']
            ],
            'sort_order' => 1,
            'is_visible' => true,
            'is_published' => true,
        ];

        $createResponse = $this->actingAs($this->adminUser)
            ->postJson('/api/v1/admin/journey', $payload);

        $createResponse->assertStatus(201)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.milestone.role_en', 'Senior Art Director')
            ->assertJsonPath('data.milestone.role_ar', 'مدير فني أول');

        $this->assertDatabaseHas('journey_milestones', [
            'year' => '2025',
            'role_en' => 'Senior Art Director',
            'company_en' => 'Luxury Studio Paris',
        ]);
    }

    public function test_admin_can_update_milestone(): void
    {
        $milestone = JourneyMilestone::create([
            'year' => '2023',
            'role_en' => 'Junior Designer',
            'role_ar' => 'مصمم مبتدئ',
            'description_en' => 'Initial description',
            'description_ar' => 'الوصف الأولي',
            'is_published' => false,
        ]);

        $updateResponse = $this->actingAs($this->adminUser)
            ->putJson("/api/v1/admin/journey/{$milestone->id}", [
                'role_en' => 'Midweight Brand Designer',
                'role_ar' => 'مصمم علامات تجارية',
                'is_published' => true,
            ]);

        $updateResponse->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.milestone.role_en', 'Midweight Brand Designer')
            ->assertJsonPath('data.milestone.is_published', true);

        $this->assertDatabaseHas('journey_milestones', [
            'id' => $milestone->id,
            'role_en' => 'Midweight Brand Designer',
            'is_published' => 1,
        ]);
    }

    public function test_admin_can_toggle_publish_status(): void
    {
        $milestone = JourneyMilestone::create([
            'year' => '2024',
            'role_en' => 'Brand Strategist',
            'role_ar' => 'خبير استراتيجية العلامات',
            'description_en' => 'Testing publish toggle',
            'description_ar' => 'اختبار تبديل النشر',
            'is_published' => false,
        ]);

        // Toggle to true
        $res1 = $this->actingAs($this->adminUser)
            ->postJson("/api/v1/admin/journey/{$milestone->id}/publish");
        $res1->assertStatus(200)
            ->assertJsonPath('data.milestone.is_published', true);

        // Toggle back to false
        $res2 = $this->actingAs($this->adminUser)
            ->postJson("/api/v1/admin/journey/{$milestone->id}/publish");
        $res2->assertStatus(200)
            ->assertJsonPath('data.milestone.is_published', false);
    }

    public function test_admin_can_reorder_milestones(): void
    {
        $m1 = JourneyMilestone::create([
            'year' => '2022',
            'role_en' => 'First',
            'role_ar' => 'الأول',
            'description_en' => 'D1',
            'description_ar' => 'و1',
            'sort_order' => 1,
        ]);

        $m2 = JourneyMilestone::create([
            'year' => '2023',
            'role_en' => 'Second',
            'role_ar' => 'الثاني',
            'description_en' => 'D2',
            'description_ar' => 'و2',
            'sort_order' => 2,
        ]);

        $reorderResponse = $this->actingAs($this->adminUser)
            ->postJson('/api/v1/admin/journey/reorder', [
                'order' => [$m2->id, $m1->id],
            ]);

        $reorderResponse->assertStatus(200);

        $this->assertEquals(1, $m2->fresh()->sort_order);
        $this->assertEquals(2, $m1->fresh()->sort_order);
    }

    public function test_admin_can_delete_milestone(): void
    {
        $milestone = JourneyMilestone::create([
            'year' => '2021',
            'role_en' => 'Intern',
            'role_ar' => 'متدرب',
            'description_en' => 'To be deleted',
            'description_ar' => 'سيتم حذفه',
        ]);

        $deleteResponse = $this->actingAs($this->adminUser)
            ->deleteJson("/api/v1/admin/journey/{$milestone->id}");

        $deleteResponse->assertStatus(200)
            ->assertJsonPath('status', 'success');

        $this->assertDatabaseMissing('journey_milestones', [
            'id' => $milestone->id,
        ]);
    }
}
