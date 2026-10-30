<?php

namespace Tests\Unit\PageBuilder;

use Tests\TestCase;
use App\Services\PageBuilder\BlockSchema;

class BlockSchemaTest extends TestCase
{
    protected BlockSchema $schema;

    protected function setUp(): void
    {
        parent::setUp();
        $this->schema = new BlockSchema();
    }

    public function test_it_recognizes_all_12_approved_block_types(): void
    {
        $expectedTypes = [
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

        $supported = BlockSchema::SUPPORTED_TYPES;
        sort($expectedTypes);
        sort($supported);

        $this->assertSame($expectedTypes, $supported);
    }

    public function test_it_accepts_valid_hero_block(): void
    {
        $block = [
            'id' => 'hero-1',
            'type' => 'hero',
            'version' => 1,
            'data' => [
                'title' => 'Intentional Visual Design',
                'subtitle' => 'Specializing in brand identity and typography',
                'badge' => 'Graphic Designer',
                'align' => 'center',
                'cta_primary' => [
                    'text' => 'View Work',
                    'url' => '/en/work',
                ],
                'cta_secondary' => [
                    'text' => 'Contact Me',
                    'url' => '/en/contact',
                ],
            ],
        ];

        $result = $this->schema->validateBlock($block);
        $this->assertTrue($result['valid']);
        $this->assertEmpty($result['errors']);
    }

    public function test_it_accepts_valid_heading_block(): void
    {
        $block = [
            'id' => 'h-1',
            'type' => 'heading',
            'version' => 1,
            'data' => [
                'text' => 'Design Philosophy',
                'level' => 'h2',
                'subtitle' => 'Principles shaping our craft',
                'align' => 'right',
            ],
        ];

        $result = $this->schema->validateBlock($block);
        $this->assertTrue($result['valid']);
    }

    public function test_it_accepts_valid_text_block(): void
    {
        $block = [
            'id' => 'txt-1',
            'type' => 'text',
            'version' => 1,
            'data' => [
                'body' => 'We craft visual identities tailored to contemporary culture.',
                'lead' => true,
                'align' => 'left',
                'max_width' => 'prose',
            ],
        ];

        $result = $this->schema->validateBlock($block);
        $this->assertTrue($result['valid']);
    }

    public function test_it_accepts_valid_image_block(): void
    {
        $block = [
            'id' => 'img-1',
            'type' => 'image',
            'version' => 1,
            'data' => [
                'url' => 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
                'alt' => 'Studio showcase preview',
                'caption' => 'Brand application showcase',
                'aspect_ratio' => '16:9',
                'rounded' => true,
            ],
        ];

        $result = $this->schema->validateBlock($block);
        $this->assertTrue($result['valid']);
    }

    public function test_it_accepts_valid_gallery_block(): void
    {
        $block = [
            'id' => 'gal-1',
            'type' => 'gallery',
            'version' => 1,
            'data' => [
                'columns' => 3,
                'gap' => 'md',
                'items' => [
                    [
                        'url' => 'https://images.unsplash.com/photo-1',
                        'alt' => 'Gallery item 1',
                        'caption' => 'Stationery',
                    ],
                    [
                        'url' => 'https://images.unsplash.com/photo-2',
                        'alt' => 'Gallery item 2',
                        'caption' => 'Packaging',
                    ],
                ],
            ],
        ];

        $result = $this->schema->validateBlock($block);
        $this->assertTrue($result['valid']);
    }

    public function test_it_accepts_valid_columns_block(): void
    {
        $block = [
            'id' => 'col-1',
            'type' => 'columns',
            'version' => 1,
            'data' => [
                'gap' => 'lg',
                'stack_on_mobile' => true,
                'columns' => [
                    [
                        [
                            'id' => 'inner-txt-1',
                            'type' => 'text',
                            'version' => 1,
                            'data' => [
                                'body' => 'Column 1 text content',
                                'lead' => false,
                                'align' => 'left',
                                'max_width' => 'full',
                            ],
                        ],
                    ],
                    [
                        [
                            'id' => 'inner-txt-2',
                            'type' => 'text',
                            'version' => 1,
                            'data' => [
                                'body' => 'Column 2 text content',
                                'lead' => false,
                                'align' => 'left',
                                'max_width' => 'full',
                            ],
                        ],
                    ],
                ],
            ],
        ];

        $result = $this->schema->validateBlock($block);
        $this->assertTrue($result['valid']);
    }

    public function test_it_accepts_valid_spacer_block(): void
    {
        $block = [
            'id' => 'sp-1',
            'type' => 'spacer',
            'version' => 1,
            'data' => [
                'size' => 'lg',
            ],
        ];

        $result = $this->schema->validateBlock($block);
        $this->assertTrue($result['valid']);
    }

    public function test_it_accepts_valid_cta_block(): void
    {
        $block = [
            'id' => 'cta-1',
            'type' => 'cta',
            'version' => 1,
            'data' => [
                'title' => 'Ready to build your next brand identity?',
                'subtitle' => 'Let us collaborate on meaningful design solutions.',
                'button_text' => 'Get in Touch',
                'button_url' => '/en/contact',
                'button_variant' => 'primary',
                'align' => 'center',
            ],
        ];

        $result = $this->schema->validateBlock($block);
        $this->assertTrue($result['valid']);
    }

    public function test_it_accepts_valid_stats_block(): void
    {
        $block = [
            'id' => 'st-1',
            'type' => 'stats',
            'version' => 1,
            'data' => [
                'items' => [
                    [
                        'value' => '40',
                        'prefix' => '+',
                        'suffix' => '',
                        'label' => 'Brand Identities',
                    ],
                    [
                        'value' => '8',
                        'prefix' => '',
                        'suffix' => ' Years',
                        'label' => 'Design Experience',
                    ],
                ],
            ],
        ];

        $result = $this->schema->validateBlock($block);
        $this->assertTrue($result['valid']);
    }

    public function test_it_accepts_valid_services_block(): void
    {
        $block = [
            'id' => 'srv-1',
            'type' => 'services',
            'version' => 1,
            'data' => [
                'items' => [
                    [
                        'title' => 'Brand Strategy & Identity',
                        'description' => 'Comprehensive visual system guidelines',
                        'icon' => 'Palette',
                    ],
                ],
            ],
        ];

        $result = $this->schema->validateBlock($block);
        $this->assertTrue($result['valid']);
    }

    public function test_it_accepts_valid_category_preview_and_featured_work_blocks(): void
    {
        $catBlock = [
            'id' => 'cp-1',
            'type' => 'category_preview',
            'version' => 1,
            'data' => [
                'category_slug' => 'branding',
                'title' => 'Branding Projects',
                'limit' => 4,
            ],
        ];
        $res1 = $this->schema->validateBlock($catBlock);
        $this->assertTrue($res1['valid']);

        $featBlock = [
            'id' => 'fw-1',
            'type' => 'featured_work',
            'version' => 1,
            'data' => [
                'title' => 'Featured Work',
                'limit' => 6,
                'show_view_all' => true,
            ],
        ];
        $res2 = $this->schema->validateBlock($featBlock);
        $this->assertTrue($res2['valid']);
    }

    public function test_it_rejects_missing_required_top_level_fields(): void
    {
        $badBlocks = [
            [],
            ['type' => 'hero', 'version' => 1, 'data' => []], // missing id
            ['id' => 'b1', 'version' => 1, 'data' => []], // missing type
            ['id' => 'b1', 'type' => 'hero', 'data' => []], // missing version
            ['id' => 'b1', 'type' => 'hero', 'version' => 1], // missing data
        ];

        foreach ($badBlocks as $b) {
            $result = $this->schema->validateBlock($b);
            $this->assertFalse($result['valid'], 'Expected block to be invalid due to missing required field');
            $this->assertNotEmpty($result['errors']);
        }
    }

    public function test_it_rejects_unknown_block_types(): void
    {
        $block = [
            'id' => 'bad-type',
            'type' => 'raw_iframe_embed',
            'version' => 1,
            'data' => [
                'html' => '<div>dangerous</div>',
            ],
        ];

        $result = $this->schema->validateBlock($block);
        $this->assertFalse($result['valid']);
        $this->assertStringContainsString('Unknown or unsupported block type', $result['errors'][0]);
    }

    public function test_it_rejects_unsupported_version(): void
    {
        $block = [
            'id' => 'v-999',
            'type' => 'spacer',
            'version' => 999,
            'data' => ['size' => 'md'],
        ];

        $result = $this->schema->validateBlock($block);
        $this->assertFalse($result['valid']);
        $this->assertStringContainsString('Unsupported schema version', $result['errors'][0]);
    }

    public function test_it_rejects_malformed_block_data(): void
    {
        // Spacer with invalid size
        $badSpacer = [
            'id' => 'sp-bad',
            'type' => 'spacer',
            'version' => 1,
            'data' => ['size' => 'massive-huge'],
        ];
        $res1 = $this->schema->validateBlock($badSpacer);
        $this->assertFalse($res1['valid']);

        // Heading with invalid level
        $badHeading = [
            'id' => 'h-bad',
            'type' => 'heading',
            'version' => 1,
            'data' => ['text' => 'Hello', 'level' => 'h9'],
        ];
        $res2 = $this->schema->validateBlock($badHeading);
        $this->assertFalse($res2['valid']);
    }

    public function test_it_rejects_unsafe_attributes_and_xss_payloads(): void
    {
        // Script tag injection in text
        $xssBlock = [
            'id' => 'xss-1',
            'type' => 'text',
            'version' => 1,
            'data' => [
                'body' => '<script>window.location="http://attacker.com"</script>',
                'lead' => false,
                'align' => 'left',
                'max_width' => 'prose',
            ],
        ];

        $res1 = $this->schema->validateBlock($xssBlock);
        $this->assertFalse($res1['valid']);
        $this->assertStringContainsString('Unsafe HTML or script detected', $res1['errors'][0]);

        // javascript: pseudo-protocol in cta url
        $jsUrlBlock = [
            'id' => 'cta-xss',
            'type' => 'cta',
            'version' => 1,
            'data' => [
                'title' => 'Click Here',
                'button_text' => 'Action',
                'button_url' => 'javascript:alert(document.cookie)',
                'button_variant' => 'primary',
                'align' => 'center',
            ],
        ];

        $res2 = $this->schema->validateBlock($jsUrlBlock);
        $this->assertFalse($res2['valid']);
        $this->assertStringContainsString('Unsafe URL protocol', $res2['errors'][0]);
    }

    public function test_it_rejects_unexpected_unsafe_top_level_keys(): void
    {
        $pollutedBlock = [
            'id' => 'p-1',
            'type' => 'spacer',
            'version' => 1,
            'data' => ['size' => 'md'],
            'dangerouslySetInnerHTML' => ['__html' => '<style>body{display:none}</style>'],
        ];

        $result = $this->schema->validateBlock($pollutedBlock);
        $this->assertFalse($result['valid']);
        $this->assertStringContainsString('Disallowed attribute', $result['errors'][0]);
    }
}
