import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import PublicLayout from '../src/layouts/PublicLayout.jsx';
import Header from '../src/components/Header.jsx';
import Footer from '../src/components/Footer.jsx';
import ThemeToggle from '../src/components/ThemeToggle.jsx';

describe('Public Shell & Navigation (Task 04.02)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  describe('ThemeToggle', () => {
    it('initializes theme and toggles between light and dark mode', () => {
      render(<ThemeToggle locale="en" />);
      const btn = screen.getByRole('button', { name: /switch to dark mode|switch to light mode/i });
      expect(btn).toBeInTheDocument();

      // Click to toggle
      fireEvent.click(btn);
      const themeAfterFirstClick = document.documentElement.getAttribute('data-theme');
      expect(['dark', 'light']).toContain(themeAfterFirstClick);
      expect(localStorage.getItem('portfolio-theme')).toBe(themeAfterFirstClick);

      // Click again to toggle back
      fireEvent.click(btn);
      const themeAfterSecondClick = document.documentElement.getAttribute('data-theme');
      expect(themeAfterSecondClick).not.toBe(themeAfterFirstClick);
    });
  });

  describe('Header', () => {
    it('renders brand title and desktop navigation links in English', () => {
      render(
        <MemoryRouter initialEntries={['/en/']}>
          <Header locale="en" />
        </MemoryRouter>
      );

      expect(screen.getByRole('link', { name: /mohammed/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /^home$/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /^work$/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /^about$/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /^contact$/i })).toBeInTheDocument();
    });

    it('renders brand title and desktop navigation links in Arabic', () => {
      render(
        <MemoryRouter initialEntries={['/ar/']}>
          <Header locale="ar" />
        </MemoryRouter>
      );

      expect(screen.getByRole('link', { name: /محمد/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /^الرئيسية$/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /^الأعمال$/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /^نبذة$/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /^تواصل معي$/i })).toBeInTheDocument();
    });

    it('opens and closes mobile navigation drawer with keyboard and buttons', () => {
      render(
        <MemoryRouter initialEntries={['/en/']}>
          <Header locale="en" />
        </MemoryRouter>
      );

      const menuToggle = screen.getByRole('button', { name: /open menu|menu/i });
      expect(menuToggle).toHaveAttribute('aria-expanded', 'false');

      // Open drawer
      fireEvent.click(menuToggle);
      expect(menuToggle).toHaveAttribute('aria-expanded', 'true');
      const drawer = screen.getByRole('dialog', { name: /navigation menu/i });
      expect(drawer).toBeInTheDocument();

      // Close via Escape key
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(menuToggle).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByRole('dialog', { name: /navigation menu/i })).not.toBeInTheDocument();

      // Open again and close via close button
      fireEvent.click(menuToggle);
      const closeBtn = screen.getByTestId('mobile-drawer-close');
      fireEvent.click(closeBtn);
      expect(menuToggle).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Footer', () => {
    it('renders localized copyright and social links with secure attributes', () => {
      render(
        <MemoryRouter initialEntries={['/en/']}>
          <Footer locale="en" />
        </MemoryRouter>
      );

      expect(screen.getByText(/all rights reserved/i)).toBeInTheDocument();

      const behanceLink = screen.getByRole('link', { name: /behance/i });
      expect(behanceLink).toBeInTheDocument();
      expect(behanceLink).toHaveAttribute('target', '_blank');
      expect(behanceLink).toHaveAttribute('rel', 'noopener noreferrer');

      const dribbbleLink = screen.getByRole('link', { name: /dribbble/i });
      expect(dribbbleLink).toBeInTheDocument();
      expect(dribbbleLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('PublicLayout', () => {
    it('renders SkipToContent link pointing to #main-content and wraps children', () => {
      render(
        <MemoryRouter initialEntries={['/en/']}>
          <PublicLayout locale="en">
            <div data-testid="page-child">Public Page Content</div>
          </PublicLayout>
        </MemoryRouter>
      );

      const skipLink = screen.getByRole('link', { name: /skip to (main )?content/i });
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute('href', '#main-content');
      expect(screen.getByTestId('page-child')).toBeInTheDocument();
    });
  });
});
