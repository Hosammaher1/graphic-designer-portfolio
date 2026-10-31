<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\Security\InputSanitizer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InputSanitizationTest extends TestCase
{
    use RefreshDatabase;

    protected InputSanitizer $sanitizer;

    protected function setUp(): void
    {
        parent::setUp();
        $this->sanitizer = new InputSanitizer();
    }

    /**
     * Test cleanPlainText strips script tags, event handlers, and malicious URIs.
     */
    public function test_plain_text_strips_all_html_and_executable_scripts(): void
    {
        $dirty = "<script>alert('xss')</script>Hello World";
        $clean = $this->sanitizer->cleanPlainText($dirty);
        $this->assertEquals("Hello World", $clean);

        $dirtyImg = "Text <img src=x onerror=alert(1)> here";
        $cleanImg = $this->sanitizer->cleanPlainText($dirtyImg);
        $this->assertEquals("Text  here", $cleanImg);

        $dirtyJs = "Visit javascript:alert(document.cookie)";
        $cleanJs = $this->sanitizer->cleanPlainText($dirtyJs);
        $this->assertStringNotContainsString("javascript:", $cleanJs);
    }

    /**
     * Test cleanPlainText strips null bytes and normalizes UTF-8.
     */
    public function test_plain_text_normalizes_utf8_and_removes_null_bytes(): void
    {
        $withNull = "Hello\0World\x00";
        $clean = $this->sanitizer->cleanPlainText($withNull);
        $this->assertEquals("HelloWorld", $clean);

        // Arabic text integrity preserved
        $arabic = "تصميم هوية بصرية فاخرة لمحمد ماهر";
        $cleanArabic = $this->sanitizer->cleanPlainText($arabic);
        $this->assertEquals($arabic, $cleanArabic);
    }

    /**
     * Test cleanHtml allows safe tags while stripping dangerous elements and attributes.
     */
    public function test_rich_text_html_sanitizer_permits_safe_formatting_and_neutralizes_xss(): void
    {
        $payload = '<p>This is <strong>bold</strong> and <em>italic</em>.</p><script>evil()</script><iframe src="evil.com"></iframe>';
        $cleaned = $this->sanitizer->cleanHtml($payload);

        $this->assertStringContainsString('<p>', $cleaned);
        $this->assertStringContainsString('<strong>bold</strong>', $cleaned);
        $this->assertStringContainsString('<em>italic</em>', $cleaned);
        $this->assertStringNotContainsString('<script>', $cleaned);
        $this->assertStringNotContainsString('<iframe>', $cleaned);
        $this->assertStringNotContainsString('evil()', $cleaned);

        // Inline event handler
        $onerror = '<img src="https://res.cloudinary.com/demo/image/upload/v1/pic.jpg" onerror="alert(document.domain)">';
        $cleanedImg = $this->sanitizer->cleanHtml($onerror);
        $this->assertStringNotContainsString('onerror', $cleanedImg);
        $this->assertStringNotContainsString('alert', $cleanedImg);

        // javascript: in href
        $link = '<a href="javascript:alert(1)">Click here</a>';
        $cleanedLink = $this->sanitizer->cleanHtml($link);
        $this->assertStringNotContainsString('javascript:', $cleanedLink);
    }

    /**
     * Test recursive array sanitization on page builder / block structure.
     */
    public function test_recursive_array_sanitizer_sanitizes_nested_layout_blocks(): void
    {
        $blocks = [
            [
                'type' => 'text',
                'data' => [
                    'title' => 'Project Heading <script>alert(1)</script>',
                    'body' => '<p>Valid body</p><img src="x" onerror="steal()"/>',
                ],
            ],
            [
                'type' => 'gallery',
                'data' => [
                    'caption' => 'Safe caption <iframe src="evil.html"></iframe>',
                ],
            ],
        ];

        $sanitized = $this->sanitizer->sanitizeArray($blocks, ['body']);

        $this->assertEquals('Project Heading', $sanitized[0]['data']['title']);
        $this->assertStringNotContainsString('onerror', $sanitized[0]['data']['body']);
        $this->assertStringNotContainsString('steal()', $sanitized[0]['data']['body']);
        $this->assertStringNotContainsString('<iframe>', $sanitized[1]['data']['caption']);
        $this->assertEquals('Safe caption', $sanitized[1]['data']['caption']);
    }

    /**
     * Test contact inquiry endpoint sanitizes all inputs against XSS before storage.
     */
    public function test_contact_inquiry_endpoint_sanitizes_xss_inputs(): void
    {
        $inquiryData = [
            'name' => '<script>alert("attacker")</script>Ahmed',
            'email' => 'ahmed@example.com',
            'subject' => 'Inquiry <img src=x onerror=alert(1)>',
            'message' => 'Hello <a href="javascript:alert(1)">click me</a>, please contact me about branding.',
            '_timestamp' => time() - 5,
        ];

        $response = $this->postJson('/api/v1/contact', $inquiryData);
        $response->assertStatus(201);

        $this->assertDatabaseHas('inquiries', [
            'name' => 'Ahmed',
            'subject' => 'Inquiry',
        ]);

        $storedInquiry = \App\Models\Inquiry::where('email', 'ahmed@example.com')->first();
        $this->assertNotNull($storedInquiry);
        $this->assertStringNotContainsString('<script>', $storedInquiry->name);
        $this->assertStringNotContainsString('onerror', $storedInquiry->subject);
        $this->assertStringNotContainsString('javascript:', $storedInquiry->message);
    }
}
