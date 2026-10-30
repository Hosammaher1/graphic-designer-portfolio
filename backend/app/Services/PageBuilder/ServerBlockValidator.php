<?php

namespace App\Services\PageBuilder;

class ServerBlockValidator
{
    public const MAX_NESTING_DEPTH = 3;
    public const MAX_BLOCKS_PER_DOCUMENT = 100;
    public const MAX_DOCUMENT_BYTES = 524288; // 512 KB

    public const ALLOWED_SETTINGS_KEYS = [
        'spacing',
        'color_theme',
        'background_color',
        'animation',
        'layout',
        'custom_classes',
    ];

    public const ALLOWED_SPACING_TOKENS = [
        'none',
        'xs',
        'sm',
        'md',
        'lg',
        'xl',
        '2xl',
    ];

    public const ALLOWED_COLOR_THEMES = [
        'base',
        'surface',
        'elevated',
        'muted',
        'primary',
        'secondary',
        'accent',
        'inherit',
    ];

    public const ALLOWED_ANIMATION_PRESETS = [
        'none',
        'fade-in',
        'slide-up',
        'scale-in',
    ];

    public const ALLOWED_ANIMATION_DURATIONS = [
        '0ms',
        '150ms',
        '200ms',
        '300ms',
        '400ms',
        '500ms',
    ];

    public const ALLOWED_ANIMATION_DELAYS = [
        '0ms',
        '50ms',
        '100ms',
        '150ms',
        '200ms',
        '300ms',
    ];

    protected BlockSchema $schema;

    public function __construct(?BlockSchema $schema = null)
    {
        $this->schema = $schema ?? new BlockSchema();
    }

    /**
     * Validate an entire document (array of blocks) against strict server constraints.
     *
     * @param mixed $document
     * @return array{valid: bool, errors: string[]}
     */
    public function validateDocument(mixed $document): array
    {
        $errors = [];

        if (!is_array($document)) {
            return ['valid' => false, 'errors' => ['Document must be an array of blocks.']];
        }

        // 1. Check byte size limit
        $encoded = json_encode($document);
        if ($encoded === false || strlen($encoded) > self::MAX_DOCUMENT_BYTES) {
            $errors[] = 'Document size exceeds 512 KB limit.';
            return ['valid' => false, 'errors' => $errors];
        }

        // 2. Count total blocks recursively
        $totalCount = 0;
        $this->countBlocksRecursive($document, $totalCount);
        if ($totalCount > self::MAX_BLOCKS_PER_DOCUMENT) {
            $errors[] = "Document contains {$totalCount} blocks which exceeds limit of 100 blocks.";
            return ['valid' => false, 'errors' => $errors];
        }

        // 3. Validate each block and its nested blocks
        foreach ($document as $index => $block) {
            $this->validateBlockRecursive($block, 1, "blocks[{$index}]", $errors);
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
        ];
    }

    /**
     * Recursively validate a single block and enforce depth limits.
     */
    protected function validateBlockRecursive(mixed $block, int $depth, string $path, array &$errors): void
    {
        if ($depth > self::MAX_NESTING_DEPTH) {
            $errors[] = "Block at '{$path}' exceeds maximum allowed depth of " . self::MAX_NESTING_DEPTH . '.';
            return;
        }

        // Base schema validation
        $schemaResult = $this->schema->validateBlock($block);
        if (!$schemaResult['valid']) {
            foreach ($schemaResult['errors'] as $err) {
                $errors[] = "{$path}: {$err}";
            }
            return;
        }

        // Settings and styling validation
        if (isset($block['settings'])) {
            $this->validateBlockSettings($block['settings'], "{$path}.settings", $errors);
        }

        // Reference validations (categories, media)
        $this->validateReferences($block, $path, $errors);

        // Nested column validation
        if ($block['type'] === 'columns' && isset($block['data']['columns']) && is_array($block['data']['columns'])) {
            foreach ($block['data']['columns'] as $colIdx => $colBlocks) {
                if (is_array($colBlocks)) {
                    foreach ($colBlocks as $innerIdx => $innerBlock) {
                        $this->validateBlockRecursive(
                            $innerBlock,
                            $depth + 1,
                            "{$path}.data.columns[{$colIdx}][{$innerIdx}]",
                            $errors
                        );
                    }
                }
            }
        }
    }

