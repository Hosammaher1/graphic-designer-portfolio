<?php

namespace App\Services\PageBuilder;

class BlockSchema
{
    public const CURRENT_VERSION = 1;

    public const SUPPORTED_TYPES = [
        'hero',
        'text',
        'heading',
        'image',
        'gallery',
        'columns',
        'spacer',
        'cta',
        'stats',
        'services',
        'category_preview',
        'featured_work',
    ];

    public const ALLOWED_TOP_LEVEL_KEYS = [
        'id',
        'type',
        'version',
        'data',
        'settings',
    ];

    /**
     * Validate a single block against the schema.
     *
     * @param mixed $block
     * @return array{valid: bool, errors: string[]}
     */
    public function validateBlock(mixed $block): array
    {
        $errors = [];

        if (!is_array($block)) {
            return ['valid' => false, 'errors' => ['Block must be an object/associative array.']];
        }

        // 1. Top level allowed keys
        foreach (array_keys($block) as $key) {
            if (!in_array($key, self::ALLOWED_TOP_LEVEL_KEYS, true)) {
                $errors[] = "Disallowed attribute '{$key}' at block top level.";
            }
        }

        // 2. Required top level fields
        foreach (['id', 'type', 'version', 'data'] as $req) {
            if (!array_key_exists($req, $block)) {
                $errors[] = "Missing required block attribute '{$req}'.";
            }
        }

        if (!empty($errors)) {
            return ['valid' => false, 'errors' => $errors];
        }

        // 3. ID and Type validation
        if (!is_string($block['id']) || trim($block['id']) === '') {
            $errors[] = 'Block ID must be a non-empty string.';
        }

        if (!in_array($block['type'], self::SUPPORTED_TYPES, true)) {
            $errors[] = "Unknown or unsupported block type '{$block['type']}'.";
            return ['valid' => false, 'errors' => $errors];
        }

        // 4. Version check
        if ($block['version'] !== self::CURRENT_VERSION) {
            $errors[] = "Unsupported schema version '{$block['version']}'. Expected version " . self::CURRENT_VERSION . '.';
            return ['valid' => false, 'errors' => $errors];
        }

        // 5. Data payload check
        if (!is_array($block['data'])) {
            $errors[] = "Block 'data' property must be an object/array.";
            return ['valid' => false, 'errors' => $errors];
        }

        // 6. Security & XSS payload checks across all data fields
        $this->checkSecurityPayloads($block['data'], $errors);
        if (!empty($errors)) {
            return ['valid' => false, 'errors' => $errors];
        }

        // 7. Block-specific schema validations
        $this->validateBlockData($block['type'], $block['data'], $errors);

        return [
            'valid' => empty($errors),
            'errors' => $errors,
        ];
    }

    /**
     * Deep inspection for script tags, dangerous HTML, and unsafe URL protocols.
     */
    protected function checkSecurityPayloads(mixed $value, array &$errors, string $path = 'data'): void
    {
        if (is_string($value)) {
            // Check for dangerous HTML / script tags
            if (preg_match('/<\s*(script|iframe|object|embed|applet|meta|link)/i', $value) ||
                preg_match('/(on\w+\s*=)/i', $value)) {
                $errors[] = "Unsafe HTML or script detected at '{$path}'.";
            }

            // Check for unsafe URL schemes if string looks like or is a url
            if (preg_match('/^\s*(javascript|vbscript|data):/i', $value)) {
                $errors[] = "Unsafe URL protocol detected at '{$path}'.";
            }
        } elseif (is_array($value)) {
            foreach ($value as $k => $v) {
                $this->checkSecurityPayloads($v, $errors, "{$path}.{$k}");
            }
        }
    }

