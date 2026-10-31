import React, { useState, useEffect, useRef } from 'react';
import { Search, X, RotateCcw, Calendar, Wrench } from 'lucide-react';
import { Button, Badge } from './ui';

export default function SearchFilterBar({
  locale = 'ar',
  searchQuery = '',
  selectedCategory = '',
  selectedTool = '',
  selectedYear = '',
  selectedSort = 'newest',
  categories = [],
  tools = [],
  years = [2026, 2025, 2024, 2023],
  onSearchChange,
  onCategoryChange,
  onToolChange,
  onYearChange,
  onSortChange,
  onClearFilters,
  isLoading = false,
}) {
  const isAr = locale === 'ar';
  const [internalQuery, setInternalQuery] = useState(searchQuery || '');
  const isFirstRender = useRef(true);

  // Sync external searchQuery changes to internal input
  useEffect(() => {
    setInternalQuery(searchQuery || '');
  }, [searchQuery]);

  // Debounced search query propagation (300ms)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timer = setTimeout(() => {
      if (internalQuery !== searchQuery && typeof onSearchChange === 'function') {
        onSearchChange(internalQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [internalQuery, searchQuery, onSearchChange]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (typeof onSearchChange === 'function') {
        onSearchChange(internalQuery);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setInternalQuery('');
      if (typeof onSearchChange === 'function') {
        onSearchChange('');
      }
    }
  };

  const handleClearQuery = () => {
    setInternalQuery('');
    if (typeof onSearchChange === 'function') {
      onSearchChange('');
    }
  };

  const hasActiveFilters = Boolean(
    internalQuery ||
      selectedCategory ||
      selectedTool ||
      selectedYear ||
      (selectedSort && selectedSort !== 'newest')
  );

  return (
    <div
      className="search-filter-bar-wrapper bg-surface border border-border rounded-xl p-4 sm:p-5 shadow-xs space-y-4 mb-8"
      role="search"
      aria-label={isAr ? 'البحث وتصفية المشاريع' : 'Search and filter projects'}
    >
      {/* 1. Main Search Input & Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search Box Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none text-muted">
            <Search size={18} aria-hidden="true" />
          </div>

          <input
            type="search"
            role="searchbox"
            value={internalQuery}
            onChange={(e) => setInternalQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isAr
                ? 'ابحث عن مشروع، هوية، أداة، أو سنة...'
                : 'Search projects, branding, tools, or year...'
            }
            aria-label={isAr ? 'حقل البحث' : 'Search input'}
            aria-busy={isLoading}
            className="w-full bg-base border border-border rounded-lg ps-10 pe-10 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
          />

          {internalQuery && (
            <button
              type="button"
              onClick={handleClearQuery}
              className="absolute inset-y-0 end-0 flex items-center pe-3 text-muted hover:text-foreground transition-colors"
              aria-label={isAr ? 'مسح نص البحث' : 'Clear search text'}
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="search-sort-select" className="text-xs text-muted font-medium whitespace-nowrap">
            {isAr ? 'ترتيب:' : 'Sort:'}
          </label>
          <select
            id="search-sort-select"
            value={selectedSort}
            onChange={(e) => onSortChange?.(e.target.value)}
            aria-label={isAr ? 'ترتيب النتائج' : 'Sort results'}
            className="bg-base border border-border rounded-lg px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="newest">{isAr ? 'الأحدث أولاً' : 'Newest'}</option>
            <option value="most_viewed">{isAr ? 'الأكثر مشاهدة' : 'Most Viewed'}</option>
            <option value="oldest">{isAr ? 'الأقدم' : 'Oldest'}</option>
            <option value="year_desc">{isAr ? 'السنة (الأحدث)' : 'Year (Desc)'}</option>
            <option value="year_asc">{isAr ? 'السنة (الأقدم)' : 'Year (Asc)'}</option>
          </select>
        </div>

        {/* Clear All Filters Button */}
        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            aria-label={isAr ? 'مسح الفلاتر والبحث' : 'Clear all filters and search'}
            className="flex items-center gap-1.5 text-xs text-muted hover:text-destructive transition-colors shrink-0"
          >
            <RotateCcw size={14} aria-hidden="true" />
            <span>{isAr ? 'مسح الفلاتر' : 'Clear Filters'}</span>
          </Button>
        )}
      </div>

      {/* 2. Category Filter Chips */}
      <div className="category-filter-chips flex items-center flex-wrap gap-2 pt-1 border-t border-border/60">
        <span className="text-xs text-muted font-medium me-1">
          {isAr ? 'التصنيفات:' : 'Categories:'}
        </span>

        {/* All Categories Chip */}
        <button
          type="button"
          onClick={() => onCategoryChange?.('')}
          aria-pressed={!selectedCategory}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
            !selectedCategory
              ? 'bg-primary text-primary-fg shadow-xs font-semibold'
              : 'bg-muted text-muted hover:text-foreground hover:bg-muted/80'
          }`}
        >
          {isAr ? 'الكل' : 'All Projects'}
        </button>

        {/* Dynamic Category Chips */}
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.slug;
          const label =
            cat.name ||
            cat.translations?.find((t) => t.locale === locale)?.name ||
            cat.slug;

          return (
            <button
              key={cat.id || cat.slug}
              type="button"
              onClick={() => onCategoryChange?.(cat.slug)}
              aria-pressed={isSelected}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                isSelected
                  ? 'bg-primary text-primary-fg shadow-xs font-semibold'
                  : 'bg-muted text-muted hover:text-foreground hover:bg-muted/80'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* 3. Secondary Filter Chips (Tools & Year) */}
      {(tools.length > 0 || years.length > 0) && (
        <div className="secondary-filters flex items-center flex-wrap gap-4 text-xs pt-2">
          {/* Tool Filter */}
          {tools.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Wrench size={14} className="text-muted" aria-hidden="true" />
              <select
                id="search-tool-filter"
                value={selectedTool}
                onChange={(e) => onToolChange?.(e.target.value)}
                aria-label={isAr ? 'تصفية حسب الأداة' : 'Filter by tool'}
                className="bg-base border border-border rounded-md px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">{isAr ? 'جميع الأدوات' : 'All Tools'}</option>
                {tools.map((tool) => (
                  <option key={tool.slug} value={tool.slug}>
                    {tool.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Year Filter */}
          {years.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-muted" aria-hidden="true" />
              <select
                id="search-year-filter"
                value={selectedYear}
                onChange={(e) => onYearChange?.(e.target.value)}
                aria-label={isAr ? 'تصفية حسب السنة' : 'Filter by year'}
                className="bg-base border border-border rounded-md px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">{isAr ? 'جميع السنوات' : 'All Years'}</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
