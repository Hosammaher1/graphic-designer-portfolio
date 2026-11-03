import React, { useRef, useEffect } from 'react';
import { translations, resolveText } from '../data/portfolioData';
import { WaveTransition } from './WaveTransition';
import { ArrowUpRight, ChevronDown } from 'lucide-react';
import gsap from 'gsap';

export const HeroSection = ({
  lang,
  onOpenProject,
  settings,
  featuredProject,
}) => {
  const t = translations[lang].hero;

  const kicker = settings?.hero?.[lang === 'ar' ? 'kickerAr' : 'kickerEn'] || t.kicker;
  const titleLine1 = settings?.hero?.[lang === 'ar' ? 'titleStartAr' : 'titleStartEn'] || t.titleLine1;
  const titleLine2 = settings?.hero?.[lang === 'ar' ? 'titleAccentAr' : 'titleAccentEn'] || t.titleLine2;
  const description = settings?.hero?.[lang === 'ar' ? 'descAr' : 'descEn'] || t.description;

  const hasFeatured = Boolean(featuredProject);
  const cardKicker = hasFeatured
    ? (lang === 'ar' ? 'مشروع مميز' : 'FEATURED CASE')
    : (lang === 'ar' ? 'استوديو التصميم' : 'STUDIO ARCHIVE');
  const cardTitle = hasFeatured
    ? resolveText(featuredProject.title, lang, 'Studio Case')
    : (settings?.profile?.[lang === 'ar' ? 'taglineAr' : 'taglineEn'] || t.featuredCardTitle);

  const handleCardClick = () => {
    if (hasFeatured && (featuredProject.slug || featuredProject.id)) {
      onOpenProject(featuredProject.slug || featuredProject.id);
    } else {
      scrollToAbout();
    }
  };

  const heroRef = useRef(null);
  const titleRef = useRef(null);
  const cardStackRef = useRef(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      // Staggered reveal for headline, description, and buttons
      gsap.fromTo(
        '.hero-stagger',
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 0.85, stagger: 0.12, ease: 'power3.out' }
      );

      // Subtle floating animation for 3D card deck
      if (cardStackRef.current) {
        gsap.to(cardStackRef.current, {
          y: -10,
          duration: 3.5,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      }
    }, heroRef);

    return () => ctx.revert();
  }, [lang]);

  const scrollToWork = () => {
    const el = document.querySelector('#selected-work');
    if (el) {
      const navHeight = 80;
      window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY - navHeight,
        behavior: 'smooth',
      });
    }
  };

  const scrollToAbout = () => {
    const el = document.querySelector('#about-me');
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
      id="hero"
      ref={heroRef}
      className="relative min-h-screen flex flex-col justify-between pt-32 pb-0 bg-[#09070c] overflow-hidden"
    >
      {/* Background Cinematic Radiant Glows */}
      <div className="absolute top-1/4 -right-20 w-[650px] h-[650px] bg-rose-900/20 blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-[#3a1523]/25 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-[450px] h-[450px] bg-rose-950/20 blur-[140px] rounded-full pointer-events-none" />

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full flex-1 flex flex-col justify-center py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Typographic Hierarchy */}
          <div className="lg:col-span-6 flex flex-col items-start text-left rtl:text-right">
            {/* Kicker: "Hello, I'm a" */}
            <p className="hero-stagger text-base sm:text-lg text-neutral-300 font-light mb-3">
              {kicker}
            </p>

            {/* Large Serif Display Headline */}
            <h1
              ref={titleRef}
              className="hero-stagger font-serif text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-normal tracking-tight text-white leading-[1.05] mb-6"
            >
              <span className="block">{titleLine1}</span>
              <span className="block italic">{titleLine2}</span>
            </h1>

            {/* Subtitle */}
            <p className="hero-stagger text-base sm:text-lg text-neutral-300/90 leading-relaxed max-w-lg mb-8 font-light">
              {description}
            </p>

            {/* Pill Action Buttons */}
            <div className="hero-stagger flex flex-wrap items-center gap-4">
              <button
                onClick={scrollToWork}
                className="inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3.5 rounded-full text-sm font-semibold text-neutral-900 bg-white hover:bg-neutral-100 shadow-xl hover:shadow-2xl transition-all duration-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <span>{t.viewWork}</span>
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform rtl:rotate-180" />
              </button>

              <button
                onClick={scrollToAbout}
                className="inline-flex items-center justify-center px-6 sm:px-7 py-3.5 rounded-full text-sm font-medium text-white bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/30 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
              >
                <span>{t.aboutMe}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Layered 3D Perspective Card Deck */}
          <div className="lg:col-span-6 flex items-center justify-center lg:justify-end">
            <div
              ref={cardStackRef}
              className="relative w-full max-w-[480px] sm:max-w-[540px] h-[340px] sm:h-[400px] flex items-center justify-center"
            >
              {/* Back Card 1 (Tilted left in perspective) */}
              <div className="absolute left-0 w-[68%] h-[82%] rounded-3xl bg-[#1b121c] border border-white/10 shadow-2xl transform -rotate-12 translate-x-[-12%] translate-y-[5%] opacity-40 blur-[0.5px] overflow-hidden">
                <div className="w-full h-full bg-gradient-to-tr from-black via-rose-950/40 to-transparent p-4 flex flex-col justify-end">
                  <div className="text-[10px] font-mono text-neutral-400">ARCHIVE 01</div>
                </div>
              </div>

              {/* Back Card 2 (Tilted right in perspective) */}
              <div className="absolute right-0 w-[72%] h-[86%] rounded-3xl bg-[#170e19] border border-white/10 shadow-2xl transform rotate-6 translate-x-[10%] translate-y-[2%] opacity-60 overflow-hidden">
                <div className="w-full h-full bg-gradient-to-bl from-black/80 via-rose-900/30 to-black p-4 flex flex-col justify-end">
                  <div className="text-[10px] font-mono text-rose-300/60">COLLECTION</div>
                </div>
              </div>

              {/* Center Prominent Card with Botanical Petal Graphic */}
              <div
                onClick={handleCardClick}
                className="relative z-20 w-[84%] sm:w-[86%] h-[92%] rounded-3xl glass-panel-active border border-rose-300/30 shadow-[0_25px_60px_rgba(0,0,0,0.85)] p-5 sm:p-6 flex flex-col justify-between overflow-hidden cursor-pointer group hover:scale-[1.02] transition-transform duration-500"
              >
                {/* Botanical Petal Floral Artwork */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#2b1420] via-[#1a0a14] to-[#0c0409]">
                  {/* Glowing Ambient Radial in Petal Center */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-tr from-rose-500/30 via-amber-400/20 to-transparent blur-2xl rounded-full" />
                  
                  {/* Stylized Organic Blossom Petals */}
                  <svg
                    className="absolute right-2 top-2 w-[85%] h-[85%] text-rose-300/40 drop-shadow-[0_10px_25px_rgba(235,119,139,0.3)] transform rotate-12 group-hover:scale-105 transition-transform duration-700"
                    viewBox="0 0 200 200"
                    fill="none"
                  >
                    <path
                      d="M100,20 C130,50 170,80 180,120 C150,150 110,170 80,140 C50,110 70,50 100,20 Z"
                      fill="url(#petalGrad1)"
                    />
                    <path
                      d="M60,60 C90,80 120,110 130,150 C100,170 60,160 40,130 C20,100 30,70 60,60 Z"
                      fill="url(#petalGrad2)"
                      opacity="0.8"
                    />
                    <defs>
                      <linearGradient id="petalGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fca5a5" />
                        <stop offset="40%" stopColor="#fb7185" />
                        <stop offset="80%" stopColor="#e11d48" />
                        <stop offset="100%" stopColor="#881337" />
                      </linearGradient>
                      <linearGradient id="petalGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#fed7aa" />
                        <stop offset="50%" stopColor="#f472b6" />
                        <stop offset="100%" stopColor="#4c0519" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                {/* Card Top Pill Badge */}
                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs font-mono tracking-widest text-rose-200/90 uppercase px-3 py-1 rounded-full glass-panel-subtle border border-rose-300/20">
                    {cardKicker}
                  </span>
                </div>

                {/* Card Bottom: Project / Tagline + Circle Arrow Button */}
                <div className="relative z-10 flex items-end justify-between gap-3 pt-6 border-t border-rose-300/15">
                  <div>
                    <h3 className="font-serif text-lg sm:text-xl font-medium text-white italic tracking-wide leading-tight">
                      {cardTitle}
                    </h3>
                  </div>

                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform shadow-lg">
                    <ArrowUpRight className="w-5 h-5 rtl:rotate-180" />
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Scroll Indicator at Bottom */}
        <div className="mt-8 mb-2 flex flex-col items-center justify-center text-center">
          <button
            onClick={scrollToWork}
            className="flex flex-col items-center gap-1.5 text-neutral-400 hover:text-white transition-colors group focus:outline-none"
            aria-label="Scroll to explore selected work"
          >
            {/* Mouse Outline Icon with Animated Dot */}
            <div className="w-5 h-8 rounded-full border-2 border-neutral-400 group-hover:border-rose-300 flex items-start justify-center p-1 transition-colors">
              <div className="w-1 h-2 rounded-full bg-rose-300 animate-bounce" />
            </div>
            <span className="text-xs font-light text-neutral-300 tracking-wider">
              {t.scroll}
            </span>
            <ChevronDown className="w-4 h-4 text-neutral-400 group-hover:text-rose-300 transition-colors" />
          </button>
        </div>
      </div>

      {/* Signature Illuminated Wave Transition to Selected Work */}
      <WaveTransition variant="hero-to-work" className="-mb-1" />
    </section>
  );
};

export default HeroSection;
