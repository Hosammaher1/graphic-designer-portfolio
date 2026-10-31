import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { routes } from './routes.jsx';
import { getLocaleFromPath, getDirection } from '../i18n/config.js';
import { AuthProvider } from '../context/AuthContext.jsx';
import { ConsentProvider } from '../context/ConsentContext.jsx';
import PublicLayout from '../layouts/PublicLayout.jsx';
import ConsentBanner from '../components/ConsentBanner.jsx';
import ConsentModal from '../components/ConsentModal.jsx';

export default function App() {
  const location = useLocation();
  const currentLocale = getLocaleFromPath(location.pathname);
  const currentDir = getDirection(currentLocale);
  const isAdminRoute = location.pathname.startsWith('/admin');

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('dir', currentDir);
      document.documentElement.setAttribute('lang', currentLocale);
    }
  }, [currentLocale, currentDir]);

  if (isAdminRoute) {
    return (
      <AuthProvider>
        <Routes>
          {routes.map((route, idx) => (
            <Route key={idx} path={route.path} element={route.element}>
              {route.children?.map((child, cIdx) => (
                <Route key={cIdx} path={child.path} element={child.element} />
              ))}
            </Route>
          ))}
        </Routes>
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <ConsentProvider locale={currentLocale}>
        <PublicLayout locale={currentLocale}>
          <Routes>
            {routes.map((route, idx) => (
              <Route key={idx} path={route.path} element={route.element}>
                {route.children?.map((child, cIdx) => (
                  <Route key={cIdx} path={child.path} element={child.element} />
                ))}
              </Route>
            ))}
          </Routes>
        </PublicLayout>
        <ConsentBanner locale={currentLocale} />
        <ConsentModal locale={currentLocale} />
      </ConsentProvider>
    </AuthProvider>
  );
}
