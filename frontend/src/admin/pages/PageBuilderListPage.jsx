import React from 'react';
import { Plus, Layout, Edit, ExternalLink, Calendar, Layers } from 'lucide-react';
import { useAdmin } from '../context/AdminContext.jsx';
import { Badge } from '../components/Badge.jsx';

export function PageBuilderListPage() {
  const { lang, t, pages, navigateAdmin } = useAdmin();

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#f4a496]/15">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-[#f4a496]/80 mb-1">
            {lang === 'ar' ? 'هيكلية الصفحات والأقسام' : 'Visual Page Architecture'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-normal tracking-tight text-white font-serif">
            <span>{t.pages.title} </span>
            <span className="text-[#f4a496] italic font-serif">Structure</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 font-light">
            {t.pages.subtitle}
          </p>
        </div>

        <button
          onClick={() => navigateAdmin('/admin/pages/page-home/edit')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-[#fcdcd4] bg-gradient-to-r from-[#842b45] to-[#591b2e] hover:from-[#9c3252] border border-[#f4a496]/40 transition-all shadow-lg shadow-black/50 cursor-pointer self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4 text-[#f4a496]" />
          <span>{t.pages.addNew}</span>
        </button>
      </div>

      {/* Pages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pages.map((page) => (
          <div
            key={page.id}
            className="group p-6 rounded-3xl glass-panel border border-[#f4a496]/15 hover:border-[#f4a496]/35 shadow-xl transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <Badge variant={page.status === 'published' ? 'published' : 'draft'}>
                  {page.status === 'published' ? t.projects.statusPublished : t.projects.statusDraft}
                </Badge>
                <span className="text-[11px] font-mono text-neutral-400 glass-panel-subtle px-2.5 py-0.5 rounded-full border border-white/5">
                  {page.slug}
                </span>
              </div>

              <h3 className="text-lg font-serif font-bold text-white group-hover:text-[#f4a496] transition-colors">
                {lang === 'ar' ? page.nameAr : page.nameEn}
              </h3>

              <div className="mt-5 space-y-2.5 text-xs text-neutral-400 border-t border-white/5 pt-4 font-light">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-[#f4a496]" />
                    <span>{t.pages.blocksCount}:</span>
                  </span>
                  <span className="text-white font-mono font-medium">{page.blocks?.length || 0}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                    <span>{t.pages.lastModified}:</span>
                  </span>
                  <span className="font-mono">{page.lastModified}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between gap-2">
              <a
                href={page.slug}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 transition-colors font-light"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#f4a496]" />
                <span>{lang === 'ar' ? 'معاينة الرابط' : 'Preview Live'}</span>
              </a>

              <button
                onClick={() => navigateAdmin(`/admin/pages/${page.id}/edit`)}
                className="px-4 py-2 rounded-full bg-[#842b45]/30 hover:bg-[#842b45]/50 border border-[#f4a496]/35 text-[#fcdcd4] text-xs font-semibold shadow-md shadow-black/40 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Edit className="w-3.5 h-3.5 text-[#f4a496]" />
                <span>{t.pages.editPage}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
