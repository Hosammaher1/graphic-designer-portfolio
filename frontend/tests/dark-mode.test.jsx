import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ThemeToggle from '../src/components/ThemeToggle.jsx';
import fs from 'node:fs';
import path from 'node:path';

describe('Dark Mode & Theme Persistence (Task 04.10)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    vi.restoreAllMocks();
  });

  it('detects system dark mode preference when no saved theme exists', () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(<ThemeToggle locale="en" />);

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(screen.getByRole('button', { name: /switch to light mode/i })).toBeInTheDocument();
  });

  it('restores persisted theme from localStorage over system default', () => {
    localStorage.setItem('portfolio-theme', 'light');

    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: true, // system wants dark, but user saved light!
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(<ThemeToggle locale="en" />);

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(screen.getByRole('button', { name: /switch to dark mode/i })).toBeInTheDocument();
  });

  it('toggles theme, updates DOM data-theme attribute, and persists to localStorage', () => {
    render(<ThemeToggle locale="en" />);

    const toggleBtn = screen.getByRole('button');
    const initialTheme = document.documentElement.getAttribute('data-theme');

    fireEvent.click(toggleBtn);

    const newTheme = document.documentElement.getAttribute('data-theme');
    expect(newTheme).not.toBe(initialTheme);
    expect(localStorage.getItem('portfolio-theme')).toBe(newTheme);

    // Toggle back
    fireEvent.click(toggleBtn);
    expect(document.documentElement.getAttribute('data-theme')).toBe(initialTheme);
    expect(localStorage.getItem('portfolio-theme')).toBe(initialTheme);
  });

  it('verifies dark mode CSS color tokens exist and provide high contrast', () => {
    const tokensPath = path.resolve(__dirname, '../src/styles/tokens.css');
    const tokensCss = fs.readFileSync(tokensPath, 'utf-8');

    expect(tokensCss).toContain('[data-theme="dark"]');
    expect(tokensCss).toContain('--color-bg: #090a0f');
    expect(tokensCss).toContain('--color-text-primary: #f9fafb');
    expect(tokensCss).toContain('--color-surface: #12141c');
    expect(tokensCss).toContain('--color-border: #1f2937');
  });

  it('verifies anti-flash inline script exists in index.html head', () => {
    const indexPath = path.resolve(__dirname, '../index.html');
    const indexHtml = fs.readFileSync(indexPath, 'utf-8');

    expect(indexHtml).toContain("localStorage.getItem('portfolio-theme')");
    expect(indexHtml).toContain("document.documentElement.setAttribute('data-theme'");
  });
});
