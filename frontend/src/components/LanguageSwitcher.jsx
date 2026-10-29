import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getLocaleFromPath, switchLocalePath } from '../i18n/config.js';

export default function LanguageSwitcher({ currentLocale }) {
  const location = useLocation();
  const activeLocale = currentLocale || getLocaleFromPath(location.pathname);
  const targetLocale = activeLocale === 'ar' ? 'en' : 'ar';
  const targetPath = switchLocalePath(location.pathname, targetLocale);

  const label = targetLocale === 'en' ? 'English' : 'العربية';

  return (
    <Link
      to={targetPath}
      hrefLang={targetLocale}
      lang={targetLocale}
      className="language-switcher-button"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: 'var(--space-1) var(--space-3)',
        fontSize: 'var(--font-size-sm)',
        fontWeight: 'var(--font-weight-medium)',
        color: 'var(--color-text-primary)',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-sm)',
        transition: 'background var(--motion-fast), border-color var(--motion-fast)',
      }}
    >
      {label}
    </Link>
  );
}
