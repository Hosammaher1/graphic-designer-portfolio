import React, { useState } from 'react';
import { Globe, Share2, Search, Save, Sparkles, Check, Image as ImageIcon } from 'lucide-react';
import { useAdmin } from '../context/AdminContext.jsx';
import { MediaPickerModal } from '../components/MediaPickerModal.jsx';

export function SeoPage() {
  const { lang, t, settings, updateStudioSettings, projects, addToast } = useAdmin();

  const [siteTitle, setSiteTitle] = useState(settings.seo?.siteTitle || 'Hosam Maher — Cinematic Graphic Designer Portfolio');
  const [siteDescEn, setSiteDescEn] = useState(settings.seo?.siteDescEn || 'Luxury single-page graphic designer portfolio featuring cinematic art direction, interactive Selected Work carousel, bilingual English & Arabic support, and full-detail project modal.');
  const [siteDescAr, setSiteDescAr] = useState(settings.seo?.siteDescAr || 'معرض أعمال مصمم جرافيك فاخر يتميز بالإخراج الفني السينمائي، وكاروسيل أعمال مختارة تفاعلي، ودعم ثنائي اللغة الإنجليزية والعربية.');
  const [ogImage, setOgImage] = useState(settings.seo?.ogImage || '/assets/aistudio/Cinematic_Graphic_Designer_Portfolio_Hero_c9d4f25f.png');
  const [keywords, setKeywords] = useState(settings.seo?.keywords || 'Graphic Designer, Brand Identity, Packaging Design, Cairo, Dubai');

  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      updateStudioSettings({
        seo: {
          siteTitle,
          siteDescEn,
          siteDescAr,
          ogImage,
          keywords,
        },
      });
      addToast(lang === 'ar' ? 'تم حفظ إعدادات محركات البحث ومشاركة التواصل' : 'SEO and OpenGraph settings saved in demo state', 'success');
    }, 400);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#f4a496]/15">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-[#f4a496]/80 mb-1">
            {lang === 'ar' ? 'الظهور والبيانات الوصفية' : 'Search Visibility & OpenGraph'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-normal tracking-tight text-white font-serif">
            <span>{t.seo.title} </span>
            <span className="text-[#f4a496] italic font-serif">Meta</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 font-light">
            {t.seo.subtitle}
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-[#fcdcd4] bg-gradient-to-r from-[#842b45] to-[#591b2e] hover:from-[#9c3252] border border-[#f4a496]/40 transition-all shadow-lg shadow-black/50 cursor-pointer self-start sm:self-auto active:scale-95"
        >
          <Save className="w-4 h-4 text-[#f4a496]" />
          <span>{isSaving ? t.common.loading : t.seo.saveChanges}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Metadata Configuration */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 sm:p-7 rounded-3xl glass-panel border border-[#f4a496]/15 space-y-4 shadow-xl">
            <h2 className="text-base sm:text-lg font-serif font-bold text-white flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-[#842b45]/30 text-[#f4a496]">
                <Globe className="w-4 h-4" />
              </div>
              <span>{t.seo.siteSettings}</span>
            </h2>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-light">
                {t.seo.siteTitle}
              </label>
              <input
                type="text"
                value={siteTitle}
                onChange={(e) => setSiteTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl glass-panel-subtle border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-[#f4a496]/60 transition-all font-sans"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-light">
                {t.seo.siteDesc} (English)
              </label>
              <textarea
                rows={3}
                value={siteDescEn}
                onChange={(e) => setSiteDescEn(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl glass-panel-subtle border border-white/10 text-white text-xs sm:text-sm leading-relaxed font-sans focus:outline-none focus:border-[#f4a496]/60"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-light">
                {t.seo.siteDesc} (Arabic / العربية)
              </label>
              <textarea
                rows={3}
                dir="rtl"
                value={siteDescAr}
                onChange={(e) => setSiteDescAr(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl glass-panel-subtle border border-white/10 text-white text-xs sm:text-sm leading-relaxed font-arabic focus:outline-none focus:border-[#f4a496]/60"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-light">
                {t.editor.seoKeywords}
              </label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                className="w-full px-4 py-2 rounded-xl glass-panel-subtle border border-white/10 text-white text-xs font-sans focus:outline-none focus:border-[#f4a496]/60"
              />
            </div>

            {/* Social Sharing Image */}
            <div className="pt-2">
              <label className="block text-xs font-medium text-neutral-300 mb-2 font-light">
                {t.seo.ogImage}
              </label>
              <div className="flex items-center gap-4">
                <div className="relative w-36 aspect-video rounded-2xl overflow-hidden border border-[#f4a496]/20 bg-black/40">
                  <img src={ogImage} alt="Social share OG" className="w-full h-full object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() => setIsMediaPickerOpen(true)}
                  className="px-4 py-2 rounded-full bg-[#842b45]/30 hover:bg-[#842b45]/50 border border-[#f4a496]/35 text-xs font-semibold text-[#fcdcd4] transition-colors cursor-pointer"
                >
                  Change Share Image
                </button>
              </div>
            </div>
          </div>

          {/* Per-Project SEO Overrides */}
          <div className="p-6 sm:p-7 rounded-3xl glass-panel border border-[#f4a496]/15 shadow-xl space-y-4">
            <h2 className="text-base sm:text-lg font-serif font-bold text-white">{t.seo.projectSeoTitle}</h2>
            <div className="space-y-2.5">
              {projects.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl glass-panel-subtle border border-white/5 text-xs"
                >
                  <div className="min-w-0">
                    <span className="font-serif font-bold text-white truncate block sm:text-sm">
                      {lang === 'ar' ? p.titleAr : p.titleEn}
                    </span>
                    <span className="text-[11px] text-neutral-400 font-mono">
                      portfolio.hosam.design/work/{p.slug || p.id}
                    </span>
                  </div>
                  <span className="text-emerald-300 font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px]">
                    Active
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Live Previews (Google & Social Card) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Google Search Snippet Preview */}
          <div className="p-6 rounded-3xl glass-panel border border-[#f4a496]/15 shadow-xl space-y-3.5">
            <h3 className="text-xs font-mono uppercase tracking-widest text-[#f4a496]/90 flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-[#f4a496]" />
              <span>{t.seo.googlePreview}</span>
            </h3>

            <div className="p-4 rounded-2xl bg-[#09070c] border border-[#f4a496]/20 space-y-1">
              <div className="text-[11px] text-neutral-400 flex items-center gap-1 font-mono">
                <span className="text-neutral-300">https://hosammaher.design</span>
                <span>›</span>
              </div>
              <h4 className="text-sm sm:text-base text-[#f4a496] hover:underline font-serif font-medium leading-snug cursor-pointer">
                {siteTitle}
              </h4>
              <p className="text-xs text-neutral-300 font-light line-clamp-2 leading-relaxed">
                {siteDescEn}
              </p>
            </div>
          </div>

          {/* Social Share Card Preview */}
          <div className="p-6 rounded-3xl glass-panel border border-[#f4a496]/15 shadow-xl space-y-3.5">
            <h3 className="text-xs font-mono uppercase tracking-widest text-[#f4a496]/90 flex items-center gap-2">
              <Share2 className="w-3.5 h-3.5 text-[#f4a496]" />
              <span>{t.seo.socialPreview}</span>
            </h3>

            <div className="rounded-2xl overflow-hidden border border-[#f4a496]/20 bg-[#09070c] shadow-lg">
              <div className="relative aspect-video w-full bg-black">
                <img src={ogImage} alt="Social preview" className="w-full h-full object-cover" />
              </div>
              <div className="p-4 space-y-1 bg-[#120a17]/90">
                <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-mono">
                  hosammaher.design
                </span>
                <h4 className="text-xs sm:text-sm font-serif font-bold text-white truncate">
                  {siteTitle}
                </h4>
                <p className="text-xs text-neutral-400 font-light line-clamp-2 leading-relaxed">
                  {siteDescEn}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Media Picker */}
      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={(item) => setOgImage(item.url)}
        title="Select Social Share Card Image"
      />
    </div>
  );
}
