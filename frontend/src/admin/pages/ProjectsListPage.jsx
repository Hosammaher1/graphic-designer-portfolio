import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  LayoutGrid,
  List,
  Edit,
  Trash2,
  Eye,
  Star,
  CheckCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext.jsx';
import { Badge } from '../components/Badge.jsx';
import { ConfirmModal } from '../components/ConfirmModal.jsx';

export function ProjectsListPage() {
  const {
    lang,
    t,
    projects,
    categories,
    deleteProject,
    toggleFeaturedProject,
    navigateAdmin,
    fetchProjects,
  } = useAdmin();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('recent'); // 'recent' | 'views' | 'title'
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'

  // Modal confirmation for deletion
  const [projectToDelete, setProjectToDelete] = useState(null);

  // Sync projects from database when visiting projects list
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Filtered & Sorted list
  const filteredProjects = projects
    .filter((p) => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (p.titleEn && p.titleEn.toLowerCase().includes(q)) ||
        (p.titleAr && p.titleAr.includes(q)) ||
        (p.clientEn && p.clientEn.toLowerCase().includes(q)) ||
        (p.categoryEn && p.categoryEn.toLowerCase().includes(q)) ||
        (Array.isArray(p.categories) &&
          p.categories.some((cat) => {
            const name = typeof cat === 'string' ? cat : (cat.nameEn || cat.name_en || cat.name?.en || cat.slug || '');
            return name.toLowerCase().includes(q);
          }));

      // Category
      const matchCat =
        selectedCategory === 'ALL' ||
        p.categoryEn === selectedCategory ||
        (Array.isArray(p.categories) &&
          p.categories.some((cat) => {
            if (typeof cat === 'string') return cat === selectedCategory;
            if (typeof cat === 'object' && cat !== null) {
              return (
                cat.nameEn === selectedCategory ||
                cat.name_en === selectedCategory ||
                cat.name?.en === selectedCategory ||
                cat.slug === selectedCategory ||
                String(cat.id) === String(selectedCategory)
              );
            }
            return false;
          }));

      // Status
      const matchStatus =
        selectedStatus === 'ALL' || p.status === selectedStatus;

      return matchSearch && matchCat && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'views') return (b.views || 0) - (a.views || 0);
      if (sortBy === 'title') return (a.titleEn || '').localeCompare(b.titleEn || '');
      // 'recent' by default
      return (b.updatedAt || '').localeCompare(a.updatedAt || '');
    });

  const handleDeleteConfirm = () => {
    if (projectToDelete) {
      deleteProject(projectToDelete.id);
      setProjectToDelete(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#f4a496]/15">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-[#f4a496]/80 mb-1">
            {lang === 'ar' ? 'معرض الأعمال والحقيبة' : 'Portfolio Catalogue'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-normal tracking-tight text-white font-serif">
            <span>{t.projects.title} </span>
            <span className="text-[#f4a496] italic font-serif">Index</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 font-light">
            {t.projects.subtitle}
          </p>
        </div>

        <button
          onClick={() => navigateAdmin('/admin/projects/new')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-[#fcdcd4] bg-gradient-to-r from-[#842b45] to-[#591b2e] hover:from-[#9c3252] border border-[#f4a496]/40 transition-all shadow-lg shadow-black/50 cursor-pointer self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4 text-[#f4a496]" />
          <span>{t.projects.addNew}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-3xl glass-panel border border-[#f4a496]/15 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.projects.searchPlaceholder}
            className="w-full pl-10 pr-3.5 rtl:pl-3.5 rtl:pr-10 py-2.5 rounded-full glass-panel-subtle border border-white/10 text-white placeholder-neutral-500 text-xs sm:text-sm focus:outline-none focus:border-[#f4a496]/60 transition-all font-sans"
          />
        </div>

        {/* Filters and View Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3.5 py-2 rounded-full glass-panel-subtle border border-white/10 text-neutral-200 text-xs focus:outline-none focus:border-[#f4a496]/50 cursor-pointer"
          >
            <option value="ALL" className="bg-[#120a17] text-white">
              {t.projects.filterCategory}
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.nameEn} className="bg-[#120a17] text-white">
                {lang === 'ar' ? c.nameAr : c.nameEn}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3.5 py-2 rounded-full glass-panel-subtle border border-white/10 text-neutral-200 text-xs focus:outline-none focus:border-[#f4a496]/50 cursor-pointer"
          >
            <option value="ALL" className="bg-[#120a17] text-white">
              {t.projects.filterStatus}
            </option>
            <option value="published" className="bg-[#120a17] text-white">
              {t.projects.statusPublished}
            </option>
            <option value="draft" className="bg-[#120a17] text-white">
              {t.projects.statusDraft}
            </option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3.5 py-2 rounded-full glass-panel-subtle border border-white/10 text-neutral-200 text-xs focus:outline-none focus:border-[#f4a496]/50 cursor-pointer"
          >
            <option value="recent" className="bg-[#120a17] text-white">
              {t.projects.sortRecent}
            </option>
            <option value="views" className="bg-[#120a17] text-white">
              {t.projects.sortViews}
            </option>
            <option value="title" className="bg-[#120a17] text-white">
              {t.projects.sortTitle}
            </option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-full glass-panel-subtle border border-white/10 p-0.5">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-full text-xs transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-[#842b45]/40 text-[#fcdcd4] border border-[#f4a496]/30' : 'text-neutral-400 hover:text-white'
              }`}
              title={t.projects.list}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-full text-xs transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-[#842b45]/40 text-[#fcdcd4] border border-[#f4a496]/30' : 'text-neutral-400 hover:text-white'
              }`}
              title={t.projects.grid}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-xs text-neutral-400 flex items-center justify-between px-2 font-light">
        <span>
          {filteredProjects.length} {t.projects.itemsFound}
        </span>
        {(searchQuery || selectedCategory !== 'ALL' || selectedStatus !== 'ALL') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('ALL');
              setSelectedStatus('ALL');
            }}
            className="text-[#f4a496] hover:underline cursor-pointer"
          >
            {t.projects.resetFilters}
          </button>
        )}
      </div>

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div className="rounded-3xl glass-panel border border-[#f4a496]/15 shadow-2xl overflow-hidden">
          <div className="overflow-x-auto modal-scrollbar">
            <table className="w-full text-left rtl:text-right text-xs sm:text-sm">
              <thead className="border-b border-white/10 bg-white/[0.02] text-neutral-400 text-[10px] font-mono uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-4 sm:px-6">{t.projects.colProject}</th>
                  <th className="py-4 px-4">{t.projects.colCategory}</th>
                  <th className="py-4 px-4">{t.projects.colStatus}</th>
                  <th className="py-4 px-4">{t.projects.colFeatured}</th>
                  <th className="py-4 px-4">{t.projects.colViews}</th>
                  <th className="py-4 px-4">{t.projects.colUpdated}</th>
                  <th className="py-4 px-4 sm:px-6 text-right rtl:text-left">{t.projects.colActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredProjects.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.03] transition-colors group">
                    {/* Project info */}
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-3.5">
                        <img
                          src={p.coverImage || p.image || '/assets/aistudio/Selected_Work__Noya_Skincare_Portfolio_6434c76f.png'}
                          alt={p.titleEn || 'Project thumbnail'}
                          className="w-12 h-12 rounded-2xl object-cover border border-[#f4a496]/20 flex-shrink-0"
                        />
                        <div className="min-w-0 max-w-xs">
                          <div className="font-serif font-bold text-white text-sm sm:text-base truncate group-hover:text-[#f4a496] transition-colors">
                            {lang === 'ar' ? p.titleAr : p.titleEn}
                          </div>
                          <div className="text-[11px] text-neutral-400 font-light truncate mt-0.5">
                            {lang === 'ar' ? p.clientAr : p.clientEn} • {p.year || '2025'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-4 px-4 text-neutral-300">
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(p.categories) && p.categories.length > 0 ? (
                          p.categories.map((c, i) => {
                            const label =
                              typeof c === 'string'
                                ? c
                                : lang === 'ar'
                                ? c.name_ar || c.nameAr || c.name_en || c.nameEn || c.slug
                                : c.name_en || c.nameEn || c.name_ar || c.nameAr || c.slug;
                            return (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded-full glass-panel-subtle border border-white/5 text-[10px]"
                              >
                                {label}
                              </span>
                            );
                          })
                        ) : (
                          <span className="px-2.5 py-1 rounded-full glass-panel-subtle border border-white/5 text-[11px]">
                            {(lang === 'ar' ? p.categoryAr : p.categoryEn) || 'Branding'}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <Badge variant={p.status}>
                        {p.status === 'published' ? t.projects.statusPublished : t.projects.statusDraft}
                      </Badge>
                    </td>

                    {/* Featured toggle */}
                    <td className="py-4 px-4">
                      <button
                        onClick={() => toggleFeaturedProject(p.id)}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                          p.featured
                            ? 'bg-[#842b45]/30 text-[#fcdcd4] border border-[#f4a496]/35 shadow-sm'
                            : 'glass-panel-subtle text-neutral-400 hover:text-neutral-200'
                        }`}
                        title={t.projects.toggleFeatured}
                      >
                        <Star className={`w-3.5 h-3.5 ${p.featured ? 'fill-[#f4a496] text-[#f4a496]' : ''}`} />
                        <span>{p.featured ? (lang === 'ar' ? 'مميز' : 'Featured') : (lang === 'ar' ? 'عادي' : 'Standard')}</span>
                      </button>
                    </td>

                    {/* Views */}
                    <td className="py-4 px-4 text-neutral-300 font-mono text-xs">
                      {p.views?.toLocaleString()}
                    </td>

                    {/* Updated */}
                    <td className="py-4 px-4 text-neutral-400 text-xs font-light">
                      {p.updatedAt || 'Recent'}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 sm:px-6 text-right rtl:text-left">
                      <div className="flex items-center justify-end rtl:justify-start gap-1.5">
                        <button
                          onClick={() => navigateAdmin(`/admin/projects/${p.id}/edit`)}
                          className="p-2 rounded-xl text-neutral-300 hover:text-white glass-panel-subtle hover:border-[#f4a496]/40 transition-colors cursor-pointer"
                          title={t.projects.editProject}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setProjectToDelete(p)}
                          className="p-2 rounded-xl text-neutral-400 hover:text-[#f4a496] hover:bg-[#842b45]/20 transition-colors cursor-pointer"
                          title={t.projects.deleteProject}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GRID VIEW */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((p) => (
            <div
              key={p.id}
              className="group rounded-3xl glass-panel border border-[#f4a496]/15 hover:border-[#f4a496]/35 shadow-xl overflow-hidden flex flex-col transition-all duration-300"
            >
              {/* Card Image */}
              <div className="relative aspect-video overflow-hidden">
                <img
                  src={p.coverImage || p.image || '/assets/aistudio/Selected_Work__Noya_Skincare_Portfolio_6434c76f.png'}
                  alt={p.titleEn || 'Project cover'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-90" />

                {/* Top badges */}
                <div className="absolute top-3 inset-x-3 flex items-center justify-between">
                  <Badge variant={p.status}>
                    {p.status === 'published' ? t.projects.statusPublished : t.projects.statusDraft}
                  </Badge>

                  <button
                    onClick={() => toggleFeaturedProject(p.id)}
                    className={`p-1.5 rounded-full backdrop-blur-md transition-all cursor-pointer ${
                      p.featured ? 'bg-[#842b45] text-[#fcdcd4] border border-[#f4a496]/40 shadow' : 'bg-black/60 text-neutral-400 hover:text-white border border-white/10'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${p.featured ? 'fill-[#f4a496] text-[#f4a496]' : ''}`} />
                  </button>
                </div>

                {/* Category tag */}
                <div className="absolute bottom-3 left-3 rtl:left-auto rtl:right-3 text-[11px] text-[#f4a496] font-mono tracking-wider">
                  {Array.isArray(p.categories) && p.categories.length > 0
                    ? p.categories
                        .map((c) =>
                          typeof c === 'string'
                            ? c
                            : lang === 'ar'
                            ? c.name_ar || c.nameAr || c.name_en || c.nameEn || c.slug
                            : c.name_en || c.nameEn || c.name_ar || c.nameAr || c.slug
                        )
                        .join(' · ')
                    : lang === 'ar'
                    ? p.categoryAr
                    : p.categoryEn}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif font-bold text-white text-base sm:text-lg group-hover:text-[#f4a496] transition-colors">
                    {lang === 'ar' ? p.titleAr : p.titleEn}
                  </h3>
                  <p className="text-xs text-neutral-400 font-light mt-1.5 line-clamp-2 leading-relaxed">
                    {lang === 'ar' ? (p.descAr || p.subtitleAr) : (p.descEn || p.subtitleEn)}
                  </p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-neutral-500 font-mono text-[11px]">
                    {p.views?.toLocaleString()} {lang === 'ar' ? 'مشاهدة' : 'views'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => navigateAdmin(`/admin/projects/${p.id}/edit`)}
                      className="px-3.5 py-1.5 rounded-full bg-[#842b45]/25 hover:bg-[#842b45]/45 border border-[#f4a496]/30 text-[#fcdcd4] text-xs font-semibold transition-colors cursor-pointer"
                    >
                      {t.projects.editProject}
                    </button>
                    <button
                      onClick={() => setProjectToDelete(p)}
                      className="p-1.5 rounded-full text-neutral-400 hover:text-[#f4a496] hover:bg-[#842b45]/20 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <div className="p-12 text-center rounded-3xl glass-panel border border-white/5">
          <div className="w-12 h-12 rounded-full bg-[#842b45]/20 text-[#f4a496] flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-serif font-bold text-white">{t.projects.emptyTitle}</h3>
          <p className="text-xs text-neutral-400 font-light mt-1 max-w-sm mx-auto">{t.projects.emptyDesc}</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!projectToDelete}
        title={t.projects.deleteProject}
        message={
          lang === 'ar'
            ? `هل أنت متأكد من رغبتك في نقل المشروع "${projectToDelete?.titleAr || projectToDelete?.titleEn || 'المشروع'}" إلى سلة المحذوفات؟ يمكنك استرجاعه خلال 30 يوماً.`
            : `Move project "${projectToDelete?.titleEn || 'this project'}" to Trash? It will remain restorable for 30 days.`
        }
        confirmLabel={lang === 'ar' ? 'نقل إلى السلة' : 'Move to Trash'}
        cancelLabel={lang === 'ar' ? 'إلغاء' : 'Cancel'}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setProjectToDelete(null)}
      />
    </div>
  );
}
