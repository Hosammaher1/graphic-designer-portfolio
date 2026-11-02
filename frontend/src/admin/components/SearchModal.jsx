import React, { useState, useEffect } from 'react';
import { Search, FolderKanban, Image as ImageIcon, Layout, BarChart3, Settings, Trash2, ArrowRight, X } from 'lucide-react';
import { useAdmin } from '../context/AdminContext.jsx';

export function SearchModal({ isOpen, onClose }) {
  const { lang, projects, media, pages, navigateAdmin } = useAdmin();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose(true); // toggle
      }
      if (e.key === 'Escape' && isOpen) {
        onClose(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();
  const filteredProjects = projects.filter(
    (p) =>
      !q ||
      (p.titleEn && p.titleEn.toLowerCase().includes(q)) ||
      (p.titleAr && p.titleAr.includes(q)) ||
      (p.categoryEn && p.categoryEn.toLowerCase().includes(q))
  ).slice(0, 4);

  const filteredMedia = media.filter(
    (m) =>
      m.name?.toLowerCase().includes(query.toLowerCase()) ||
      m.altEn?.toLowerCase().includes(query.toLowerCase()) ||
      (m.altAr && m.altAr.includes(query))
  ).slice(0, 3);

  const filteredPages = pages.filter(
    (p) =>
      p.nameEn?.toLowerCase().includes(query.toLowerCase()) ||
      (p.nameAr && p.nameAr.includes(query)) ||
      p.slug?.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 3);

  const quickNavItems = [
    { label: lang === 'ar' ? 'إدارة المشاريع' : 'Projects List', path: '/admin/projects', icon: FolderKanban },
    { label: lang === 'ar' ? 'مكتبة الوسائط' : 'Media Library', path: '/admin/media', icon: ImageIcon },
    { label: lang === 'ar' ? 'منشئ الصفحات' : 'Page Builder', path: '/admin/pages', icon: Layout },
    { label: lang === 'ar' ? 'الإحصائيات والتحليلات' : 'Analytics', path: '/admin/analytics', icon: BarChart3 },
    { label: lang === 'ar' ? 'إعدادات الاستوديو' : 'Settings', path: '/admin/settings', icon: Settings },
    { label: lang === 'ar' ? 'سلة المحذوفات' : 'Trash & Recovery', path: '/admin/trash', icon: Trash2 },
  ];

  const handleSelect = (path) => {
    navigateAdmin(path);
    onClose(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-3xl glass-panel-active border border-[#f4a496]/25 shadow-2xl shadow-black/95 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input bar */}
        <div className="flex items-center px-5 py-4 border-b border-white/10 gap-3 bg-[#16101a]/50">
          <Search className="w-5 h-5 text-[#f4a496] flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={lang === 'ar' ? 'ابحث في المشاريع، الوسائط، الصفحات...' : 'Search projects, media assets, pages...'}
            autoFocus
            className="flex-1 bg-transparent border-0 text-white placeholder-neutral-500 focus:outline-none text-sm sm:text-base font-sans"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-neutral-400 hover:text-white p-1 rounded-full hover:bg-white/10">
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-block text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-neutral-400">
            ESC
          </span>
        </div>

        {/* Results Area */}
        <div className="overflow-y-auto p-4 sm:p-5 space-y-4 divide-y divide-white/5 modal-scrollbar">
          {/* Quick Nav if no query */}
          {!query && (
            <div>
              <p className="text-[11px] font-mono uppercase tracking-widest text-[#f4a496]/80 mb-2.5 px-2">
                {lang === 'ar' ? 'التنقل السريع' : 'Quick Navigation'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {quickNavItems.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelect(item.path)}
                      className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-neutral-300 hover:text-white glass-panel-subtle hover:border-[#f4a496]/30 border border-transparent transition-all text-xs font-medium text-left rtl:text-right cursor-pointer"
                    >
                      <div className="p-1.5 rounded-lg bg-[#842b45]/20 text-[#f4a496]">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="flex-1">{item.label}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-neutral-500 rtl:rotate-180" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Projects Results */}
          {filteredProjects.length > 0 && (
            <div className="pt-3">
              <p className="text-[11px] font-mono uppercase tracking-widest text-[#f4a496]/80 mb-2.5 px-2">
                {lang === 'ar' ? 'المشاريع' : 'Projects'}
              </p>
              <div className="space-y-1.5">
                {filteredProjects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelect(`/admin/projects/${p.id}/edit`)}
                    className="w-full flex items-center gap-3.5 p-2.5 rounded-2xl text-neutral-200 glass-panel-subtle hover:border-[#f4a496]/35 border border-transparent transition-all text-left rtl:text-right group cursor-pointer"
                  >
                    <img
                      src={p.coverImage || p.image}
                      alt={p.titleEn || 'Project'}
                      className="w-11 h-11 rounded-xl object-cover border border-[#f4a496]/20"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs sm:text-sm font-serif font-bold text-white truncate group-hover:text-[#f4a496] transition-colors">
                        {lang === 'ar' ? p.titleAr : p.titleEn}
                      </div>
                      <div className="text-[11px] text-neutral-400 flex items-center gap-2 font-light">
                        <span>{lang === 'ar' ? p.categoryAr : p.categoryEn}</span>
                        <span>•</span>
                        <span>{p.year || '2025'}</span>
                      </div>
                    </div>
                    <span className="text-xs text-[#f4a496] group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform font-medium">
                      {lang === 'ar' ? 'تعديل' : 'Edit'} →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Media Results */}
          {filteredMedia.length > 0 && (
            <div className="pt-3">
              <p className="text-[11px] font-mono uppercase tracking-widest text-[#f4a496]/80 mb-2.5 px-2">
                {lang === 'ar' ? 'الوسائط' : 'Media Assets'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {filteredMedia.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleSelect('/admin/media')}
                    className="flex items-center gap-2.5 p-2 rounded-xl glass-panel-subtle hover:border-[#f4a496]/30 border border-transparent transition-all text-left rtl:text-right cursor-pointer"
                  >
                    <img src={m.url} alt={m.name} className="w-8 h-8 rounded-lg object-cover border border-white/10" />
                    <span className="text-xs text-neutral-200 truncate flex-1">{m.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pages Results */}
          {filteredPages.length > 0 && (
            <div className="pt-3">
              <p className="text-[11px] font-mono uppercase tracking-widest text-[#f4a496]/80 mb-2.5 px-2">
                {lang === 'ar' ? 'الصفحات' : 'Pages'}
              </p>
              <div className="space-y-1">
                {filteredPages.map((pg) => (
                  <button
                    key={pg.id}
                    onClick={() => handleSelect(`/admin/pages/${pg.id}/edit`)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl text-neutral-200 glass-panel-subtle hover:border-[#f4a496]/30 border border-transparent transition-all text-left rtl:text-right cursor-pointer"
                  >
                    <div>
                      <div className="text-xs sm:text-sm font-medium text-white">
                        {lang === 'ar' ? pg.nameAr : pg.nameEn}
                      </div>
                      <div className="text-[11px] text-neutral-400 font-mono">{pg.slug}</div>
                    </div>
                    <span className="text-xs text-[#f4a496]">{lang === 'ar' ? 'منشئ الصفحات' : 'Builder'} →</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {query && filteredProjects.length === 0 && filteredMedia.length === 0 && filteredPages.length === 0 && (
            <div className="text-center py-8 text-neutral-400 text-sm font-light">
              {lang === 'ar' ? 'لا توجد نتائج مطابقة لبحثك' : 'No results found matching your search query.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
