import React, { useState, useEffect } from 'react';
import {
  Upload,
  Search,
  Filter,
  Trash2,
  Copy,
  Check,
  Image as ImageIcon,
  ExternalLink,
  X,
  FileCheck,
  Maximize2,
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext.jsx';
import { ConfirmModal } from '../components/ConfirmModal.jsx';
import { FullscreenImageViewer } from '../../components/FullscreenImageViewer.jsx';

export function MediaLibraryPage() {
  const { lang, t, media, addMedia, uploadMediaFile, deleteMedia, addToast, fetchMedia } = useAdmin();

  useEffect(() => {
    if (fetchMedia) {
      fetchMedia();
    }
  }, [fetchMedia]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [mediaToDelete, setMediaToDelete] = useState(null);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [copiedId, setCopiedId] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(20);

    const progressTimer = setInterval(() => {
      setUploadProgress((prev) => (prev < 85 ? prev + 15 : prev));
    }, 200);

    try {
      const newItem = await uploadMediaFile(file, file.name.replace(/\.[^/.]+$/, ''));
      clearInterval(progressTimer);
      setUploadProgress(100);
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
        if (newItem) setSelectedItem(newItem);
      }, 300);
    } catch (err) {
      clearInterval(progressTimer);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCopyUrl = (item) => {
    navigator.clipboard.writeText(item.url);
    setCopiedId(item.id);
    addToast(t.media.urlCopied, 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleDeleteSelected = () => {
    selectedIds.forEach((id) => deleteMedia(id));
    setSelectedIds([]);
    setSelectedItem(null);
  };

  const filteredMedia = media.filter((m) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      m.name?.toLowerCase().includes(q) ||
      m.altEn?.toLowerCase().includes(q) ||
      (m.altAr && m.altAr.includes(q));

    const matchType =
      filterType === 'ALL' ||
      (filterType === 'mockups' && m.category === 'Mockups') ||
      (filterType === 'images' && m.type?.includes('image'));

    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#f4a496]/15">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-[#f4a496]/80 mb-1">
            {lang === 'ar' ? 'أصول الوسائط الرقمية' : 'Digital Assets & Stills'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-normal tracking-tight text-white font-serif">
            <span>{t.media.title} </span>
            <span className="text-[#f4a496] italic font-serif">Vault</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 font-light">
            {t.media.subtitle}
          </p>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#f4a496] font-medium font-mono">
              {selectedIds.length} {t.media.selectedCount}
            </span>
            <button
              onClick={handleDeleteSelected}
              className="px-4 py-2 rounded-full bg-[#842b45]/30 hover:bg-[#842b45]/50 text-[#fcdcd4] border border-[#f4a496]/35 text-xs font-semibold cursor-pointer shadow-sm transition-all"
            >
              {t.media.deleteSelected}
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="text-xs text-neutral-400 hover:text-white px-2 py-1 cursor-pointer"
            >
              {t.media.clearSelection}
            </button>
          </div>
        )}
      </div>

      {/* Upload Dropzone */}
      <div className="relative border-2 border-dashed border-[#f4a496]/25 hover:border-[#f4a496]/50 rounded-3xl p-8 text-center glass-panel-subtle hover:glass-panel transition-all cursor-pointer group">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center gap-2">
          <div className="w-13 h-13 rounded-2xl bg-[#842b45]/25 border border-[#f4a496]/30 text-[#f4a496] flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg shadow-black/40">
            <Upload className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-serif font-bold text-white mt-1">
            {t.media.dropzoneTitle}
          </h3>
          <p className="text-xs text-neutral-400 font-light max-w-sm">
            {t.media.dropzoneSub}
          </p>
        </div>

        {uploading && (
          <div className="mt-4 max-w-xs mx-auto">
            <div className="w-full bg-neutral-900 rounded-full h-2 overflow-hidden border border-white/5">
              <div
                className="bg-gradient-to-r from-[#842b45] to-[#f4a496] h-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <span className="text-[11px] text-[#f4a496] font-mono mt-1.5 inline-block">
              Uploading... {uploadProgress}%
            </span>
          </div>
        )}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-3xl glass-panel border border-[#f4a496]/15 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.media.searchPlaceholder}
            className="w-full pl-10 pr-3.5 rtl:pl-3.5 rtl:pr-10 py-2.5 rounded-full glass-panel-subtle border border-white/10 text-white placeholder-neutral-500 text-xs sm:text-sm focus:outline-none focus:border-[#f4a496]/60 transition-all font-sans"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 rounded-full glass-panel-subtle border border-white/10 text-neutral-200 text-xs focus:outline-none focus:border-[#f4a496]/50 cursor-pointer"
          >
            <option value="ALL" className="bg-[#120a17] text-white">{t.media.typeAll}</option>
            <option value="images" className="bg-[#120a17] text-white">{t.media.typeImages}</option>
            <option value="mockups" className="bg-[#120a17] text-white">{t.media.typeMockups}</option>
          </select>
        </div>
      </div>

      {/* Main Grid + Side Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Media Grid */}
        <div className={`space-y-4 ${selectedItem ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filteredMedia.map((item) => {
              const isSelected = selectedItem?.id === item.id;
              const isChecked = selectedIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`group relative rounded-3xl overflow-hidden border cursor-pointer aspect-square glass-panel-subtle transition-all duration-300 ${
                    isSelected
                      ? 'border-[#f4a496] ring-2 ring-[#f4a496]/50 shadow-xl shadow-[#842b45]/30'
                      : 'border-white/10 hover:border-[#f4a496]/35'
                  }`}
                >
                  <img
                    src={item.url || item.original_url}
                    alt={item.name || 'Media Asset'}
                    className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-75 group-hover:opacity-100 transition-opacity" />

                  {/* Multi-selection Checkbox */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelect(item.id);
                    }}
                    className="absolute top-3 left-3 rtl:left-auto rtl:right-3 z-10"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="rounded border-white/40 bg-black/60 text-[#842b45] focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                  </div>

                  {/* File name info on bottom */}
                  <div className="absolute bottom-2.5 inset-x-3 text-[11px] text-white font-medium truncate font-mono">
                    {item.name}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredMedia.length === 0 && (
            <div className="p-12 text-center rounded-3xl glass-panel border border-white/5">
              <ImageIcon className="w-8 h-8 text-neutral-500 mx-auto mb-2" />
              <p className="text-xs text-neutral-400 font-light">No media assets found matching query.</p>
            </div>
          )}
        </div>

        {/* Selected Asset Details Drawer */}
        {selectedItem && (
          <div className="p-6 sm:p-7 rounded-3xl glass-panel-active border border-[#f4a496]/25 shadow-2xl space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-xs font-mono uppercase tracking-widest text-[#f4a496]/90">
                {t.media.detailsTitle}
              </h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Preview image */}
            <div className="space-y-3">
              {/* Full Original Preview */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                  <span className="text-emerald-400">{lang === 'ar' ? 'العمل الأصلي الكامل' : 'Full Original Asset'}</span>
                  <span>object-fit: contain</span>
                </div>
                <div
                  onClick={() => setIsFullscreenOpen(true)}
                  className="relative min-h-[160px] max-h-[260px] rounded-2xl overflow-hidden border border-white/10 bg-black/70 flex items-center justify-center p-2 cursor-pointer group"
                  title={lang === 'ar' ? 'انقر للمعاينة بحجم الشاشة الكامل والتكبير' : 'Click to preview fullscreen with zoom'}
                >
                  <img src={selectedItem.url || selectedItem.original_url} alt={selectedItem.name} className="max-w-full max-h-[240px] w-auto h-auto object-contain rounded-lg group-hover:scale-105 transition-transform" />
                  <div className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* Cover Card Simulation */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                  <span className="text-[#f4a496]">{lang === 'ar' ? 'محاكاة غلاف البطاقة' : 'Card Cover Simulation'}</span>
                  <span>object-fit: cover</span>
                </div>
                <div className="relative aspect-video rounded-xl overflow-hidden border border-[#f4a496]/25 bg-black/40 shadow-inner">
                  <img src={selectedItem.url || selectedItem.original_url} alt={selectedItem.name} className="w-full h-full object-cover object-center" />
                </div>
              </div>
            </div>

            {/* Info table */}
            <div className="space-y-2.5 text-xs font-light">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-neutral-400">{t.media.fileName}</span>
                <span className="text-white font-mono truncate max-w-[160px]">{selectedItem.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-neutral-400">{t.media.dimensions}</span>
                <span className="text-white font-mono">{selectedItem.dimensions || '2560 × 1440'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-neutral-400">{t.media.fileSize}</span>
                <span className="text-white font-mono">{selectedItem.size || '3.2 MB'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-neutral-400">{t.media.uploadedOn}</span>
                <span className="text-white font-mono">{selectedItem.uploadedOn}</span>
              </div>
            </div>

            {/* Alt texts */}
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-neutral-300 font-light">
                  {t.media.altEn}
                </label>
                <input
                  type="text"
                  value={selectedItem.altEn || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedItem({ ...selectedItem, altEn: val });
                  }}
                  className="w-full px-3.5 py-2 rounded-xl glass-panel-subtle border border-white/10 text-white text-xs mt-1 focus:outline-none focus:border-[#f4a496]/50 font-sans"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-neutral-300 font-light">
                  {t.media.altAr}
                </label>
                <input
                  type="text"
                  dir="rtl"
                  value={selectedItem.altAr || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedItem({ ...selectedItem, altAr: val });
                  }}
                  className="w-full px-3.5 py-2 rounded-xl glass-panel-subtle border border-white/10 text-white text-xs mt-1 font-arabic focus:outline-none focus:border-[#f4a496]/50"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-2 space-y-2">
              <button
                onClick={() => handleCopyUrl(selectedItem)}
                className="w-full py-2.5 rounded-full glass-panel hover:border-[#f4a496]/40 text-xs font-semibold text-neutral-200 hover:text-white transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {copiedId === selectedItem.id ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300">{t.media.urlCopied}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-[#f4a496]" />
                    <span>{t.media.copyUrl}</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setMediaToDelete(selectedItem)}
                className="w-full py-2.5 rounded-full bg-[#842b45]/25 hover:bg-[#842b45]/45 border border-[#f4a496]/30 text-xs font-semibold text-[#fcdcd4] transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{lang === 'ar' ? 'حذف من المكتبة' : 'Delete Asset'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!mediaToDelete}
        title={lang === 'ar' ? 'حذف أصل الوسائط' : 'Delete Media Asset'}
        message={
          lang === 'ar'
            ? `هل أنت متأكد من حذف الملف "${mediaToDelete?.name}" من مكتبة الوسائط؟`
            : `Are you sure you want to delete "${mediaToDelete?.name}" from Media Library?`
        }
        confirmLabel={t.common.delete}
        cancelLabel={t.common.cancel}
        onConfirm={() => {
          if (mediaToDelete) {
            deleteMedia(mediaToDelete.id);
            setMediaToDelete(null);
            setSelectedItem(null);
          }
        }}
        onCancel={() => setMediaToDelete(null)}
      />
    </div>
  );
}
