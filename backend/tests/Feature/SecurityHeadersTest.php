<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SecurityHeadersTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that all required HTTP security headers are present on API endpoints.
     */
    public function test_api_endpoints_return_strict_security_headers(): void
    {
        config(['app.env' => 'production']);
        $response = $this->getJson('/api/v1/projects');

        // 1. Content Security Policy (CSP)
        $this->assertTrue($response->headers->has('Content-Security-Policy'));
        $csp = $response->headers->get('Content-Security-Policy');
        $this->assertStringContainsString("default-src 'self'", $csp);
        $this->assertStringContainsString("frame-ancestors 'none'", $csp);
        $this->assertStringContainsString('https://res.cloudinary.com', $csp);
        $this->assertStringNotContainsString('unsafe-eval', $csp);
        $this->assertStringNotContainsString('unsafe-inline', $csp);
        $this->assertStringNotContainsString('localhost', $csp);
        $this->assertStringNotContainsString('127.0.0.1', $csp);

        // 2. Strict Transport Security (HSTS)
        $this->assertTrue($response->headers->has('Strict-Transport-Security'));
        $hsts = $response->headers->get('Strict-Transport-Security');
        $this->assertStringContainsString('max-age=31536000', $hsts);
        $this->assertStringContainsString('includeSubDomains', $hsts);
        $this->assertStringContainsString('preload', $hsts);

        // 3. X-Frame-Options
        $this->assertEquals('DENY', $response->headers->get('X-Frame-Options'));

        // 4. X-Content-Type-Options
        $this->assertEquals('nosniff', $response->headers->get('X-Content-Type-Options'));

        // 5. Referrer-Policy
        $this->assertEquals('strict-origin-when-cross-origin', $response->headers->get('Referrer-Policy'));

        // 6. Permissions-Policy
        $this->assertTrue($response->headers->has('Permissions-Policy'));
        $permissions = $response->headers->get('Permissions-Policy');
        $this->assertStringContainsString('camera=()', $permissions);
        $this->assertStringContainsString('microphone=()', $permissions);
        $this->assertStringContainsString('geolocation=()', $permissions);

        // 7. Cross-Origin-Opener-Policy & Cross-Origin-Resource-Policy
        $this->assertEquals('same-origin', $response->headers->get('Cross-Origin-Opener-Policy'));
    }

    public function test_local_api_does_not_emit_production_hsts(): void
    {
        config(['app.env' => 'local']);
        $response = $this->getJson('/api/v1/projects');

        $this->assertFalse($response->headers->has('Strict-Transport-Security'));
    }

    /**
     * Test that robots.txt and sitemap.xml also receive security headers.
     */
    public function test_public_meta_routes_return_security_headers(): void
    {
        $robots = $this->get('/robots.txt');
        $this->assertEquals('DENY', $robots->headers->get('X-Frame-Options'));
        $this->assertEquals('nosniff', $robots->headers->get('X-Content-Type-Options'));
        $this->assertTrue($robots->headers->has('Content-Security-Policy'));

        $sitemap = $this->get('/sitemap.xml');
        $this->assertEquals('DENY', $sitemap->headers->get('X-Frame-Options'));
        $this->assertEquals('nosniff', $sitemap->headers->get('X-Content-Type-Options'));
        $this->assertTrue($sitemap->headers->has('Content-Security-Policy'));
    }

    /**
     * Test that framing and clickjacking protection headers cannot be bypassed.
     */
    public function test_clickjacking_protection_is_consistently_enforced(): void
    {
        $response = $this->getJson('/api/v1/categories');

        $this->assertEquals('DENY', $response->headers->get('X-Frame-Options'));
        $csp = $response->headers->get('Content-Security-Policy');
        $this->assertStringContainsString("frame-ancestors 'none'", $csp);
    }
}
