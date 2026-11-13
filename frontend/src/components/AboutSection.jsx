import React, { useRef, useEffect } from 'react';
import { translations } from '../data/portfolioData';
import { Layers, Image, PenTool, Monitor, Sparkles, ArrowUpRight } from 'lucide-react';
import { WaveTransition } from './WaveTransition';
import { Skeleton } from './ui/Skeleton';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export const AboutSection = ({
  lang,
  settings,
  isLoadingSettings = false,
  settingsError = null,
  onRetrySettings,
}) => {
  const currentLang = lang === 'ar' ? 'ar' : 'en';
  const t = translations[currentLang]?.about || translations.ar.about;
  const sectionRef = useRef(null);

  const isSettingsLoaded = Boolean(settings);
  const aboutSettings = settings?.about || {};
  const profileSettings = settings?.profile || {};

  const kicker = isSettingsLoaded
    ? (currentLang === 'ar' ? aboutSettings.kickerAr : aboutSettings.kickerEn) ?? ''
    : '';
  const titleStart = isSettingsLoaded
    ? (currentLang === 'ar' ? aboutSettings.titleStartAr : aboutSettings.titleStartEn) ?? ''
    : '';
  const titleAccent = isSettingsLoaded
    ? (currentLang === 'ar' ? aboutSettings.titleAccentAr : aboutSettings.titleAccentEn) ?? ''
    : '';

  const designerFullName = isSettingsLoaded
    ? (currentLang === 'ar' ? (profileSettings.fullNameAr || profileSettings.nameAr) : (profileSettings.fullNameEn || profileSettings.name)) ?? ''
    : '';

  const designerTitle = isSettingsLoaded
    ? (currentLang === 'ar' ? profileSettings.titleAr : profileSettings.titleEn) ?? ''
    : '';

  const description = isSettingsLoaded
    ? ((currentLang === 'ar' ? (profileSettings.bioAr || aboutSettings.descAr) : (profileSettings.bioEn || aboutSettings.descEn)) ?? '')
    : '';

  const profilePhoto = profileSettings.profilePhoto || profileSettings.avatarUrl || '/profile/mohammed-maher-profile.png';

  const statProjectsCount = isSettingsLoaded ? (aboutSettings.statProjects ?? '') : null;
  const statClientsCount = isSettingsLoaded ? (aboutSettings.statClients ?? '') : null;
  const statYearsCount = isSettingsLoaded ? (aboutSettings.statYears ?? '') : null;

  useEffect(() => {
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.about-reveal',
        { opacity: 0.7, y: 15 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [lang]);

  const expertiseCards = [
    { title: t.card1, icon: <Layers className="w-5 h-5 text-neutral-200" /> },
    { title: t.card2, icon: <Image className="w-5 h-5 text-neutral-200" /> },
    { title: t.card3, icon: <PenTool className="w-5 h-5 text-neutral-200" /> },
    { title: t.card4, icon: <Monitor className="w-5 h-5 text-neutral-200" /> },
  ];

  const scrollToSkills = () => {
    const el = document.querySelector('#skills-expertise');
    if (el) {
      const navHeight = 80;
      window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY - navHeight,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section
      id="about-me"
      ref={sectionRef}
      className="relative pt-24 pb-16 bg-[#09070c] overflow-hidden"
    >
      {/* Ambient background glows */}
      <div className="absolute top-1/3 left-10 w-[500px] h-[500px] bg-rose-950/20 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-[550px] h-[550px] bg-[#341624]/20 blur-[160px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Side: Large Portrait with Floating Glass Cards (5 cols) */}
          <div className="about-reveal lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md">
              
              {/* Outer Radiant Glow */}
              <div className="absolute -inset-2 bg-gradient-to-tr from-rose-500/20 to-amber-500/10 rounded-3xl blur-xl opacity-60" />

              {/* Portrait Image Container */}
              <div className="relative rounded-3xl overflow-hidden glass-panel border border-white/10 shadow-2xl h-[420px] sm:h-[480px]">
                
                {/* Official Designer Portrait of Mohammed Maher Aldaya */}
                <div className="w-full h-full relative overflow-hidden bg-gradient-to-b from-[#1a121e] via-[#241525] to-[#140b17] flex items-end justify-center">
                  {/* Atmospheric backlights */}
                  <div className="absolute top-6 right-4 w-52 h-52 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute bottom-10 left-4 w-60 h-60 bg-rose-600/25 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute inset-0 bg-radial from-transparent via-[#140b17]/20 to-[#09070c]/70 pointer-events-none" />

                  {!isSettingsLoaded ? (
                    <Skeleton className="w-full h-full rounded-3xl" />
                  ) : (
                    /* Official Image - Bottom-aligned, centered horizontally, natural proportions */
                    <img
                      src={profilePhoto}
                      alt={designerFullName || 'Mohammed Maher Aldaya'}
                      className="relative z-10 h-[76%] sm:h-[80%] w-auto max-w-[85%] sm:max-w-[88%] object-contain object-bottom drop-shadow-[0_20px_40px_rgba(0,0,0,0.9)] transition-transform duration-700 hover:scale-[1.02]"
                      data-testid="about-profile-image"
                      loading="lazy"
                      decoding="async"
                    />
                  )}

                  {/* Subtle bottom gradient vignette to ensure smooth merge */}
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#140b17] via-[#140b17]/40 to-transparent z-10 pointer-events-none" />
                </div>

                {/* Top-Left Floating Glass Card: Graphic Designer */}
                <div className="absolute top-4 left-4 rtl:left-auto rtl:right-4 p-3 rounded-2xl glass-panel-active border border-white/20 shadow-xl max-w-[220px] z-20 backdrop-blur-xl">
                  {!isSettingsLoaded ? (
                    <div className="space-y-1.5 py-0.5" aria-busy="true">
                      <Skeleton className="w-24 h-4 rounded" />
                      <Skeleton className="w-32 h-3 rounded" />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5 text-amber-300 mb-1">
                        <Sparkles className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-xs font-serif font-bold text-white truncate block">
                          {designerFullName}
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-300 font-sans tracking-wide leading-tight line-clamp-2">
                        {designerTitle}
                      </p>
                    </>
                  )}
                </div>

                {/* Bottom Overlay Glass Card: 3 Dynamic Stats */}
                <div className="absolute bottom-4 inset-x-4 p-3.5 sm:p-4 rounded-2xl glass-panel-active border border-white/20 shadow-xl z-20 backdrop-blur-xl">
                  <div className="grid grid-cols-3 divide-x divide-white/10 text-center rtl:divide-x-reverse">
                    <div>
                      {!isSettingsLoaded ? (
                        <Skeleton className="w-12 h-6 mx-auto mb-1 rounded" />
                      ) : (
                        <div className="text-lg sm:text-xl font-serif font-bold text-white tabular-nums" data-testid="about-stat-projects">
                          {statProjectsCount}
                        </div>
                      )}
                      <div className="text-[10px] sm:text-xs text-neutral-300 font-light mt-0.5">
                        {t.statProjects}
                      </div>
                    </div>

                    <div>
                      {!isSettingsLoaded ? (
                        <Skeleton className="w-12 h-6 mx-auto mb-1 rounded" />
                      ) : (
                        <div className="text-lg sm:text-xl font-serif font-bold text-white tabular-nums">
                          {statClientsCount}
                        </div>
                      )}
                      <div className="text-[10px] sm:text-xs text-neutral-300 font-light mt-0.5">
                        {t.statClients}
                      </div>
                    </div>

                    <div>
                      {!isSettingsLoaded ? (
                        <Skeleton className="w-12 h-6 mx-auto mb-1 rounded" />
                      ) : (
                        <div className="text-lg sm:text-xl font-serif font-bold text-white tabular-nums">
                          {statYearsCount}
                        </div>
                      )}
                      <div className="text-[10px] sm:text-xs text-neutral-300 font-light mt-0.5">
                        {t.statYears}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Right Side: Heading, Description, 4 Cards, CTA & Signature (7 cols) */}
          <div className="about-reveal lg:col-span-7 text-left rtl:text-right">
            {/* Kicker: e.g. "03 / About Me ——" */}
            {!isSettingsLoaded ? (
              <Skeleton className="w-32 h-4 mb-3 rounded" />
            ) : (
              kicker ? (
                <div className="text-xs sm:text-sm font-mono text-neutral-400 mb-3 tracking-wider">
                  {kicker}
                </div>
              ) : null
            )}

            {/* Title: "About Me" */}
            {!isSettingsLoaded ? (
              <Skeleton className="w-56 sm:w-72 h-10 sm:h-14 mb-3 rounded-lg" />
            ) : (
              (titleStart || titleAccent) ? (
                <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-white leading-tight mb-3">
                  <span>{titleStart} </span>
                  <span className="text-[#f4a496] italic font-serif">{titleAccent}</span>
                </h2>
              ) : null
            )}

            {/* Prominent Designer Identity & Professional Title */}
            {!isSettingsLoaded ? (
              <div className="mb-6 space-y-2" aria-busy="true">
                <Skeleton className="w-64 h-8 rounded-md" />
                <Skeleton className="w-72 sm:w-96 h-4 rounded-md" />
              </div>
            ) : (
              (designerFullName || designerTitle) ? (
                <div className="mb-6 space-y-1">
                  {designerFullName && (
                    <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight" data-testid="about-designer-name">
                      {designerFullName}
                    </h3>
                  )}
                  {designerTitle && (
                    <p className="text-xs sm:text-sm font-mono tracking-wider text-[#f4a496] font-medium uppercase" data-testid="about-designer-title">
                      {designerTitle}
                    </p>
                  )}
                </div>
              ) : null
            )}

            {/* Description Paragraph */}
            {!isSettingsLoaded ? (
              <div className="space-y-2.5 mb-8 max-w-2xl" aria-busy="true">
                <Skeleton className="w-full h-4 rounded" />
                <Skeleton className="w-11/12 h-4 rounded" />
                <Skeleton className="w-4/5 h-4 rounded" />
              </div>
            ) : (
              description ? (
                <p className="text-base sm:text-lg text-neutral-300 font-light leading-relaxed mb-8 max-w-2xl whitespace-pre-line" data-testid="about-designer-bio">
                  {description}
                </p>
              ) : null
            )}

            {/* Subtle localized retry prompt if settings request failed */}
            {settingsError && !isSettingsLoaded && (
              <div className="flex items-center gap-2 mb-4 text-xs text-rose-300/80">
                <span>{lang === 'ar' ? 'تعذر تحميل بيانات الملف الشخصي' : 'Unable to load profile data'}</span>
                {onRetrySettings && (
                  <button onClick={onRetrySettings} className="underline hover:text-white transition-colors cursor-pointer">
                    {lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}
                  </button>
                )}
              </div>
            )}

            {/* Four Expertise Cards in a row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-10">
              {expertiseCards.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl glass-panel border border-white/10 hover:border-rose-300/30 transition-all duration-300 flex flex-col items-center justify-center text-center group"
                >
                  <div className="p-2.5 rounded-xl bg-white/5 group-hover:bg-rose-500/20 text-neutral-200 group-hover:text-rose-200 transition-colors mb-2.5">
                    {item.icon}
                  </div>
                  <span className="text-xs font-medium text-white leading-tight">
                    {item.title}
                  </span>
                </div>
              ))}
            </div>

            {/* Bottom Row: White CTA Button + Signature */}
            <div className="flex flex-wrap items-center justify-between gap-6 pt-2">
              <button
                onClick={scrollToSkills}
                className="inline-flex items-center gap-2 px-6 sm:px-7 py-3 rounded-full text-sm font-semibold text-neutral-900 bg-white hover:bg-neutral-100 shadow-xl transition-all duration-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <span>{t.moreAboutMe}</span>
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform rtl:rotate-180" />
              </button>

              {/* Elegant Designer Cursive Signature in Rose Gold */}
              <div className="opacity-90 hover:opacity-100 transition-opacity">
                <svg className="w-32 sm:w-36 h-12 text-[#f4a496]" viewBox="0 0 160 50" fill="none">
                  <path
                    d="M10,35 C25,15 35,8 45,22 C55,36 30,42 40,30 C50,18 70,25 80,32 C90,39 105,20 115,25 C125,30 145,22 155,20"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <line x1="60" y1="28" x2="135" y2="28" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Luminous Wave Transition to Skills */}
      <WaveTransition variant="subtle" className="mt-16 -mb-4" />
    </section>
  );
};

export default AboutSection;
