import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { t } from '../i18n/config.js';
import LanguageSwitcher from './LanguageSwitcher.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import { SkipToContent } from './ui/SkipToContent.jsx';

export function Header({ locale = 'ar' }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Close mobile drawer on route navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [mobileMenuOpen]);

  const navLinks = [
    { to: `/${locale}/`, label: t('nav.home', locale) },
    { to: `/${locale}/work`, label: t('nav.work', locale) },
    { to: `/${locale}/about`, label: t('nav.about', locale) },
    { to: `/${locale}/contact`, label: t('nav.contact', locale) },
  ];

  return (
    <>
      <SkipToContent targetId="main-content">
        {t('nav.skipToContent', locale)}
      </SkipToContent>

      <header className="public-header">
        <div className="container container-site header-inner">
          <Link to={`/${locale}/`} className="brand-logo" aria-label={t('site.title', locale)}>
            <span className="brand-title">{t('site.designerName', locale)}</span>
            <span className="brand-sub">/ {t('site.role', locale).split(' ')[0]}</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="desktop-nav" aria-label="Main Navigation">
            <ul className="nav-list">
              {navLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className={`nav-link ${location.pathname === link.to ? 'active' : ''}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Desktop Controls */}
          <div className="header-controls">
            <LanguageSwitcher currentLocale={locale} />
            <ThemeToggle locale={locale} />

            {/* Mobile Menu Hamburger Button */}
            <button
              type="button"
              className="mobile-menu-toggle"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav"
              aria-label={mobileMenuOpen ? t('nav.menuClose', locale) : t('nav.menuOpen', locale)}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-drawer-wrapper">
          <div
            className="mobile-drawer-backdrop"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <aside
            id="mobile-nav"
            className="mobile-drawer-dialog"
            data-testid="mobile-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={t('nav.menuDialog', locale)}
          >
            <div className="mobile-drawer-header">
              <span className="mobile-drawer-title">{t('site.designerName', locale)}</span>
              <button
                type="button"
                className="mobile-drawer-close"
                data-testid="mobile-drawer-close"
                aria-label={t('nav.menuClose', locale)}
                onClick={() => setMobileMenuOpen(false)}
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <nav className="mobile-nav-body" aria-label="Mobile Navigation">
              <ul className="mobile-nav-list">
                {navLinks.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className={`mobile-nav-link ${location.pathname === link.to ? 'active' : ''}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="mobile-drawer-footer">
              <LanguageSwitcher currentLocale={locale} />
              <ThemeToggle locale={locale} />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

export default Header;
