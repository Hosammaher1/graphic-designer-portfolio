import React, { useState, useEffect, useRef } from 'react';
import { translations, getFeaturedProjects } from '../data/portfolioData';
import { ProjectArtwork } from './ProjectArtworks';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import gsap from 'gsap';

export const SelectedWorkSection = ({
  lang,
  onOpenProject,
  onNavigateAllProjects,
  featuredMode = 'manual',
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const t = translations[lang].work;
  // Get exactly three featured projects according to mode (manual or latest)
  const projects = getFeaturedProjects(featuredMode, 3);
  const total = projects.length;
  const currentProject = projects[activeIndex] || projects[0];

  const sectionRef = useRef(null);
  const activeCardRef = useRef(null);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? total - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev === total - 1 ? 0 : prev + 1));
  };

  useEffect(() => {
    if (activeCardRef.current) {
      gsap.fromTo(
        activeCardRef.current,
        { scale: 0.97, opacity: 0.8 },
        { scale: 1, opacity: 1, duration: 0.45, ease: 'power2.out' }
      );
    }
  }, [activeIndex]);

  // Keyboard navigation when modal is not active
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (document.body.classList.contains('modal-open')) return;
      if (e.key === 'ArrowLeft') {
        lang === 'ar' ? handleNext() : handlePrev();
      } else if (e.key === 'ArrowRight') {
        lang === 'ar' ? handlePrev() : handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lang, total]);

  const prevIndex = activeIndex === 0 ? total - 1 : activeIndex - 1;
  const nextIndex = activeIndex === total - 1 ? 0 : activeIndex + 1;

  return (
    <section
      id="selected-work"
      ref={sectionRef}
      className="relative py-20 sm:py-28 bg-[#09070c] overflow-hidden"
    >
      {/* Background Soft Ambient Light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[550px] bg-rose-950/15 blur-[170px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header: Left Title + Right Description & Nav Controls */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12 sm:mb-16">
          
          {/* Left: Kicker + Heading */}
          <div className="text-left rtl:text-right">
            <div className="text-xs sm:text-sm font-mono text-neutral-400 mb-2 tracking-wider">
              {t.kicker}
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-white leading-[1.1]">
              <span className="block">{t.titleLine1}</span>
              <span className="block">{t.titleLine2}</span>
            </h2>
          </div>

          {/* Right: Description Paragraph + Prev/Next Circle Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-6 lg:max-w-xl text-left rtl:text-right">
            <p className="text-sm sm:text-base text-neutral-400 font-light leading-relaxed flex-1">
              {t.description}
            </p>

            {/* Circular Prev/Next Arrow Buttons */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={handlePrev}
                aria-label="Previous project"
                className="w-11 h-11 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/30 text-white flex items-center justify-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
              >
                <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
              </button>

              <button
                onClick={handleNext}
                aria-label="Next project"
                className="w-11 h-11 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/30 text-white flex items-center justify-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
              >
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </div>
          </div>

        </div>

        {/* Carousel Center Stage: Active Centered Card with Flanking Peeks */}
        <div className="relative w-full flex items-center justify-center min-h-[460px] sm:min-h-[520px] my-4">
          
          {/* Left Flanking Peek Card */}
          <div
            onClick={handlePrev}
            className="hidden lg:block absolute left-[-10%] xl:left-[-8%] w-[38%] h-[390px] rounded-3xl overflow-hidden opacity-30 hover:opacity-50 transition-all duration-500 transform scale-90 cursor-pointer pointer-events-auto border border-white/10 shadow-2xl"
          >
            <ProjectArtwork id={projects[prevIndex].artworkId} className="w-full h-full" />
            <div className="absolute inset-0 bg-black/60" />
          </div>

          {/* Large Centered Active Project Card */}
          <div
            ref={activeCardRef}
            onClick={() => onOpenProject(currentProject.id)}
            className="relative w-full max-w-4xl h-[460px] sm:h-[510px] rounded-3xl overflow-hidden glass-panel border border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.85)] cursor-pointer group"
          >
            {/* Project Artwork */}
            <ProjectArtwork id={currentProject.artworkId} className="w-full h-full object-cover" />

            {/* Subtle Contrast Gradient at bottom for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />

            {/* Top Badge: Featured Case */}
            <div className="absolute top-5 left-6 rtl:left-auto rtl:right-6 pointer-events-none">
              <span className="px-3.5 py-1 rounded-full text-[11px] font-mono tracking-widest text-rose-200 glass-panel-active border border-rose-300/30 uppercase">
                {t.featuredLabel} · 0{activeIndex + 1}/0{total}
              </span>
            </div>

            {/* Overlaid Project Information on the active card */}
            <div className="absolute bottom-6 sm:bottom-8 left-6 sm:left-10 rtl:left-auto rtl:right-6 rtl:sm:right-10 right-6 flex items-end justify-between gap-4 pointer-events-none">
              
              <div className="text-left rtl:text-right max-w-lg">
                {/* Title & Subtitle */}
                <h3 className="font-serif text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
                  {currentProject.title[lang]}
                </h3>
                <p className="font-serif text-lg sm:text-xl text-neutral-200 italic font-light mt-0.5 mb-3">
                  {currentProject.subtitle[lang]}
                </p>

                {/* Pill Tags */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs text-neutral-200 bg-white/10 backdrop-blur-md border border-white/15">
                    {t.tagBranding}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs text-neutral-200 bg-white/10 backdrop-blur-md border border-white/15">
                    {t.tagPackaging}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs text-neutral-200 bg-white/10 backdrop-blur-md border border-white/15">
                    {t.tagVisual}
                  </span>
                </div>
              </div>

              {/* White Round Arrow Button to open modal */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenProject(currentProject.id);
                }}
                aria-label="Open project case study"
                className="pointer-events-auto w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white hover:bg-neutral-100 text-neutral-900 flex items-center justify-center shrink-0 shadow-xl group-hover:scale-110 transition-transform duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <ArrowRight className="w-5 h-5 rtl:rotate-180 text-neutral-900" />
              </button>

            </div>
          </div>

          {/* Right Flanking Peek Card */}
          <div
            onClick={handleNext}
            className="hidden lg:block absolute right-[-10%] xl:right-[-8%] w-[38%] h-[390px] rounded-3xl overflow-hidden opacity-30 hover:opacity-50 transition-all duration-500 transform scale-90 cursor-pointer pointer-events-auto border border-white/10 shadow-2xl"
          >
            <ProjectArtwork id={projects[nextIndex].artworkId} className="w-full h-full" />
            <div className="absolute inset-0 bg-black/60" />
          </div>

        </div>

        {/* Carousel Pagination Dots Indicator (3 dots for 3 featured projects) */}
        <div className="flex items-center justify-center gap-2 mt-6 mb-8">
          {projects.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-1.5 transition-all duration-300 rounded-full ${
                idx === activeIndex
                  ? 'w-8 bg-white shadow-sm'
                  : 'w-2.5 bg-white/30 hover:bg-white/60'
              }`}
            />
          ))}
        </div>

        {/* Three Corresponding Interactive Rounded Thumbnails */}
        <div className="mt-4 flex justify-center">
          <div className="grid grid-cols-3 gap-3 sm:gap-6 max-w-xl w-full">
            {projects.map((item, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveIndex(idx)}
                  className={`group relative h-20 sm:h-28 rounded-2xl overflow-hidden transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 ${
                    isActive
                      ? 'border-2 border-rose-300 shadow-[0_0_20px_rgba(244,164,150,0.5)] scale-105 z-10'
                      : 'border border-white/10 opacity-60 hover:opacity-100 hover:scale-[1.02]'
                  }`}
                >
                  <ProjectArtwork id={item.artworkId} className="w-full h-full object-cover" />
                  {isActive && (
                    <div className="absolute inset-0 bg-rose-500/10 pointer-events-none" />
                  )}
                  {/* Subtle label overlay on hover/active */}
                  <div className="absolute bottom-1.5 inset-x-1.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] font-mono text-neutral-200 truncate">
                    {item.title[lang]}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Elegant Premium CTA Button below carousel: "View All Projects ↗" */}
        <div className="mt-14 flex items-center justify-center">
          <button
            onClick={onNavigateAllProjects}
            className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full text-sm font-semibold text-neutral-900 bg-white hover:bg-neutral-100 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <span>{t.viewAllProjects}</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform rtl:rotate-180" />
          </button>
        </div>

      </div>
    </section>
  );
};

export default SelectedWorkSection;
