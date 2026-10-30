import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { t } from '../i18n/config.js';

export function ThemeToggle({ locale = 'ar', className = '' }) {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('portfolio-theme');
      if (saved === 'dark' || saved === 'light') {
        setTheme(saved);
        document.documentElement.setAttribute('data-theme', saved);
      } else if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)')?.matches) {
        setTheme('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        setTheme('light');
        document.documentElement.setAttribute('data-theme', 'light');
      }
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', nextTheme);
      localStorage.setItem('portfolio-theme', nextTheme);
    }
  };

  const isDark = theme === 'dark';
  const label = isDark ? t('theme.toggleLight', locale) : t('theme.toggleDark', locale);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={`theme-toggle-btn ${className}`.trim()}
    >
      {isDark ? (
        <Sun size={18} className="theme-toggle-icon" aria-hidden="true" />
      ) : (
        <Moon size={18} className="theme-toggle-icon" aria-hidden="true" />
      )}
    </button>
  );
}

export default ThemeToggle;
