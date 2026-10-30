/**
 * Page Builder Versioned JSON Schema & Validator — Task 05.01
 *
 * Defines and validates the 12 approved block types for page builder composition:
 * - hero
 * - text
 * - heading
 * - image
 * - gallery
 * - columns
 * - spacer
 * - cta
 * - stats
 * - services
 * - category_preview
 * - featured_work
 */

export const CURRENT_SCHEMA_VERSION = 1;

export const SUPPORTED_BLOCK_TYPES = [
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

export const PROJECT_RESTRICTED_BLOCK_TYPES = [
  'text',
  'image',
  'gallery',
  'columns',
  'spacer',
  'heading',
  'cta',
  'stats'
];

export const ALLOWED_TOP_LEVEL_KEYS = [
  'id',
  'type',
  'version',
  'data',
  'settings',
];

/**
 * Generate a blueprint instance of a block with default valid values.
 */
export function createDefaultBlock(type, customId = null) {
  const id = customId || `blk-${type}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

  const defaultDataMap = {
    hero: {
      title: 'Intentional Visual Design',
      subtitle: 'Specializing in brand identity, typography, and tactile packaging.',
      badge: 'Visual Identity & Design',
      align: 'center',
      cta_primary: { text: 'View Work', url: '/en/work' },
      cta_secondary: { text: 'Contact Me', url: '/en/contact' },
    },
    text: {
      body: 'We design meaningful visual systems rooted in typography and craft.',
      lead: false,
      align: 'left',
      max_width: 'prose',
    },
    heading: {
      text: 'Section Title',
      level: 'h2',
      subtitle: '',
      align: 'left',
    },
    image: {
      url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
      alt: 'Image preview',
      caption: '',
      aspect_ratio: '16:9',
      rounded: true,
    },
    gallery: {
      columns: 3,
      gap: 'md',
      items: [
        {
          url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
          alt: 'Gallery image 1',
          caption: 'Visual identity system',
        },
      ],
    },
    columns: {
      gap: 'md',
      stack_on_mobile: true,
      columns: [
        [
          {
            id: `inner-${Date.now().toString(36)}-1`,
            type: 'text',
            version: CURRENT_SCHEMA_VERSION,
            data: { body: 'Column 1 text', lead: false, align: 'left', max_width: 'full' },
          },
        ],
        [
          {
            id: `inner-${Date.now().toString(36)}-2`,
            type: 'text',
            version: CURRENT_SCHEMA_VERSION,
            data: { body: 'Column 2 text', lead: false, align: 'left', max_width: 'full' },
          },
        ],
      ],
    },
    spacer: {
      size: 'md',
    },
    cta: {
      title: 'Let’s collaborate on your next project',
      subtitle: 'Open for selected brand identity and editorial commissions.',
      button_text: 'Get in Touch',
      button_url: '/en/contact',
      button_variant: 'primary',
      align: 'center',
    },
    stats: {
      items: [
        { value: '40', prefix: '+', suffix: '', label: 'Brand Identities' },
        { value: '8', prefix: '', suffix: ' Years', label: 'Design Experience' },
      ],
    },
    services: {
      items: [
        {
          title: 'Brand Strategy & Identity',
          description: 'Comprehensive visual system guidelines and typography.',
          icon: 'Palette',
        },
      ],
    },
    category_preview: {
      category_slug: 'branding',
      title: 'Branding Showcase',
      limit: 4,
    },
    featured_work: {
      title: 'Selected Projects',
      limit: 6,
      show_view_all: true,
    },
  };

  return {
    id,
    type,
    version: CURRENT_SCHEMA_VERSION,
    data: defaultDataMap[type] || {},
    settings: {},
  };
}

/**
 * Validate a block against the v1 JSON schema.
 */
export function validateBlock(block) {
  const errors = [];

  if (!block || typeof block !== 'object' || Array.isArray(block)) {
    return { valid: false, errors: ['Block must be an object.'] };
  }

  // 1. Disallowed top-level keys
  for (const key of Object.keys(block)) {
    if (!ALLOWED_TOP_LEVEL_KEYS.includes(key)) {
      errors.push(`Disallowed attribute '${key}' at block top level.`);
    }
  }

  // 2. Required top-level attributes
  for (const req of ['id', 'type', 'version', 'data']) {
    if (!(req in block)) {
      errors.push(`Missing required block attribute '${req}'.`);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // 3. ID and Type validation
  if (typeof block.id !== 'string' || block.id.trim() === '') {
    errors.push('Block ID must be a non-empty string.');
  }

  if (!SUPPORTED_BLOCK_TYPES.includes(block.type)) {
    errors.push(`Unknown or unsupported block type '${block.type}'.`);
    return { valid: false, errors };
  }

  // 4. Version check
  if (block.version !== CURRENT_SCHEMA_VERSION) {
    errors.push(`Unsupported schema version '${block.version}'. Expected version ${CURRENT_SCHEMA_VERSION}.`);
    return { valid: false, errors };
  }

  // 5. Data payload check
  if (!block.data || typeof block.data !== 'object' || Array.isArray(block.data)) {
    errors.push("Block 'data' property must be an object.");
    return { valid: false, errors };
  }

  // 6. Security & XSS payload checks
  checkSecurityPayloads(block.data, errors);
  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // 7. Block-specific validations
  validateBlockData(block.type, block.data, errors);

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Deep inspection for script tags, dangerous HTML, and unsafe URL protocols.
 */
function checkSecurityPayloads(value, errors, path = 'data') {
  if (typeof value === 'string') {
    if (/<\s*(script|iframe|object|embed|applet|meta|link)/i.test(value) || /(on\w+\s*=)/i.test(value)) {
      errors.push(`Unsafe HTML or script detected at '${path}'.`);
    }
    if (/^\s*(javascript|vbscript|data):/i.test(value)) {
      errors.push(`Unsafe URL protocol detected at '${path}'.`);
    }
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      checkSecurityPayloads(v, errors, `${path}.${k}`);
    }
  }
}

/**
 * Block data type rules.
 */
function validateBlockData(type, data, errors) {
  switch (type) {
    case 'hero':
      if (data.align && !['left', 'center', 'right'].includes(data.align)) {
        errors.push("Hero align must be 'left', 'center', or 'right'.");
      }
      break;

    case 'text':
      if (data.align && !['left', 'center', 'right', 'justify'].includes(data.align)) {
        errors.push("Text align must be 'left', 'center', 'right', or 'justify'.");
      }
      if (data.max_width && !['prose', 'full', 'narrow'].includes(data.max_width)) {
        errors.push("Text max_width must be 'prose', 'full', or 'narrow'.");
      }
      break;

    case 'heading':
      if (!data.level || !['h1', 'h2', 'h3', 'h4'].includes(data.level)) {
        errors.push("Heading level must be one of 'h1', 'h2', 'h3', 'h4'.");
      }
      if (data.align && !['left', 'center', 'right'].includes(data.align)) {
        errors.push("Heading align must be 'left', 'center', or 'right'.");
      }
      break;

    case 'image':
      if (data.aspect_ratio && !['16:9', '4:3', '1:1', '3:2', 'auto'].includes(data.aspect_ratio)) {
        errors.push("Image aspect_ratio must be one of '16:9', '4:3', '1:1', '3:2', 'auto'.");
      }
      break;

    case 'gallery':
      if (data.columns && ![1, 2, 3, 4].includes(data.columns)) {
        errors.push('Gallery columns must be 1, 2, 3, or 4.');
      }
      if (data.gap && !['sm', 'md', 'lg'].includes(data.gap)) {
        errors.push("Gallery gap must be 'sm', 'md', or 'lg'.");
      }
      if (data.items && !Array.isArray(data.items)) {
        errors.push('Gallery items must be an array.');
      }
      break;

    case 'columns':
      if (data.gap && !['sm', 'md', 'lg'].includes(data.gap)) {
        errors.push("Columns gap must be 'sm', 'md', or 'lg'.");
      }
      if (!Array.isArray(data.columns)) {
        errors.push('Columns block must contain a nested columns array.');
      } else {
        data.columns.forEach((colBlocks, colIndex) => {
          if (!Array.isArray(colBlocks)) {
            errors.push(`Column at index ${colIndex} must be an array of blocks.`);
            return;
          }
          colBlocks.forEach((innerBlock) => {
            const innerResult = validateBlock(innerBlock);
            if (!innerResult.valid) {
              innerResult.errors.forEach((e) => errors.push(`Column ${colIndex}: ${e}`));
            }
          });
        });
      }
      break;

    case 'spacer':
      if (!data.size || !['xs', 'sm', 'md', 'lg', 'xl'].includes(data.size)) {
        errors.push("Spacer size must be one of 'xs', 'sm', 'md', 'lg', 'xl'.");
      }
      break;

    case 'cta':
      if (data.button_variant && !['primary', 'secondary', 'outline', 'ghost'].includes(data.button_variant)) {
        errors.push("CTA button_variant must be 'primary', 'secondary', 'outline', or 'ghost'.");
      }
      if (data.align && !['left', 'center', 'right'].includes(data.align)) {
        errors.push("CTA align must be 'left', 'center', or 'right'.");
      }
      break;

    case 'stats':
      if (data.items && !Array.isArray(data.items)) {
        errors.push('Stats items must be an array.');
      }
      break;

    case 'services':
      if (data.items && !Array.isArray(data.items)) {
        errors.push('Services items must be an array.');
      }
      break;

    case 'category_preview':
      if (data.limit && (typeof data.limit !== 'number' || data.limit < 1 || data.limit > 24)) {
        errors.push('Category preview limit must be an integer between 1 and 24.');
      }
      break;

    case 'featured_work':
      if (data.limit && (typeof data.limit !== 'number' || data.limit < 1 || data.limit > 24)) {
        errors.push('Featured work limit must be an integer between 1 and 24.');
      }
      break;
  }
}
