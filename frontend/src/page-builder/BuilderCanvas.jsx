import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Save,
  Sliders,
  Eye,
  CheckCircle,
  AlertCircle,
  X,
} from 'lucide-react';
import {
  Container,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Badge,
  Input,
  Textarea,
  Select,
} from '../components/ui';
import { createDefaultBlock, SUPPORTED_BLOCK_TYPES } from './schema.js';
import { DocumentRenderer, BlockRenderer } from './BlockRenderer.jsx';

/**
 * Human-readable labels for block types
 */
const BLOCK_LABELS = {
  hero: { ar: 'قسم الواجهة الرئيسية (Hero)', en: 'Hero Section' },
  heading: { ar: 'عنوان فرعي (Heading)', en: 'Heading' },
  text: { ar: 'نص ومقالة (Text)', en: 'Text Block' },
  image: { ar: 'صورة مفردة (Image)', en: 'Image' },
  gallery: { ar: 'معرض صور (Gallery)', en: 'Gallery' },
  columns: { ar: 'أعمدة متعددة (Columns)', en: 'Columns' },
  spacer: { ar: 'فاصل مسافي (Spacer)', en: 'Spacer' },
  cta: { ar: 'شريط دعوة (CTA)', en: 'Call to Action' },
  stats: { ar: 'إحصائيات وأرقام (Stats)', en: 'Statistics' },
  services: { ar: 'بطاقات الخدمات (Services)', en: 'Services' },
  category_preview: { ar: 'معاينة تصنيف (Category Preview)', en: 'Category Preview' },
  featured_work: { ar: 'أعمال مختارة (Featured Work)', en: 'Featured Work' },
};

