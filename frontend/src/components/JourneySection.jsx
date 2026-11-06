import React, { useRef, useEffect, useState } from 'react';
import { translations, timelineData } from '../data/portfolioData';
import { GraduationCap, Laptop, Briefcase, Award, Rocket, Sparkles, Star, ArrowUpRight } from 'lucide-react';
import { WaveTransition } from './WaveTransition';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export const JourneySection = ({ lang }) => {
  const t = translations[lang].journey;
  const [milestones, setMilestones] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const local = window.localStorage.getItem('studio_journey_cache');
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}
    }
    return timelineData;
  });
  const journeyRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    async function loadDynamicJourney() {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(`/api/v1/journey?locale=${lang}`, { signal: controller.signal });
        clearTimeout(timer);
        if (!res.ok) return;
        const data = await res.json();
        if (
          isMounted &&
          data?.status === 'success' &&
          Array.isArray(data?.data?.milestones) &&
          data.data.milestones.length > 0
        ) {
          setMilestones(data.data.milestones);
          try {
            window.localStorage.setItem('studio_journey_cache', JSON.stringify(data.data.milestones));
          } catch (e) {}
        }
      } catch (e) {
        // Fallback gracefully to cached/default timelineData without hanging
      }
    }
    loadDynamicJourney();
    return () => {
      isMounted = false;
    };
  }, [lang]);

  const getMilestoneIcon = (iconName) => {
    switch (iconName) {
      case 'GraduationCap':
        return <GraduationCap className="w-5 h-5 text-neutral-200" />;
      case 'Laptop':
        return <Laptop className="w-5 h-5 text-neutral-200" />;
      case 'Briefcase':
        return <Briefcase className="w-5 h-5 text-neutral-200" />;
      case 'Award':
        return <Award className="w-5 h-5 text-neutral-200" />;
      case 'Rocket':
        return <Rocket className="w-5 h-5 text-amber-200" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-[#f4a496]" />;
      case 'Star':
        return <Star className="w-5 h-5 text-amber-300" />;
      default:
        return <Award className="w-5 h-5 text-neutral-200" />;
    }
  };

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 1024 || ('ontouchstart' in window);
    if (prefersReduced || isMobile) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.milestone-card',
        { opacity: 0.7, y: 15 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.18,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: journeyRef.current,
            start: 'top 75%',
            toggleActions: 'play none none none',
          },
        }
      );
    }, journeyRef);

    return () => ctx.revert();
  }, [lang]);

  return (
    <section
      id="creative-journey"
      ref={journeyRef}
      className="relative pt-24 pb-20 bg-[#09070c] overflow-hidden"
    >
      {/* Background Soft Glows */}
      <div className="absolute top-1/3 left-10 w-[550px] h-[550px] bg-rose-950/15 blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-[550px] h-[550px] bg-[#311122]/20 blur-[150px] rounded-full pointer-events-none" />

      {/* Decorative Background Elements matching reference */}
      {/* 1. Top-Right Botanical Leaf Branch */}
      <div className="absolute -top-10 right-4 sm:right-16 w-48 sm:w-64 h-48 sm:h-64 opacity-40 pointer-events-none blur-[0.5px]">
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full text-emerald-800">
          <path d="M90,10 Q60,40 20,60" stroke="#3b5936" strokeWidth="2" />
          <ellipse cx="60" cy="30" rx="12" ry="6" fill="#4d7347" transform="rotate(-30 60 30)" />
          <ellipse cx="40" cy="45" rx="10" ry="5" fill="#3b5936" transform="rotate(-15 40 45)" />
          <ellipse cx="75" cy="20" rx="14" ry="7" fill="#5c8a55" transform="rotate(-40 75 20)" />
        </svg>
      </div>

      {/* 2. Lower-Left Ceramic Coffee Cup with Latte Art */}
      <div className="absolute bottom-12 -left-10 sm:left-4 w-40 sm:w-52 h-40 sm:h-52 opacity-35 pointer-events-none">
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="w-28 sm:w-36 h-28 sm:h-36 rounded-full bg-neutral-900 border-4 border-neutral-700 shadow-2xl flex items-center justify-center p-3">
            {/* Dark Coffee & Milk Foam Rosette */}
            <div className="w-full h-full rounded-full bg-gradient-to-br from-[#3b2318] via-[#24150d] to-[#140b07] flex items-center justify-center shadow-inner relative overflow-hidden">
              <div className="w-10 sm:w-14 h-10 sm:h-14 rounded-full border-2 border-amber-200/50 flex items-center justify-center">
                <div className="w-4 h-4 bg-amber-100/40 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Right Side: Digital Drawing Tablet with "MO" Logo & Stylus */}
      <div className="absolute top-1/2 -right-16 sm:right-0 -translate-y-1/2 w-48 sm:w-72 h-64 sm:h-96 opacity-30 pointer-events-none transform rotate-12">
        <div className="w-full h-full rounded-3xl bg-neutral-950 border-4 border-neutral-800 shadow-2xl p-6 flex flex-col items-center justify-center relative">
          <img
            src="/logo/logo.png"
            alt="MO"
            className="w-24 sm:w-36 h-auto object-contain opacity-80"
          />
          <div className="absolute -left-6 bottom-8 w-4 h-36 bg-rose-200/60 rounded-full transform -rotate-45 shadow-lg" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Top-Left Header: Kicker, Title, Subtitle, Button */}
        <div className="max-w-2xl mb-16 text-left rtl:text-right">
          <div className="text-xs sm:text-sm font-mono text-neutral-400 mb-2 tracking-wider">
            {t.kicker}
          </div>
          <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-white leading-[1.1] mb-4">
            <span>{t.titleStart} </span>
            <span className="text-[#f4a496] italic font-serif">{t.titleAccent}</span>
          </h2>
          <p className="text-sm sm:text-base text-neutral-400 font-light leading-relaxed mb-6">
            {t.description}
          </p>

          <a
            href="#selected-work"
            className="inline-flex items-center gap-2 px-6 sm:px-7 py-3 rounded-full text-sm font-semibold text-neutral-900 bg-white hover:bg-neutral-100 shadow-xl transition-all duration-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <span>{t.viewFull}</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform rtl:rotate-180" />
          </a>
        </div>

        {/* Alternating Vertical Timeline */}
        <div className="relative max-w-4xl mx-auto my-8">
          
          {/* Vertical Glowing Center Line */}
          <div className="absolute left-8 md:left-1/2 top-4 bottom-4 -translate-x-1/2 w-[1.5px] bg-gradient-to-b from-rose-300/40 via-amber-200/30 to-amber-500/50" />

          <div className="space-y-10 sm:space-y-12">
            {milestones.map((item, idx) => {
              const isEven = idx % 2 === 0; // 0 (2022) is on right, 1 (2023) is on left...
              // In the reference:
              // 2022 (Right)
              // 2023 (Left)
              // 2024 (Right)
              // 2025 (Left)
              // 2026+ (Right)

              const isRightSide = idx === 0 || idx === 2 || idx === 4;

              return (
                <div
                  key={idx}
                  className={`milestone-card relative flex flex-col md:flex-row items-start md:items-center ${
                    isRightSide ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}
                >
                  {/* Center Node & Year Label */}
                  <div className="absolute left-8 md:left-1/2 -translate-x-1/2 flex items-center justify-center z-20">
                    {/* Year text badge placed adjacent to the node */}
                    <span
                      className={`hidden md:block absolute text-xs sm:text-sm font-mono font-semibold tracking-wider ${
                        isRightSide
                          ? '-left-16 text-right'
                          : '-right-16 text-left'
                      } ${item.highlighted ? 'text-amber-300 font-bold' : 'text-neutral-300'}`}
                    >
                      {item.year}
                    </span>

                    {/* Illuminated Node Dot */}
                    <div
                      className={`w-4 h-4 rounded-full border-2 transition-all ${
                        item.highlighted
                          ? 'bg-amber-400 border-amber-200 ring-4 ring-amber-500/30'
                          : 'bg-white border-rose-300 ring-2 ring-rose-400/20'
                      }`}
                    />
                  </div>

                  {/* Empty opposite column on desktop */}
                  <div className="hidden md:block md:w-1/2" />

                  {/* Milestone Glassmorphism Card */}
                  <div
                    className={`w-full pl-16 md:pl-0 md:w-1/2 ${
                      isRightSide
                        ? 'md:pl-12 rtl:md:pl-0 rtl:md:pr-12'
                        : 'md:pr-12 rtl:md:pr-0 rtl:md:pl-12'
                    }`}
                  >
                    <div
                      className={`p-5 sm:p-6 rounded-3xl transition-all duration-300 shadow-xl group text-left rtl:text-right ${
                        item.highlighted
                          ? 'glass-panel-active border-2 border-amber-400/50 shadow-[0_10px_35px_rgba(245,158,11,0.25)]'
                          : 'glass-panel border border-white/10 hover:border-rose-300/30'
                      }`}
                    >
                      {/* Mobile Year Badge */}
                      <span className="md:hidden inline-block text-xs font-mono font-bold text-amber-300 mb-2">
                        {item.year}
                      </span>

                      <div className="flex items-start gap-4">
                        <div
                          className={`p-3 rounded-2xl shrink-0 ${
                            item.highlighted
                              ? 'bg-amber-500/20 text-amber-200 border border-amber-300/30'
                              : 'bg-white/5 text-neutral-200 border border-white/10'
                          }`}
                        >
                          {getMilestoneIcon(item.iconName || item.icon_name || item.icon)}
                        </div>

                        <div>
                          <h3 className="text-base sm:text-lg font-serif font-bold text-white group-hover:text-rose-200 transition-colors">
                            {item.activeRole || (typeof item.role === 'object' ? item.role?.[lang] : item.role) || item.role_en || ''}
                          </h3>
                          <p className="text-xs sm:text-sm text-neutral-400 font-light mt-1 leading-relaxed">
                            {item.activeDescription || (typeof item.description === 'object' ? item.description?.[lang] : item.description) || item.description_en || ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

        </div>

      </div>

      {/* Luminous Wave Transition to Contact */}
      <WaveTransition variant="inverted" className="mt-16 -mb-4" />
    </section>
  );
};

export default JourneySection;
