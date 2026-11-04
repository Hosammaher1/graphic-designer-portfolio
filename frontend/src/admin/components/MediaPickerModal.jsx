import React, { useState, useEffect } from 'react';
import { X, Upload, Check, Image as ImageIcon } from 'lucide-react';
import { useAdmin } from '../context/AdminContext.jsx';

export function MediaPickerModal({ isOpen, onClose, onSelect, title = 'Select Media Asset' }) {
  const { lang, media, addMedia, uploadMediaFile, fetchMedia } = useAdmin();
  const [selectedItem, setSelectedItem] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (isOpen && fetchMedia) {
      fetchMedia();
    }
  }, [isOpen, fetchMedia]);

  if (!isOpen) return null;

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

  const handleConfirm = () => {
    if (selectedItem) {
      onSelect(selectedItem);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[85vh] rounded-3xl glass-panel-active border border-[#f4a496]/25 shadow-2xl shadow-black/95 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/10 bg-[#16101a]/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#842b45]/30 border border-[#f4a496]/20 flex items-center justify-center text-[#f4a496]">
              <ImageIcon className="w-4 h-4" />
            </div>
            <h3 className="text-base sm:text-lg font-serif font-bold text-white">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 modal-scrollbar">
          {/* Upload Dropzone */}
          <div className="relative border-2 border-dashed border-[#f4a496]/25 hover:border-[#f4a496]/50 rounded-2xl p-6 text-center bg-[#842b45]/10 transition-all group">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center gap-2">
              <div className="w-11 h-11 rounded-2xl bg-[#842b45]/30 border border-[#f4a496]/30 text-[#f4a496] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs sm:text-sm font-medium text-white">
                {lang === 'ar' ? 'انقر أو اسحب صورة جديدة للرفع الفوري' : 'Click or drop a new image to upload'}
              </p>
              <p className="text-[11px] text-neutral-400 font-light">
                {lang === 'ar' ? 'رفع فوري وحفظ دائم في مكتبة وسائط الاستوديو' : 'Upload and persist directly to studio media library'}
              </p>
            </div>

            {uploading && (
              <div className="mt-4 w-full bg-neutral-900 rounded-full h-2 overflow-hidden border border-white/5">
                <div
                  className="bg-gradient-to-r from-[#842b45] to-[#f4a496] h-full transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>

          {/* Grid of existing Media */}
          <div>
            <p className="text-[11px] font-mono uppercase tracking-widest text-[#f4a496]/80 mb-3">
              {lang === 'ar' ? 'الوسائط المتاحة' : 'Available Media Assets'}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {media.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`relative group rounded-2xl overflow-hidden border cursor-pointer transition-all aspect-video glass-panel-subtle ${
                      isSelected
                        ? 'border-[#f4a496] ring-2 ring-[#f4a496]/50 shadow-xl shadow-[#842b45]/30'
                        : 'border-white/10 hover:border-[#f4a496]/40'
                    }`}
                  >
                    <img
                      src={item.url}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

                    <div className="absolute bottom-1.5 left-2 right-2 text-[10px] text-neutral-200 truncate font-light">
                      {item.name}
                    </div>

                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#f4a496] text-neutral-900 flex items-center justify-center shadow font-bold">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-white/10 flex items-center justify-between bg-[#16101a]/80">
          <span className="text-xs text-neutral-400 font-light truncate max-w-xs">
            {selectedItem
              ? selectedItem.name
              : lang === 'ar'
              ? 'اختر صورة من المكتبة'
              : 'Select an image to continue'}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-medium text-neutral-300 hover:text-white glass-panel hover:bg-white/10 transition-colors cursor-pointer"
            >
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              disabled={!selectedItem}
              onClick={handleConfirm}
              className={`px-5 py-2 rounded-full text-xs font-semibold transition-all shadow-lg ${
                selectedItem
                  ? 'bg-gradient-to-r from-[#842b45] to-[#591b2e] hover:from-[#9c3252] text-[#fcdcd4] border border-[#f4a496]/40 cursor-pointer shadow-black/40'
                  : 'bg-white/5 text-neutral-500 border border-white/5 cursor-not-allowed'
              }`}
            >
              {lang === 'ar' ? 'اختيار الصورة' : 'Choose Asset'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