export function BuilderCanvas({
  pageId = 'home',
  initialBlocks = [],
  locale = 'ar',
  onSave = null,
}) {
  const isAr = locale === 'ar';
  const storageKey = `page-builder-recovery-${pageId}`;
  const isFirstRender = useRef(true);

  const [blocks, setBlocks] = useState(initialBlocks);
  const [selectedBlockId, setSelectedBlockId] = useState(
    initialBlocks.length > 0 ? initialBlocks[0].id : null
  );
  const [showLibrary, setShowLibrary] = useState(false);
  const [recoveryDraft, setRecoveryDraft] = useState(null);
  const [hasRecoverableDraft, setHasRecoverableDraft] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  // Check for local storage recovery draft on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (
          Array.isArray(parsed) &&
          parsed.length > 0 &&
          JSON.stringify(parsed) !== JSON.stringify(initialBlocks)
        ) {
          setRecoveryDraft(parsed);
          setHasRecoverableDraft(true);
        }
      }
    } catch {
      // Storage unavailable or corrupted
    }
  }, [storageKey, initialBlocks]);

  // Auto-persist work-in-progress to local storage for recovery (skip initial mount)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    try {
      localStorage.setItem(storageKey, JSON.stringify(blocks));
    } catch {
      // Storage error safe fallback
    }
  }, [blocks, storageKey]);

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) || null;

  // Add block
  const handleAddBlock = (type) => {
    const newBlock = createDefaultBlock(type);
    if (type === 'cta') {
      newBlock.data = {
        title: isAr ? 'دعنا نتعاون في مشروعك القادم' : 'Let’s collaborate on your next project',
        subtitle: isAr ? 'نرحب بطلبات الهوية البصرية والتصميم الإبداعي.' : 'Open for brand identity commissions.',
        button_text: isAr ? 'تواصل معنا' : 'Get in Touch',
        button_url: `/${locale}/contact`,
        button_variant: 'primary',
        align: 'center',
      };
    }
    setBlocks([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id);
    setShowLibrary(false);
  };

  // Duplicate block
  const handleDuplicateBlock = (index) => {
    const target = blocks[index];
    if (!target) return;
    const duplicated = {
      ...target,
      id: `blk-${target.type}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      data: JSON.parse(JSON.stringify(target.data || {})),
      settings: JSON.parse(JSON.stringify(target.settings || {})),
    };
    const next = [...blocks];
    next.splice(index + 1, 0, duplicated);
    setBlocks(next);
    setSelectedBlockId(duplicated.id);
  };

  // Remove block
  const handleRemoveBlock = (index) => {
    const target = blocks[index];
    const next = blocks.filter((_, i) => i !== index);
    setBlocks(next);
    if (selectedBlockId === target?.id) {
      setSelectedBlockId(next.length > 0 ? next[0].id : null);
    }
  };

  // Move block up/down
  const handleMove = (index, delta) => {
    const targetIndex = index + delta;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    const next = [...blocks];
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);
    setBlocks(next);
  };

  // Update block data properties
  const handleUpdateData = (field, value) => {
    if (!selectedBlockId) return;
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== selectedBlockId) return b;
        return {
          ...b,
          data: {
            ...b.data,
            [field]: value,
          },
        };
      })
    );
  };

  // Cancel / Revert to initial state
  const handleCancel = () => {
    setBlocks(initialBlocks);
    setSelectedBlockId(initialBlocks.length > 0 ? initialBlocks[0].id : null);
    try {
      localStorage.removeItem(storageKey);
    } catch {}
    setHasRecoverableDraft(false);
    setRecoveryDraft(null);
  };

  // Restore draft from recovery storage
  const handleRestoreRecovery = () => {
    if (recoveryDraft) {
      setBlocks(recoveryDraft);
      setSelectedBlockId(recoveryDraft.length > 0 ? recoveryDraft[0].id : null);
    }
    setHasRecoverableDraft(false);
  };

  // Explicit Save
  const handleSave = () => {
    if (typeof onSave === 'function') {
      onSave(blocks);
    }
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="builder-canvas-wrapper" dir={isAr ? 'rtl' : 'ltr'}>
      {/* 1. Canvas Top Toolbar */}
      <header className="builder-header-toolbar">
        <Container size="site">
          <div className="flex justify-between items-center py-4 flex-wrap gap-4">
            <div>
              <h1 className="builder-main-title text-xl font-bold">
                {isAr ? 'محرر الصفحات والمرئيات' : 'Page Builder & Layout Editor'}
              </h1>
              <p className="builder-subtitle text-sm text-muted">
                {isAr
                  ? 'قم بإضافة الكتل وترتيبها وتعديل خصائصها مع معاينة حية فورية.'
                  : 'Add, reorder, and configure modular blocks with live interactive preview.'}
              </p>
            </div>

            <div className="builder-toolbar-actions flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                aria-label={isAr ? 'إلغاء التعديلات' : 'Cancel Changes'}
              >
                <RotateCcw size={16} aria-hidden="true" />
                <span>{isAr ? 'إلغاء التعديلات' : 'Cancel Changes'}</span>
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowLibrary(true)}
                aria-label={isAr ? 'إضافة كتلة' : 'Add Block'}
              >
                <Plus size={16} aria-hidden="true" />
                <span>{isAr ? 'إضافة كتلة' : 'Add Block'}</span>
              </Button>

              {onSave && (
                <Button variant="primary" size="sm" onClick={handleSave}>
                  <Save size={16} aria-hidden="true" />
                  <span>{isAr ? 'حفظ المسودة' : 'Save Draft'}</span>
                </Button>
              )}
            </div>
          </div>
        </Container>
      </header>

      {/* 2. Recovery Banner */}
      {hasRecoverableDraft && (
        <div className="recovery-draft-banner" role="alert">
          <Container size="site">
            <div className="flex items-center justify-between p-3 rounded-md bg-muted">
              <div className="flex items-center gap-2">
                <AlertCircle size={18} className="text-primary" aria-hidden="true" />
                <span className="text-sm">
                  {isAr
                    ? 'تم العثور على مسودة غير محفوظة مخزنة محلياً من جلسة سابقة.'
                    : 'An unsaved local draft from a previous session was detected.'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleRestoreRecovery}
                  aria-label={isAr ? 'استعادة المسودة' : 'Restore Draft'}
                >
                  {isAr ? 'استعادة المسودة' : 'Restore Draft'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setHasRecoverableDraft(false)}
                >
                  {isAr ? 'تجاهل' : 'Dismiss'}
                </Button>
              </div>
            </div>
          </Container>
        </div>
      )}

      {/* 3. Main Workspace Layout */}
      <main className="builder-workspace py-6">
        <Container size="site">
          <div className="builder-grid grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Outline Block List (5 cols) */}
            <section className="lg:col-span-5 builder-outline-panel" aria-label="Block Outline">
              <Card>
                <CardHeader>
                  <CardTitle as="h2" className="text-base">
                    {isAr ? 'هيكل الكتل والعناصر' : 'Document Outline'}
                  </CardTitle>
                  <CardDescription>
                    {isAr
                      ? `إجمالي الكتل: ${blocks.length}`
                      : `Total Blocks: ${blocks.length}`}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  {blocks.length === 0 ? (
                    <div className="text-center py-8 text-muted">
                      <p>{isAr ? 'لا توجد كتل بعد. اضغط إضافة كتلة للبدء.' : 'No blocks yet. Click Add Block to start.'}</p>
                    </div>
                  ) : (
                    blocks.map((block, idx) => {
                      const isSelected = block.id === selectedBlockId;
                      const titlePreview =
                        block.data?.title ||
                        block.data?.text ||
                        block.data?.body ||
                        BLOCK_LABELS[block.type]?.[locale] ||
                        block.type;

                      return (
                        <div
                          key={block.id}
                          data-testid="canvas-block-item"
                          className={`canvas-block-card p-3 rounded-md border flex items-center justify-between gap-2 transition-all ${
                            isSelected ? 'border-primary bg-surface' : 'border-border'
                          }`}
                        >
                          <button
                            type="button"
                            className="block-select-btn text-start flex-1 truncate"
                            onClick={() => setSelectedBlockId(block.id)}
                            aria-label={`${isAr ? 'تعديل الكتلة' : 'Edit Block'}: ${titlePreview}`}
                          >
                            <span className="block-type-badge font-mono text-xs text-muted block">
                              {BLOCK_LABELS[block.type]?.[locale] || block.type}
                            </span>
                            <span className="block-title-text font-medium text-sm truncate block">
                              {titlePreview}
                            </span>
                          </button>

                          {/* Accessible Reordering & Actions */}
                          <div className="block-card-actions flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={idx === 0}
                              onClick={() => handleMove(idx, -1)}
                              aria-label={`${isAr ? 'تحريك الكتلة للأعلى' : 'Move block up'} ${idx + 1}`}
                            >
                              <ArrowUp size={14} aria-hidden="true" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={idx === blocks.length - 1}
                              onClick={() => handleMove(idx, 1)}
                              aria-label={`${isAr ? 'تحريك الكتلة للأسفل' : 'Move block down'} ${idx + 1}`}
                            >
                              <ArrowDown size={14} aria-hidden="true" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDuplicateBlock(idx)}
                              aria-label={`${isAr ? 'تكرار الكتلة' : 'Duplicate block'} ${idx + 1}`}
                            >
                              <Copy size={14} aria-hidden="true" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveBlock(idx)}
                              aria-label={`${isAr ? 'حذف الكتلة' : 'Delete block'} ${idx + 1}`}
                            >
                              <Trash2 size={14} aria-hidden="true" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </section>

            {/* Right: Property Inspector (7 cols) */}
            <section className="lg:col-span-7 builder-inspector-panel" aria-label="Property Inspector">
              <Card>
                <CardHeader>
                  <CardTitle as="h2" className="text-base flex items-center gap-2">
                    <Sliders size={18} aria-hidden="true" />
                    <span>{isAr ? 'محرر الخصائص' : 'Property Inspector'}</span>
                  </CardTitle>
                  <CardDescription>
                    {selectedBlock
                      ? (BLOCK_LABELS[selectedBlock.type]?.[locale] || selectedBlock.type)
                      : (isAr ? 'حدد كتلة لتعديل إعداداتها' : 'Select a block to inspect')}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  {!selectedBlock ? (
                    <div className="text-center py-8 text-muted">
                      <p>{isAr ? 'حدد كتلة من القائمة اليسرى لعرض خصائصها.' : 'Select a block from the outline to configure.'}</p>
                    </div>
                  ) : (
                    <div className="inspector-fields space-y-4">
                      {/* Common Heading / Title Field */}
                      {('text' in selectedBlock.data || selectedBlock.type === 'heading') && (
                        <Input
                          id="field-text"
                          label={isAr ? 'نص العنوان' : 'Heading Text'}
                          value={selectedBlock.data.text || ''}
                          onChange={(e) => handleUpdateData('text', e.target.value)}
                        />
                      )}

                      {('title' in selectedBlock.data) && (
                        <Input
                          id="field-title"
                          label={isAr ? 'العنوان الرئيسي' : 'Title'}
                          value={selectedBlock.data.title || ''}
                          onChange={(e) => handleUpdateData('title', e.target.value)}
                        />
                      )}

                      {('subtitle' in selectedBlock.data) && (
                        <Input
                          id="field-subtitle"
                          label={isAr ? 'العنوان الفرعي' : 'Subtitle'}
                          value={selectedBlock.data.subtitle || ''}
                          onChange={(e) => handleUpdateData('subtitle', e.target.value)}
                        />
                      )}

                      {('badge' in selectedBlock.data) && (
                        <Input
                          id="field-badge"
                          label={isAr ? 'الشارة التوضيحية' : 'Badge'}
                          value={selectedBlock.data.badge || ''}
                          onChange={(e) => handleUpdateData('badge', e.target.value)}
                        />
                      )}

                      {('body' in selectedBlock.data) && (
                        <Textarea
                          id="field-body"
                          label={isAr ? 'نص المقالة / الفقرة' : 'Body Text'}
                          rows={4}
                          value={selectedBlock.data.body || ''}
                          onChange={(e) => handleUpdateData('body', e.target.value)}
                        />
                      )}

                      {('url' in selectedBlock.data) && (
                        <Input
                          id="field-url"
                          label={isAr ? 'رابط الصورة' : 'Image URL'}
                          value={selectedBlock.data.url || ''}
                          onChange={(e) => handleUpdateData('url', e.target.value)}
                        />
                      )}

                      {('alt' in selectedBlock.data) && (
                        <Input
                          id="field-alt"
                          label={isAr ? 'النص البديل (Alt)' : 'Alt Text'}
                          value={selectedBlock.data.alt || ''}
                          onChange={(e) => handleUpdateData('alt', e.target.value)}
                        />
                      )}

                      {/* Heading Level */}
                      {selectedBlock.type === 'heading' && (
                        <Select
                          id="field-level"
                          label={isAr ? 'مستوى العنوان' : 'Heading Level'}
                          value={selectedBlock.data.level || 'h2'}
                          onChange={(e) => handleUpdateData('level', e.target.value)}
                        >
                          <option value="h1">H1</option>
                          <option value="h2">H2</option>
                          <option value="h3">H3</option>
                          <option value="h4">H4</option>
                        </Select>
                      )}

                      {/* Spacer Size */}
                      {selectedBlock.type === 'spacer' && (
                        <Select
                          id="field-size"
                          label={isAr ? 'حجم المسافة' : 'Spacer Size'}
                          value={selectedBlock.data.size || 'md'}
                          onChange={(e) => handleUpdateData('size', e.target.value)}
                        >
                          <option value="xs">XS</option>
                          <option value="sm">SM</option>
                          <option value="md">MD</option>
                          <option value="lg">LG</option>
                          <option value="xl">XL</option>
                        </Select>
                      )}

                      {/* Alignment */}
                      {('align' in selectedBlock.data) && (
                        <Select
                          id="field-align"
                          label={isAr ? 'المحاذاة' : 'Alignment'}
                          value={selectedBlock.data.align || 'center'}
                          onChange={(e) => handleUpdateData('align', e.target.value)}
                        >
                          <option value="left">{isAr ? 'يسار' : 'Left'}</option>
                          <option value="center">{isAr ? 'وسط' : 'Center'}</option>
                          <option value="right">{isAr ? 'يمين' : 'Right'}</option>
                        </Select>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>
          </div>

          {/* 4. Live Interactive Preview Canvas */}
          <section className="builder-live-preview-section mt-10" aria-label="Live Preview">
            <div className="preview-header-bar flex items-center gap-2 mb-4">
              <Eye size={18} aria-hidden="true" />
              <h2 className="text-base font-semibold">
                {isAr ? 'المعاينة الحية التفاعلية' : 'Live Interactive Preview'}
              </h2>
            </div>

            <div className="preview-canvas-box border rounded-lg p-6 bg-base">
              <DocumentRenderer blocks={blocks} locale={locale} isEditor={true} />
            </div>
          </section>
        </Container>
      </main>

      {/* 5. Block Library Palette Dialog */}
      {showLibrary && (
        <div className="block-library-modal-overlay" role="dialog" aria-modal="true">
          <div className="block-library-dialog p-6 bg-surface rounded-lg shadow-xl max-w-xl mx-auto border border-border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">
                {isAr ? 'اختر كتلة للإضافة' : 'Select Block to Add'}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowLibrary(false)}>
                <X size={18} aria-hidden="true" />
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {SUPPORTED_BLOCK_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  className="p-3 border rounded text-start hover:border-primary transition-all bg-base"
                  onClick={() => handleAddBlock(type)}
                >
                  <span className="font-medium text-sm block">
                    {BLOCK_LABELS[type]?.[locale] || type}
                  </span>
                  <span className="text-xs text-muted font-mono">{type}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BuilderCanvas;
