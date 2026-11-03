import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HomePage from '../src/pages/HomePage.jsx';
import AdminPlaceholder from '../src/pages/AdminPlaceholder.jsx';
import App from '../src/app/App.jsx';

describe('Frontend Smoke Tests', () => {
  it('renders HomePage in Arabic by default with key headings', () => {
    render(
      <MemoryRouter initialEntries={['/ar/']}>
        <HomePage locale="ar" />
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('تصميم بصري هادف');
    expect(screen.getByRole('heading', { level: 2, name: 'أعمال مختارة' })).toBeInTheDocument();
  });

  it('renders HomePage in English when locale is en', () => {
    render(
      <MemoryRouter initialEntries={['/en/']}>
        <HomePage locale="en" />
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Intentional visual design');
    expect(screen.getByRole('heading', { level: 2, name: 'Featured Projects' })).toBeInTheDocument();
  });

  it('renders AdminPlaceholder component', () => {
    render(<AdminPlaceholder />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Admin Dashboard');
    expect(screen.getByText(/Administration Shell Status/i)).toBeInTheDocument();
  });

  it('renders App shell with Arabic route and language toggle', () => {
    render(
      <MemoryRouter initialEntries={['/ar/']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getAllByText(/محمد/i).length).toBeGreaterThan(0);
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /لوحة التحكم/i })).not.toBeInTheDocument();
  });

  it('renders App shell with English route', () => {
    render(
      <MemoryRouter initialEntries={['/en/']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getAllByText(/Mohammed/i).length).toBeGreaterThan(0);
    expect(screen.getByText('العربية')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^admin$/i })).not.toBeInTheDocument();
  });
});
