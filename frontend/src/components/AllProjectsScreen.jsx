import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  categoriesData,
  getAllPublishedProjects,
  translations,
} from '../data/portfolioData';
import { ProjectArtwork } from './ProjectArtworks';
import {
  ArrowLeft,
  ArrowUpRight,
  Search,
  SlidersHorizontal,
  X,
  Sparkles,
  Layers,
  Calendar,
} from 'lucide-react';
import gsap from 'gsap';

export const AllProjectsScreen = ({
  lang,
  onBackToHome,
  onOpenProject,
}) => {
  const t = translations[lang].allProjects;
  const allProjects = useMemo(() => getAllPublishedProjects(), []);

  // Filter & Search & Sort states
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [visibleCount, setVisibleCount] = useState(6);

  const gridRef = useRef(null);
  const containerRef = useRef(null);

  // Compute category counts dynamically
  const categoryCounts = useMemo(() => {
    const counts = { all: allProjects.length };
    categoriesData.forEach((cat) => {
      if (cat.id !== 'all') {
        counts[cat.id] = allProjects.filter((p) =>
          p.categoryIds.includes(cat.id)
        ).length;
      }
    });
    return counts;
  }, [allProjects]);

  // Filtered & Sorted Projects
  const filteredProjects = useMemo(() => {
    let result = [...allProjects];

    // 1. Category Filter
    if (selectedCategory !== 'all') {
      result = result.filter((p) => p.categoryIds.includes(selectedCategory));
    }

    // 2. Search Query (Bilingual Title, Description, Category, Services)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((p) => {
        const titleEn = p.title.en.toLowerCase();
        const titleAr = p.title.ar.toLowerCase();
        const descEn = p.description.en.toLowerCase();
        const descAr = p.description.ar.toLowerCase();
        const catEn = p.category.en.toLowerCase();
        const catAr = p.category.ar.toLowerCase();
        const tools = p.tools.join(' ').toLowerCase();

        return (
          titleEn.includes(q) ||
          titleAr.includes(q) ||
          descEn.includes(q) ||
          descAr.includes(q) ||
          catEn.includes(q) ||
          catAr.includes(q) ||
          tools.includes(q)
        );
      });
    }

    // 3. Sorting
    if (sortBy === 'newest') {
      result.sort(
        (a, b) =>
          new Date(b.publicationDate).getTime() -
          new Date(a.publicationDate).getTime()
      );
    } else if (sortBy === 'oldest') {
      result.sort(
        (a, b) =>
          new Date(a.publicationDate).getTime() -
          new Date(b.publicationDate).getTime()
      );
    } else if (sortBy === 'featured') {
      result.sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return (a.featuredOrder || 99) - (b.featuredOrder || 99);
      });
    }

    return result;
  }, [allProjects, selectedCategory, searchQuery, sortBy]);

  // Reset pagination when category, search, or sort changes
  useEffect(() => {
    setVisibleCount(6);
  }, [selectedCategory, searchQuery, sortBy]);

  // Entrance animation for screen
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.gallery-enter',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out' }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Staggered reveal for grid cards on filter change
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    if (gridRef.current) {
      gsap.fromTo(
        gridRef.current.children,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: 'power2.out' }
      );
    }
  }, [selectedCategory, searchQuery, sortBy, visibleCount]);

  const visibleProjects = filteredProjects.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProjects.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 6);
  };

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setSortBy('newest');
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen pt-28 pb-24 bg-[#09070c] relative overflow-hidden"
    >
      {/* Ambient background glows */}
      <div className="absolute top-20 right-10 w-[700px] h-[550px] bg-rose-950/20 blur-[180px] pointer-events-none rounded-full" />
      <div className="absolute top-1/2 left-10 w-[600px] h-[600px] bg-amber-950/15 blur-[170px] pointer-events-none rounded-full" />
      <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-rose-900/15 blur-[160px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Top Breadcrumb & Back Action */}
        <div className="gallery-enter flex items-center justify-between gap-4 mb-8">
          <button
            onClick={onBackToHome}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-neutral-300 hover:text-white glass-panel-subtle hover:border-rose-300/40 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 rtl:group-hover:translate-x-1 transition-transform rtl:rotate-180" />
            <span>{t.backToHome}</span>
          </button>

          {/* Breadcrumb Eyebrow */}
          <div className="text-xs font-mono text-rose-300/80 tracking-widest uppercase">
            {t.breadcrumb}
          </div>
        </div>

        {/* Screen Editorial Header */}
        <div className="gallery-enter max-w-3xl mb-12 text-left rtl:text-right">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono tracking-widest text-rose-200 glass-panel border border-rose-300/25 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            <span>
              {t.countBadge.replace('{count}', String(allProjects.length))}
            </span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-white leading-tight mb-4">
            {t.title}
          </h1>
          <p className="text-base sm:text-lg text-neutral-300/90 font-light leading-relaxed">
            {t.subtitle}
          </p>
        </div>

        {/* Search & Sorting Bar */}
        <div className="gallery-enter p-4 sm:p-5 rounded-3xl glass-panel border border-white/10 mb-8 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Search Input Field */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-11 pr-10 rtl:pl-10 rtl:pr-11 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-white"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sorting Dropdown */}
          <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto">
            <span className="text-xs font-mono text-neutral-400 hidden sm:inline">
              {t.sortBy}
            </span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none px-4 py-2.5 pr-8 rtl:pr-4 rtl:pl-8 rounded-2xl bg-white/5 border border-white/10 text-xs font-medium text-white focus:outline-none focus:border-rose-400 cursor-pointer transition-all"
              >
                <option value="newest" className="bg-[#160c18] text-white">
                  {t.sortOptions.newest}
                </option>
                <option value="oldest" className="bg-[#160c18] text-white">
                  {t.sortOptions.oldest}
                </option>
                <option value="featured" className="bg-[#160c18] text-white">
                  {t.sortOptions.featured}
                </option>
              </select>
              <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-400 absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

        </div>

        {/* Horizontal Category Filter Pills (Scrollable on mobile) */}
        <div className="gallery-enter mb-10 overflow-x-auto modal-scrollbar pb-2">
          <div className="flex items-center gap-2 min-w-max">
            {categoriesData.map((cat) => {
              const isActive = selectedCategory === cat.id;
              const count = categoryCounts[cat.id] || 0;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 sm:px-5 py-2.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 ${
                    isActive
                      ? 'bg-gradient-to-r from-rose-950/90 to-rose-900/90 text-white border border-rose-300/50 shadow-md shadow-rose-950/60 scale-105'
                      : 'glass-panel-subtle text-neutral-300 hover:text-white hover:border-white/20'
                  }`}
                >
                  <span>{cat.name[lang]}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-rose-400/30 text-rose-200 font-bold'
                        : 'bg-white/10 text-neutral-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Gallery Grid or Empty State */}
        {filteredProjects.length === 0 ? (
          /* Empty State */
          <div className="py-20 flex flex-col items-center justify-center text-center p-8 rounded-3xl glass-panel border border-white/10">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-300/20 flex items-center justify-center text-rose-300 mb-4">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-white mb-2">
              {t.emptyTitle}
            </h3>
            <p className="text-sm text-neutral-400 max-w-md font-light leading-relaxed mb-6">
              {t.emptyDesc}
            </p>
            <button
              onClick={handleResetFilters}
              className="px-6 py-2.5 rounded-full text-xs font-semibold text-neutral-900 bg-white hover:bg-neutral-100 transition-colors shadow-md"
            >
              {t.resetFilters}
            </button>
          </div>
        ) : (
          /* 3-Column / 2-Column / 1-Column Responsive Grid */
          <>
            <div
              ref={gridRef}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-14"
            >
              {visibleProjects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => onOpenProject(project.id, filteredProjects)}
                  className="group relative rounded-3xl overflow-hidden glass-panel border border-white/10 hover:border-rose-300/40 shadow-xl hover:shadow-2xl transition-all duration-500 flex flex-col cursor-pointer"
                >
                  {/* Artwork Showcase Box */}
                  <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-[#160c18]">
                    <ProjectArtwork
                      id={project.artworkId}
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                    />

                    {/* Gradient Overlay for Text Readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0e0711] via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

                    {/* Featured Star / Badge */}
                    {project.isFeatured && (
                      <div className="absolute top-4 left-4 rtl:left-auto rtl:right-4 px-2.5 py-1 rounded-full text-[10px] font-mono tracking-wider text-amber-200 glass-panel border border-amber-300/30 flex items-center gap-1.5 shadow-md">
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        <span>FEATURED</span>
                      </div>
                    )}

                    {/* Year Tag on Top Right */}
                    <div className="absolute top-4 right-4 rtl:right-auto rtl:left-4 px-2.5 py-1 rounded-full text-[10px] font-mono text-neutral-300 glass-panel-subtle border border-white/10">
                      {project.year}
                    </div>
                  </div>

                  {/* Card Bottom Content Area */}
                  <div className="p-6 flex-1 flex flex-col justify-between text-left rtl:text-right bg-gradient-to-b from-[#140b17] to-[#0c050f]">
                    <div>
                      {/* Category Label */}
                      <span className="text-[11px] font-mono tracking-wider text-rose-300 uppercase block mb-1">
                        {project.category[lang]}
                      </span>

                      {/* Project Title */}
                      <h3 className="font-serif text-xl sm:text-2xl font-bold text-white group-hover:text-rose-200 transition-colors leading-tight">
                        {project.title[lang]}
                      </h3>

                      {/* Brief Subtitle */}
                      <p className="text-xs text-neutral-400 font-light mt-1.5 line-clamp-2 leading-relaxed">
                        {project.subtitle[lang]}
                      </p>
                    </div>

                    {/* Card Footer: Tags & Arrow Button */}
                    <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[11px] font-mono text-neutral-500">
                        {project.tools.slice(0, 2).join(' · ')}
                      </span>

                      {/* Circle Arrow Action Button */}
                      <div className="w-9 h-9 rounded-full bg-white/5 group-hover:bg-white text-neutral-300 group-hover:text-neutral-900 flex items-center justify-center transition-all duration-300 shadow-md">
                        <ArrowUpRight className="w-4 h-4 rtl:rotate-180" />
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>

            {/* Load More Button or "Showing all" indicator */}
            <div className="flex flex-col items-center justify-center pt-4">
              {hasMore ? (
                <button
                  onClick={handleLoadMore}
                  className="px-8 py-3.5 rounded-full text-xs sm:text-sm font-semibold text-neutral-900 bg-white hover:bg-neutral-100 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  {t.loadMore}
                </button>
              ) : (
                <div className="text-xs font-mono text-neutral-500 tracking-wider">
                  {t.showingAll.replace('{count}', String(filteredProjects.length))}
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default AllProjectsScreen;
