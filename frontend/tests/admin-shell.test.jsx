import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AdminLayout from '../src/layouts/AdminLayout.jsx';
import LoginPage from '../src/pages/admin/LoginPage.jsx';
import { AuthProvider } from '../src/context/AuthContext.jsx';

describe('Admin Shell UI Component Tests', () => {
  it('renders loading state when authentication is being verified', () => {
    render(
      <AuthProvider initialLoading={true}>
        <MemoryRouter initialEntries={['/admin/']}>
          <AdminLayout />
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByRole('status')).toHaveTextContent('Verifying authentication status...');
  });

  it('redirects unauthenticated user to /admin/login', () => {
    render(
      <AuthProvider initialUser={null} initialLoading={false} skipCheck={true}>
        <MemoryRouter initialEntries={['/admin/']}>
          <Routes>
            <Route path="/admin/*" element={<AdminLayout />} />
            <Route path="/admin/login" element={<LoginPage />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    // Should render the LoginPage
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Portfolio Administration');
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('renders authenticated admin shell with navigation and user identity', () => {
    const mockAdmin = {
      id: 1,
      name: 'Mohammed Maher',
      email: 'admin@mohammed-portfolio.test',
      is_admin: true,
    };

    render(
      <AuthProvider initialUser={mockAdmin} initialLoading={false}>
        <MemoryRouter initialEntries={['/admin/']}>
          <Routes>
            <Route path="/admin/*" element={<AdminLayout />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    // Sidebar navigation links
    expect(screen.getByRole('complementary', { name: 'Admin Navigation' })).toBeInTheDocument();
    expect(screen.getByText('admin@mohammed-portfolio.test')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Projects' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Categories' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Page Builder' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign Out' })).toBeInTheDocument();
  });

  it('toggles mobile drawer with aria-expanded attribute for assistive tech and keyboard nav', () => {
    const mockAdmin = {
      id: 1,
      name: 'Mohammed Maher',
      email: 'admin@mohammed-portfolio.test',
      is_admin: true,
    };

    render(
      <AuthProvider initialUser={mockAdmin} initialLoading={false}>
        <MemoryRouter initialEntries={['/admin/']}>
          <Routes>
            <Route path="/admin/*" element={<AdminLayout />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    const toggleButton = screen.getByRole('button', { name: 'Toggle navigation menu' });
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');

    // Click toggle to open drawer
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');

    // Click toggle to close drawer
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
  });
});
