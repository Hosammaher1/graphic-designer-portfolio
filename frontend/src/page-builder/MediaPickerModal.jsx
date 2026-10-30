import React, { useState } from 'react';
import { X, Image as ImageIcon, Check } from 'lucide-react';
import { Button, Input, Textarea } from '../components/ui';

/**
 * Translation fallback resolver
 */
export function getBilingualFallback(data, field, locale = 'ar') {
  if (!data || typeof data !== 'object') return '';

  const primaryKey = `${field}_${locale}`;
  const fallbackLocale = locale === 'ar' ? 'en' : 'ar';
  const fallbackKey = `${field}_${fallbackLocale}`;

  // Check flat keys (title_ar, title_en)
  if (data[primaryKey] && typeof data[primaryKey] === 'string' && data[primaryKey].trim() !== '') {
    return data[primaryKey];
  }
  if (data[fallbackKey] && typeof data[fallbackKey] === 'string' && data[fallbackKey].trim() !== '') {
    return data[fallbackKey];
  }

  // Check nested map data[field]?.ar
  if (data[field] && typeof data[field] === 'object') {
    if (data[field][locale] && data[field][locale].trim() !== '') {
      return data[field][locale];
    }
    if (data[field][fallbackLocale] && data[field][fallbackLocale].trim() !== '') {
      return data[field][fallbackLocale];
    }
  }

  return '';
}

/**
 * 1. Media Picker Modal
 */
export function MediaPickerModal({
  isOpen = false,
  assets = [],
  onSelect,
  onClose,
  locale = 'ar',
}) {
  const isAr = locale === 'ar';

  if (!isOpen) return null;

  // STRICT REQUIREMENT: Only published/approved media is selectable
  const publishedAssets = assets.filter((asset) => asset.is_published !== false);

  const handleSelect = (asset) => {
    if (typeof onSelect === 'function') {
      onSelect({
        url: asset.url,
        alt: asset.alt_text || '',
        caption: asset.caption || '',
      });
    }
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  return (
    <div
      className="media-picker-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      role="dialog"
      aria-modal="true"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="media-picker-dialog bg-surface border border-border rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="media-picker-header p-4 border-b border-border flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ImageIcon size={20} className="text-primary" aria-hidden="true" />
            <h3 className="font-bold text-base">
              {isAr ? 'مكتبة الوسائط المعتمدة' : 'Approved Media Asset Library'}
            </h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label={isAr ? 'إغلاق' : 'Close'}>
            <X size={18} aria-hidden="true" />
          </Button>
        </div>

        {/* Content Body */}
        <div className="media-picker-body p-4 overflow-y-auto flex-1">
          {publishedAssets.length === 0 ? (
            <div className="text-center py-10 text-muted">
              <p>{isAr ? 'لا توجد وسائط منشورة متاحة حالياً.' : 'No published media assets available.'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {publishedAssets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  className="media-asset-card p-2 border border-border rounded-lg text-start hover:border-primary transition-all bg-base group flex flex-col"
                  onClick={() => handleSelect(asset)}
                  aria-label={`${isAr ? 'اختيار الأصل' : 'Select Asset'}: ${asset.alt_text || asset.url}`}
                >
                  <div className="asset-thumb-wrap aspect-video w-full rounded overflow-hidden bg-muted mb-2 relative">
                    <img
                      src={asset.url}
                      alt={asset.alt_text || 'Media asset'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <span className="asset-alt-label text-xs font-medium truncate block w-full">
                    {asset.alt_text || (isAr ? 'صورة بدون وصف' : 'Untitled image')}
                  </span>
                  {asset.caption && (
                    <span className="asset-caption-label text-[10px] text-muted truncate block w-full">
                      {asset.caption}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 2. Bilingual Text Editor with Tabs
 */
export function BilingualTextEditor({
  label,
  value = { ar: '', en: '' },
  onChange,
  multiline = false,
  rows = 3,
}) {
  const [activeTab, setActiveTab] = useState('ar');

  const handleTextChange = (e) => {
    if (typeof onChange !== 'function') return;
    onChange({
      ...value,
      [activeTab]: e.target.value,
    });
  };

  const currentVal = value[activeTab] || '';
  const inputId = `bilingual-${label}-${activeTab}`;

  return (
    <div className="bilingual-text-editor space-y-2">
      <div className="bilingual-header flex justify-between items-center">
        <label htmlFor={inputId} className="text-sm font-medium">
          {label} ({activeTab === 'ar' ? 'العربية' : 'English'})
        </label>

        {/* Tab Controls */}
        <div className="bilingual-tabs flex gap-1 p-0.5 bg-muted rounded-md text-xs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'ar'}
            className={`px-2 py-1 rounded font-medium transition-all ${
              activeTab === 'ar' ? 'bg-surface text-primary shadow-sm' : 'text-muted'
            }`}
            onClick={() => setActiveTab('ar')}
          >
            العربية
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'en'}
            className={`px-2 py-1 rounded font-medium transition-all ${
              activeTab === 'en' ? 'bg-surface text-primary shadow-sm' : 'text-muted'
            }`}
            onClick={() => setActiveTab('en')}
          >
            English
          </button>
        </div>
      </div>

      {multiline ? (
        <Textarea
          id={`bilingual-${label}-${activeTab}`}
          value={currentVal}
          onChange={handleTextChange}
          rows={rows}
          dir={activeTab === 'ar' ? 'rtl' : 'ltr'}
        />
      ) : (
        <Input
          id={`bilingual-${label}-${activeTab}`}
          value={currentVal}
          onChange={handleTextChange}
          dir={activeTab === 'ar' ? 'rtl' : 'ltr'}
        />
      )}
    </div>
  );
}

export default MediaPickerModal;
