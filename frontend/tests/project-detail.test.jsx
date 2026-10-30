import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProjectDetailPage from '../src/pages/ProjectDetailPage.jsx';

describe('Project Detail Page (Task 04.05)', () => {
  const mockProject = {
    id: 1,
    slug: 'solis-branding',
    year: 2025,
    client: 'Solis Energy',
    view_count: 142,
    published_at: '2025-01-15T12:00:00Z',
    title: 'Solis Brand Identity & Guidelines',
    summary: 'A warm solar identity designed for clean energy.',
    description: 'Full identity suite covering logomark, typography scale, corporate collateral, and web guidelines.',
    cover_url: 'https://res.cloudinary.com/demo/solis-cover.jpg',
    categories: [{ id: 1, slug: 'branding', name: 'Branding & Identity' }],
    tools: [{ id: 1, name: 'Illustrator' }, { id: 2, name: 'Figma' }],
    media: [
      {
        id: 10,
        url: 'https://res.cloudinary.com/demo/solis-01.jpg',
        title: 'Brandmark Construction',
        sort_order: 1,
      },
      {
        id: 11,
        url: 'https://res.cloudinary.com/demo/solis-02.jpg',
        title: 'Stationery Suite',
        sort_order: 2,
      },
    ],
    prev_project: {
      slug: 'aurora-packaging',
      title: 'Aurora Cosmetics Packaging',
    },
    next_project: {
      slug: 'zenith-editorial',
      title: 'Zenith Architecture Monograph',
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders project metadata, cover, and ordered media in English', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 'success', data: { project: mockProject } }),
    });

    render(
      <MemoryRouter initialEntries={['/en/projects/solis-branding']}>
        <Routes>
          <Route path="/:locale/projects/:slug" element={<ProjectDetailPage locale="en" />} />
        </Routes>
      </MemoryRouter>
    );

    // Title and metadata
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Solis Brand Identity & Guidelines' })).toBeInTheDocument();
      expect(screen.getByText('Solis Energy')).toBeInTheDocument();
      expect(screen.getByText('2025')).toBeInTheDocument();
      expect(screen.getByText('Branding & Identity')).toBeInTheDocument();
      expect(screen.getByText('Illustrator')).toBeInTheDocument();
      expect(screen.getByText('Figma')).toBeInTheDocument();
    });

    // Overview & description
    expect(screen.getByText('A warm solar identity designed for clean energy.')).toBeInTheDocument();
    expect(screen.getByText(/Full identity suite covering logomark/)).toBeInTheDocument();

    // Cover image
    const cover = screen.getByAltText('Solis Brand Identity & Guidelines');
    expect(cover).toBeInTheDocument();
    expect(cover).toHaveAttribute('src', 'https://res.cloudinary.com/demo/solis-cover.jpg');

    // Gallery images
    expect(screen.getByAltText('Brandmark Construction')).toBeInTheDocument();
    expect(screen.getByAltText('Stationery Suite')).toBeInTheDocument();
  });

  it('opens and navigates Lightbox image viewer with keyboard and buttons', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 'success', data: { project: mockProject } }),
    });

    render(
      <MemoryRouter initialEntries={['/en/projects/solis-branding']}>
        <Routes>
          <Route path="/:locale/projects/:slug" element={<ProjectDetailPage locale="en" />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByAltText('Brandmark Construction')).toBeInTheDocument();
    });

    // Click first gallery image to open Lightbox
    const firstImg = screen.getByAltText('Brandmark Construction');
    fireEvent.click(firstImg);

    // Lightbox modal appears
    const lightbox = screen.getByRole('dialog', { name: /image viewer/i });
    expect(lightbox).toBeInTheDocument();
    expect(screen.getByText(/image 1 of 2/i)).toBeInTheDocument();

    // Click Next image
    const nextBtn = screen.getByRole('button', { name: /next image/i });
    fireEvent.click(nextBtn);
    expect(screen.getByText(/image 2 of 2/i)).toBeInTheDocument();

    // Close via Escape key
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: /image viewer/i })).not.toBeInTheDocument();
  });

  it('renders previous and next project navigation links', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 'success', data: { project: mockProject } }),
    });

    render(
      <MemoryRouter initialEntries={['/en/projects/solis-branding']}>
        <Routes>
          <Route path="/:locale/projects/:slug" element={<ProjectDetailPage locale="en" />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Aurora Cosmetics Packaging')).toBeInTheDocument();
      expect(screen.getByText('Zenith Architecture Monograph')).toBeInTheDocument();
    });

    const prevLink = screen.getByRole('link', { name: /aurora cosmetics packaging/i });
    expect(prevLink).toHaveAttribute('href', '/en/projects/aurora-packaging');

    const nextLink = screen.getByRole('link', { name: /zenith architecture monograph/i });
    expect(nextLink).toHaveAttribute('href', '/en/projects/zenith-editorial');

    const backLink = screen.getByRole('link', { name: /back to all work/i });
    expect(backLink).toHaveAttribute('href', '/en/work');
  });

  it('renders 404 state when project is not found', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ status: 'error', message: 'Project not found.' }),
    });

    render(
      <MemoryRouter initialEntries={['/en/projects/invalid-slug']}>
        <Routes>
          <Route path="/:locale/projects/:slug" element={<ProjectDetailPage locale="en" />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /project not found/i })).toBeInTheDocument();
    });

    const backBtn = screen.getByRole('link', { name: /back to all work/i });
    expect(backBtn).toHaveAttribute('href', '/en/work');
  });
});
