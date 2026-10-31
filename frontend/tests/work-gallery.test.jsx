import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import WorkPage from '../src/pages/WorkPage.jsx';

describe('Work Gallery (Task 04.04)', () => {
  const mockCategories = [
    { id: 1, slug: 'branding', name: 'Branding & Identity' },
    { id: 2, slug: 'packaging', name: 'Packaging' },
  ];

  const mockProjectsPage1 = [
    {
      id: 101,
      slug: 'minimalist-branding',
      title: 'Minimalist Studio Branding',
      summary: 'Identity design for creative studio.',
      cover_url: 'https://res.cloudinary.com/demo/branding.jpg',
      year: 2025,
      client: 'Studio Alpha',
      categories: [{ id: 1, slug: 'branding', name: 'Branding & Identity' }],
      tools: [{ id: 1, name: 'Illustrator' }],
    },
  ];

  const mockProjectsPage2 = [
    {
      id: 102,
      slug: 'artisan-packaging',
      title: 'Artisan Olive Oil Packaging',
      summary: 'Embossed label and packaging system.',
      cover_url: 'https://res.cloudinary.com/demo/oil.jpg',
      year: 2024,
      client: 'Terra Farms',
      categories: [{ id: 2, slug: 'packaging', name: 'Packaging' }],
      tools: [{ id: 2, name: 'Photoshop' }],
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders gallery header, categories tabs, and projects grid in English', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/v1/categories')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'success', data: { categories: mockCategories } }),
        });
      }
      if (url.includes('/api/v1/projects')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              status: 'success',
              data: {
                projects: {
                  data: mockProjectsPage1,
                  current_page: 1,
                  last_page: 1,
                  total: 1,
                },
              },
            }),
        });
      }
      return Promise.reject(new Error('Unknown url'));
    });

    render(
      <MemoryRouter initialEntries={['/en/work']}>
        <WorkPage locale="en" />
      </MemoryRouter>
    );

    // Title and subtitle
    expect(screen.getByRole('heading', { level: 1, name: /selected work & projects/i })).toBeInTheDocument();

    // Category tabs
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /all projects/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /branding & identity/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /packaging/i })).toBeInTheDocument();
    });

    // Project card
    await waitFor(() => {
      expect(screen.getByText('Minimalist Studio Branding')).toBeInTheDocument();
      expect(screen.getByText('Studio Alpha')).toBeInTheDocument();
    });

    const img = screen.getByRole('img', { name: 'Minimalist Studio Branding' });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://res.cloudinary.com/demo/branding.jpg');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('filters projects when a category tab is clicked', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/v1/categories')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'success', data: { categories: mockCategories } }),
        });
      }
      if (url.includes('category=packaging')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              status: 'success',
              data: {
                projects: {
                  data: mockProjectsPage2,
                  current_page: 1,
                  last_page: 1,
                  total: 1,
                },
              },
            }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            status: 'success',
            data: {
              projects: {
                data: mockProjectsPage1,
                current_page: 1,
                last_page: 1,
                total: 1,
              },
            },
          }),
      });
    });

    render(
      <MemoryRouter initialEntries={['/en/work']}>
        <WorkPage locale="en" />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Minimalist Studio Branding')).toBeInTheDocument();
    });

    // Click Packaging category tab
    const packagingTab = screen.getByRole('button', { name: /packaging/i });
    fireEvent.click(packagingTab);

    await waitFor(() => {
      expect(screen.getByText('Artisan Olive Oil Packaging')).toBeInTheDocument();
      expect(screen.queryByText('Minimalist Studio Branding')).not.toBeInTheDocument();
    });
  });

  it('renders empty state when no projects match category', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/v1/categories')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'success', data: { categories: mockCategories } }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            status: 'success',
            data: {
              projects: {
                data: [],
                current_page: 1,
                last_page: 1,
                total: 0,
              },
            },
          }),
      });
    });

    render(
      <MemoryRouter initialEntries={['/en/work']}>
        <WorkPage locale="en" />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/no projects found/i)).toBeInTheDocument();
    });
  });

  it('renders error state and retries on button click', async () => {
    let shouldFail = true;
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/v1/categories')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'success', data: { categories: [] } }),
        });
      }
      if (shouldFail) {
        return Promise.resolve({ ok: false, status: 500 });
      }
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            status: 'success',
            data: {
              projects: {
                data: mockProjectsPage1,
                current_page: 1,
                last_page: 1,
                total: 1,
              },
            },
          }),
      });
    });

    render(
      <MemoryRouter initialEntries={['/en/work']}>
        <WorkPage locale="en" />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/unable to load projects/i)).toBeInTheDocument();
    });

    shouldFail = false;
    const retryBtn = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText('Minimalist Studio Branding')).toBeInTheDocument();
    });
  });

  it('loads more projects when multiple pages exist', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/v1/categories')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'success', data: { categories: [] } }),
        });
      }
      if (url.includes('page=2')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              status: 'success',
              data: {
                projects: {
                  data: mockProjectsPage2,
                  current_page: 2,
                  last_page: 2,
                  total: 2,
                },
              },
            }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            status: 'success',
            data: {
              projects: {
                data: mockProjectsPage1,
                current_page: 1,
                last_page: 2,
                total: 2,
              },
            },
          }),
      });
    });

    render(
      <MemoryRouter initialEntries={['/en/work']}>
        <WorkPage locale="en" />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Minimalist Studio Branding')).toBeInTheDocument();
    });

    const loadMoreBtn = screen.getByRole('button', { name: /load more projects/i });
    expect(loadMoreBtn).toBeInTheDocument();
    fireEvent.click(loadMoreBtn);

    await waitFor(() => {
      expect(screen.getByText('Artisan Olive Oil Packaging')).toBeInTheDocument();
      expect(screen.getByText('Minimalist Studio Branding')).toBeInTheDocument();
    });
  });
});
