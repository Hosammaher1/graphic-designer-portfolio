<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class RobotsTest extends TestCase
{
    public function test_robots_txt_returns_text_plain_with_valid_directives(): void
    {
        $response = $this->get('/robots.txt');

        $response->assertStatus(200);
        $this->assertStringContainsString('text/plain', $response->headers->get('Content-Type'));

        $content = $response->getContent();

        $this->assertStringContainsString('User-agent: *', $content);
        $this->assertStringContainsString('Allow: /', $content);
        $this->assertStringContainsString('Disallow: /admin', $content);
        $this->assertStringContainsString('Disallow: /api', $content);
        $this->assertStringContainsString('Sitemap:', $content);
        $this->assertStringContainsString('/sitemap.xml', $content);
    }

    public function test_robots_txt_includes_configured_sitemap_url(): void
    {
        Config::set('app.url', 'https://mohammed-portfolio.com');

        $response = $this->get('/robots.txt');
        $response->assertStatus(200);

        $content = $response->getContent();
        $this->assertStringContainsString('Sitemap: https://mohammed-portfolio.com/sitemap.xml', $content);
    }

    public function test_robots_txt_caching_headers(): void
    {
        $response = $this->get('/robots.txt');

        $response->assertStatus(200);
        $cacheControl = $response->headers->get('Cache-Control');
        $this->assertNotEmpty($cacheControl);
        $this->assertStringContainsString('public', $cacheControl);
    }
}
