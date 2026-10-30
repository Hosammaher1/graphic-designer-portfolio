import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProjectDetailPage from '../src/pages/ProjectDetailPage.jsx';
import { PROJECT_RESTRICTED_BLOCK_TYPES, SUPPORTED_BLOCK_TYPES } from '../src/page-builder/schema.js';

describe('Project Layout Builder (Task 05.11)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('restricts project block types to presentation components and disallows global page blocks', () => {
    expect(PROJECT_RESTRICTED_BLOCK_TYPES).toEqual([
      'text',
      'image',
      'gallery',
      'columns',
      'spacer',
      'heading',
      'cta',
      'stats',
    ]);

    // Ensure global blocks are disallowed
    expect(PROJECT_RESTRICTED_BLOCK_TYPES).not.toContain('category_preview');
    expect(PROJECT_RESTRICTED_BLOCK_TYPES).not.toContain('featured_work');
    expect(PROJECT_RESTRICTED_BLOCK_TYPES).not.toContain('services');
    expect(PROJECT_RESTRICTED_BLOCK_TYPES).not.toContain('hero');
  });

  it('renders dynamic custom layout blocks on ProjectDetailPage when layout_blocks are present', async () => {
    const projectWithBlocks = {
      id: 10,
      slug: 'custom-branding',
      title: 'مشروع الهوية البصرية المتقدمة',
      year: 2026,
      client: 'Brand Studio',
      categories: [{ id: 1, name: 'هويات بصرية', slug: 'branding' }],
      tools: [{ id: 1, name: 'Illustrator', slug: 'illustrator' }],
      media: [],
      layout_blocks: [
        {
          id: 'blk-detail-heading',
          type: 'heading',
          version: 1,
          data: {
            text: 'فلسفة الألوان والرموز في المشروع',
            level: 'h2',
          },
          settings: {},
        },
        {
          id: 'blk-detail-text',
          type: 'text',
          version: 1,
          data: {
            body: 'تم بناء الهوية استناداً إلى تدرجات الأزرق والذهبي لتعزيز الثقة والأناقة.',
          },
          settings: {},
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        status: 'success',
        data: { project: projectWithBlocks },
      }),
    });

    render(
      <MemoryRouter initialEntries={['/ar/projects/custom-branding']}>
        <Routes>
          <Route path="/:locale/projects/:slug" element={<ProjectDetailPage locale="ar" />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for project title to render
    await waitFor(() => {
      expect(screen.getByText('مشروع الهوية البصرية المتقدمة')).toBeInTheDocument();
    });

    // Verify custom blocks rendered via DocumentRenderer
    expect(screen.getByText('فلسفة الألوان والرموز في المشروع')).toBeInTheDocument();
    expect(
      screen.getByText(/تم بناء الهوية استناداً إلى تدرجات الأزرق والذهبي/i)
    ).toBeInTheDocument();
  });

  it('falls back gracefully to standard description layout when layout_blocks is absent', async () => {
    const standardProject = {
      id: 11,
      slug: 'standard-project',
      title: 'مشروع بالنسق القياسي',
      description: 'هذا المشروع يستخدم النسق القياسي الافتراضي للوصف والصور.',
      categories: [],
      tools: [],
      media: [
        {
          id: 101,
          url: 'https://images.unsplash.com/photo-test',
          title: 'صورة توضيحية',
        },
      ],
      layout_blocks: null,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        status: 'success',
        data: { project: standardProject },
      }),
    });

    render(
      <MemoryRouter initialEntries={['/ar/projects/standard-project']}>
        <Routes>
          <Route path="/:locale/projects/:slug" element={<ProjectDetailPage locale="ar" />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('مشروع بالنسق القياسي')).toBeInTheDocument();
    });

    // Standard description is present
    expect(
      screen.getByText('هذا المشروع يستخدم النسق القياسي الافتراضي للوصف والصور.')
    ).toBeInTheDocument();

    // No custom layout section rendered
    expect(screen.queryByLabelText('Project Layout')).not.toBeInTheDocument();
  });
});
