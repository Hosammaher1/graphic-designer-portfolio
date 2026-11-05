<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\Security\FileUploadSecurityService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class FileUploadSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected FileUploadSecurityService $securityService;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('media_test');
        $this->admin = User::factory()->create(['is_admin' => true]);
        $this->securityService = new FileUploadSecurityService();
    }

    /**
     * Test executable and dangerous extensions are rejected.
     */
    public function test_rejects_executable_and_script_extensions(): void
    {
        $this->actingAs($this->admin, 'sanctum');

        $dangerousFiles = [
            UploadedFile::fake()->create('shell.php', 100, 'text/x-php'),
            UploadedFile::fake()->create('script.phtml', 100, 'application/x-httpd-php'),
            UploadedFile::fake()->create('exploit.exe', 100, 'application/x-msdownload'),
            UploadedFile::fake()->create('malware.sh', 100, 'application/x-sh'),
        ];

        foreach ($dangerousFiles as $file) {
            $response = $this->postJson('/api/v1/admin/media/upload', [
                'file' => $file,
            ]);

            $response->assertStatus(422);
        }
    }

    /**
     * Test double extensions and disguised PHP files are rejected.
     */
    public function test_rejects_double_extension_polyglot_attempts(): void
    {
        $this->actingAs($this->admin, 'sanctum');

        // Disguised double extension
        $file = UploadedFile::fake()->create('avatar.php.jpg', 100, 'image/jpeg');
        $response = $this->postJson('/api/v1/admin/media/upload', [
            'file' => $file,
        ]);
        $response->assertStatus(422);

        // JPG containing PHP tags (Polyglot)
        $polyglotContent = "\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00" . "<?php echo 'malicious_polyglot_marker'; ?>";
        $tempPath = tempnam(sys_get_temp_dir(), 'poly_');
        file_put_contents($tempPath, $polyglotContent);
        $polyglotFile = new UploadedFile($tempPath, 'polyglot.jpg', 'image/jpeg', null, true);

        $responsePoly = $this->postJson('/api/v1/admin/media/upload', [
            'file' => $polyglotFile,
        ]);
        $responsePoly->assertStatus(422);
    }

    /**
     * Test SVG sanitization strips XSS scripts, event handlers, and XXE declarations.
     */
    public function test_svg_sanitization_strips_scripts_event_handlers_and_xxe(): void
    {
        $maliciousSvg = <<<SVG
<?xml version="1.0" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd" [
<!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <script type="text/javascript">alert("XSS");</script>
  <circle cx="50" cy="50" r="40" stroke="green" stroke-width="4" fill="yellow" onload="alert(1)" onclick="steal()" />
  <a href="javascript:alert(document.cookie)"><text x="10" y="20">&xxe;</text></a>
</svg>
SVG;

        $cleanSvg = $this->securityService->sanitizeSvg($maliciousSvg);

        $this->assertStringNotContainsString('<script', $cleanSvg);
        $this->assertStringNotContainsString('alert(', $cleanSvg);
        $this->assertStringNotContainsString('onload=', $cleanSvg);
        $this->assertStringNotContainsString('onclick=', $cleanSvg);
        $this->assertStringNotContainsString('javascript:', $cleanSvg);
        $this->assertStringNotContainsString('<!ENTITY', $cleanSvg);
        $this->assertStringNotContainsString('SYSTEM', $cleanSvg);
        $this->assertStringContainsString('<circle', $cleanSvg);
        $this->assertStringContainsString('stroke="green"', $cleanSvg);
    }

    /**
     * Test Cloudinary signed upload parameters generation.
     */
    public function test_generates_valid_cloudinary_signed_upload_parameters(): void
    {
        $params = $this->securityService->generateSignedPresetParams([
            'folder' => 'portfolio/projects',
            'public_id' => 'custom-id',
        ], 'mock_secret_key');

        $this->assertArrayHasKey('timestamp', $params);
        $this->assertArrayHasKey('signature', $params);
        $this->assertArrayHasKey('folder', $params);
        $this->assertEquals('portfolio/projects', $params['folder']);
        $this->assertNotEmpty($params['signature']);
    }

    /**
     * Test admin endpoint for signing direct uploads.
     */
    public function test_admin_can_request_signed_upload_parameters_endpoint(): void
    {
        $this->actingAs($this->admin, 'sanctum');

        $response = $this->postJson('/api/v1/admin/media/sign', [
            'folder' => 'projects/branding',
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'status',
            'data' => [
                'timestamp',
                'signature',
                'folder',
                'api_key',
            ],
        ]);
        $response->assertJsonPath('data.folder', 'projects/branding');
    }

    /**
     * Test valid, legitimate image uploads succeed.
     */
    public function test_legitimate_image_upload_passes_security_checks(): void
    {
        $this->actingAs($this->admin, 'sanctum');

        $rawPng = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
        $tempPath = tempnam(sys_get_temp_dir(), 'valid_');
        file_put_contents($tempPath, $rawPng);
        $validFile = new UploadedFile($tempPath, 'branding-identity.png', 'image/png', null, true);

        $response = $this->postJson('/api/v1/admin/media/upload', [
            'file' => $validFile,
        ]);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'status',
            'data' => [
                'asset' => [
                    'id',
                    'file_name',
                    'original_url',
                ],
            ],
        ]);
    }

    public function test_rejects_image_with_dimensions_above_safe_limit(): void
    {
        $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
        $widePng = substr_replace($png, pack('N', 32769), 16, 4);
        $path = tempnam(sys_get_temp_dir(), 'wide_png_');
        file_put_contents($path, $widePng);
        $this->assertSame(32769, getimagesize($path)[0]);

        $file = new UploadedFile($path, 'wide.png', 'image/png', null, true);

        $this->expectException(ValidationException::class);
        $this->securityService->validateFile($file);
    }

    public function test_rejects_image_whose_extension_disagrees_with_detected_type(): void
    {
        $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
        $path = tempnam(sys_get_temp_dir(), 'wrong_ext_');
        file_put_contents($path, $png);
        $file = new UploadedFile($path, 'photo.jpg', 'image/jpeg', null, true);

        $this->expectException(ValidationException::class);
        $this->securityService->validateFile($file);
    }

    public function test_rejects_pdf_from_image_only_upload(): void
    {
        $path = tempnam(sys_get_temp_dir(), 'pdf_upload_');
        file_put_contents($path, "%PDF-1.4\n1 0 obj <</Type/Catalog>> endobj\n%%EOF\n");
        $file = new UploadedFile($path, 'portfolio.pdf', 'application/pdf', null, true);

        $this->expectException(ValidationException::class);
        $this->securityService->validateFile($file);
    }
}
