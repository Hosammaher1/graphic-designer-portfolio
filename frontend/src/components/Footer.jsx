import React from 'react';
import { translations } from '../data/portfolioData';
import { ArrowUp, Shield } from 'lucide-react';
import { useConsent } from '../context/ConsentContext.jsx';
import { Skeleton } from './ui/Skeleton';

export const Footer = ({ lang, locale, settings }) => {
  const currentLang = locale || lang || 'en';
  const t = (translations[currentLang] || translations.en || translations.ar).footer;
  const nav = (translations[currentLang] || translations.en || translations.ar).nav;

  const isSettingsLoaded = Boolean(settings);
  const designerName = settings?.profile?.[currentLang === 'ar' ? 'fullNameAr' : 'fullNameEn'] ||
    settings?.profile?.[currentLang === 'ar' ? 'nameAr' : 'nameEn'] ||
    (currentLang === 'ar' ? 'محمد ماهر الداية' : 'Mohammed Maher Aldaya');

  const footerTagline = settings?.profile?.[currentLang === 'ar' ? 'taglineAr' : 'taglineEn'] || t.tagline;

  let openSettings = null;
  try {
    const consentCtx = useConsent();
    openSettings = consentCtx?.openSettings;
  } catch (e) {
    // Graceful fallback if ConsentContext is not present
  }

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleOpenPrivacy = () => {
    if (openSettings) {
      openSettings();
    }
  };

  const socialLinks = [
    { label: 'Instagram', href: settings?.contact?.instagramUrl || settings?.profile?.instagramUrl || 'https://www.instagram.com/mohmmed_ma48/' },
    { label: 'WhatsApp', href: settings?.contact?.whatsappUrl || settings?.profile?.whatsappUrl || 'https://wa.me/972592382189' },
    { label: 'Behance', href: settings?.profile?.behanceUrl || 'https://behance.net' },
    { label: 'Dribbble', href: settings?.profile?.dribbbleUrl || 'https://dribbble.com' },
    { label: 'LinkedIn', href: settings?.profile?.linkedinUrl || 'https://linkedin.com' },
  ];

  return (
    <footer className="relative bg-[#070509] border-t border-white/10 pt-16 pb-12 overflow-hidden">
      {/* Top subtle glow line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-rose-400/30 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Main Footer Row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 pb-12 border-b border-white/5 text-center md:text-left rtl:md:text-right">
          {/* Brand lockup */}
          <div>
            <div className="flex items-center justify-center md:justify-start gap-2.5">
              <img
                src="/logo/logo.png"
                alt="MO"
                className="h-7 sm:h-8 w-auto object-contain"
                loading="lazy"
                decoding="async"
                data-testid="footer-brand-logo"
              />
              <span className="text-sm font-medium text-neutral-300">
                {designerName}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-2 font-light max-w-sm">
              {footerTagline}
            </p>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-wrap justify-center gap-6 text-xs font-medium text-neutral-400">
            <a href="#hero" className="hover:text-white transition-colors">
              {nav.home}
            </a>
            <a href="#selected-work" className="hover:text-white transition-colors">
              {nav.work}
            </a>
            <a href="#about-me" className="hover:text-white transition-colors">
              {nav.about}
            </a>
            <a href="#skills-expertise" className="hover:text-white transition-colors">
              {nav.skills}
            </a>
            <a href="#creative-journey" className="hover:text-white transition-colors">
              {nav.journey}
            </a>
            <a href="#contact" className="hover:text-white transition-colors">
              {nav.contact}
            </a>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4 text-xs font-mono text-neutral-400">
            {socialLinks.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="hover:text-rose-300 transition-colors cursor-pointer"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>

        {/* Bottom Row */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500 font-light text-center sm:text-left rtl:sm:text-right">
          <div>
            © {new Date().getFullYear()} {designerName}. {t.rights}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleOpenPrivacy}
              className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-400 rounded cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{currentLang === 'ar' ? 'تفضيلات الخصوصية' : 'Privacy Preferences'}</span>
            </button>

            <button
              onClick={scrollToTop}
              className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-400 rounded cursor-pointer"
              aria-label={t.backToTop}
            >
              <span>{t.backToTop}</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
