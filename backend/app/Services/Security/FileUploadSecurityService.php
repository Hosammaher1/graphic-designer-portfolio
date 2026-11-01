<?php

namespace App\Services\Security;

use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;

class FileUploadSecurityService
{
    /**
     * Extensions strictly disallowed anywhere in the filename.
     */
    protected const BLOCKED_EXTENSIONS = [
        'php', 'phtml', 'php3', 'php4', 'php5', 'phps', 'phar', 'inc',
        'exe', 'sh', 'bat', 'cmd', 'cgi', 'pl', 'py', 'js', 'vbs',
        'htaccess', 'bin', 'dll', 'com', 'msi', 'scr', 'app',
    ];

    /**
     * Permitted media extensions.
     */
    protected const ALLOWED_EXTENSIONS = [
        'jpg', 'jpeg', 'png', 'webp', 'avif', 'svg', 'pdf',
    ];

    /**
     * Permitted MIME types verified via fileinfo magic bytes.
     */
    protected const ALLOWED_MIME_TYPES = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/avif',
        'image/svg+xml',
        'application/pdf',
        'text/xml',      // Fallback for some SVG fileinfo signatures
        'image/svg',
    ];

    /**
     * Maximum file size in bytes (15 MB).
     */
    protected const MAX_FILE_BYTES = 15728640;

    /**
     * Perform exhaustive multi-layer security validation on an uploaded file.
     *
     * @param UploadedFile $file
     * @throws ValidationException
     */
    public function validateFile(UploadedFile $file): void
    {
        // 1. File size enforcement
        if ($file->getSize() > self::MAX_FILE_BYTES) {
            throw ValidationException::withMessages([
                'file' => ['The uploaded file exceeds the 15MB size limit.'],
            ]);
        }

        // 2. Extension check & double-extension / polyglot name detection
        $originalName = strtolower($file->getClientOriginalName());
        $parts = explode('.', $originalName);

        // Check if any segment is a blocked executable extension
        foreach ($parts as $part) {
            if (in_array(trim($part), self::BLOCKED_EXTENSIONS, true)) {
                throw ValidationException::withMessages([
                    'file' => ['Executable or dangerous file extension detected.'],
                ]);
            }
        }

        $extension = strtolower($file->getClientOriginalExtension() ?: pathinfo($originalName, PATHINFO_EXTENSION));
        if (!in_array($extension, self::ALLOWED_EXTENSIONS, true)) {
            throw ValidationException::withMessages([
                'file' => ["Disallowed file extension [.{$extension}]."],
            ]);
        }

        // 3. Polyglot payload detection: inspect file bytes for PHP / script tags
        $filePath = $file->getRealPath() ?: $file->getPathname();
        $content = '';
        if ($filePath && file_exists($filePath)) {
            $content = (string) @file_get_contents($filePath, false, null, 0, min(65536, (int) @filesize($filePath)));
        }
        if (preg_match('/(<\?php|<\?=|<script\s+language=["\']php["\'])/i', $content)) {
            throw ValidationException::withMessages([
                'file' => ['Malicious executable script content detected in image payload.'],
            ]);
        }

        // 4. XXE (XML External Entity) & malicious XML payload rejection
        if ($extension === 'svg' || in_array($extension, ['xml', 'svgz'], true) || stripos($content, '<svg') !== false || stripos($content, '<?xml') !== false) {
            if (preg_match('/(<!ENTITY\b|<!DOCTYPE\b[^>]*\[|SYSTEM\s+["\']|PUBLIC\s+["\']|<script\b|<foreignObject\b)/i', $content)) {
                throw ValidationException::withMessages([
                    'file' => ['Malicious XML External Entity (XXE) or script payload detected.'],
                ]);
            }
        }

        // 4. Deep MIME type verification via fileinfo magic bytes
        $mime = null;
        if ($filePath && file_exists($filePath) && function_exists('finfo_open')) {
            try {
                $finfo = @finfo_open(FILEINFO_MIME_TYPE);
                if ($finfo) {
                    $detected = @finfo_file($finfo, $filePath);
                    if ($detected && is_string($detected)) {
                        $mime = $detected;
                    }
                    @finfo_close($finfo);
                }
            } catch (\Throwable $e) {
                // Fallback to client/Symfony guesser
            }
        }

        if (!$mime) {
            try {
                $mime = @$file->getMimeType();
            } catch (\Throwable $e) {
                $mime = $file->getClientMimeType();
            }
        }

        if (!$mime) {
            $mime = $file->getClientMimeType();
        }

        if (!in_array($mime, self::ALLOWED_MIME_TYPES, true)) {
            throw ValidationException::withMessages([
                'file' => ["Disallowed MIME type [{$mime}]."],
            ]);
        }
    }

    /**
     * Sanitize SVG content against XML External Entity (XXE) and Cross-Site Scripting (XSS).
     *
     * @param string $svgContent
     * @return string
     */
    public function sanitizeSvg(string $svgContent): string
    {
        // 1. Strip XML entity declarations and external DTDs (XXE protection)
        $svgContent = preg_replace('/<!ENTITY\b[^>]*>/is', '', $svgContent);
        $svgContent = preg_replace('/<!DOCTYPE\b[^>]*>/is', '', $svgContent);
        $svgContent = preg_replace('/SYSTEM\s+["\'][^"\']*["\']/is', '', $svgContent);
        $svgContent = preg_replace('/PUBLIC\s+["\'][^"\']*["\']/is', '', $svgContent);

        // 2. Strip executable <script> tags
        $svgContent = preg_replace('/<script\b[^>]*>(.*?)<\/script>/is', '', $svgContent);

        // 3. Strip dangerous SVG containers
        $svgContent = preg_replace('/<foreignObject\b[^>]*>(.*?)<\/foreignObject>/is', '', $svgContent);

        // 4. Strip inline event handlers (e.g. onload=, onclick=, onerror=)
        $svgContent = preg_replace('/\s+on[a-zA-Z]+\s*=\s*(["\'][^"\']*["\']|[^\s>]+)/is', '', $svgContent);

        // 5. Neutralize dangerous URIs in href and xlink:href
        $svgContent = preg_replace('/\s*(href|xlink:href)\s*=\s*(["\'])\s*(javascript|data):.*?\2/is', ' $1="#"', $svgContent);

        return trim($svgContent);
    }

    /**
     * Generate signed upload parameters for Cloudinary or secure cloud storage.
     *
     * @param array $params
     * @param string|null $apiSecret
     * @return array
     */
    public function generateSignedPresetParams(array $params = [], ?string $apiSecret = null): array
    {
        $secret = $apiSecret ?: config('services.cloudinary.api_secret', env('CLOUDINARY_API_SECRET', 'test_secret'));
        $params['timestamp'] = $params['timestamp'] ?? time();

        // Sort parameters alphabetically by key
        ksort($params);

        $toSign = [];
        foreach ($params as $key => $value) {
            if ($key !== 'file' && $key !== 'api_key' && $key !== 'signature') {
                $toSign[] = "{$key}={$value}";
            }
        }

        $signatureString = implode('&', $toSign) . $secret;
        $params['signature'] = sha1($signatureString);

        return $params;
    }

    /**
     * Sign direct Cloudinary upload and attach the public API key.
     *
     * @param array $params
     * @param string|null $apiSecret
     * @return array
     */
    public function signUpload(array $params = [], ?string $apiSecret = null): array
    {
        $signed = $this->generateSignedPresetParams($params, $apiSecret);
        $signed['api_key'] = (string) (config('services.cloudinary.api_key') ?? env('CLOUDINARY_API_KEY', 'test_key'));

        return $signed;
    }
}
