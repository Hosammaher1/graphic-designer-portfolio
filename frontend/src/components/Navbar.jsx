import React, { useState, useEffect } from 'react';
import { translations } from '../data/portfolioData';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle.jsx';

export const Navbar = ({
  lang,
  onToggleLanguage,
  activeSection,
  currentRoute = 'home',
  onNavigateRoute,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = translations[lang].nav;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { id: 'hero', label: t.home, href: '#hero' },
    { id: 'selected-work', label: t.work, href: '#selected-work' },
    { id: 'about-me', label: t.about, href: '#about-me' },
    { id: 'skills-expertise', label: t.skills, href: '#skills-expertise' },
    { id: 'creative-journey', label: t.journey, href: '#creative-journey' },
    { id: 'contact', label: t.contact, href: '#contact' },
  ];

  const handleLinkClick = (e, href, sectionId) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    if (currentRoute === 'work') {
      if (sectionId === 'selected-work') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (onNavigateRoute) {
        onNavigateRoute('home', sectionId);
      }
      return;
    }

    const targetElement = document.querySelector(href);
    if (targetElement) {
      const navHeight = 80;
      const elementPosition = targetElement.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - navHeight;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#09070c]/85 backdrop-blur-xl border-b border-rose-300/10 py-3.5 shadow-xl shadow-black/40'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6">
          
          {/* Left: GD Circle Logo & Brand Title */}
          <a
            href="#hero"
            onClick={(e) => {
              e.preventDefault();
              if (currentRoute === 'work' && onNavigateRoute) {
                onNavigateRoute('home', 'hero');
              } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 rounded-lg shrink-0 cursor-pointer"
          >
            {/* GD Serif Badge */}
            <span className="font-serif text-2xl font-bold tracking-tight text-white group-hover:text-rose-200 transition-colors">
              GD
            </span>
            <span className="text-sm font-medium text-neutral-300 tracking-normal hidden sm:inline">
              Graphic Designer
            </span>
          </a>

          {/* Center: Nav links with smooth active indicator */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-neutral-300">
            {navLinks.map((link) => {
              const isActive =
                currentRoute === 'work'
                  ? link.id === 'selected-work'
                  : activeSection === link.id;
              return (
                <a
                  key={link.id}
                  href={link.href}
                  onClick={(e) => handleLinkClick(e, link.href, link.id)}
                  className={`relative py-1 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 rounded-sm cursor-pointer ${
                    isActive ? 'text-white font-semibold' : 'hover:text-white text-neutral-400'
                  }`}
                >
                  <span>{link.label}</span>
                  {isActive && (
                    <span className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-rose-400 via-rose-300 to-amber-200 rounded-full animate-in fade-in duration-200" />
                  )}
                </a>
              );
            })}
          </nav>

          {/* Right: EN / AR toggle, Theme Icon, and Get in Touch Button */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
            {/* EN / AR Segmented Control */}
            <div className="flex items-center p-0.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium">
              <button
                onClick={() => lang !== 'en' && onToggleLanguage()}
                className={`px-2.5 py-1 rounded-full transition-all text-[11px] font-semibold ${
                  lang === 'en'
                    ? 'bg-white/15 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => lang !== 'ar' && onToggleLanguage()}
                className={`px-2.5 py-1 rounded-full transition-all text-[11px] font-semibold ${
                  lang === 'ar'
                    ? 'bg-white/15 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                AR
              </button>
            </div>

            {/* Approved Eclipse Theme Toggle */}
            <ThemeToggle locale={lang} />

            {/* White Pill Primary Action Button: "Get in Touch ↗" */}
            <a
              href="#contact"
              onClick={(e) => handleLinkClick(e, '#contact', 'contact')}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold text-neutral-900 bg-white hover:bg-neutral-100 shadow-md hover:shadow-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white shrink-0 cursor-pointer"
            >
              <span>{t.getInTouch}</span>
              <ArrowUpRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </a>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-neutral-300 hover:text-white"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden glass-panel border-b border-rose-300/20 px-6 py-5 mt-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col gap-3.5">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href, link.id)}
                className="text-base font-medium text-neutral-200 hover:text-rose-300 py-1.5 border-b border-white/5 cursor-pointer"
              >
                {link.label}
              </a>
            ))}
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-sm font-medium text-neutral-300">
                {lang === 'ar' ? 'المظهر' : 'Appearance'}
              </span>
              <ThemeToggle locale={lang} />
            </div>
            <a
              href="#contact"
              onClick={(e) => handleLinkClick(e, '#contact', 'contact')}
              className="inline-flex items-center justify-center gap-2 mt-2 px-5 py-3 rounded-full text-sm font-semibold text-neutral-900 bg-white cursor-pointer"
            >
              <span>{t.getInTouch}</span>
              <ArrowUpRight className="w-4 h-4 rtl:rotate-180" />
            </a>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
