<?php

namespace App\Services\Security;

class InputSanitizer
{
    /**
     * Allowed HTML tags for rich text / page builder content.
     */
    protected const ALLOWED_HTML_TAGS = '<p><a><b><strong><i><em><u><s><strike><h1><h2><h3><h4><h5><h6><ul><ol><li><blockquote><br><hr><img><div><span><pre><code>';

    /**
     * Normalize UTF-8 encoding and strip null bytes and invalid control sequences.
     */
    public function normalizeUtf8(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        // 1. Remove null bytes and invisible control characters (preserve tab \t, newline \n, return \r)
        $value = str_replace(["\0", "\x00"], '', $value);
        $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value);

        // 2. Normalize UTF-8 encoding
        if (!mb_check_encoding($value, 'UTF-8')) {
            $value = mb_convert_encoding($value, 'UTF-8', 'UTF-8');
        }

        return $value;
    }

    /**
     * Sanitize plain text input: strip all HTML/script tags and dangerous URIs.
     */
    public function cleanPlainText(?string $value): ?string
    {
        $value = $this->normalizeUtf8($value);
        if ($value === null || $value === '') {
            return $value;
        }

        // 1. Strip script, iframe, and style tag blocks including inner content
        $value = preg_replace('/<script\b[^>]*>(.*?)<\/script>/is', '', $value);
        $value = preg_replace('/<iframe\b[^>]*>(.*?)<\/iframe>/is', '', $value);
        $value = preg_replace('/<style\b[^>]*>(.*?)<\/style>/is', '', $value);

        // 2. Strip any remaining HTML tags
        $value = strip_tags($value);

        // 3. Neutralize dangerous pseudo-protocols
        $value = preg_replace('/(javascript|vbscript|data):/i', '', $value);

        return trim($value);
    }

    /**
     * Sanitize rich text / HTML content: retain safe formatting tags while neutralizing XSS vectors.
     */
    public function cleanHtml(?string $value): ?string
    {
        $value = $this->normalizeUtf8($value);
        if ($value === null || $value === '') {
            return $value;
        }

        // 1. Strip dangerous tag blocks with their content
        $value = preg_replace('/<script\b[^>]*>(.*?)<\/script>/is', '', $value);
        $value = preg_replace('/<iframe\b[^>]*>(.*?)<\/iframe>/is', '', $value);
        $value = preg_replace('/<style\b[^>]*>(.*?)<\/style>/is', '', $value);
        $value = preg_replace('/<object\b[^>]*>(.*?)<\/object>/is', '', $value);
        $value = preg_replace('/<embed\b[^>]*>(.*?)<\/embed>/is', '', $value);
        $value = preg_replace('/<applet\b[^>]*>(.*?)<\/applet>/is', '', $value);

        // 2. Remove inline event handlers (e.g. onload=, onerror=, onclick=)
        $value = preg_replace('/\s+on[a-zA-Z]+\s*=\s*(["\'][^"\']*["\']|[^\s>]+)/is', '', $value);

        // 3. Neutralize javascript: or vbscript: in attributes
        $value = preg_replace('/\s*(href|src|action)\s*=\s*(["\'])\s*(javascript|vbscript|data):.*?\2/is', ' $1="#"', $value);
        $value = preg_replace('/\s*(href|src|action)\s*=\s*(javascript|vbscript|data):[^\s>]+/is', ' $1="#"', $value);

        // 4. Strip tags outside the allowed whitelist
        $value = strip_tags($value, self::ALLOWED_HTML_TAGS);

        return trim($value);
    }

    /**
     * Recursively sanitize an associative array or nested block collection.
     *
     * @param array $data
     * @param array $htmlFields Keys that are allowed to contain safe HTML formatting
     * @return array
     */
    public function sanitizeArray(array $data, array $htmlFields = []): array
    {
        $sanitized = [];

        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $sanitized[$key] = $this->sanitizeArray($value, $htmlFields);
            } elseif (is_string($value)) {
                if (in_array($key, $htmlFields, true)) {
                    $sanitized[$key] = $this->cleanHtml($value);
                } else {
                    $sanitized[$key] = $this->cleanPlainText($value);
                }
            } else {
                $sanitized[$key] = $value;
            }
        }

        return $sanitized;
    }
}