    /**
     * Block-specific data validators.
     */
    protected function validateBlockData(string $type, array $data, array &$errors): void
    {
        switch ($type) {
            case 'hero':
                if (isset($data['align']) && !in_array($data['align'], ['left', 'center', 'right'], true)) {
                    $errors[] = "Hero align must be 'left', 'center', or 'right'.";
                }
                break;

            case 'text':
                if (isset($data['align']) && !in_array($data['align'], ['left', 'center', 'right', 'justify'], true)) {
                    $errors[] = "Text align must be 'left', 'center', 'right', or 'justify'.";
                }
                if (isset($data['max_width']) && !in_array($data['max_width'], ['prose', 'full', 'narrow'], true)) {
                    $errors[] = "Text max_width must be 'prose', 'full', or 'narrow'.";
                }
                break;

            case 'heading':
                if (!isset($data['level']) || !in_array($data['level'], ['h1', 'h2', 'h3', 'h4'], true)) {
                    $errors[] = "Heading level must be one of 'h1', 'h2', 'h3', 'h4'.";
                }
                if (isset($data['align']) && !in_array($data['align'], ['left', 'center', 'right'], true)) {
                    $errors[] = "Heading align must be 'left', 'center', or 'right'.";
                }
                break;

            case 'image':
                if (isset($data['aspect_ratio']) && !in_array($data['aspect_ratio'], ['16:9', '4:3', '1:1', '3:2', 'auto'], true)) {
                    $errors[] = "Image aspect_ratio must be one of '16:9', '4:3', '1:1', '3:2', 'auto'.";
                }
                break;

            case 'gallery':
                if (isset($data['columns']) && !in_array($data['columns'], [1, 2, 3, 4], true)) {
                    $errors[] = 'Gallery columns must be 1, 2, 3, or 4.';
                }
                if (isset($data['gap']) && !in_array($data['gap'], ['sm', 'md', 'lg'], true)) {
                    $errors[] = "Gallery gap must be 'sm', 'md', or 'lg'.";
                }
                if (isset($data['items']) && !is_array($data['items'])) {
                    $errors[] = 'Gallery items must be an array.';
                }
                break;

            case 'columns':
                if (isset($data['gap']) && !in_array($data['gap'], ['sm', 'md', 'lg'], true)) {
                    $errors[] = "Columns gap must be 'sm', 'md', or 'lg'.";
                }
                if (!isset($data['columns']) || !is_array($data['columns'])) {
                    $errors[] = 'Columns block must contain a nested columns array.';
                } else {
                    foreach ($data['columns'] as $colIndex => $colBlocks) {
                        if (!is_array($colBlocks)) {
                            $errors[] = "Column at index {$colIndex} must be an array of blocks.";
                            continue;
                        }
                        foreach ($colBlocks as $innerBlock) {
                            $innerResult = $this->validateBlock($innerBlock);
                            if (!$innerResult['valid']) {
                                foreach ($innerResult['errors'] as $innerError) {
                                    $errors[] = "Column {$colIndex}: {$innerError}";
                                }
                            }
                        }
                    }
                }
                break;

            case 'spacer':
                if (!isset($data['size']) || !in_array($data['size'], ['xs', 'sm', 'md', 'lg', 'xl'], true)) {
                    $errors[] = "Spacer size must be one of 'xs', 'sm', 'md', 'lg', 'xl'.";
                }
                break;

            case 'cta':
                if (isset($data['button_variant']) && !in_array($data['button_variant'], ['primary', 'secondary', 'outline', 'ghost'], true)) {
                    $errors[] = "CTA button_variant must be 'primary', 'secondary', 'outline', or 'ghost'.";
                }
                if (isset($data['align']) && !in_array($data['align'], ['left', 'center', 'right'], true)) {
                    $errors[] = "CTA align must be 'left', 'center', or 'right'.";
                }
                break;

            case 'stats':
                if (isset($data['items']) && !is_array($data['items'])) {
                    $errors[] = 'Stats items must be an array.';
                }
                break;

            case 'services':
                if (isset($data['items']) && !is_array($data['items'])) {
                    $errors[] = 'Services items must be an array.';
                }
                break;

            case 'category_preview':
                if (isset($data['limit']) && (!is_int($data['limit']) || $data['limit'] < 1 || $data['limit'] > 24)) {
                    $errors[] = 'Category preview limit must be an integer between 1 and 24.';
                }
                break;

            case 'featured_work':
                if (isset($data['limit']) && (!is_int($data['limit']) || $data['limit'] < 1 || $data['limit'] > 24)) {
                    $errors[] = 'Featured work limit must be an integer between 1 and 24.';
                }
                break;
        }
    }
}
