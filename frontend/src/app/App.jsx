import React, { useEffect } from 'react';
import { Routes, Route, useLocation, Link } from 'react-router-dom';
import { routes } from './routes.jsx';

export default function App() {
  const location = useLocation();
  const isArabic = location.pathname.startsWith('/ar');

  useEffect(() => {
    const dir = isArabic ? 'rtl' : 'ltr';
    const lang = isArabic ? 'ar' : 'en';
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', lang);
  }, [isArabic]);

  return (
    <div className="portfolio-app-root">
      <header style={{
        borderBottom: '1px solid var(--color-border)',
        padding: 'var(--space-4) 0',
        background: 'var(--color-bg)'
      }}>
        <div className="site-container" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Link to={isArabic ? '/ar/' : '/en/'} style={{
            fontSize: 'var(--font-size-xl)',
            fontWeight: 'var(--font-weight-bold)'
          }}>
            {isArabic ? 'محمد — مصمم جرافيك' : 'Mohammed — Graphic Designer'}
          </Link>
          <nav style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
            <Link to={isArabic ? '/en/' : '/ar/'} style={{
              fontSize: 'var(--font-size-sm)',
              padding: 'var(--space-1) var(--space-3)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)'
            }}>
              {isArabic ? 'English' : 'العربية'}
            </Link>
            <Link to="/admin/" style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-secondary)'
            }}>
              {isArabic ? 'لوحة التحكم' : 'Admin'}
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <Routes>
          {routes.map((route, idx) => (
            <Route key={idx} path={route.path} element={route.element} />
          ))}
        </Routes>
      </main>

      <footer style={{
        borderTop: '1px solid var(--color-border)',
        padding: 'var(--space-8) 0',
        marginTop: 'auto',
        fontSize: 'var(--font-size-sm)',
        color: 'var(--color-text-secondary)',
        textAlign: 'center'
      }}>
        <div className="site-container">
          <p>© {new Date().getFullYear()} Mohammed. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
