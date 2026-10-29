import React, { useEffect } from 'react';
import { Routes, Route, useLocation, Link } from 'react-router-dom';
import { routes } from './routes.jsx';
import LanguageSwitcher from '../components/LanguageSwitcher.jsx';
import { getLocaleFromPath, getDirection, t } from '../i18n/config.js';

export default function App() {
  const location = useLocation();
  const currentLocale = getLocaleFromPath(location.pathname);
  const currentDir = getDirection(currentLocale);
  const isArabic = currentLocale === 'ar';

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('dir', currentDir);
      document.documentElement.setAttribute('lang', currentLocale);
    }
  }, [currentLocale, currentDir]);

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
          <Link to={`/${currentLocale}/`} style={{
            fontSize: 'var(--font-size-xl)',
            fontWeight: 'var(--font-weight-bold)'
          }}>
            {t('site.title', currentLocale)}
          </Link>
          <nav style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
            <LanguageSwitcher currentLocale={currentLocale} />
            <Link to="/admin/" style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-secondary)'
            }}>
              {t('nav.admin', currentLocale)}
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
          <p>© {new Date().getFullYear()} {t('site.designerName', currentLocale)}. {t('footer.rights', currentLocale)}</p>
        </div>
      </footer>
    </div>
  );
}
