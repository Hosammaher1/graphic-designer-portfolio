import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Eye,
  Sparkles,
  Upload,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Star,
  CheckCircle2,
  Image as ImageIcon,
  Layers,
  Globe,
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext.jsx';
import { Badge } from '../components/Badge.jsx';
import { MediaPickerModal } from '../components/MediaPickerModal.jsx';
import { resolveLocalized } from '../utils/localization.js';

export function ProjectEditorPage({ projectId }) {
  const {
    lang,
    t,
    projects,
    categories,
    addProject,
    updateProject,
    navigateAdmin,
    addToast,
  } = useAdmin();

  const isEditing = Boolean(projectId && projectId !== 'new');
  const existingProject = isEditing ? projects.find((p) => p.id === projectId) : null;

  // Form State
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'gallery' | 'seo'
  const [titleEn, setTitleEn] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [slug, setSlug] = useState('');
  const [client, setClient] = useState('');
  const [year, setYear] = useState('2025');
  const [selectedCategories, setSelectedCategories] = useState(['Branding']);
  const [tools, setTools] = useState('Illustrator, Photoshop, Figma');
  const [descEn, setDescEn] = useState('');
  const [descAr, setDescAr] = useState('');
  const [coverImage, setCoverImage] = useState('/assets/aistudio/Selected_Work__Noya_Skincare_Portfolio_6434c76f.png');
  const [featured, setFeatured] = useState(false);
  const [status, setStatus] = useState('published');
  const [gallery, setGallery] = useState([]);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDesc, setSeoDesc] = useState('');

  // Media Picker state
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState('cover'); // 'cover' or 'gallery'
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form when editing
  useEffect(() => {
    if (existingProject) {
      const tEn = resolveLocalized(existingProject.title, 'en') || existingProject.titleEn || '';
      const tAr = resolveLocalized(existingProject.title, 'ar') || existingProject.titleAr || '';
      const cEn = resolveLocalized(existingProject.client, 'en') || existingProject.clientEn || '';
      const catEn = resolveLocalized(existingProject.category, 'en') || existingProject.categoryEn || 'Branding';
      const dEn = resolveLocalized(existingProject.description, 'en') || existingProject.descEn || resolveLocalized(existingProject.subtitle, 'en') || '';
      const dAr = resolveLocalized(existingProject.description, 'ar') || existingProject.descAr || resolveLocalized(existingProject.subtitle, 'ar') || '';

      setTitleEn(tEn);
      setTitleAr(tAr);
      setSlug(existingProject.slug || existingProject.id || '');
      setClient(cEn);
      setYear(existingProject.year || '2025');
      setSelectedCategories(
        Array.isArray(existingProject.categories) && existingProject.categories.length > 0
          ? existingProject.categories
          : [catEn]
      );
      setTools(
        Array.isArray(existingProject.tools)
          ? existingProject.tools.join(', ')
          : existingProject.tools || 'Illustrator, Photoshop, Figma'
      );
      setDescEn(dEn);
      setDescAr(dAr);
      setCoverImage(existingProject.coverImage || existingProject.image || '/assets/aistudio/Selected_Work__Noya_Skincare_Portfolio_6434c76f.png');
      setFeatured(!!existingProject.featured);
      setStatus(existingProject.status || 'published');
      setGallery(
        Array.isArray(existingProject.gallery) && existingProject.gallery.length > 0
          ? existingProject.gallery.map((g, gIdx) => ({
              id: g.id || `g-${gIdx + 1}`,
              url: g.url || existingProject.coverImage || existingProject.image,
              captionEn: resolveLocalized(g.captionEn || g.caption, 'en'),
              captionAr: resolveLocalized(g.captionAr || g.caption, 'ar'),
            }))
          : [
              {
                id: 'g-1',
                url: existingProject.coverImage || existingProject.image,
                captionEn: 'Main Presentation',
                captionAr: 'العرض الرئيسي',
              },
            ]
      );
      setSeoTitle(existingProject.seoTitle || tEn);
      setSeoDesc(existingProject.seoDesc || dEn);
    } else {
      // New project default gallery
      setGallery([
        {
          id: 'g-1',
          url: '/assets/aistudio/Selected_Work__Noya_Skincare_Portfolio_6434c76f.png',
          captionEn: 'Packaging & Bottle Design',
          captionAr: 'تصميم التغليف والعبوات',
        },
      ]);
    }
  }, [existingProject]);

  const handleMoveGallery = (index, direction) => {
    const updated = [...gallery];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= updated.length) return;
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setGallery(updated);
  };

  const handleRemoveGallery = (index) => {
    setGallery(gallery.filter((_, i) => i !== index));
  };

  const handleUpdateGalleryCaption = (index, langKey, val) => {
    const updated = [...gallery];
    if (langKey === 'en') updated[index].captionEn = val;
    if (langKey === 'ar') updated[index].captionAr = val;
    setGallery(updated);
  };

  const handleMediaSelected = (mediaItem) => {
    if (mediaPickerTarget === 'cover') {
      setCoverImage(mediaItem.url);
    } else {
      setGallery((prev) => [
        ...prev,
        {
          id: `g-${Date.now()}`,
          url: mediaItem.url,
          captionEn: mediaItem.altEn || mediaItem.name,
          captionAr: mediaItem.altAr || mediaItem.name,
        },
      ]);
    }
  };

  const handleSave = (publishState = status) => {
    setIsSaving(true);
    const projectPayload = {
      title: titleEn,
      titleEn,
      titleAr,
      slug,
      client,
      year,
      categories: selectedCategories,
      category: selectedCategories[0] || 'Branding',
      tools: tools.split(',').map((t) => t.trim()),
      description: {
        en: descEn,
        ar: descAr,
      },
      coverImage,
      image: coverImage,
      featured,
      status: publishState,
      gallery,
      seoTitle,
      seoDesc,
    };

    setTimeout(() => {
      setIsSaving(false);
      if (isEditing) {
        updateProject(projectId, projectPayload);
      } else {
        const created = addProject(projectPayload);
        navigateAdmin(`/admin/projects/${created.id}/edit`);
      }
    }, 500);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#f4a496]/15">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateAdmin('/admin/projects')}
            className="p-2.5 rounded-full text-neutral-300 hover:text-white glass-panel hover:border-[#f4a496]/40 transition-colors cursor-pointer"
            aria-label="Back to projects"
          >
            {lang === 'ar' ? <ArrowRight className="w-5 h-5 text-[#f4a496]" /> : <ArrowLeft className="w-5 h-5 text-[#f4a496]" />}
          </button>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#f4a496]/80 mb-0.5">
              {lang === 'ar' ? 'محرر المشروعات' : 'Studio Project Editor'}
            </div>
            <h1 className="text-xl sm:text-2xl font-normal tracking-tight text-white font-serif">
              {isEditing ? (
                <>
                  <span>{lang === 'ar' ? 'تعديل ' : 'Edit '}</span>
                  <span className="text-[#f4a496] italic font-serif">{titleEn || titleAr || 'Project'}</span>
                </>
              ) : (
                <>
                  <span>{lang === 'ar' ? 'إنشاء مشروع ' : 'Create New '}</span>
                  <span className="text-[#f4a496] italic font-serif">Project</span>
                </>
              )}
            </h1>
            <p className="text-xs text-neutral-400 mt-0.5 font-light">{t.editor.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSave('draft')}
            className="px-4 py-2.5 rounded-full text-xs font-medium text-neutral-300 hover:text-white glass-panel hover:border-[#f4a496]/40 transition-colors cursor-pointer"
          >
            {t.editor.saveDraft}
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSave('published')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold text-[#fcdcd4] bg-gradient-to-r from-[#842b45] to-[#591b2e] hover:from-[#9c3252] border border-[#f4a496]/40 transition-all shadow-lg shadow-black/50 cursor-pointer active:scale-95"
          >
            <Save className="w-4 h-4 text-[#f4a496]" />
            <span>{isSaving ? t.editor.saving : t.editor.publish}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer ${
            activeTab === 'general'
              ? 'glass-panel-active text-[#fcdcd4] border border-[#f4a496]/35 shadow-sm'
              : 'text-neutral-400 hover:text-white glass-panel-subtle'
          }`}
        >
          <Layers className="w-4 h-4 text-[#f4a496]" />
          <span>{t.editor.tabs.general}</span>
        </button>

        <button
          onClick={() => setActiveTab('gallery')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer ${
            activeTab === 'gallery'
              ? 'glass-panel-active text-[#fcdcd4] border border-[#f4a496]/35 shadow-sm'
              : 'text-neutral-400 hover:text-white glass-panel-subtle'
          }`}
        >
          <ImageIcon className="w-4 h-4 text-[#f4a496]" />
          <span>{t.editor.tabs.gallery} ({gallery.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('seo')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer ${
            activeTab === 'seo'
              ? 'glass-panel-active text-[#fcdcd4] border border-[#f4a496]/35 shadow-sm'
              : 'text-neutral-400 hover:text-white glass-panel-subtle'
          }`}
        >
          <Globe className="w-4 h-4 text-[#f4a496]" />
          <span>{t.editor.tabs.seo}</span>
        </button>
      </div>

      {/* TAB 1: GENERAL DETAILS */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form Fields */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bilingual Titles */}
            <div className="p-6 rounded-3xl glass-panel border border-[#f4a496]/15 shadow-xl space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-light">
                  {t.editor.titleEn} *
                </label>
                <input
                  type="text"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl glass-panel-subtle border border-white/10 text-white text-sm focus:outline-none focus:border-[#f4a496]/60 transition-all font-sans"
                  placeholder="e.g. Noya Skincare"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-light">
                  {t.editor.titleAr} *
                </label>
                <input
                  type="text"
                  dir="rtl"
                  value={titleAr}
                  onChange={(e) => setTitleAr(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl glass-panel-subtle border border-white/10 text-white text-sm focus:outline-none focus:border-[#f4a496]/60 transition-all font-arabic"
                  placeholder="مثال: نويا سكينكير"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-light">
                    {t.editor.slug}
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl glass-panel-subtle border border-white/10 text-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-light">
                    {t.editor.client}
                  </label>
                  <input
                    type="text"
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl glass-panel-subtle border border-white/10 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-light">
                    {t.editor.year}
                  </label>
                  <input
                    type="text"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl glass-panel-subtle border border-white/10 text-white text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Bilingual Descriptions */}
            <div className="p-6 rounded-3xl glass-panel border border-[#f4a496]/15 shadow-xl space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-light">
                  {t.editor.descEn}
                </label>
                <textarea
                  rows={4}
                  value={descEn}
                  onChange={(e) => setDescEn(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl glass-panel-subtle border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-[#f4a496]/60 transition-all leading-relaxed font-sans"
                  placeholder="Elaborate on the brand essence, typographic choices, and packaging strategy..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-light">
                  {t.editor.descAr}
                </label>
                <textarea
                  rows={4}
                  dir="rtl"
                  value={descAr}
                  onChange={(e) => setDescAr(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl glass-panel-subtle border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-[#f4a496]/60 transition-all leading-relaxed font-arabic"
                  placeholder="اشرح الرؤية الإبداعية ومفهوم الهوية البصرية وتصميم التغليف..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-light">
                  {t.editor.tools}
                </label>
                <input
                  type="text"
                  value={tools}
                  onChange={(e) => setTools(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl glass-panel-subtle border border-white/10 text-white text-xs"
                  placeholder="Illustrator, Photoshop, InDesign, Blender"
                />
              </div>
            </div>
          </div>

          {/* Sidebar Settings (Cover, Featured, Status, Categories) */}
          <div className="space-y-6">
            {/* Cover Image Box */}
            <div className="p-6 rounded-3xl glass-panel border border-[#f4a496]/15 shadow-xl space-y-3.5">
              <label className="block text-xs font-medium text-neutral-300 font-light">
                {t.editor.coverImage}
              </label>
              <div className="relative aspect-video rounded-2xl overflow-hidden border border-[#f4a496]/20 bg-black/40">
                <img src={coverImage} alt="Cover preview" className="w-full h-full object-cover" />
              </div>
              <button
                type="button"
                onClick={() => {
                  setMediaPickerTarget('cover');
                  setIsMediaPickerOpen(true);
                }}
                className="w-full py-2.5 rounded-full text-xs font-semibold text-[#fcdcd4] bg-[#842b45]/30 hover:bg-[#842b45]/50 border border-[#f4a496]/35 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4 text-[#f4a496]" />
                <span>{t.editor.chooseCover}</span>
              </button>
            </div>

            {/* Publication & Featured Status */}
            <div className="p-6 rounded-3xl glass-panel border border-[#f4a496]/15 shadow-xl space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-2 font-light">
                  {t.editor.statusLabel}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus('published')}
                    className={`py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                      status === 'published'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'glass-panel-subtle text-neutral-400 border-white/10 hover:text-white'
                    }`}
                  >
                    {t.projects.statusPublished}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('draft')}
                    className={`py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                      status === 'draft'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'glass-panel-subtle text-neutral-400 border-white/10 hover:text-white'
                    }`}
                  >
                    {t.projects.statusDraft}
                  </button>
                </div>
              </div>

              {/* Featured in Homepage Carousel Toggle */}
              <div className="pt-3 border-t border-white/10">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-[#f4a496] fill-[#f4a496]" />
                      <span>{t.editor.featuredToggle}</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-1 leading-snug font-light">
                      {t.editor.featuredDesc}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="mt-1 rounded border-white/20 bg-white/10 text-[#842b45] focus:ring-[#f4a496] w-4 h-4 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Category checkboxes */}
            <div className="p-6 rounded-3xl glass-panel border border-[#f4a496]/15 shadow-xl space-y-2">
              <label className="block text-xs font-medium text-neutral-300 mb-2 font-light">
                {t.editor.categories}
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 modal-scrollbar">
                {categories.map((c) => {
                  const isChecked = selectedCategories.includes(c.nameEn);
                  return (
                    <label
                      key={c.id}
                      className="flex items-center gap-2.5 text-xs text-neutral-300 hover:text-white cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCategories([...selectedCategories, c.nameEn]);
                          } else {
                            setSelectedCategories(selectedCategories.filter((cat) => cat !== c.nameEn));
                          }
                        }}
                        className="rounded border-white/20 bg-white/10 text-[#842b45] focus:ring-[#f4a496]"
                      />
                      <span className="font-light">{lang === 'ar' ? c.nameAr : c.nameEn}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MULTI-IMAGE GALLERY MANAGEMENT */}
      {activeTab === 'gallery' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl glass-panel border border-[#f4a496]/15 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-white">{t.editor.galleryTitle}</h2>
              <p className="text-xs text-neutral-400 font-light mt-0.5">{t.editor.galleryDesc}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setMediaPickerTarget('gallery');
                setIsMediaPickerOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold text-[#fcdcd4] bg-gradient-to-r from-[#842b45] to-[#591b2e] hover:from-[#9c3252] border border-[#f4a496]/40 transition-all shadow-md shadow-black/50 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 text-[#f4a496]" />
              <span>{t.editor.addImage}</span>
            </button>
          </div>

          {/* Gallery Items List */}
          <div className="space-y-3.5">
            {gallery.map((item, idx) => (
              <div
                key={item.id || idx}
                className="p-4 sm:p-5 rounded-3xl glass-panel-subtle border border-[#f4a496]/15 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 group"
              >
                {/* Image Preview */}
                <div className="relative w-full sm:w-36 aspect-video sm:aspect-square rounded-2xl overflow-hidden border border-[#f4a496]/20 flex-shrink-0">
                  <img src={item.url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/80 text-[10px] text-[#fcdcd4] font-mono border border-white/10">
                    #{idx + 1}
                  </span>
                </div>

                {/* Captions Inputs */}
                <div className="flex-1 space-y-2">
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold text-[#f4a496]/80 tracking-wider">
                      English Caption
                    </span>
                    <input
                      type="text"
                      value={item.captionEn || ''}
                      onChange={(e) => handleUpdateGalleryCaption(idx, 'en', e.target.value)}
                      placeholder="e.g. Premium Embossed Foil Detail"
                      className="w-full px-3.5 py-2 rounded-xl glass-panel border border-white/10 text-white text-xs mt-1 focus:outline-none focus:border-[#f4a496]/50"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold text-[#f4a496]/80 tracking-wider">
                      Arabic Caption (العربية)
                    </span>
                    <input
                      type="text"
                      dir="rtl"
                      value={item.captionAr || ''}
                      onChange={(e) => handleUpdateGalleryCaption(idx, 'ar', e.target.value)}
                      placeholder="مثال: تفاصيل الحفر الرقائقي الذهبي"
                      className="w-full px-3.5 py-2 rounded-xl glass-panel border border-white/10 text-white text-xs mt-1 font-arabic focus:outline-none focus:border-[#f4a496]/50"
                    />
                  </div>
                </div>

                {/* Reorder and Delete Actions */}
                <div className="flex sm:flex-col items-center justify-end gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMoveGallery(idx, 'up')}
                    className="p-2 rounded-full text-neutral-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed glass-panel-subtle hover:border-[#f4a496]/30 transition-colors"
                    title="Move Up"
                  >
                    <MoveUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === gallery.length - 1}
                    onClick={() => handleMoveGallery(idx, 'down')}
                    className="p-2 rounded-full text-neutral-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed glass-panel-subtle hover:border-[#f4a496]/30 transition-colors"
                    title="Move Down"
                  >
                    <MoveDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveGallery(idx)}
                    className="p-2 rounded-full text-[#f4a496] hover:bg-[#842b45]/30 transition-colors"
                    title="Remove Image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {gallery.length === 0 && (
              <div className="p-8 text-center rounded-3xl glass-panel border border-dashed border-white/15">
                <p className="text-xs text-neutral-400 font-light">No images added to gallery yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SEO & METADATA */}
      {activeTab === 'seo' && (
        <div className="p-6 sm:p-7 rounded-3xl glass-panel border border-[#f4a496]/15 space-y-5 max-w-3xl">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-light">
              {t.editor.seoTitle}
            </label>
            <input
              type="text"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl glass-panel-subtle border border-white/10 text-white text-sm focus:outline-none focus:border-[#f4a496]/60 transition-all"
              placeholder="Case study search title"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-light">
              {t.editor.seoDesc}
            </label>
            <textarea
              rows={3}
              value={seoDesc}
              onChange={(e) => setSeoDesc(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl glass-panel-subtle border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-[#f4a496]/60 transition-all leading-relaxed font-sans"
              placeholder="Search snippet summary"
            />
          </div>

          {/* Live Google Search Card Preview */}
          <div className="pt-4 border-t border-white/10">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#f4a496]/80 mb-3 block">
              Google Search Result Snippet Preview
            </span>
            <div className="p-4 rounded-2xl bg-[#09070c] border border-[#f4a496]/20 max-w-xl">
              <div className="text-[11px] text-neutral-400 flex items-center gap-1 font-mono">
                <span>portfolio.hosam.design</span>
                <span>›</span>
                <span>work</span>
                <span>›</span>
                <span>{slug || 'project-slug'}</span>
              </div>
              <h4 className="text-base text-[#f4a496] hover:underline font-serif font-medium mt-1 truncate">
                {seoTitle || `${titleEn || 'Project'} — Brand Identity Case Study`}
              </h4>
              <p className="text-xs text-neutral-300 font-light mt-1 line-clamp-2 leading-relaxed">
                {seoDesc || descEn || 'Explore the complete brand identity case study, packaging systems, and typography.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Media Picker Modal */}
      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={handleMediaSelected}
        title={
          mediaPickerTarget === 'cover'
            ? t.editor.chooseCover
            : t.editor.addImage
        }
      />
    </div>
  );
}
