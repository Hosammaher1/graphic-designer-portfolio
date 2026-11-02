import React, { useRef, useEffect } from 'react';
import { translations } from '../data/portfolioData';
import { Layers, Image, PenTool, Monitor, Sparkles, ArrowUpRight } from 'lucide-react';
import { WaveTransition } from './WaveTransition';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export const AboutSection = ({ lang }) => {
  const t = translations[lang].about;
  const sectionRef = useRef(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.about-reveal',
        { opacity: 0, y: 30 },
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
                
                {/* Real photographic illustration of designer holding stylus */}
                <div className="w-full h-full relative overflow-hidden bg-gradient-to-b from-[#1a121e] via-[#241525] to-[#140b17]">
                  {/* Atmospheric backlight */}
                  <div className="absolute top-10 right-4 w-52 h-52 bg-amber-500/20 rounded-full blur-2xl" />
                  <div className="absolute bottom-10 left-4 w-60 h-60 bg-rose-600/20 rounded-full blur-3xl" />

                  {/* Stylized Silhouette & Studio Environment */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg viewBox="0 0 320 400" className="w-full h-full object-cover text-neutral-100" fill="none">
                      {/* Studio table & tablet */}
                      <rect x="0" y="310" width="320" height="90" fill="#130915" />
                      <path d="M20,330 L110,270 L140,290 L40,360 Z" fill="#201025" stroke="#482550" strokeWidth="1.5" />
                      
                      {/* Stylus in hand */}
                      <line x1="88" y1="160" x2="88" y2="230" stroke="#f6c5b9" strokeWidth="4" strokeLinecap="round" />
                      
                      {/* Designer Body & Head Silhouette with warm lighting */}
                      <path
                        d="M160,100 C135,100 120,120 120,150 C120,170 130,195 145,205 C115,220 80,245 60,310 L260,310 C240,245 205,220 175,205 C190,195 200,170 200,150 C200,120 185,100 160,100 Z"
                        fill="#1f1122"
                      />
                      {/* Beard & Hair details */}
                      <path
                        d="M135,140 C135,120 145,105 160,105 C175,105 185,120 185,140 C185,150 180,165 175,175 C165,185 155,185 145,175 C140,165 135,150 135,140 Z"
                        fill="#2c1a2f"
                      />
                      {/* Warm rim light along face */}
                      <path
                        d="M165,115 C175,125 180,140 180,160 C180,175 170,185 160,185"
                        stroke="#fbcfe8"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        opacity="0.8"
                      />
                    </svg>
                  </div>
                </div>

                {/* Top-Left Floating Glass Card: Graphic Designer */}
                <div className="absolute top-4 left-4 rtl:left-auto rtl:right-4 p-3 rounded-2xl glass-panel-active border border-white/20 shadow-xl max-w-[200px]">
                  <div className="flex items-center gap-1.5 text-amber-300 mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="text-xs font-serif font-bold text-white">
                      {t.badgeTitle}
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-300 font-sans tracking-wide">
                    {t.badgeSubtitle}
                  </p>
                </div>

                {/* Bottom Overlay Glass Card: 50+ Projects | 20+ Clients | 5+ Years */}
                <div className="absolute bottom-4 inset-x-4 p-3.5 sm:p-4 rounded-2xl glass-panel-active border border-white/20 shadow-xl">
                  <div className="grid grid-cols-3 divide-x divide-white/10 text-center rtl:divide-x-reverse">
                    <div>
                      <div className="text-lg sm:text-xl font-serif font-bold text-white tabular-nums">
                        50<span className="text-rose-300 font-sans">+</span>
                      </div>
                      <div className="text-[10px] sm:text-xs text-neutral-300 font-light mt-0.5">
                        {t.statProjects}
                      </div>
                    </div>

                    <div>
                      <div className="text-lg sm:text-xl font-serif font-bold text-white tabular-nums">
                        20<span className="text-rose-300 font-sans">+</span>
                      </div>
                      <div className="text-[10px] sm:text-xs text-neutral-300 font-light mt-0.5">
                        {t.statClients}
                      </div>
                    </div>

                    <div>
                      <div className="text-lg sm:text-xl font-serif font-bold text-white tabular-nums">
                        5<span className="text-rose-300 font-sans">+</span>
                      </div>
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
            {/* Kicker: "03 / About Me ——" */}
            <div className="text-xs sm:text-sm font-mono text-neutral-400 mb-3 tracking-wider">
              {t.kicker}
            </div>

            {/* Title: "About Me" */}
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-white leading-tight mb-6">
              <span>{t.titleStart} </span>
              <span className="text-[#f4a496] italic font-serif">{t.titleAccent}</span>
            </h2>

            {/* Description Paragraph */}
            <p className="text-base sm:text-lg text-neutral-300 font-light leading-relaxed mb-8 max-w-2xl">
              {t.description}
            </p>

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
