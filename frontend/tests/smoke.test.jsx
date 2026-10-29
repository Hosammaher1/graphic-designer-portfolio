import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HomePage from '../src/pages/HomePage.jsx';
import AdminPlaceholder from '../src/pages/AdminPlaceholder.jsx';
import App from '../src/app/App.jsx';

describe('Frontend Smoke Tests', () => {
  it('renders HomePage in Arabic by default with key headings', () => {
    render(<HomePage locale="ar" />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('تصميم بصري هادف');
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('أعمال مختارة');
  });

  it('renders HomePage in English when locale is en', () => {
    render(<HomePage locale="en" />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Intentional visual design');
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Featured Projects');
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
    expect(screen.getByText(/محمد — مصمم جرافيك/i)).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('لوحة التحكم')).toBeInTheDocument();
  });

  it('renders App shell with English route', () => {
    render(
      <MemoryRouter initialEntries={['/en/']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText(/Mohammed — Graphic Designer/i)).toBeInTheDocument();
    expect(screen.getByText('العربية')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });
});
