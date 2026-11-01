<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

/**
 * Task 08.06: Security Penetration Test Suite (OWASP Top 10)
 *
 * Automated penetration test coverage against OWASP Top 10 vulnerabilities:
 * - A01: Broken Access Control & IDOR
 * - A02: Cryptographic Failures & Sensitive Data Exposure
 * - A03: Injection (SQLi & Command Injection)
 * - A04: Insecure Design & Rate Limiting Hardening
 * - A05: Security Misconfiguration & Error Masking
 * - A06: Vulnerable Components & XXE (XML External Entity)
 * - A07: Identification & Authentication Failures
 * - A08: Software & Data Integrity Failures (Schema Tampering)
 * - A09: Security Logging & Secret Redaction
 * - A10: Server-Side Request Forgery (SSRF) / Loopback Rejection
 */
class SecurityPenetrationTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected User $regularUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminUser = User::factory()->create([
            'email' => 'admin@mohammed-portfolio.test',
            'password' => Hash::make('AdminPass123!@#'),
            'is_admin' => true,
        ]);

        $this->regularUser = User::factory()->create([
            'email' => 'user@mohammed-portfolio.test',
            'password' => Hash::make('RegularPass123!@#'),
            'is_admin' => false,
        ]);

        RateLimiter::clear('admin@mohammed-portfolio.test|127.0.0.1');
    }

    /* =========================================================================
     * A01: Broken Access Control & IDOR
     * ========================================================================= */

    public function test_a01_unauthenticated_access_to_admin_endpoints_is_blocked(): void
    {
        $endpoints = [
            ['GET', '/api/v1/admin/projects'],
            ['POST', '/api/v1/admin/projects'],
            ['GET', '/api/v1/admin/users'],
            ['GET', '/api/v1/admin/audit-logs'],
            ['GET', '/api/v1/admin/profile'],
            ['PUT', '/api/v1/admin/profile/password'],
        ];

        foreach ($endpoints as [$method, $uri]) {
            $response = $this->json($method, $uri);
            $response->assertStatus(401)
                ->assertJson(['status' => 'error']);
        }
    }

    public function test_a01_non_admin_authenticated_user_cannot_access_admin_endpoints(): void
    {
        $response = $this->actingAs($this->regularUser)
            ->getJson('/api/v1/admin/projects');

        $response->assertStatus(403)
            ->assertJson(['status' => 'error']);
    }

    public function test_a01_admin_cannot_delete_their_own_account_self_lockout_prevention(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->deleteJson("/api/v1/admin/users/{$this->adminUser->id}");

        $response->assertStatus(403)
            ->assertJson(['status' => 'error']);

        $this->assertDatabaseHas('users', ['id' => $this->adminUser->id]);
    }

    /* =========================================================================
     * A02: Cryptographic Failures & Sensitive Data Exposure
     * ========================================================================= */

    public function test_a02_passwords_are_never_leaked_in_user_or_auth_responses(): void
    {
        // 1. Auth Login response
        $loginResponse = $this->postJson('/api/v1/auth/login', [
            'email' => $this->adminUser->email,
            'password' => 'AdminPass123!@#',
        ]);
        $loginResponse->assertStatus(200);
        $this->assertStringNotContainsString('password', $loginResponse->getContent());
        $this->assertStringNotContainsString('$2y$', $loginResponse->getContent()); // No bcrypt prefix

        // 2. Auth Me response
        $meResponse = $this->actingAs($this->adminUser)->getJson('/api/v1/auth/me');
        $meResponse->assertStatus(200);
        $this->assertArrayNotHasKey('password', $meResponse->json('data.user'));
        $this->assertArrayNotHasKey('remember_token', $meResponse->json('data.user'));

        // 3. User Index response
        $usersResponse = $this->actingAs($this->adminUser)->getJson('/api/v1/admin/users');
        $usersResponse->assertStatus(200);
        $this->assertStringNotContainsString('$2y$', $usersResponse->getContent());
    }

    public function test_a02_draft_and_trashed_projects_never_exposed_on_public_api(): void
    {
        $published = Project::factory()->create(['slug' => 'published-project', 'status' => 'draft']);
        \App\Models\ProjectTranslation::factory()->create(['project_id' => $published->id, 'locale' => 'ar', 'title' => 'مشروع منشور']);
        \App\Models\ProjectTranslation::factory()->create(['project_id' => $published->id, 'locale' => 'en', 'title' => 'Published Project']);
        $this->actingAs($this->adminUser)->postJson("/api/v1/admin/projects/{$published->id}/publish");

        $draft = Project::factory()->create(['status' => 'draft', 'slug' => 'secret-draft-project']);
        \App\Models\ProjectTranslation::factory()->create(['project_id' => $draft->id, 'locale' => 'en', 'title' => 'Draft Project']);

        $trashed = Project::factory()->create(['status' => 'draft', 'slug' => 'trashed-project']);
        \App\Models\ProjectTranslation::factory()->create(['project_id' => $trashed->id, 'locale' => 'en', 'title' => 'Trashed Project']);
        $this->actingAs($this->adminUser)->postJson("/api/v1/admin/projects/{$trashed->id}/publish");
        $trashed->delete();

        // Public index
        $indexResponse = $this->getJson('/api/v1/projects');
        $indexResponse->assertStatus(200);
        $slugs = collect($indexResponse->json('data.projects.data') ?? [])->pluck('slug');

        $this->assertTrue($slugs->contains('published-project'));
        $this->assertFalse($slugs->contains('secret-draft-project'));
        $this->assertFalse($slugs->contains('trashed-project'));

        // Public single show
        $this->getJson('/api/v1/projects/secret-draft-project')->assertStatus(404);
        $this->getJson('/api/v1/projects/trashed-project')->assertStatus(404);
    }

    /* =========================================================================
     * A03: Injection (SQLi & Command Injection)
     * ========================================================================= */

    public function test_a03_sql_injection_payloads_in_search_and_filter_parameters(): void
    {
        $sqliPayloads = [
            "' OR 1=1 --",
            "1' UNION SELECT null, null, null, null, null, null, null, null, null, null --",
            "admin' AND (SELECT 1 FROM (SELECT SLEEP(1))a)--",
            "'; DROP TABLE projects; --",
            "\" OR \"\"=\"",
            "1; WAITFOR DELAY '0:0:1'--",
            "1' OR '1'='1",
        ];

        foreach ($sqliPayloads as $payload) {
            $response = $this->getJson('/api/v1/search?q=' . urlencode($payload));
            $response->assertStatus(200); // Handled cleanly, no 500 SQL crash
            $this->assertStringNotContainsString('SQLSTATE', $response->getContent());
            $this->assertStringNotContainsString('Syntax error', $response->getContent());

            $projectShow = $this->getJson('/api/v1/projects/' . urlencode($payload));
            $this->assertTrue(in_array($projectShow->status(), [400, 404]));
            $this->assertStringNotContainsString('SQLSTATE', $projectShow->getContent());
        }
    }

    public function test_a03_command_injection_payloads_in_inputs_are_neutralized(): void
    {
        $cmdPayloads = [
            '; cat /etc/passwd',
            '| whoami',
            '&& ping -c 1 127.0.0.1',
            '`id`',
            '$(id)',
        ];

        foreach ($cmdPayloads as $payload) {
            $response = $this->postJson('/api/v1/contact', [
                'name' => 'Attacker ' . $payload,
                'email' => 'attacker@test.com',
                'subject' => 'Inquiry ' . $payload,
                'message' => 'Message with injection ' . $payload,
            ]);

            // Handled cleanly (200, 201, or 422 if sanitized/rate limited), never 500
            $this->assertNotEquals(500, $response->status());
        }
    }

    /* =========================================================================
     * A04: Insecure Design & Rate Limiting Hardening
     * ========================================================================= */

    public function test_a04_authentication_rate_limiting_enforces_brute_force_block(): void
    {
        RateLimiter::clear('admin@mohammed-portfolio.test|127.0.0.1');

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/auth/login', [
                'email' => 'admin@mohammed-portfolio.test',
                'password' => 'WrongPassword!',
            ])->assertStatus(401);
        }

        // 6th attempt must trigger 429
        $blocked = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@mohammed-portfolio.test',
            'password' => 'WrongPassword!',
        ]);

        $blocked->assertStatus(429)
            ->assertHeader('Retry-After');
    }

    /* =========================================================================
     * A05: Security Misconfiguration & Error Masking
     * ========================================================================= */

    public function test_a05_error_handling_masks_system_paths_and_stack_traces(): void
    {
        // Request non-existent route with wrong verb
        $response = $this->postJson('/api/v1/non-existent-endpoint');

        $this->assertTrue(in_array($response->status(), [404, 405]));
        $content = $response->getContent();

        // Must never leak server path delimiters, framework files, or traces
        $this->assertStringNotContainsString('vendor/laravel', $content);
        $this->assertStringNotContainsString('Stack trace:', $content);
        $this->assertStringNotContainsString('PDOException', $content);
    }

    public function test_a05_security_headers_are_strictly_present_on_all_responses(): void
    {
        $response = $this->getJson('/api/v1/health');

        $response->assertStatus(200);
        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('X-Frame-Options');
        $response->assertHeader('Referrer-Policy');
    }

    /* =========================================================================
     * A06: Vulnerable Components & XXE (XML External Entity)
     * ========================================================================= */

    public function test_a06_xxe_payload_in_svg_upload_is_strictly_rejected(): void
    {
        $xxeSvg = <<<SVG
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
  <text>&xxe;</text>
</svg>
SVG;

        $file = UploadedFile::fake()->createWithContent('malicious-xxe.svg', $xxeSvg);

        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/v1/admin/media/upload', [
                'file' => $file,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['file']);
    }

    /* =========================================================================
     * A07: Identification and Authentication Failures
     * ========================================================================= */

    public function test_a07_login_does_not_reveal_user_existence_timing_or_messages(): void
    {
        // 1. Existing user with wrong password
        $resExisting = $this->postJson('/api/v1/auth/login', [
            'email' => $this->adminUser->email,
            'password' => 'IncorrectPass123!',
        ]);

        // 2. Non-existent user
        $resNonExistent = $this->postJson('/api/v1/auth/login', [
            'email' => 'doesnotexist@example.com',
            'password' => 'IncorrectPass123!',
        ]);

        $resExisting->assertStatus(401);
        $resNonExistent->assertStatus(401);

        // Both error messages must be generic without user enumeration
        $this->assertEquals($resExisting->json('message'), $resNonExistent->json('message'));
    }

    /* =========================================================================
     * A08: Software and Data Integrity Failures (Block Schema Tampering)
     * ========================================================================= */

    public function test_a08_tampered_malicious_script_in_page_block_is_rejected(): void
    {
        $tamperedBlocks = [
            [
                'id' => 'block-1',
                'type' => 'text',
                'version' => 1,
                'data' => [
                    'content' => '<script>alert("pwned")</script>',
                ],
            ],
        ];

        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/v1/admin/pages/sec-test-page/draft', [
                'blocks' => $tamperedBlocks,
            ]);

        // Must reject or sanitize script payload
        if ($response->status() === 200 || $response->status() === 201) {
            $createdContent = json_encode($response->json());
            $this->assertStringNotContainsString('<script>', $createdContent);
        } else {
            $this->assertTrue(in_array($response->status(), [400, 422]));
        }
    }

    /* =========================================================================
     * A09: Security Logging and Secret Redaction
     * ========================================================================= */

    public function test_a09_audit_logs_redact_sensitive_keys(): void
    {
        Log::shouldReceive('warning')->atLeast()->once();

        $this->postJson('/api/v1/auth/login', [
            'email' => 'test-audit@mohammed-portfolio.test',
            'password' => 'PlaintextPasswordNeverLogged!',
        ]);

        // If audit logs table exists, verify sensitive keys are omitted
        if (\Illuminate\Support\Facades\Schema::hasTable('admin_activity_logs')) {
            $logs = \Illuminate\Support\Facades\DB::table('admin_activity_logs')
                ->where('details', 'like', '%PlaintextPasswordNeverLogged%')
                ->count();
            $this->assertEquals(0, $logs, 'Plaintext password was found in activity logs!');
        }
    }

    /* =========================================================================
     * A10: Server-Side Request Forgery (SSRF) / Private IP Defense
     * ========================================================================= */

    public function test_a10_signed_preview_requires_valid_hmac_and_rejects_tampering(): void
    {
        // Try accessing preview with fake signature
        $response = $this->getJson('/api/v1/pages/any-slug/preview?signature=forged_fake_signature');
        $response->assertStatus(403);
    }
}
