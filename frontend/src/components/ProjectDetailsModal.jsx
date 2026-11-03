import React, { useEffect, useRef, useState, useCallback } from 'react';
import { translations, projectsData, resolveText } from '../data/portfolioData';
import { ProjectArtwork } from './ProjectArtworks';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Target,
  Compass,
  CheckCircle,
  Award,
  Maximize2,
  Copy,
  Check,
  Palette,
  Type,
  Layers,
  Wrench,
  Sparkles,
} from 'lucide-react';

export const ProjectDetailsModal = ({
  project,
  isOpen,
  onClose,
  lang,
  onNavigateProject,
  projectCollection,
}) => {
  const modalRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const closeButtonRef = useRef(null);
  const previousActiveElement = useRef(null);

  // Lightbox state
  const [selectedLightboxIndex, setSelectedLightboxIndex] = useState(null);
  const [copiedHex, setCopiedHex] = useState(null);

  // Touch swipe support for Lightbox
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  const t = translations[lang].modal;
  const activeList = projectCollection && projectCollection.length > 0 ? projectCollection : projectsData;

  const getLoc = (val) => resolveText(val, lang, '');

  // Background scroll locking
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
      document.body.classList.add('modal-open');
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);

      return () => {
        document.body.classList.remove('modal-open');
        document.body.style.overflow = originalOverflow;
        previousActiveElement.current?.focus();
      };
    }
  }, [isOpen]);

  // Construct comprehensive image collection for current project
  const coverSrc = project?.coverImage || project?.imageUrl || project?.image || null;
  const projectGallery = Array.isArray(project?.gallery) ? project.gallery : [];
  const normalizedGallery = projectGallery.map((item, idx) => {
    if (typeof item === 'string') {
      return {
        id: `${project?.id}-g-${idx}`,
        src: item,
        artworkId: item,
        title: project?.title,
        caption: project?.subtitle || project?.title,
        type: 'image',
      };
    }
    return {
      ...item,
      id: item.id || `${project?.id}-g-${idx}`,
      src: item.url || item.src || null,
      artworkId: item.artworkId || item.url || item.src || project?.artworkId,
      title: item.title || project?.title,
      caption: item.caption || project?.subtitle || project?.title,
      type: item.type || 'image',
    };
  });

  const allImages = project
    ? [
        {
          id: `${project.id}-cover`,
          src: coverSrc,
          artworkId: project.artworkId || coverSrc || project.slug,
          title: project.title,
          caption: project.subtitle || project.title,
          type: 'cover',
        },
        ...normalizedGallery,
      ]
    : [];

  const rawIndex = project ? activeList.findIndex((p) => p.id === project.id) : 0;
  const currentIndex = rawIndex >= 0 ? rawIndex : 0;
  const totalProjects = activeList.length;

  const getPrevProj = useCallback(() => {
    return currentIndex > 0 ? activeList[currentIndex - 1] : activeList[totalProjects - 1];
  }, [currentIndex, activeList, totalProjects]);

  const getNextProj = useCallback(() => {
    return currentIndex < totalProjects - 1 ? activeList[currentIndex + 1] : activeList[0];
  }, [currentIndex, activeList, totalProjects]);

  const prevProject = getPrevProj();
  const nextProject = getNextProj();

  // Handle ESC and Arrow Keys (Priority: Lightbox first, then Project navigation)
  useEffect(() => {
    if (!isOpen || !project) return;

    const handleKeyDown = (e) => {
      // If Lightbox is open:
      if (selectedLightboxIndex !== null) {
        if (e.key === 'Escape') {
          e.stopPropagation();
          setSelectedLightboxIndex(null);
        } else if (e.key === 'ArrowLeft') {
          e.stopPropagation();
          setSelectedLightboxIndex((prev) => {
            if (prev === null) return 0;
            return lang === 'ar'
              ? (prev + 1) % allImages.length
              : (prev === 0 ? allImages.length - 1 : prev - 1);
          });
        } else if (e.key === 'ArrowRight') {
          e.stopPropagation();
          setSelectedLightboxIndex((prev) => {
            if (prev === null) return 0;
            return lang === 'ar'
              ? (prev === 0 ? allImages.length - 1 : prev - 1)
              : (prev + 1) % allImages.length;
          });
        }
        return;
      }

      // If Lightbox is closed, handle modal controls:
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        lang === 'ar' ? onNavigateProject(getNextProj().id) : onNavigateProject(prevProject.id);
      } else if (e.key === 'ArrowRight') {
        lang === 'ar' ? onNavigateProject(prevProject.id) : onNavigateProject(nextProject.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isOpen,
    project,
    selectedLightboxIndex,
    allImages.length,
    lang,
    onClose,
    onNavigateProject,
    prevProject.id,
    nextProject.id,
    getNextProj,
  ]);

  // Touch Swipe for Mobile Lightbox
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50 && selectedLightboxIndex !== null) {
      if (diff > 0) {
        // Swiped Left
        setSelectedLightboxIndex((prev) =>
          prev !== null ? (prev + 1) % allImages.length : 0
        );
      } else {
        // Swiped Right
        setSelectedLightboxIndex((prev) =>
          prev !== null ? (prev === 0 ? allImages.length - 1 : prev - 1) : 0
        );
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handleCopyHex = (hex) => {
    navigator.clipboard?.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => {
      setCopiedHex(null);
    }, 2000);
  };

  if (!isOpen || !project) return null;

  return (
    <>
      {/* ------------------------------------------------------------------- */}
      {/* FULL-SCREEN INTERACTIVE LIGHTBOX OVERLAY (Priority z-[100])         */}
      {/* ------------------------------------------------------------------- */}
      {selectedLightboxIndex !== null && allImages[selectedLightboxIndex] && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Image Lightbox Viewer"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-between p-3 sm:p-6 bg-[#040206]/95 backdrop-blur-2xl animate-in fade-in duration-200"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Top Bar: Counter, Title & Close */}
          <div className="w-full max-w-7xl flex items-center justify-between py-3 px-2 sm:px-4 z-20">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-rose-300 bg-rose-950/80 px-3 py-1 rounded-full border border-rose-300/30">
                {String(selectedLightboxIndex + 1).padStart(2, '0')} /{' '}
                {String(allImages.length).padStart(2, '0')}
              </span>
              <div className="text-left rtl:text-right hidden sm:block">
                <span className="text-xs sm:text-sm font-serif text-white font-medium block">
                  {getLoc(allImages[selectedLightboxIndex]?.title)}
                </span>
                <span className="text-[10px] text-neutral-400 font-light block">
                  {getLoc(project?.title)} · {getLoc(project?.category)}
                </span>
              </div>
            </div>

            {/* Lightbox Navigation Buttons & Close */}
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setSelectedLightboxIndex((prev) =>
                    prev !== null
                      ? prev === 0
                        ? allImages.length - 1
                        : prev - 1
                      : 0
                  )
                }
                aria-label="Previous image"
                className="p-2 sm:p-2.5 rounded-full bg-white/5 hover:bg-white/15 text-neutral-300 hover:text-white border border-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 rtl:rotate-180" />
              </button>

              <button
                onClick={() =>
                  setSelectedLightboxIndex((prev) =>
                    prev !== null ? (prev + 1) % allImages.length : 0
                  )
                }
                aria-label="Next image"
                className="p-2 sm:p-2.5 rounded-full bg-white/5 hover:bg-white/15 text-neutral-300 hover:text-white border border-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 rtl:rotate-180" />
              </button>

              <button
                onClick={() => setSelectedLightboxIndex(null)}
                aria-label={t.closeLightbox}
                className="p-2 sm:p-2.5 rounded-full bg-rose-950/80 hover:bg-rose-900 border border-rose-300/30 text-rose-200 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 ml-2"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Central Full-Resolution Showcase Area */}
          <div className="relative flex-1 w-full max-w-6xl flex items-center justify-center my-auto p-2 sm:p-6 overflow-hidden">
            <div className="relative w-full h-[65vh] sm:h-[75vh] rounded-2xl sm:rounded-3xl overflow-hidden glass-panel border border-white/15 shadow-[0_30px_90px_rgba(0,0,0,0.95)]">
              <ProjectArtwork
                id={allImages[selectedLightboxIndex]?.artworkId}
                src={allImages[selectedLightboxIndex]?.src}
                className="w-full h-full object-contain"
                priority={true}
              />
            </div>
          </div>

          {/* Bottom Bar: Bilingual Caption & Quick Thumbnail Strip */}
          <div className="w-full max-w-5xl text-center py-2 z-20 space-y-3">
            <p className="text-xs sm:text-sm text-neutral-300 font-light max-w-2xl mx-auto px-4 leading-relaxed">
              {getLoc(allImages[selectedLightboxIndex]?.caption)}
            </p>

            {/* Quick mini-thumbnail selector */}
            <div className="flex items-center justify-center gap-2 overflow-x-auto modal-scrollbar py-1 px-4">
              {allImages.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedLightboxIndex(idx)}
                  className={`w-10 sm:w-12 h-8 sm:h-9 rounded-lg overflow-hidden shrink-0 transition-all border ${
                    idx === selectedLightboxIndex
                      ? 'border-rose-400 ring-2 ring-rose-400/50 scale-105'
                      : 'border-white/15 opacity-50 hover:opacity-100'
                  }`}
                >
                  <ProjectArtwork id={img.artworkId} src={img.src} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* PRIMARY PROJECT DETAILS MODAL OVERLAY (85%–95% Viewport)            */}
      {/* ------------------------------------------------------------------- */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-project-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 lg:p-8 animate-in fade-in duration-300"
      >
        {/* Dark Translucent Backdrop with Background Blur */}
        <div
          className="fixed inset-0 bg-[#060408]/85 backdrop-blur-xl transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Large Modal Container */}
        <div
          ref={modalRef}
          className="relative z-10 w-full max-w-6xl h-[94vh] sm:h-[90vh] md:h-[88vh] rounded-2xl sm:rounded-3xl glass-panel border border-rose-300/25 shadow-[0_30px_90px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 bg-gradient-to-b from-[#160d1b]/95 via-[#110915]/95 to-[#0c0610]/95"
        >
          {/* Top Sticky Header Bar */}
          <div className="flex items-center justify-between px-5 sm:px-8 py-3.5 border-b border-rose-300/15 bg-[#140b17]/85 backdrop-blur-md shrink-0 z-20">
            {/* Project Counter & Category */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-rose-300 bg-rose-950/60 px-2.5 py-1 rounded-md border border-rose-300/20">
                {String(currentIndex + 1).padStart(2, '0')} / {String(totalProjects).padStart(2, '0')}
              </span>
              <span className="text-xs font-mono tracking-wider text-neutral-300 hidden sm:inline uppercase">
                {getLoc(project?.category)}
              </span>
            </div>

            {/* Nav Controls: Prev / Next / Close */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => prevProject && onNavigateProject(prevProject.id)}
                aria-label={t.previous}
                className="p-2 rounded-xl glass-panel-subtle hover:border-rose-300/40 text-neutral-300 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                title={getLoc(prevProject?.title)}
              >
                <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
              </button>

              <button
                onClick={() => nextProject && onNavigateProject(nextProject.id)}
                aria-label={t.next}
                className="p-2 rounded-xl glass-panel-subtle hover:border-rose-300/40 text-neutral-300 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                title={getLoc(nextProject?.title)}
              >
                <ChevronRight className="w-4 h-4 rtl:rotate-180" />
              </button>

              <div className="w-[1px] h-5 bg-white/10 mx-1" />

              <button
                ref={closeButtonRef}
                onClick={onClose}
                aria-label={t.close}
                className="p-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-300/30 text-rose-200 hover:text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Modal Internal Vertical Scrollable Case Study Area */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto modal-scrollbar p-5 sm:p-8 md:p-12 space-y-12"
          >
            {/* 1. EDITORIAL HEADER & METADATA STRIP */}
            <div className="space-y-6 text-left rtl:text-right">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono tracking-widest text-rose-300 glass-panel border border-rose-300/20 uppercase mb-3">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>{getLoc(project?.category)} · {project?.year || ''}</span>
                </div>
                <h1
                  id="modal-project-title"
                  className="font-serif text-3xl sm:text-5xl md:text-6xl font-normal text-white tracking-tight leading-[1.1]"
                >
                  {getLoc(project?.title)}
                </h1>
                <p className="text-base sm:text-xl text-rose-200/90 font-light mt-2 max-w-3xl leading-relaxed">
                  {getLoc(project?.subtitle || project?.summary)}
                </p>
              </div>

              {/* Quick Meta Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 px-5 rounded-2xl glass-panel-subtle border border-rose-300/10">
                <div>
                  <span className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase block">
                    {t.client}
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-white mt-0.5 block">
                    {getLoc(project?.client) || 'Studio Client'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase block">
                    {t.year}
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-white mt-0.5 block">
                    {project?.year || new Date().getFullYear()}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase block">
                    {t.category}
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-rose-300 mt-0.5 block">
                    {getLoc(project?.category)}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase block">
                    Art Direction
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-white mt-0.5 block">
                    Hosam Maher
                  </span>
                </div>
              </div>
            </div>

            {/* 2. CINEMATIC HERO COVER IMAGE (Clickable to Lightbox) */}
            <div
              onClick={() => setSelectedLightboxIndex(0)}
              className="group relative w-full h-80 sm:h-[460px] md:h-[520px] rounded-2xl sm:rounded-3xl overflow-hidden glass-panel border border-rose-300/20 shadow-2xl cursor-pointer"
            >
              <ProjectArtwork id={project.artworkId} src={coverSrc} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out" priority={true} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

              {/* Hover Lightbox Indicator Badge */}
              <div className="absolute top-4 right-4 rtl:right-auto rtl:left-4 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-xs font-mono text-white flex items-center gap-1.5 opacity-90 group-hover:opacity-100 group-hover:bg-rose-950/80 transition-all shadow-lg">
                <Maximize2 className="w-3.5 h-3.5" />
                <span>{t.viewImage}</span>
              </div>

              <div className="absolute bottom-4 left-4 rtl:left-auto rtl:right-4 px-3.5 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-xs font-mono text-rose-200 border border-rose-300/20">
                01 / {String(allImages.length).padStart(2, '0')} · {getLoc(allImages[0]?.title)}
              </div>
            </div>

            {/* 3. CASE STUDY STORY & STRATEGIC CONTEXT */}
            <div className="space-y-6 text-left rtl:text-right">
              <div className="space-y-3">
                <span className="text-xs font-mono tracking-widest text-rose-300 uppercase block">
                  {t.caseStudyNarrative}
                </span>
                <p className="text-base sm:text-lg text-neutral-200 font-light leading-relaxed">
                  {getLoc(project?.description)}
                </p>
              </div>

              {/* Two Column Strategic Bento Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl glass-panel-subtle border border-rose-300/15">
                  <div className="flex items-center gap-2.5 mb-3 text-rose-300">
                    <Target className="w-5 h-5" />
                    <h3 className="font-serif text-lg font-bold text-white">
                      {lang === 'en' ? 'Strategic Objectives' : 'الأهداف الاستراتيجية'}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-neutral-300 font-light leading-relaxed">
                    {getLoc(project?.objectives) || (lang === 'en' ? 'Craft a distinctive visual identity and elevated brand experience.' : 'بناء هوية بصرية متميزة وتجربة علامة تجارية راقية.')}
                  </p>
                </div>

                <div className="p-6 rounded-2xl glass-panel-subtle border border-rose-300/15">
                  <div className="flex items-center gap-2.5 mb-3 text-amber-300">
                    <Compass className="w-5 h-5" />
                    <h3 className="font-serif text-lg font-bold text-white">
                      {lang === 'en' ? 'Creative Direction' : 'التوجه الإبداعي'}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-neutral-300 font-light leading-relaxed">
                    {getLoc(project?.creativeConcept) || (lang === 'en' ? 'Harmonizing minimalist typography with warm editorial aesthetics.' : 'التناغم بين التيبوغرافيا البسيطة والجماليات التحريرية الدافئة.')}
                  </p>
                </div>
              </div>
            </div>

            {/* 4. BRAND & VISUAL IDENTITY SYSTEM (Color Swatches & Typography) */}
            {project?.brandSystem && (
              <div className="space-y-6 text-left rtl:text-right pt-4 border-t border-rose-300/15">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-2xl font-normal text-white flex items-center gap-2.5">
                    <Palette className="w-5 h-5 text-rose-300" />
                    <span>{t.brandSystem}</span>
                  </h3>
                  <span className="text-xs font-mono text-neutral-400">
                    {project.brandSystem.palette?.length || 0} SWATCHES
                  </span>
                </div>

                {/* Color Palette Grid with copyable HEX codes */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {(project.brandSystem.palette || []).map((swatch) => (
                    <div
                      key={swatch.hex}
                      onClick={() => handleCopyHex(swatch.hex)}
                      className="group p-3.5 rounded-2xl glass-panel-subtle border border-white/10 hover:border-rose-300/40 cursor-pointer transition-all flex flex-col justify-between shadow-md"
                    >
                      <div
                        className="w-full h-20 rounded-xl mb-3 shadow-inner relative flex items-center justify-center border border-white/10"
                        style={{ backgroundColor: swatch.hex }}
                      >
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-mono text-white flex items-center gap-1">
                          {copiedHex === swatch.hex ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>{t.copiedHex}</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>{t.copyHex}</span>
                            </>
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-white block">
                          {swatch.name[lang]}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-light block mt-0.5">
                          {swatch.role[lang]}
                        </span>
                        <span className="text-[10px] font-mono text-rose-300 font-bold block mt-1">
                          {swatch.hex}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Typography Hierarchy Specimen */}
                {project.brandSystem.typography && project.brandSystem.typography.length > 0 && (
                  <div className="p-6 rounded-2xl glass-panel border border-rose-300/15 space-y-4">
                    <div className="flex items-center gap-2 text-rose-300">
                      <Type className="w-4 h-4" />
                      <h4 className="font-serif text-base font-semibold text-white">
                        {t.typography}
                      </h4>
                    </div>

                    <div className="space-y-4">
                      {project.brandSystem.typography.map((specimen, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-serif text-lg font-bold text-white">
                                {specimen.fontFamily}
                              </span>
                              <span className="text-[10px] font-mono text-neutral-400 px-2 py-0.5 rounded bg-white/5">
                                {specimen.classification}
                              </span>
                            </div>
                            <span className="text-xs text-rose-200/80 font-light mt-0.5 block">
                              {specimen.usage[lang]}
                            </span>
                          </div>

                          <div className="text-sm font-serif italic text-neutral-300 border-l rtl:border-l-0 rtl:border-r border-rose-300/20 pl-4 rtl:pl-0 rtl:pr-4">
                            “{specimen.specimenText[lang]}”
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 5. MULTI-IMAGE BEHANCE-STYLE EDITORIAL GALLERY */}
            <div className="space-y-8 text-left rtl:text-right pt-4 border-t border-rose-300/15">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-2xl sm:text-3xl font-normal text-white">
                    {t.allImagesInCase}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    {t.galleryItemsCount.replace('{count}', String(projectGallery.length))}
                  </p>
                </div>
              </div>

              {/* Asymmetric / Two-Column Responsive Gallery Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                {projectGallery.map((item, gIdx) => {
                  const globalIdx = gIdx + 1; // 0 is cover
                  const isFull = item.span === 'full';
                  const itemSrc = item.url || item.src || null;

                  return (
                    <div
                      key={item.id || gIdx}
                      onClick={() => setSelectedLightboxIndex(globalIdx)}
                      className={`group relative rounded-3xl overflow-hidden glass-panel border border-white/10 hover:border-rose-300/50 cursor-pointer shadow-xl transition-all duration-300 flex flex-col ${
                        isFull ? 'md:col-span-2' : ''
                      }`}
                    >
                      {/* Image Canvas */}
                      <div
                        className={`relative w-full overflow-hidden bg-[#160c18] ${
                          isFull
                            ? 'h-80 sm:h-96 md:h-[460px]'
                            : item.aspectRatio === 'portrait'
                            ? 'h-96 sm:h-[420px]'
                            : 'h-64 sm:h-80'
                        }`}
                      >
                        <ProjectArtwork
                          id={item.artworkId}
                          src={itemSrc}
                          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 ease-out"
                        />

                        {/* Top Badge: Type & Index */}
                        <div className="absolute top-4 left-4 rtl:left-auto rtl:right-4 flex items-center gap-2">
                          <span className="px-3 py-1 rounded-full text-[10px] font-mono tracking-wider text-rose-200 glass-panel border border-rose-300/30 uppercase">
                            {String(globalIdx + 1).padStart(2, '0')} · {item.type || 'image'}
                          </span>
                        </div>

                        {/* Expand Icon Button on Hover */}
                        <div className="absolute top-4 right-4 rtl:right-auto rtl:left-4 p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          <Maximize2 className="w-4 h-4" />
                        </div>
                      </div>

                      {/* Item Caption Box */}
                      <div className="p-5 sm:p-6 bg-gradient-to-b from-[#140b17] to-[#0c050f] border-t border-white/5">
                        <h4 className="font-serif text-lg font-bold text-white group-hover:text-rose-200 transition-colors">
                          {getLoc(item.title)}
                        </h4>
                        <p className="text-xs sm:text-sm text-neutral-300/80 font-light mt-1 leading-relaxed">
                          {getLoc(item.caption)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 6. SERVICES & TOOLS BREAKDOWN */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-rose-300/15">
              {/* Services Provided */}
              <div className="p-6 rounded-2xl glass-panel border border-rose-300/15 text-left rtl:text-right">
                <h4 className="font-serif text-base font-bold text-white mb-4 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-rose-300" />
                  <span>{t.servicesProvided}</span>
                </h4>
                <ul className="space-y-2.5">
                  {(project?.services || []).map((srv, sIdx) => (
                    <li key={sIdx} className="flex items-center gap-2.5 text-xs sm:text-sm text-neutral-300">
                      <CheckCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{getLoc(srv)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tools & Technologies */}
              <div className="p-6 rounded-2xl glass-panel border border-rose-300/15 text-left rtl:text-right">
                <h4 className="font-serif text-base font-bold text-white mb-4 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-rose-300" />
                  <span>{t.toolsUtilized}</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(project?.tools || []).map((tool, tIdx) => (
                    <span
                      key={typeof tool === 'string' ? tool : tool.name || tIdx}
                      className="px-3 py-1.5 rounded-lg text-xs font-mono text-neutral-300 bg-neutral-900/70 border border-white/5"
                    >
                      {typeof tool === 'string' ? tool : tool.name}
                    </span>
                  ))}
                </div>

                {/* Recognition & Results */}
                {project?.results && project.results.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-white/5">
                    <span className="text-[11px] font-mono tracking-wider text-rose-300 uppercase block mb-2 font-semibold">
                      {t.resultsTitle}
                    </span>
                    <ul className="space-y-2">
                      {project.results.map((res, rIdx) => (
                        <li key={rIdx} className="flex items-start gap-2 text-xs text-neutral-300">
                          <Award className="w-3.5 h-3.5 text-amber-300 mt-0.5 shrink-0" />
                          <span>{getLoc(res)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* 7. BOTTOM FOOTER NAVIGATION: SEAMLESS PREV / NEXT CASE STUDY TOUR */}
            <div className="pt-8 border-t border-rose-300/15 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                onClick={() => prevProject && onNavigateProject(prevProject.id)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-semibold text-neutral-200 glass-panel-subtle hover:border-rose-300/40 hover:text-white transition-all"
              >
                <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                <span>{t.previous}: {getLoc(prevProject?.title)}</span>
              </button>

              <button
                onClick={() => nextProject && onNavigateProject(nextProject.id)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 shadow-md hover:shadow-xl transition-all"
              >
                <span>{t.next}: {getLoc(nextProject?.title)}</span>
                <ChevronRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default ProjectDetailsModal;
