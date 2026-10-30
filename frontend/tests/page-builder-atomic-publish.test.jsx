import { describe, it, expect, vi, beforeEach } from 'vitest';
import { publishPage, fetchPublicPage } from '../src/page-builder/pageBuilderApi.js';

describe('Page Builder Atomic Publish API Client (Task 05.10)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('atomically publishes page and returns published_version snapshot', async () => {
    const mockResponse = {
      message: 'Page published successfully.',
      page: {
        id: 1,
        slug: 'home',
        published_version_id: 5,
      },
      published_version: {
        id: 5,
        version_number: 2,
        status: 'published',
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    const res = await publishPage('home');

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v1/admin/pages/home/publish',
      expect.objectContaining({ method: 'POST' })
    );

    expect(res.success).toBe(true);
    expect(res.page.published_version_id).toBe(5);
    expect(res.published_version.status).toBe('published');
  });

  it('normalizes 422 localized completeness policy rejection correctly', async () => {
    const errorResponse = {
      message: 'Localized completeness policy violation: Both Arabic and English titles are required for publication.',
      policy_violation: true,
      errors: {
        title_en: ['The title_en field is required to publish this page.'],
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => errorResponse,
    });

    const res = await publishPage('incomplete-page');

    expect(res.success).toBe(false);
    expect(res.policy_violation).toBe(true);
    expect(res.status).toBe(422);
    expect(res.errors.title_en).toBeDefined();
  });

  it('fetches public page for anonymous visitors', async () => {
    const publicPageData = {
      page: {
        slug: 'about',
        title_ar: 'من نحن',
        title_en: 'About Us',
      },
      blocks: [
        { id: 'blk-1', type: 'hero', data: { title: 'مرحبا' } },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => publicPageData,
    });

    const res = await fetchPublicPage('about');

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v1/pages/about',
      expect.anything()
    );

    expect(res.success).toBe(true);
    expect(res.blocks.length).toBe(1);
    expect(res.blocks[0].type).toBe('hero');
  });

  it('handles 404 for unpublished page gracefully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({ message: 'Page not found or not published.' }),
    });

    const res = await fetchPublicPage('non-existent');

    expect(res.success).toBe(false);
    expect(res.status).toBe(404);
  });
});
