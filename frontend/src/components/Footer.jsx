import React from 'react';
import { translations } from '../data/portfolioData';
import { ArrowUp, Shield } from 'lucide-react';
import { useConsent } from '../context/ConsentContext.jsx';

export const Footer = ({ lang, locale, settings }) => {
  const currentLang = locale || lang || 'ar';
  const t = (translations[currentLang] || translations.ar || translations.en).footer;
  const nav = (translations[currentLang] || translations.ar || translations.en).nav;

  const designerName = settings?.profile?.[currentLang === 'ar' ? 'fullNameAr' : 'fullNameEn'] || settings?.profile?.[currentLang === 'ar' ? 'nameAr' : 'nameEn'] || (currentLang === 'ar' ? 'محمد ماهر الداية' : 'Mohammed Maher Aldaya');
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
                className="hover:text-white transition-colors"
              >
                {s.label}
              </a>
            ))}
          </div>

          {/* Back to top button */}
          <button
            onClick={scrollToTop}
            aria-label={t.backToTop}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium text-neutral-300 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 hover:text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 cursor-pointer"
          >
            <span>{t.backToTop}</span>
            <ArrowUp className="w-3.5 h-3.5 text-rose-300" />
          </button>
        </div>

        {/* Bottom copyright line */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400 text-center sm:text-left rtl:sm:text-right font-mono">
          <div>
            © {new Date().getFullYear()} Graphic Designer Portfolio. {currentLang === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
          </div>

          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={handleOpenPrivacy}
              className="text-xs text-neutral-400 hover:text-white transition-colors inline-flex items-center gap-1.5 focus:outline-none cursor-pointer"
              aria-label={currentLang === 'ar' ? 'تفضيلات الخصوصية والكوكيز' : 'Privacy Preferences'}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{currentLang === 'ar' ? 'تفضيلات الخصوصية' : 'Privacy Preferences'}</span>
            </button>
            <div className="text-[11px] text-neutral-500">
              Bilingual Design System · English & Arabic
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
