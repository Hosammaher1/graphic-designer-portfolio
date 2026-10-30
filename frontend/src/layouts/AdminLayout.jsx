import React, { useState } from 'react';
import { NavLink, Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import LoginPage from '../pages/admin/LoginPage.jsx';

export default function AdminLayout() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        className="admin-loading-screen"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-bg)',
          color: 'var(--color-text-primary)',
        }}
      >
        <p role="status" aria-live="polite">Verifying authentication status...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (typeof window === 'undefined') {
      return <LoginPage />;
    }
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  const navLinks = [
    { to: '/admin/', label: 'Dashboard', exact: true },
    { to: '/admin/projects', label: 'Projects' },
    { to: '/admin/categories', label: 'Categories' },
    { to: '/admin/pages', label: 'Page Builder' },
    { to: '/admin/profile', label: 'Profile & Password' },
    { to: '/admin/audit', label: 'Audit Log' },
  ];

  return (
    <div
      className="admin-shell"
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--color-bg)',
        color: 'var(--color-text-primary)',
      }}
    >
      {/* Mobile Drawer Backdrop */}
      {mobileDrawerOpen && (
        <div
          className="admin-mobile-backdrop"
          onClick={() => setMobileDrawerOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 40,
          }}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Nav */}
      <aside
        id="admin-sidebar"
        className={`admin-sidebar ${mobileDrawerOpen ? 'open' : ''}`}
        aria-label="Admin Navigation"
        style={{
          position: 'relative',
          width: '260px',
          borderRight: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
          padding: 'var(--space-6) var(--space-4)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 50,
          transition: 'transform var(--motion-normal)',
        }}
      >
        <div style={{ marginBottom: 'var(--space-8)', paddingLeft: 'var(--space-2)' }}>
          <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)' }}>
            Admin Control
          </h2>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
            {user?.email}
          </span>
        </div>

        <nav style={{ flex: 1 }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            {navLinks.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.exact}
                  onClick={() => setMobileDrawerOpen(false)}
                  style={({ isActive }) => ({
                    display: 'block',
                    padding: 'var(--space-2) var(--space-3)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: isActive ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
                    color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                    background: isActive ? 'var(--color-border)' : 'transparent',
                    textDecoration: 'none',
                    transition: 'background var(--motion-fast)',
                  })}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}>
          <button
            type="button"
            onClick={logout}
            style={{
              width: '100%',
              padding: 'var(--space-2) var(--space-3)',
              background: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-sm)',
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <header
          style={{
            height: '60px',
            borderBottom: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 var(--space-6)',
          }}
        >
          <button
            type="button"
            aria-label="Toggle navigation menu"
            aria-controls="admin-sidebar"
            aria-expanded={mobileDrawerOpen}
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            className="mobile-drawer-toggle"
            style={{
              padding: 'var(--space-2)',
              background: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              color: 'var(--color-text-primary)',
            }}
          >
            Menu
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <a
              href="/ar/"
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-secondary)',
                textDecoration: 'none',
              }}
            >
              View Public Site ↗
            </a>
          </div>
        </header>

        <main style={{ flex: 1 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
