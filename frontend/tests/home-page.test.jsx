import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import HomePage from '../src/pages/HomePage.jsx';

describe('Home Page (Task 04.03)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders hero section, services, about, and contact CTA in English', async () => {
    // Mock empty projects and categories fetch
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/v1/projects')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'success', data: { projects: { data: [] } } }),
        });
      }
      if (url.includes('/api/v1/categories')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'success', data: { categories: [] } }),
        });
      }
      return Promise.reject(new Error('Unknown url'));
    });

    render(
      <MemoryRouter initialEntries={['/en/']}>
        <HomePage locale="en" />
      </MemoryRouter>
    );

    // Hero section
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/intentional visual design/i);
    expect(screen.getByRole('link', { name: /explore work/i })).toHaveAttribute('href', '/en/work');
    expect(screen.getByRole('link', { name: /get in touch/i })).toHaveAttribute('href', '/en/contact');

    // Services section
    expect(screen.getByRole('heading', { name: /services & craft/i })).toBeInTheDocument();
    expect(screen.getByText(/brand identity & strategy/i)).toBeInTheDocument();
    expect(screen.getByText(/packaging & print production/i)).toBeInTheDocument();
    expect(screen.getByText(/editorial & publication design/i)).toBeInTheDocument();
    expect(screen.getByText(/digital media & visual direction/i)).toBeInTheDocument();

    // About section
    expect(screen.getByRole('heading', { name: /about mohammed/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /read full bio/i })).toHaveAttribute('href', '/en/about');

    // Contact CTA banner
    expect(screen.getByRole('heading', { name: /have a project in mind\?/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /start a conversation/i })).toHaveAttribute('href', '/en/contact');
  });

  it('renders featured projects grid with title, badges, and cover when data is returned', async () => {
    const mockProjects = [
      {
        id: 1,
        slug: 'astrid-brand-identity',
        year: 2025,
        client: 'Astrid Studio',
        is_featured: true,
        title: 'Astrid Visual Identity',
        summary: 'Minimalist brand identity for luxury skincare.',
        cover_url: 'https://res.cloudinary.com/demo/astrid-cover.jpg',
        categories: [{ id: 1, slug: 'branding', name: 'Branding' }],
        tools: [{ id: 1, name: 'Illustrator' }],
      },
      {
        id: 2,
        slug: 'nordic-packaging',
        year: 2024,
        client: 'Nordic Roasters',
        is_featured: true,
        title: 'Nordic Coffee Packaging',
        summary: 'Sustainable kraft paper packaging series.',
        cover_url: 'https://res.cloudinary.com/demo/nordic-cover.jpg',
        categories: [{ id: 2, slug: 'packaging', name: 'Packaging' }],
        tools: [{ id: 2, name: 'Photoshop' }],
      },
    ];

    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/v1/projects')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'success', data: { projects: { data: mockProjects } } }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ status: 'success', data: { categories: [] } }),
      });
    });

    render(
      <MemoryRouter initialEntries={['/en/']}>
        <HomePage locale="en" />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Astrid Visual Identity')).toBeInTheDocument();
      expect(screen.getByText('Nordic Coffee Packaging')).toBeInTheDocument();
    });

    // Check project links
    expect(screen.getByRole('link', { name: /astrid visual identity/i })).toHaveAttribute(
      'href',
      '/en/projects/astrid-brand-identity'
    );
    expect(screen.getByRole('link', { name: /nordic coffee packaging/i })).toHaveAttribute(
      'href',
      '/en/projects/nordic-packaging'
    );

    // Check images with proper alt tags
    const images = screen.getAllByRole('img');
    const astridImg = images.find((img) => img.getAttribute('alt') === 'Astrid Visual Identity');
    expect(astridImg).toBeInTheDocument();
  });

  it('renders graceful fallback when no featured projects exist', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 'success', data: { projects: { data: [] } } }),
    });

    render(
      <MemoryRouter initialEntries={['/ar/']}>
        <HomePage locale="ar" />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/أعمال جديدة قادمة قريباً/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: /عرض جميع الأعمال/i })).toHaveAttribute('href', '/ar/work');
  });
});
