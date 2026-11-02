import React, { useRef, useEffect } from 'react';
import { translations } from '../data/portfolioData';
import {
  Layers,
  Monitor,
  Play,
  Zap,
  Target,
  Sparkles,
  Rocket,
  ArrowRight,
} from 'lucide-react';
import { WaveTransition } from './WaveTransition';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const SkillsSection = ({ lang }) => {
  const t = translations[lang].skills;
  const sectionRef = useRef(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.skill-stagger',
        { opacity: 0, y: 25 },
        {
          opacity: 1,
          y: 0,
          duration: 0.75,
          stagger: 0.08,
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

  const softwareIcons = [
    {
      id: 'ai',
      name: 'Illustrator',
      glyph: 'Ai',
      bg: 'bg-[#330000]',
      color: 'text-[#ff9a00]',
      border: 'border-[#ff9a00]/30',
    },
    {
      id: 'ps',
      name: 'Photoshop',
      glyph: 'Ps',
      bg: 'bg-[#001e36]',
      color: 'text-[#31a8ff]',
      border: 'border-[#31a8ff]/30',
    },
    {
      id: 'id',
      name: 'InDesign',
      glyph: 'Id',
      bg: 'bg-[#2b0017]',
      color: 'text-[#ff3366]',
      border: 'border-[#ff3366]/30',
    },
    {
      id: 'ae',
      name: 'After Effects',
      glyph: 'Ae',
      bg: 'bg-[#190033]',
      color: 'text-[#9999ff]',
      border: 'border-[#9999ff]/30',
    },
    {
      id: 'pr',
      name: 'Premiere Pro',
      glyph: 'Pr',
      bg: 'bg-[#220033]',
      color: 'text-[#ea77ff]',
      border: 'border-[#ea77ff]/30',
    },
    {
      id: 'figma',
      name: 'Figma',
      isSvg: true,
      svg: (
        <svg viewBox="0 0 38 57" className="w-5 h-7">
          <path d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z" fill="#1ABCFE" />
          <path d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z" fill="#0ACF83" />
          <path d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19z" fill="#FF7262" />
          <path d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z" fill="#F24E1E" />
          <path d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z" fill="#A259FF" />
        </svg>
      ),
    },
    {
      id: 'blender',
      name: 'Blender',
      isSvg: true,
      svg: (
        <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#ea7600]" fill="currentColor">
          <circle cx="12" cy="14" r="4" fill="#255799" />
          <path d="M12 2C6.5 2 2 6.5 2 12c0 2.2.7 4.2 2 5.8L12 10l8 7.8c1.3-1.6 2-3.6 2-5.8 0-5.5-4.5-10-10-10z" fill="#ea7600" />
        </svg>
      ),
    },
    {
      id: 'capcut',
      name: 'CapCut',
      isSvg: true,
      svg: (
        <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M4 8l16 8M4 16l16-8" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: 'notion',
      name: 'Notion',
      glyph: 'N',
      bg: 'bg-neutral-900',
      color: 'text-white',
      border: 'border-white/20',
      font: 'font-serif font-black',
    },
    {
      id: 'trello',
      name: 'Trello',
      isSvg: true,
      svg: (
        <div className="w-6 h-6 rounded-md bg-[#0079bf] p-1 flex gap-1 items-start justify-center shadow-sm">
          <div className="w-1.5 h-3.5 bg-white rounded-sm" />
          <div className="w-1.5 h-2.5 bg-white rounded-sm" />
        </div>
      ),
    },
  ];

  const expertiseCards = [
    {
      icon: <Layers className="w-5 h-5 text-neutral-200" />,
      title: t.expertise1Title,
      desc: t.expertise1Desc,
    },
    {
      icon: <Monitor className="w-5 h-5 text-neutral-200" />,
      title: t.expertise2Title,
      desc: t.expertise2Desc,
    },
    {
      icon: <Play className="w-5 h-5 text-neutral-200 fill-current" />,
      title: t.expertise3Title,
      desc: t.expertise3Desc,
    },
  ];

  const principles = [
    { icon: <Zap className="w-5 h-5 text-amber-300" />, title: t.p1Title, desc: t.p1Desc },
    { icon: <Target className="w-5 h-5 text-rose-300" />, title: t.p2Title, desc: t.p2Desc },
    { icon: <Layers className="w-5 h-5 text-neutral-200" />, title: t.p3Title, desc: t.p3Desc },
    { icon: <Rocket className="w-5 h-5 text-peach-300" />, title: t.p4Title, desc: t.p4Desc },
  ];

  return (
    <section
      id="skills-expertise"
      ref={sectionRef}
      className="relative pt-24 pb-16 bg-[#09070c] overflow-hidden"
    >
      {/* Background Soft Glows */}
      <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-rose-950/15 blur-[170px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[500px] h-[500px] bg-[#2d121f]/20 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Top Header: Kicker, Title, Subtitle */}
        <div className="skill-stagger max-w-2xl mb-12 sm:mb-16 text-left rtl:text-right">
          <div className="text-xs sm:text-sm font-mono text-neutral-400 mb-2 tracking-wider">
            {t.kicker}
          </div>
          <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-white leading-[1.1] mb-4">
            <span className="block">{t.titleLine1}</span>
            <span className="block">{t.titleLine2}</span>
          </h2>
          <p className="text-sm sm:text-base text-neutral-400 font-light leading-relaxed">
            {t.description}
          </p>
        </div>

        {/* Center Grid: Software 2x5 Grid + Floating Pen Tool + 3 Expertise Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-16">
          
          {/* Left: 10 Software Icons Grid (5 cols) */}
          <div className="lg:col-span-5">
            <div className="grid grid-cols-5 gap-2.5 sm:gap-3">
              {softwareIcons.map((tool) => (
                <div
                  key={tool.id}
                  className="p-2 sm:p-2.5 rounded-2xl glass-panel border border-white/10 hover:border-rose-300/40 hover:scale-105 transition-all duration-300 flex flex-col items-center justify-center text-center group aspect-square shadow-lg"
                >
                  {/* Icon Representation */}
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-1 overflow-hidden">
                    {tool.isSvg ? (
                      tool.svg
                    ) : (
                      <div
                        className={`w-full h-full rounded-lg ${tool.bg} ${tool.border} border flex items-center justify-center shadow-inner`}
                      >
                        <span className={`text-xs sm:text-sm font-bold ${tool.color} ${tool.font || 'font-sans'}`}>
                          {tool.glyph}
                        </span>
                      </div>
                    )}
                  </div>

                  <span className="text-[9px] sm:text-[10px] text-neutral-300 font-medium truncate w-full">
                    {tool.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Center: Floating Pen Tool with Bezier Handles & Glowing Leaves (3 cols) */}
          <div className="lg:col-span-3 flex items-center justify-center">
            <div className="relative group w-48 sm:w-56 h-48 sm:h-56 flex items-center justify-center">
              
              {/* Layered Glass Planes Behind Pen Tool */}
              <div className="absolute w-40 h-40 rounded-3xl bg-rose-500/10 border border-white/10 transform rotate-12 blur-[1px]" />
              <div className="absolute w-36 h-36 rounded-3xl bg-amber-500/10 border border-white/10 transform -rotate-6 blur-[1px]" />

              {/* Glowing Center Glass Square */}
              <div className="relative z-10 w-36 sm:w-40 h-36 sm:h-40 rounded-3xl glass-panel-active border border-rose-300/40 shadow-[0_20px_45px_rgba(244,164,150,0.3)] flex items-center justify-center p-4">
                
                {/* Pen Tool Nib & Bezier Graphic */}
                <svg viewBox="0 0 100 100" className="w-24 h-24 text-white drop-shadow-md" fill="none">
                  {/* Bezier Vector Handle Curves */}
                  <path d="M15,50 Q50,20 85,50" stroke="#f4a496" strokeWidth="2" strokeDasharray="3 3" />
                  <circle cx="15" cy="50" r="3.5" fill="#f4a496" />
                  <circle cx="85" cy="50" r="3.5" fill="#f4a496" />
                  <circle cx="50" cy="35" r="4" fill="white" />

                  {/* Pen Tool Icon Nib */}
                  <path
                    d="M50,38 L68,68 L50,90 L32,68 Z"
                    fill="white"
                  />
                  <line x1="50" y1="52" x2="50" y2="78" stroke="#1f1122" strokeWidth="2.5" />
                  <circle cx="50" cy="52" r="2" fill="#1f1122" />
                </svg>
              </div>

            </div>
          </div>

          {/* Right: 3 Expertise Cards (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-3.5">
            {expertiseCards.map((card, idx) => (
              <div
                key={idx}
                className="p-4 sm:p-5 rounded-2xl glass-panel border border-white/10 hover:border-rose-300/30 transition-all duration-300 flex items-center justify-between gap-4 group cursor-pointer shadow-lg"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-3 rounded-xl bg-white/5 group-hover:bg-rose-500/20 text-neutral-200 group-hover:text-rose-200 transition-colors shrink-0">
                    {card.icon}
                  </div>
                  <div className="text-left rtl:text-right">
                    <h4 className="text-sm sm:text-base font-semibold text-white group-hover:text-rose-200 transition-colors">
                      {card.title}
                    </h4>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {card.desc}
                    </p>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-white text-neutral-300 group-hover:text-neutral-900 flex items-center justify-center shrink-0 transition-all">
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Bottom Strip: 4 Design Principles in a Wide Rounded Capsule */}
        <div className="p-5 sm:p-6 rounded-3xl glass-panel-active border border-white/15 shadow-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left rtl:text-right divide-y sm:divide-y-0 sm:divide-x divide-white/10 rtl:sm:divide-x-reverse">
            {principles.map((pr, idx) => (
              <div key={idx} className={`flex items-start gap-3.5 ${idx > 0 ? 'pt-4 sm:pt-0 sm:pl-6 rtl:sm:pl-0 rtl:sm:pr-6' : ''}`}>
                <div className="p-2.5 rounded-xl bg-white/5 shrink-0 mt-0.5">
                  {pr.icon}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    {pr.title}
                  </h4>
                  <p className="text-xs text-neutral-400 font-light mt-0.5 leading-snug">
                    {pr.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Luminous Wave Transition to Creative Journey */}
      <WaveTransition variant="subtle" className="mt-16 -mb-4" />
    </section>
  );
};

export default SkillsSection;
