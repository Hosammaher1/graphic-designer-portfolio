import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Monitor,
  Tablet,
  Smartphone,
  Plus,
  MoveUp,
  MoveDown,
  Copy,
  Trash2,
  Save,
  CheckCircle,
  Eye,
  Layers,
  Sparkles,
  Heading,
  Type,
  Image as ImageIcon,
  Grid,
  User,
  Cpu,
  Clock,
  Mail,
  Minus,
  Columns,
  Sliders,
  X,
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext.jsx';
import { AVAILABLE_BLOCK_TYPES } from '../data/adminData.js';

export function PageBuilderEditorPage({ pageId }) {
  const { lang, t, pages, setPages, navigateAdmin, addToast } = useAdmin();

  const currentPage = pages.find((p) => p.id === pageId) || pages[0];

  const [blocks, setBlocks] = useState(currentPage.blocks || []);
  const [selectedBlockId, setSelectedBlockId] = useState(blocks[0]?.id || null);
  const [devicePreview, setDevicePreview] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'
  const [isAddingBlock, setIsAddingBlock] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) || blocks[0];

  const iconMap = {
    Sparkles,
    Heading,
    Type,
    Image: ImageIcon,
    Grid,
    Layers,
    User,
    Cpu,
    Clock,
    Mail,
    Minus,
    Columns,
  };

  const handleAddBlock = (blockType) => {
    const newBlock = {
      id: `b-${Date.now()}`,
      type: blockType.type,
      name: `${blockType.label} Section`,
      isVisible: true,
      settings: {
        titleEn: `New ${blockType.label}`,
        titleAr: `قسم ${blockType.label} جديد`,
        subtitleEn: 'Crafting memorable visual communications for discerning clients.',
        subtitleAr: 'صناعة اتصالات بصرية مميزة للعملاء الرواد.',
      },
    };
    setBlocks([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id);
    setIsAddingBlock(false);
    addToast(lang === 'ar' ? 'تم إضافة الكتلة الإنشائية بنجاح' : `Added ${blockType.label} block`, 'success');
  };

  const handleMoveBlock = (index, direction) => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    setBlocks(next);
  };

  const handleDuplicateBlock = (index) => {
    const target = blocks[index];
    const copy = {
      ...target,
      id: `b-${Date.now()}`,
      name: `${target.name} (Copy)`,
    };
    const next = [...blocks];
    next.splice(index + 1, 0, copy);
    setBlocks(next);
    setSelectedBlockId(copy.id);
    addToast(lang === 'ar' ? 'تم تكرار الكتلة' : 'Block duplicated', 'info');
  };

  const handleDeleteBlock = (id) => {
    if (blocks.length <= 1) {
      addToast(lang === 'ar' ? 'يجب أن تحتوي الصفحة على كتلة واحدة على الأقل' : 'Page must have at least one block', 'error');
      return;
    }
    const next = blocks.filter((b) => b.id !== id);
    setBlocks(next);
    if (selectedBlockId === id) {
      setSelectedBlockId(next[0]?.id || null);
    }
  };

  const handleUpdateSelectedSettings = (key, value) => {
    setBlocks(
      blocks.map((b) => {
        if (b.id === selectedBlockId) {
          return {
            ...b,
            settings: {
              ...b.settings,
              [key]: value,
            },
          };
        }
        return b;
      })
    );
  };

  const handleSavePage = (status = 'published') => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setPages(
        pages.map((p) => {
          if (p.id === currentPage.id) {
            return {
              ...p,
              blocks,
              status,
              lastModified: new Date().toISOString().split('T')[0],
            };
          }
          return p;
        })
      );
      addToast(
        lang === 'ar'
          ? 'تم حفظ ونشر الصفحة بنجاح في الحالة التجريبية!'
          : 'Page blocks successfully saved in demo prototype!',
        'success'
      );
    }, 400);
  };

  const deviceWidthClasses = {
    desktop: 'w-full max-w-5xl',
    tablet: 'w-full max-w-[768px]',
    mobile: 'w-full max-w-[375px]',
  };

  return (
    <div className="space-y-4 animate-fadeIn pb-12">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#f4a496]/15">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateAdmin('/admin/pages')}
            className="p-2.5 rounded-full text-neutral-300 hover:text-white glass-panel hover:border-[#f4a496]/40 transition-colors"
          >
            {lang === 'ar' ? <ArrowRight className="w-5 h-5 text-[#f4a496]" /> : <ArrowLeft className="w-5 h-5 text-[#f4a496]" />}
          </button>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#f4a496]/80 mb-0.5">
              {lang === 'ar' ? 'محرر تخطيط الصفحة' : 'Visual Page Composer'}
            </div>
            <h1 className="text-lg sm:text-xl font-normal tracking-tight text-white font-serif flex items-center gap-2">
              <span>{t.pages.editor.title}:</span>
              <span className="text-[#f4a496] italic font-serif">
                {lang === 'ar' ? currentPage.nameAr : currentPage.nameEn}
              </span>
            </h1>
            <span className="text-xs text-neutral-400 font-mono">{currentPage.slug}</span>
          </div>
        </div>

        {/* Device Switcher & Actions */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Device toggle */}
          <div className="flex items-center rounded-full glass-panel-subtle border border-white/10 p-1">
            <button
              onClick={() => setDevicePreview('desktop')}
              className={`p-1.5 rounded-full text-xs transition-colors cursor-pointer ${
                devicePreview === 'desktop' ? 'bg-[#842b45]/40 text-[#fcdcd4] border border-[#f4a496]/40' : 'text-neutral-400 hover:text-white'
              }`}
              title={t.pages.editor.deviceDesktop}
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDevicePreview('tablet')}
              className={`p-1.5 rounded-full text-xs transition-colors cursor-pointer ${
                devicePreview === 'tablet' ? 'bg-[#842b45]/40 text-[#fcdcd4] border border-[#f4a496]/40' : 'text-neutral-400 hover:text-white'
              }`}
              title={t.pages.editor.deviceTablet}
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDevicePreview('mobile')}
              className={`p-1.5 rounded-full text-xs transition-colors cursor-pointer ${
                devicePreview === 'mobile' ? 'bg-[#842b45]/40 text-[#fcdcd4] border border-[#f4a496]/40' : 'text-neutral-400 hover:text-white'
              }`}
              title={t.pages.editor.deviceMobile}
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => handleSavePage('draft')}
            disabled={isSaving}
            className="px-4 py-2 rounded-full text-xs font-medium text-neutral-300 hover:text-white glass-panel hover:border-[#f4a496]/40 cursor-pointer"
          >
            {t.pages.editor.saveDraft}
          </button>

          <button
            onClick={() => handleSavePage('published')}
            disabled={isSaving}
            className="px-5 py-2 rounded-full text-xs font-semibold text-[#fcdcd4] bg-gradient-to-r from-[#842b45] to-[#591b2e] hover:from-[#9c3252] border border-[#f4a496]/40 shadow-md shadow-black/50 cursor-pointer flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5 text-[#f4a496]" />
            <span>{t.pages.editor.publish}</span>
          </button>
        </div>
      </div>

      {/* 3-Column Layout: Blocks Tree / Live Preview Canvas / Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[640px]">
        {/* Left: Blocks Navigator */}
        <div className="lg:col-span-3 p-5 rounded-3xl glass-panel border border-[#f4a496]/15 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#f4a496]/80 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-[#f4a496]" />
                <span>{t.pages.editor.blocksInPage}</span>
              </span>

              <button
                onClick={() => setIsAddingBlock(true)}
                className="px-3 py-1 rounded-full bg-[#842b45]/30 hover:bg-[#842b45]/50 border border-[#f4a496]/35 text-[#fcdcd4] text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3 text-[#f4a496]" />
                <span>{t.pages.editor.blockLibrary}</span>
              </button>
            </div>

            {/* List of Blocks */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 modal-scrollbar">
              {blocks.map((b, idx) => {
                const isSelected = b.id === selectedBlockId;
                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBlockId(b.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'glass-panel-active border-[#f4a496]/40 text-[#fcdcd4] shadow-md font-semibold'
                        : 'glass-panel-subtle border-white/5 text-neutral-300 hover:border-[#f4a496]/20'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-[10px] font-mono text-neutral-500 w-4">#{idx + 1}</span>
                      <span className="text-xs truncate font-medium">{b.name}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        disabled={idx === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveBlock(idx, 'up');
                        }}
                        className="p-1 text-neutral-400 hover:text-white disabled:opacity-20"
                        title={t.pages.editor.moveUp}
                      >
                        <MoveUp className="w-3 h-3" />
                      </button>
                      <button
                        disabled={idx === blocks.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveBlock(idx, 'down');
                        }}
                        className="p-1 text-neutral-400 hover:text-white disabled:opacity-20"
                        title={t.pages.editor.moveDown}
                      >
                        <MoveDown className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 text-[11px] text-neutral-500 text-center font-mono font-light">
            {blocks.length} {lang === 'ar' ? 'كتل مرتبة' : 'blocks assembled'}
          </div>
        </div>

        {/* Center: Live Rendered Device Preview Canvas */}
        <div className="lg:col-span-6 flex flex-col items-center justify-start bg-black/60 rounded-3xl border border-white/10 p-4 sm:p-6 overflow-y-auto max-h-[720px] modal-scrollbar">
          <div
            className={`transition-all duration-300 bg-[#09070c] rounded-3xl border border-[#f4a496]/20 p-5 sm:p-7 shadow-2xl space-y-6 ${deviceWidthClasses[devicePreview]}`}
          >
            {blocks.map((b) => {
              const isSelected = b.id === selectedBlockId;
              const title = lang === 'ar' && b.settings?.titleAr ? b.settings.titleAr : b.settings?.titleEn || b.name;
              const sub = lang === 'ar' && b.settings?.subtitleAr ? b.settings.subtitleAr : b.settings?.subtitleEn || '';

              return (
                <div
                  key={b.id}
                  onClick={() => setSelectedBlockId(b.id)}
                  className={`relative p-5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#f4a496] ring-2 ring-[#f4a496]/40 glass-panel-active'
                      : 'border-white/5 hover:border-[#f4a496]/20 glass-panel-subtle'
                  }`}
                >
                  <span className="absolute top-2.5 right-2.5 rtl:right-auto rtl:left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-white/10 text-neutral-400">
                    {b.type}
                  </span>

                  {/* Visual Simulation by Block Type */}
                  {b.type === 'hero' && (
                    <div className="space-y-3 py-4 text-center">
                      <div className="inline-block px-3 py-1 rounded-full text-[10px] font-medium bg-[#842b45]/30 text-[#fcdcd4] border border-[#f4a496]/30">
                        Cinematic Hero
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold font-serif text-white">{title}</h2>
                      <p className="text-xs text-neutral-400 font-light max-w-sm mx-auto">{sub}</p>
                      <div className="pt-2 flex items-center justify-center gap-2">
                        <span className="px-4 py-1.5 rounded-full bg-white text-black font-semibold text-[11px]">
                          View Work ↗
                        </span>
                        <span className="px-4 py-1.5 rounded-full glass-panel text-white text-[11px]">
                          About Me
                        </span>
                      </div>
                    </div>
                  )}

                  {b.type === 'heading' && (
                    <div className="py-2">
                      <span className="text-[10px] uppercase tracking-widest text-[#f4a496] font-mono block mb-1">
                        02 / Selected Section
                      </span>
                      <h2 className="text-lg font-serif font-bold text-white">{title}</h2>
                      <div className="w-12 h-0.5 bg-[#f4a496] mt-2" />
                    </div>
                  )}

                  {b.type === 'featured-projects' && (
                    <div className="space-y-2 py-2">
                      <div className="text-xs font-serif font-bold text-white">{title}</div>
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <div className="aspect-video rounded-xl bg-[#842b45]/20 border border-[#f4a496]/30 flex items-center justify-center text-[10px] text-[#fcdcd4] font-semibold">
                          Featured #1
                        </div>
                        <div className="aspect-video rounded-xl glass-panel-subtle border border-white/10 flex items-center justify-center text-[10px] text-neutral-400">
                          Featured #2
                        </div>
                        <div className="aspect-video rounded-xl glass-panel-subtle border border-white/10 flex items-center justify-center text-[10px] text-neutral-400">
                          Featured #3
                        </div>
                      </div>
                    </div>
                  )}

                  {b.type === 'image' && (
                    <div className="space-y-2 py-1">
                      <div className="aspect-video rounded-2xl bg-gradient-to-tr from-[#842b45]/30 via-[#421a28]/20 to-black border border-white/10 flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-neutral-600" />
                      </div>
                      <p className="text-[11px] text-neutral-400 text-center font-light">{title}</p>
                    </div>
                  )}

                  {b.type === 'skills' && (
                    <div className="space-y-2 py-2">
                      <h4 className="text-xs font-serif font-bold text-white">{title}</h4>
                      <div className="grid grid-cols-4 gap-2">
                        {['Ai', 'Ps', 'Id', 'Ae'].map((tool) => (
                          <div
                            key={tool}
                            className="p-2.5 rounded-xl glass-panel-subtle border border-white/5 text-center text-xs font-mono text-[#f4a496]"
                          >
                            {tool}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {b.type !== 'hero' && b.type !== 'heading' && b.type !== 'featured-projects' && b.type !== 'image' && b.type !== 'skills' && (
                    <div className="space-y-1 py-1">
                      <h4 className="text-xs font-serif font-semibold text-white">{title}</h4>
                      <p className="text-[11px] text-neutral-400 font-light">{sub || 'Section block placeholder mockup'}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Block Properties Inspector */}
        <div className="lg:col-span-3 p-5 rounded-3xl glass-panel border border-[#f4a496]/15 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#f4a496]/80 flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-[#f4a496]" />
              <span>{t.pages.editor.blockProperties}</span>
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => handleDuplicateBlock(blocks.findIndex((b) => b.id === selectedBlockId))}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white"
                title={t.pages.editor.duplicate}
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDeleteBlock(selectedBlockId)}
                className="p-1.5 rounded-lg text-[#f4a496] hover:bg-[#842b45]/20"
                title={t.pages.editor.delete}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {selectedBlock ? (
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-neutral-300 mb-1 font-light">
                  Block Label
                </label>
                <input
                  type="text"
                  value={selectedBlock.name}
                  onChange={(e) => {
                    setBlocks(
                      blocks.map((b) =>
                        b.id === selectedBlock.id ? { ...b, name: e.target.value } : b
                      )
                    );
                  }}
                  className="w-full px-3.5 py-2 rounded-xl glass-panel-subtle border border-white/10 text-white text-xs focus:outline-none focus:border-[#f4a496]/50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-300 mb-1 font-light">
                  Title (English)
                </label>
                <input
                  type="text"
                  value={selectedBlock.settings?.titleEn || ''}
                  onChange={(e) => handleUpdateSelectedSettings('titleEn', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl glass-panel-subtle border border-white/10 text-white text-xs focus:outline-none focus:border-[#f4a496]/50 font-sans"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-300 mb-1 font-light">
                  Title (Arabic)
                </label>
                <input
                  type="text"
                  dir="rtl"
                  value={selectedBlock.settings?.titleAr || ''}
                  onChange={(e) => handleUpdateSelectedSettings('titleAr', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl glass-panel-subtle border border-white/10 text-white text-xs font-arabic focus:outline-none focus:border-[#f4a496]/50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-300 mb-1 font-light">
                  Subtitle / Copy (English)
                </label>
                <textarea
                  rows={3}
                  value={selectedBlock.settings?.subtitleEn || ''}
                  onChange={(e) => handleUpdateSelectedSettings('subtitleEn', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl glass-panel-subtle border border-white/10 text-white text-xs font-sans focus:outline-none focus:border-[#f4a496]/50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-300 mb-1 font-light">
                  Subtitle / Copy (Arabic)
                </label>
                <textarea
                  rows={3}
                  dir="rtl"
                  value={selectedBlock.settings?.subtitleAr || ''}
                  onChange={(e) => handleUpdateSelectedSettings('subtitleAr', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl glass-panel-subtle border border-white/10 text-white text-xs font-arabic focus:outline-none focus:border-[#f4a496]/50"
                />
              </div>
            </div>
          ) : (
            <p className="text-xs text-neutral-500 text-center py-8 font-light">Select a block to inspect its settings.</p>
          )}
        </div>
      </div>

      {/* Block Library Selector Modal */}
      {isAddingBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-2xl p-6 sm:p-7 rounded-3xl glass-panel-active border border-[#f4a496]/25 shadow-2xl shadow-black/95 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <h3 className="text-lg font-serif font-bold text-white">
                {lang === 'ar' ? 'مكتبة الكتل الإنشائية' : 'Block Library'}
              </h3>
              <button
                onClick={() => setIsAddingBlock(false)}
                className="p-1.5 rounded-full text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 max-h-[60vh] overflow-y-auto p-1 modal-scrollbar">
              {AVAILABLE_BLOCK_TYPES.map((item) => {
                const IconComponent = iconMap[item.icon] || Layers;
                return (
                  <button
                    key={item.type}
                    onClick={() => handleAddBlock(item)}
                    className="p-4 rounded-2xl glass-panel-subtle hover:border-[#f4a496]/40 transition-all text-left rtl:text-right flex flex-col justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="w-9 h-9 rounded-xl bg-[#842b45]/30 text-[#f4a496] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="text-xs font-serif font-bold text-white group-hover:text-[#f4a496] transition-colors">
                        {item.label}
                      </div>
                      <p className="text-[10px] text-neutral-400 mt-1 leading-snug font-light">
                        {item.desc}
                      </p>
                    </div>
                    <span className="text-[10px] text-[#f4a496] mt-3 font-semibold">
                      + Add Block
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