    /**
     * Validate settings against strict allowlists.
     */
    protected function validateBlockSettings(mixed $settings, string $path, array &$errors): void
    {
        if (!is_array($settings)) {
            $errors[] = "Settings at '{$path}' must be an object.";
            return;
        }

        foreach (array_keys($settings) as $key) {
            if ($key === 'custom_css' || $key === 'style') {
                $errors[] = "Disallowed style property or arbitrary CSS at '{$path}.{$key}'.";
                continue;
            }

            if (!in_array($key, self::ALLOWED_SETTINGS_KEYS, true)) {
                $errors[] = "Disallowed setting attribute '{$key}' at '{$path}'.";
            }
        }

        // Spacing validation
        if (isset($settings['spacing']) && is_array($settings['spacing'])) {
            foreach ($settings['spacing'] as $prop => $val) {
                if (!in_array($val, self::ALLOWED_SPACING_TOKENS, true)) {
                    $errors[] = "Invalid spacing token '{$val}' for '{$prop}' at '{$path}.spacing'.";
                }
            }
        }

        // Color theme validation
        if (isset($settings['color_theme'])) {
            if (!in_array($settings['color_theme'], self::ALLOWED_COLOR_THEMES, true)) {
                $errors[] = "Invalid color theme '{$settings['color_theme']}' at '{$path}'.";
            }
        }

        // Background color validation (strict allowlist or safe hex format)
        if (isset($settings['background_color'])) {
            $val = $settings['background_color'];
            if (!is_string($val) ||
                preg_match('/(expression|url|behavior|javascript)/i', $val) ||
                (!in_array($val, self::ALLOWED_COLOR_THEMES, true) && !preg_match('/^#(?:[0-9a-fA-F]{3}){1,2}$/', $val))) {
                $errors[] = "Invalid color or unsafe CSS function at '{$path}.background_color'.";
            }
        }

        // Animation validation
        if (isset($settings['animation']) && is_array($settings['animation'])) {
            $anim = $settings['animation'];
            if (isset($anim['preset']) && !in_array($anim['preset'], self::ALLOWED_ANIMATION_PRESETS, true)) {
                $errors[] = "Invalid animation preset '{$anim['preset']}' at '{$path}.animation'.";
            }
            if (isset($anim['duration']) && !in_array($anim['duration'], self::ALLOWED_ANIMATION_DURATIONS, true)) {
                $errors[] = "Invalid animation duration '{$anim['duration']}' at '{$path}.animation'.";
            }
            if (isset($anim['delay']) && !in_array($anim['delay'], self::ALLOWED_ANIMATION_DELAYS, true)) {
                $errors[] = "Invalid animation delay '{$anim['delay']}' at '{$path}.animation'.";
            }
        }
    }

    /**
     * Validate reference integrity (e.g. category slugs).
     */
    protected function validateReferences(array $block, string $path, array &$errors): void
    {
        if ($block['type'] === 'category_preview' && isset($block['data']['category_slug'])) {
            $slug = $block['data']['category_slug'];
            if (!is_string($slug) || !preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slug)) {
                $errors[] = "Invalid category reference slug '{$slug}' at '{$path}.data.category_slug'.";
            }
        }
    }

    /**
     * Count blocks recursively.
     */
    protected function countBlocksRecursive(array $blocks, int &$count): void
    {
        foreach ($blocks as $block) {
            $count++;
            if (isset($block['type']) && $block['type'] === 'columns' && isset($block['data']['columns']) && is_array($block['data']['columns'])) {
                foreach ($block['data']['columns'] as $col) {
                    if (is_array($col)) {
                        $this->countBlocksRecursive($col, $count);
                    }
                }
            }
        }
    }
}
