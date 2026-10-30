import { describe, it, expect } from 'vitest';
import {
  SUPPORTED_BLOCK_TYPES,
  CURRENT_SCHEMA_VERSION,
  createDefaultBlock,
  validateBlock,
} from '../src/page-builder/schema.js';

describe('Page Builder Schema & Validator (Task 05.01)', () => {
  it('supports all 12 required block types', () => {
    const expected = [
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

    expect([...SUPPORTED_BLOCK_TYPES].sort()).toEqual(expected.sort());
  });

  it('generates valid default blueprint blocks for each type', () => {
    for (const type of SUPPORTED_BLOCK_TYPES) {
      const block = createDefaultBlock(type);
      expect(block).toHaveProperty('id');
      expect(block.type).toBe(type);
      expect(block.version).toBe(CURRENT_SCHEMA_VERSION);
      expect(block).toHaveProperty('data');

      const validation = validateBlock(block);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    }
  });

  it('rejects missing top-level properties', () => {
    expect(validateBlock(null).valid).toBe(false);
    expect(validateBlock({}).valid).toBe(false);
    expect(validateBlock({ type: 'hero', version: 1, data: {} }).valid).toBe(false); // missing id
    expect(validateBlock({ id: 'b1', version: 1, data: {} }).valid).toBe(false); // missing type
    expect(validateBlock({ id: 'b1', type: 'hero', data: {} }).valid).toBe(false); // missing version
    expect(validateBlock({ id: 'b1', type: 'hero', version: 1 }).valid).toBe(false); // missing data
  });

  it('rejects unknown block types', () => {
    const invalid = {
      id: 'inv-1',
      type: 'arbitrary_eval',
      version: 1,
      data: {},
    };
    const res = validateBlock(invalid);
    expect(res.valid).toBe(false);
    expect(res.errors[0]).toMatch(/Unknown or unsupported block type/);
  });

  it('rejects unsupported schema version', () => {
    const invalid = {
      id: 'inv-v',
      type: 'spacer',
      version: 999,
      data: { size: 'md' },
    };
    const res = validateBlock(invalid);
    expect(res.valid).toBe(false);
    expect(res.errors[0]).toMatch(/Unsupported schema version/);
  });

  it('rejects malformed block-specific data', () => {
    const badSpacer = {
      id: 'sp-bad',
      type: 'spacer',
      version: 1,
      data: { size: 'invalid_size' },
    };
    expect(validateBlock(badSpacer).valid).toBe(false);

    const badHeading = {
      id: 'h-bad',
      type: 'heading',
      version: 1,
      data: { text: 'Title', level: 'h8' },
    };
    expect(validateBlock(badHeading).valid).toBe(false);
  });

  it('rejects unsafe script tags and XSS payloads', () => {
    const xss = {
      id: 'xss-1',
      type: 'text',
      version: 1,
      data: {
        body: '<script>alert("hacked")</script>',
        lead: false,
        align: 'left',
        max_width: 'prose',
      },
    };
    const res = validateBlock(xss);
    expect(res.valid).toBe(false);
    expect(res.errors[0]).toMatch(/Unsafe HTML or script detected/);
  });

  it('rejects javascript: pseudo-protocol in URLs', () => {
    const jsUrl = {
      id: 'cta-xss',
      type: 'cta',
      version: 1,
      data: {
        title: 'Call to Action',
        button_text: 'Click',
        button_url: 'javascript:steal()',
        button_variant: 'primary',
        align: 'center',
      },
    };
    const res = validateBlock(jsUrl);
    expect(res.valid).toBe(false);
    expect(res.errors[0]).toMatch(/Unsafe URL protocol/);
  });

  it('rejects unexpected top-level disallowed keys', () => {
    const polluted = {
      id: 'p-1',
      type: 'spacer',
      version: 1,
      data: { size: 'md' },
      dangerouslySetInnerHTML: { __html: '<style>body{color:red}</style>' },
    };
    const res = validateBlock(polluted);
    expect(res.valid).toBe(false);
    expect(res.errors[0]).toMatch(/Disallowed attribute/);
  });
});
