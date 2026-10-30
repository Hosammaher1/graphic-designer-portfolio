<?php

namespace Tests\Unit\PageBuilder;

use Tests\TestCase;
use App\Services\PageBuilder\ServerBlockValidator;

class ServerBlockValidatorTest extends TestCase
{
    protected ServerBlockValidator $validator;

    protected function setUp(): void
    {
        parent::setUp();
        $this->validator = new ServerBlockValidator();
    }

    public function test_it_accepts_blocks_with_allowlisted_tokens_and_styles(): void
    {
        $blocks = [
            [
                'id' => 'hero-1',
                'type' => 'hero',
                'version' => 1,
                'data' => [
                    'title' => 'Minimal Brand Identity',
                    'subtitle' => 'Modern aesthetics and Arabic typography',
                    'badge' => 'Brand Strategy',
                    'align' => 'center',
                ],
                'settings' => [
                    'spacing' => [
                        'padding_top' => 'lg',
                        'padding_bottom' => 'xl',
                    ],
                    'color_theme' => 'surface',
                    'animation' => [
                        'preset' => 'fade-in',
                        'duration' => '300ms',
                        'delay' => '100ms',
                    ],
                ],
            ],
        ];

        $result = $this->validator->validateDocument($blocks);
        $this->assertTrue($result['valid']);
        $this->assertEmpty($result['errors']);
    }

    public function test_it_rejects_unapproved_styles_and_arbitrary_css(): void
    {
        $blocks = [
            [
                'id' => 'txt-bad',
                'type' => 'text',
                'version' => 1,
                'data' => [
                    'body' => 'Sample text',
                ],
                'settings' => [
                    'custom_css' => 'position: fixed; top: 0; left: 0; z-index: 999999;',
                ],
            ],
        ];

        $result = $this->validator->validateDocument($blocks);
        $this->assertFalse($result['valid']);
        $this->assertStringContainsString('Disallowed style property or arbitrary CSS', $result['errors'][0]);
    }

    public function test_it_rejects_unapproved_animation_tokens(): void
    {
        $blocks = [
            [
                'id' => 'anim-bad',
                'type' => 'heading',
                'version' => 1,
                'data' => [
                    'text' => 'Heading Title',
                    'level' => 'h2',
                ],
                'settings' => [
                    'animation' => [
                        'preset' => 'hyper-spin-rotate-infinite',
                        'duration' => '99999ms',
                    ],
                ],
            ],
        ];

        $result = $this->validator->validateDocument($blocks);
        $this->assertFalse($result['valid']);
        $this->assertStringContainsString('Invalid animation preset', $result['errors'][0]);
    }

    public function test_it_rejects_unapproved_colors_and_css_functions(): void
    {
        $blocks = [
            [
                'id' => 'color-bad',
                'type' => 'cta',
                'version' => 1,
                'data' => [
                    'title' => 'Click Here',
                ],
                'settings' => [
                    'background_color' => 'expression(alert(1))',
                ],
            ],
        ];

        $result = $this->validator->validateDocument($blocks);
        $this->assertFalse($result['valid']);
        $this->assertStringContainsString('Invalid color or unsafe CSS function', $result['errors'][0]);
    }

    public function test_it_rejects_nesting_beyond_maximum_depth(): void
    {
        // Max nesting depth is 3. Creating level 4 nesting:
        $deeplyNested = [
            'id' => 'col-lvl1',
            'type' => 'columns',
            'version' => 1,
            'data' => [
                'columns' => [
                    [
                        [
                            'id' => 'col-lvl2',
                            'type' => 'columns',
                            'version' => 1,
                            'data' => [
                                'columns' => [
                                    [
                                        [
                                            'id' => 'col-lvl3',
                                            'type' => 'columns',
                                            'version' => 1,
                                            'data' => [
                                                'columns' => [
                                                    [
                                                        [
                                                            'id' => 'col-lvl4',
                                                            'type' => 'columns',
                                                            'version' => 1,
                                                            'data' => [
                                                                'columns' => [
                                                                    [
                                                                        [
                                                                            'id' => 'deep-leaf',
                                                                            'type' => 'text',
                                                                            'version' => 1,
                                                                            'data' => ['body' => 'Too deep'],
                                                                        ],
                                                                    ],
                                                                ],
                                                            ],
                                                        ],
                                                    ],
                                                ],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ];

        $result = $this->validator->validateDocument([$deeplyNested]);
        $this->assertFalse($result['valid']);
        $this->assertStringContainsString('exceeds maximum allowed depth', $result['errors'][0]);
    }

    public function test_it_rejects_documents_exceeding_maximum_block_count(): void
    {
        $blocks = [];
        for ($i = 0; $i < 105; $i++) {
            $blocks[] = [
                'id' => "spacer-{$i}",
                'type' => 'spacer',
                'version' => 1,
                'data' => ['size' => 'sm'],
            ];
        }

        $result = $this->validator->validateDocument($blocks);
        $this->assertFalse($result['valid']);
        $this->assertStringContainsString('exceeds limit of 100 blocks', $result['errors'][0]);
    }

    public function test_it_rejects_documents_exceeding_byte_size_limit(): void
    {
        // 512 KB payload limit
        $giantString = str_repeat('A', 600 * 1024);
        $blocks = [
            [
                'id' => 'huge-txt',
                'type' => 'text',
                'version' => 1,
                'data' => [
                    'body' => $giantString,
                ],
            ],
        ];

        $result = $this->validator->validateDocument($blocks);
        $this->assertFalse($result['valid']);
        $this->assertStringContainsString('Document size exceeds 512 KB limit', $result['errors'][0]);
    }

    public function test_it_rejects_xss_payloads_in_all_attributes(): void
    {
        $blocks = [
            [
                'id' => 'xss-img',
                'type' => 'image',
                'version' => 1,
                'data' => [
                    'url' => 'https://images.unsplash.com/test',
                    'alt' => 'test" onfocus="alert(document.domain)"',
                ],
            ],
        ];

        $result = $this->validator->validateDocument($blocks);
        $this->assertFalse($result['valid']);
        $this->assertStringContainsString('Unsafe HTML or script detected', $result['errors'][0]);
    }

    public function test_it_rejects_invalid_media_asset_or_category_reference(): void
    {
        $blocks = [
            [
                'id' => 'ref-bad',
                'type' => 'category_preview',
                'version' => 1,
                'data' => [
                    'category_slug' => 'invalid slug with spaces and !@#$%',
                ],
            ],
        ];

        $result = $this->validator->validateDocument($blocks);
        $this->assertFalse($result['valid']);
        $this->assertStringContainsString('Invalid category reference slug', $result['errors'][0]);
    }
}
