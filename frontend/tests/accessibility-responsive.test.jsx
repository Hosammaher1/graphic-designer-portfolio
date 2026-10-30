import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import PublicLayout from '../src/layouts/PublicLayout.jsx';
import HomePage from '../src/pages/HomePage.jsx';
import WorkPage from '../src/pages/WorkPage.jsx';
import AboutPage from '../src/pages/AboutPage.jsx';
import ContactPage from '../src/pages/ContactPage.jsx';
import fs from 'node:fs';
import path from 'node:path';

describe('Accessibility & Responsive Design (Task 04.09)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/v1/projects')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              status: 'success',
              data: {
                projects: {
                  data: [
                    {
                      id: 1,
                      slug: 'sample-project',
                      title: 'Sample Project Title',
                      summary: 'Sample summary',
                      cover_url: 'https://res.cloudinary.com/demo/sample.jpg',
                      categories: [{ id: 1, slug: 'branding', name: 'Branding' }],
                    },
                  ],
                },
              },
            }),
        });
      }
      if (url.includes('/api/v1/categories')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              status: 'success',
              data: { categories: [{ id: 1, slug: 'branding', name: 'Branding' }] },
            }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  describe('Semantic Landmarks & Structure', () => {
    it('provides all essential landmark regions in PublicLayout', () => {
      render(
        <MemoryRouter initialEntries={['/en/']}>
          <PublicLayout locale="en">
            <div>Page Content</div>
          </PublicLayout>
        </MemoryRouter>
      );

      // Banner (header)
      expect(screen.getByRole('banner')).toBeInTheDocument();
      // Navigation
      expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
      // Main landmark
      expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
      // Contentinfo (footer)
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
      // Skip link
      const skipLink = screen.getByRole('link', { name: /skip to (main )?content/i });
      expect(skipLink).toHaveAttribute('href', '#main-content');
    });

    it('ensures each public page has exactly one h1 heading', async () => {
      const { rerender } = render(
        <MemoryRouter initialEntries={['/en/']}>
          <HomePage locale="en" />
        </MemoryRouter>
      );
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);

      rerender(
        <MemoryRouter initialEntries={['/en/work']}>
          <WorkPage locale="en" />
        </MemoryRouter>
      );
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);

      rerender(
        <MemoryRouter initialEntries={['/en/about']}>
          <AboutPage locale="en" />
        </MemoryRouter>
      );
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);

      rerender(
        <MemoryRouter initialEntries={['/en/contact']}>
          <ContactPage locale="en" />
        </MemoryRouter>
      );
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    });
  });

  describe('Form Control Accessibility', () => {
    it('ensures all contact form inputs have explicit accessible labels and names', () => {
      render(
        <MemoryRouter initialEntries={['/en/contact']}>
          <ContactPage locale="en" />
        </MemoryRouter>
      );

      const nameInput = screen.getByLabelText(/full name/i);
      expect(nameInput).toHaveAttribute('required');

      const emailInput = screen.getByLabelText(/your email/i);
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('required');

      const messageInput = screen.getByLabelText(/project scope & details/i);
      expect(messageInput).toHaveAttribute('required');
    });
  });

  describe('Image Accessibility & Aspect Ratios', () => {
    it('ensures rendered project images have informative alt attributes', async () => {
      render(
        <MemoryRouter initialEntries={['/en/work']}>
          <WorkPage locale="en" />
        </MemoryRouter>
      );

      const images = await screen.findAllByRole('img');
      images.forEach((img) => {
        expect(img).toHaveAttribute('alt');
        expect(img.getAttribute('alt').trim().length).toBeGreaterThan(0);
      });
    });
  });

  describe('CSS Focus Rings & Breakpoint Tokens', () => {
    it('declares accessible :focus-visible ring in stylesheet', () => {
      const cssPath = path.resolve(__dirname, '../src/styles/global.css');
      const cssContent = fs.readFileSync(cssPath, 'utf-8');

      expect(cssContent).toContain(':focus-visible');
      expect(cssContent).toContain('outline:');
      expect(cssContent).toContain('var(--color-focus)');
    });

    it('declares responsive container clamp and max-width boundaries in tokens', () => {
      const tokensPath = path.resolve(__dirname, '../src/styles/tokens.css');
      const tokensContent = fs.readFileSync(tokensPath, 'utf-8');

      expect(tokensContent).toContain('--max-width-site: 1440px');
      expect(tokensContent).toContain('--max-width-content: 1100px');
      expect(tokensContent).toContain('--max-width-narrow: 768px');
      expect(tokensContent).toContain('--container-padding-x:');
    });

    it('declares reduced motion zeroing overrides in tokens', () => {
      const tokensPath = path.resolve(__dirname, '../src/styles/tokens.css');
      const tokensContent = fs.readFileSync(tokensPath, 'utf-8');

      expect(tokensContent).toContain('prefers-reduced-motion: reduce');
      expect(tokensContent).toContain('--motion-fast: 0ms !important');
      expect(tokensContent).toContain('--motion-normal: 0ms !important');
      expect(tokensContent).toContain('--motion-slow: 0ms !important');
    });
  });
});
