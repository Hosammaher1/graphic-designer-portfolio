import React, { useState, useEffect, useRef } from 'react';
import { translations, resolveText } from '../data/portfolioData';
import { ProjectArtwork } from './ProjectArtworks';
import { ArrowLeft, ArrowRight, ArrowUpRight, AlertCircle } from 'lucide-react';
import { Skeleton } from './ui/Skeleton';
import gsap from 'gsap';

export const SelectedWorkSection = ({
  lang,
  onOpenProject,
  onNavigateAllProjects,
  featuredMode = 'manual',
  projects: passedProjects,
  isLoadingProjects = false,
  projectsError = null,
  onRetryProjects,
  settings,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const t = translations[lang].work;

  const isProjectsLoaded = Array.isArray(passedProjects);
  // Display ONLY published projects marked as featured in the Admin Dashboard.
  // Never automatically substitute all projects; if none are marked featured, show an empty state.
  const projects = isProjectsLoaded
    ? passedProjects.filter((p) => Boolean(p.featured))
    : [];
  const total = projects.length;
  const currentProject = total > 0 ? projects[activeIndex] || projects[0] : null;

  const sectionRef = useRef(null);
  const activeCardRef = useRef(null);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const handleTouchStart = (e) => {
    if (!e.touches || e.touches.length === 0) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
      if (deltaX < 0) {
        lang === 'ar' ? handlePrev() : handleNext();
      } else {
        lang === 'ar' ? handleNext() : handlePrev();
      }
    }
  };

  const handlePrev = () => {
    if (total === 0) return;
    setActiveIndex((prev) => (prev === 0 ? total - 1 : prev - 1));
  };

  const handleNext = () => {
    if (total === 0) return;
    setActiveIndex((prev) => (prev === total - 1 ? 0 : prev + 1));
  };

  useEffect(() => {
    if (activeCardRef.current && total > 0) {
      gsap.fromTo(
        activeCardRef.current,
        { scale: 0.97, opacity: 0.8 },
        { scale: 1, opacity: 1, duration: 0.45, ease: 'power2.out' }
      );
    }
  }, [activeIndex, total]);

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

  const prevIndex = total > 0 ? (activeIndex === 0 ? total - 1 : activeIndex - 1) : 0;
  const nextIndex = total > 0 ? (activeIndex === total - 1 ? 0 : activeIndex + 1) : 0;

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
                disabled={!isProjectsLoaded || total <= 1}
                aria-label="Previous project"
                className="w-11 h-11 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-40 border border-white/15 hover:border-white/30 text-white flex items-center justify-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 cursor-pointer disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
              </button>

              <button
                onClick={handleNext}
                disabled={!isProjectsLoaded || total <= 1}
                aria-label="Next project"
                className="w-11 h-11 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-40 border border-white/15 hover:border-white/30 text-white flex items-center justify-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 cursor-pointer disabled:cursor-not-allowed"
              >
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </div>
          </div>

        </div>

        {/* Dynamic State Rendering: Skeleton -> Error -> Empty -> Carousel */}
        {!isProjectsLoaded ? (
          /* Elegant 3-Card Carousel Skeleton matching exact geometry */
          <div className="relative w-full flex items-center justify-center min-h-[460px] sm:min-h-[520px] my-4" aria-busy="true">
            {/* Left Flanking Peek Skeleton */}
            <div className="hidden lg:block absolute left-[-10%] xl:left-[-8%] w-[38%] h-[390px] rounded-3xl overflow-hidden opacity-30 transform scale-90 border border-white/10 shadow-2xl skeleton-shimmer" />

            {/* Center Active Project Card Skeleton */}
            <div
              data-theme-surface="dark"
              className="relative w-full max-w-4xl h-[460px] sm:h-[510px] rounded-3xl overflow-hidden glass-panel border border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.85)] p-6 sm:p-10 flex flex-col justify-between skeleton-shimmer"
            >
              {/* Top Badge Skeleton */}
              <div className="relative z-10 flex items-center justify-between">
                <Skeleton className="w-32 h-6 rounded-full" />
              </div>

              {/* Bottom Overlaid Project Info Skeleton */}
              <div className="relative z-10 flex items-end justify-between gap-4">
                <div className="space-y-3 w-full max-w-md">
                  <Skeleton className="w-3/4 h-8 sm:h-10 rounded-lg" />
                  <Skeleton className="w-1/2 h-5 rounded-md" />
                  <div className="flex gap-2 pt-1">
                    <Skeleton className="w-20 h-6 rounded-full" />
                    <Skeleton className="w-20 h-6 rounded-full" />
                  </div>
                </div>
                <Skeleton className="w-12 h-12 sm:w-14 sm:h-14 rounded-full shrink-0" />
              </div>
            </div>

            {/* Right Flanking Peek Skeleton */}
            <div className="hidden lg:block absolute right-[-10%] xl:right-[-8%] w-[38%] h-[390px] rounded-3xl overflow-hidden opacity-30 transform scale-90 border border-white/10 shadow-2xl skeleton-shimmer" />
          </div>
        ) : projectsError && total === 0 ? (
          /* Localized Retry State (Only in this section, never blacking out the page) */
          <div className="relative w-full max-w-xl mx-auto my-12 p-8 sm:p-12 rounded-3xl glass-panel border border-rose-400/20 shadow-2xl text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-rose-500/10 border border-rose-300/30 flex items-center justify-center text-rose-300">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl sm:text-2xl font-normal text-white mb-2">
              {lang === 'ar' ? 'تعذر تحميل معرض الأعمال' : 'Unable to load projects'}
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400 font-light max-w-md mx-auto mb-6">
              {lang === 'ar'
                ? 'حدث انقطاع مؤقت أثناء الاتصال بالخادم. يمكنك المحاولة مجدداً.'
                : 'A network timeout occurred while fetching portfolio projects. You can retry safely.'}
            </p>
            {onRetryProjects && (
              <button
                onClick={onRetryProjects}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-neutral-900 bg-white hover:bg-neutral-100 transition-all shadow-lg cursor-pointer"
              >
                <span>{lang === 'ar' ? 'إعادة المحاولة الآن' : 'Retry Now'}</span>
              </button>
            )}
          </div>
        ) : total === 0 ? (
          /* Luxury Empty State when database has 0 published projects */
          <div className="relative w-full max-w-xl mx-auto my-12 p-8 sm:p-12 rounded-3xl glass-panel-active border border-[#f4a496]/25 shadow-2xl shadow-black/85 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 border border-[#f4a496]/40 p-2 shadow-xl shadow-black/50 flex items-center justify-center">
              <img src="/logo/logo.png" alt="MO" className="w-full h-full object-contain" />
            </div>
            <div className="text-[11px] font-mono uppercase tracking-widest text-[#f4a496]/80 mb-2">
              {lang === 'ar' ? 'معرض الأعمال' : 'Curated Portfolio Showcase'}
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl font-normal text-white mb-3">
              <span>{lang === 'ar' ? 'أعمال مختارة ' : 'Curating '}</span>
              <span className="text-[#f4a496] italic font-serif">{lang === 'ar' ? 'قيد التوثيق' : 'New Works'}</span>
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400 font-light max-w-md mx-auto leading-relaxed mb-6">
              {lang === 'ar'
                ? 'يجري حالياً توثيق دراسات حالة جديدة وأنظمة هوية بصرية متميزة. استكشف مسيرة العمل أو تواصل مباشرة لبدء مشروعك القادم.'
                : 'New creative case studies and visual identity systems are currently being documented. Explore the creative journey or get in touch for custom design commissions.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="#contact"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-neutral-900 bg-white hover:bg-neutral-100 transition-all shadow-lg"
              >
                <span>{lang === 'ar' ? 'تواصل مع الاستوديو' : 'Get in Touch'}</span>
                <ArrowUpRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </a>
              <a
                href="#creative-journey"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs sm:text-sm font-medium text-neutral-200 glass-panel hover:text-white border border-white/10 hover:border-white/25 transition-all"
              >
                <span>{lang === 'ar' ? 'استكشف المسيرة' : 'Creative Journey'}</span>
              </a>
            </div>
          </div>
        ) : (
          <>
            {/* Carousel Center Stage: Active Centered Card with Flanking Peeks */}
            <div
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="relative w-full flex items-center justify-center min-h-[460px] sm:min-h-[520px] my-4 select-none touch-pan-y"
            >
              
              {/* Left Flanking Peek Card */}
              {total > 1 && (
                <div
                  onClick={handlePrev}
                  className="hidden lg:block absolute left-[-10%] xl:left-[-8%] w-[38%] h-[390px] rounded-3xl overflow-hidden opacity-30 hover:opacity-50 transition-all duration-500 transform scale-90 cursor-pointer pointer-events-auto border border-white/10 shadow-2xl"
                >
                  {projects[prevIndex]?.image ? (
                    <img src={projects[prevIndex].image} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover object-center" />
                  ) : (
                    <ProjectArtwork id={projects[prevIndex]?.artworkId || 'noya-skincare'} className="w-full h-full object-cover object-center" />
                  )}
                  <div className="absolute inset-0 bg-black/60" />
                </div>
              )}

              {/* Large Centered Active Project Card */}
              <div
                ref={activeCardRef}
                onClick={() => onOpenProject(currentProject.slug || currentProject.id)}
                data-theme-surface="dark"
                className="relative w-full max-w-4xl h-[460px] sm:h-[510px] rounded-3xl overflow-hidden glass-panel border border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.85)] cursor-pointer group"
              >
                {/* Project Artwork or Image */}
                {currentProject.image ? (
                  <img
                    src={currentProject.image}
                    alt={resolveText(currentProject.title, lang, '')}
                    fetchPriority="high"
                    decoding="async"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <ProjectArtwork id={currentProject.artworkId || 'noya-skincare'} className="w-full h-full object-cover object-center" />
                )}

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
                      {resolveText(currentProject.title, lang, 'Untitled Project')}
                    </h3>
                    <p className="font-serif text-lg sm:text-xl text-neutral-200 italic font-light mt-0.5 mb-3">
                      {resolveText(currentProject.subtitle, lang) || resolveText(currentProject.client, lang, 'Studio Case')}
                    </p>

                    {/* Pill Tags */}
                    <div className="flex flex-wrap items-center gap-2">
                      {Array.isArray(currentProject.categories) && currentProject.categories.length > 0 ? (
                        currentProject.categories.map((cat, i) => {
                          const catName = typeof cat === 'string'
                            ? cat
                            : (lang === 'ar' ? (cat.nameAr || cat.name?.ar) : (cat.nameEn || cat.name?.en)) ||
                              resolveText(cat.name, lang, cat.slug || 'Design');
                          return (
                            <span key={`cat-${i}`} className="px-3 py-1 rounded-full text-xs text-neutral-200 bg-white/10 backdrop-blur-md border border-white/15">
                              {catName}
                            </span>
                          );
                        })
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs text-neutral-200 bg-white/10 backdrop-blur-md border border-white/15">
                          {resolveText(currentProject.category, lang, t.tagBranding)}
                        </span>
                      )}
                      {currentProject.tags && currentProject.tags.length > 0 &&
                        currentProject.tags.slice(0, 2).map((tName, i) => (
                          <span key={`tag-${i}`} className="px-3 py-1 rounded-full text-xs text-neutral-400 bg-white/5 backdrop-blur-md border border-white/10">
                            {typeof tName === 'string' ? tName : resolveText(tName, lang, 'Design')}
                          </span>
                        ))
                      }
                    </div>
                  </div>

                  {/* White Round Arrow Button to open modal */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenProject(currentProject.slug || currentProject.id);
                    }}
                    aria-label="Open project case study"
                    className="pointer-events-auto w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white hover:bg-neutral-100 text-neutral-900 flex items-center justify-center shrink-0 shadow-xl group-hover:scale-110 transition-transform duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer"
                  >
                    <ArrowRight className="w-5 h-5 rtl:rotate-180 text-neutral-900" />
                  </button>

                </div>
              </div>

              {/* Right Flanking Peek Card */}
              {total > 1 && (
                <div
                  onClick={handleNext}
                  className="hidden lg:block absolute right-[-10%] xl:right-[-8%] w-[38%] h-[390px] rounded-3xl overflow-hidden opacity-30 hover:opacity-50 transition-all duration-500 transform scale-90 cursor-pointer pointer-events-auto border border-white/10 shadow-2xl"
                >
                  {projects[nextIndex]?.image ? (
                    <img src={projects[nextIndex].image} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover object-center" />
                  ) : (
                    <ProjectArtwork id={projects[nextIndex]?.artworkId || 'noya-skincare'} className="w-full h-full object-cover object-center" />
                  )}
                  <div className="absolute inset-0 bg-black/60" />
                </div>
              )}

            </div>

            {/* Carousel Pagination Dots Indicator */}
            {total > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6 mb-8">
                {projects.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveIndex(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                    className={`h-1.5 transition-all duration-300 rounded-full cursor-pointer ${
                      idx === activeIndex
                        ? 'w-8 bg-white shadow-sm'
                        : 'w-2.5 bg-white/30 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Three Corresponding Interactive Rounded Thumbnails */}
            {total > 1 && (
              <div className="mt-4 flex justify-center">
                <div className={`grid grid-cols-${Math.min(total, 3)} gap-3 sm:gap-6 max-w-xl w-full`}>
                  {projects.map((item, idx) => {
                    const isActive = idx === activeIndex;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveIndex(idx)}
                        className={`group relative h-20 sm:h-28 rounded-2xl overflow-hidden transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 cursor-pointer ${
                          isActive
                            ? 'border-2 border-rose-300 shadow-[0_0_20px_rgba(244,164,150,0.5)] scale-105 z-10'
                            : 'border border-white/10 opacity-60 hover:opacity-100 hover:scale-[1.02]'
                        }`}
                      >
                        {item.image ? (
                          <img src={item.image} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover object-center" />
                        ) : (
                          <ProjectArtwork id={item.artworkId || 'noya-skincare'} className="w-full h-full object-cover" />
                        )}
                        {isActive && (
                          <div className="absolute inset-0 bg-rose-500/10 pointer-events-none" />
                        )}
                        <div className="absolute bottom-1.5 inset-x-1.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] font-mono text-neutral-200 truncate">
                          {resolveText(item.title, lang, "")}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Elegant Premium CTA Button below carousel: "View All Projects ↗" */}
            <div className="mt-14 flex items-center justify-center">
              <button
                onClick={onNavigateAllProjects}
                className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full text-sm font-semibold text-neutral-900 bg-white hover:bg-neutral-100 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer"
              >
                <span>{t.viewAllProjects}</span>
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform rtl:rotate-180" />
              </button>
            </div>
          </>
        )}

      </div>
    </section>
  );
};

export default SelectedWorkSection;
