import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, Shield } from 'lucide-react';
import { useConsent } from '../context/ConsentContext.jsx';
import { t } from '../i18n/config.js';

export function Footer({ locale = 'ar' }) {
  const currentYear = new Date().getFullYear();
  const { openSettings } = useConsent();

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const navLinks = [
    { to: `/${locale}/`, label: t('nav.home', locale) },
    { to: `/${locale}/work`, label: t('nav.work', locale) },
    { to: `/${locale}/about`, label: t('nav.about', locale) },
    { to: `/${locale}/contact`, label: t('nav.contact', locale) },
    { to: '/admin/', label: t('nav.admin', locale) },
  ];

  const socialLinks = [
    { name: t('social.behance', locale), href: 'https://behance.net', label: 'Behance' },
    { name: t('social.dribbble', locale), href: 'https://dribbble.com', label: 'Dribbble' },
    { name: t('social.linkedin', locale), href: 'https://linkedin.com', label: 'LinkedIn' },
    { name: t('social.instagram', locale), href: 'https://instagram.com', label: 'Instagram' },
  ];

  return (
    <footer className="public-footer">
      <div className="container container-site footer-content">
        <div className="footer-grid">
          {/* Brand info */}
          <div className="footer-brand-col">
            <h2 className="footer-brand-title">{t('site.title', locale)}</h2>
            <p className="footer-tagline">{t('footer.tagline', locale)}</p>
          </div>

          {/* Quick links */}
          <div className="footer-links-col">
            <h3 className="footer-heading">{t('footer.quickLinks', locale)}</h3>
            <ul className="footer-links-list">
              {navLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="footer-link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social links */}
          <div className="footer-social-col">
            <h3 className="footer-heading">{t('footer.social', locale)}</h3>
            <ul className="footer-social-list">
              {socialLinks.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="footer-social-link"
                    aria-label={social.label}
                  >
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="footer-bottom">
          <p className="footer-copyright">
            © {currentYear} {t('site.designerName', locale)}. {t('footer.rights', locale)}
          </p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={openSettings}
              className="text-xs text-[var(--color-text-muted,#a1a1aa)] hover:text-[var(--color-text,#fafafa)] transition-colors inline-flex items-center gap-1.5 focus:outline-none focus:underline"
              aria-label={t('footer.privacyPreferences', locale)}
            >
              <Shield size={14} aria-hidden="true" />
              <span>{t('footer.privacyPreferences', locale)}</span>
            </button>
            <button
            type="button"
            onClick={scrollToTop}
            className="footer-back-to-top"
            aria-label={t('footer.backToTop', locale)}
          >
            <span>{t('footer.backToTop', locale)}</span>
            <ArrowUp size={16} aria-hidden="true" />
          </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
