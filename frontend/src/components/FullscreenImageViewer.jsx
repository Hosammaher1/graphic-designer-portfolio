import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
} from 'lucide-react';
import { ProjectArtwork } from './ProjectArtworks';

/**
 * FullscreenImageViewer
 *
 * An Apple-inspired fullscreen image viewer with smooth pan & zoom,
 * swipe/keyboard navigation, responsive touch support, bilingual RTL/LTR handling,
 * and high-fidelity rendering for all aspect ratios (including tall designs).
 */
export function FullscreenImageViewer({
  isOpen,
  onClose,
  images = [],
  initialIndex = 0,
  lang = 'ar',
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showThumbnails, setShowThumbnails] = useState(true);

  const containerRef = useRef(null);
  const touchStartRef = useRef(null);
  const touchDistanceRef = useRef(null);

  const isRtl = lang === 'ar';
  const total = images.length;
  const currentImage = total > 0 ? images[currentIndex] || images[0] : null;

  // Sync index when initialIndex changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex >= 0 && initialIndex < total ? initialIndex : 0);
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, initialIndex, total]);

  // Lock body scroll when viewer is active
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      document.body.classList.add('lightbox-open');
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.classList.remove('lightbox-open');
      };
    }
  }, [isOpen]);

  // Reset zoom & pan when navigating to a new image
  const resetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handlePrev = useCallback(() => {
    if (total <= 1) return;
    resetZoom();
    setCurrentIndex((prev) => (prev === 0 ? total - 1 : prev - 1));
  }, [total, resetZoom]);

  const handleNext = useCallback(() => {
    if (total <= 1) return;
    resetZoom();
    setCurrentIndex((prev) => (prev === total - 1 ? 0 : prev + 1));
  }, [total, resetZoom]);

  const zoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + 0.5, 4));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  }, []);

  // Double click to toggle zoom (1x <-> 2.5x)
  const handleDoubleClick = useCallback((e) => {
    if (scale > 1) {
      resetZoom();
    } else {
      setScale(2.5);
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const offsetX = (rect.width / 2 - (e.clientX - rect.left)) * 1.5;
        const offsetY = (rect.height / 2 - (e.clientY - rect.top)) * 1.5;
        setPosition({ x: offsetX, y: offsetY });
      }
    }
  }, [scale, resetZoom]);

  // Mouse wheel zoom
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setScale((prev) => Math.min(prev + 0.25, 4));
    } else {
      setScale((prev) => {
        const next = Math.max(prev - 0.25, 1);
        if (next === 1) setPosition({ x: 0, y: 0 });
        return next;
      });
    }
  }, []);

  // Mouse drag to pan
  const handleMouseDown = useCallback((e) => {
    if (scale <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  }, [scale, position]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || scale <= 1) return;
    e.preventDefault();
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }, [isDragging, scale, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch gestures: Pinch-to-zoom & Swipe
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      // Pinch gesture
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchDistanceRef.current = dist;
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
      if (scale > 1) {
        setIsDragging(true);
        setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
      }
    }
  }, [scale, position]);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 2 && touchDistanceRef.current) {
      // Handle pinch zoom
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / touchDistanceRef.current;
      setScale((prev) => Math.min(Math.max(prev * (factor > 1 ? 1.05 : 0.95), 1), 4));
      touchDistanceRef.current = dist;
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      // Handle touch pan
      const touch = e.touches[0];
      setPosition({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y,
      });
    }
  }, [isDragging, scale, dragStart]);

  const handleTouchEnd = useCallback((e) => {
    touchDistanceRef.current = null;
    setIsDragging(false);

    if (scale === 1 && touchStartRef.current && e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaTime = Date.now() - touchStartRef.current.time;

      // Horizontal swipe detected
      if (Math.abs(deltaX) > 40 && Math.abs(deltaY) < 60 && deltaTime < 400) {
        if (deltaX > 0) {
          isRtl ? handleNext() : handlePrev();
        } else {
          isRtl ? handlePrev() : handleNext();
        }
      }
    }
  }, [scale, isRtl, handleNext, handlePrev]);

  // Keyboard navigation & zoom shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        isRtl ? handleNext() : handlePrev();
      } else if (e.key === 'ArrowRight') {
        isRtl ? handlePrev() : handleNext();
      } else if (e.key === '+' || e.key === '=') {
        zoomIn();
      } else if (e.key === '-' || e.key === '_') {
        zoomOut();
      } else if (e.key === '0') {
        resetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isRtl, handlePrev, handleNext, zoomIn, zoomOut, resetZoom, onClose]);

  if (!isOpen || !currentImage) return null;

  // Resolve display source
  const imageSrc =
    currentImage.url ||
    currentImage.src ||
    currentImage.original_url ||
    currentImage.display_url ||
    null;

  const resolveText = (val) => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    return val[lang] || val.ar || val.en || '';
  };

  const imageTitle = resolveText(currentImage.title) || (lang === 'ar' ? 'عرض العمل الفني' : 'Artwork View');
  const imageCaption = resolveText(currentImage.caption);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Fullscreen Image Viewer"
      data-theme-surface="dark"
      className="fixed inset-0 z-[100] flex flex-col justify-between bg-black/95 backdrop-blur-2xl text-white select-none animate-in fade-in duration-200"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 1. TOP BAR: Info, Counter & Primary Actions */}
      <div className="relative z-30 flex items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-black/80 via-black/40 to-transparent shrink-0">
        {/* Counter Badge & Localized Title */}
        <div className="flex items-center gap-3">
          <span className="px-3.5 py-1 rounded-full text-xs font-mono font-bold text-amber-300 bg-amber-950/60 border border-amber-400/30 shadow-lg">
            {String(currentIndex + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </span>
          <div className="text-left rtl:text-right hidden sm:block max-w-md">
            <h3 className="text-sm font-serif text-white font-medium truncate">
              {imageTitle}
            </h3>
            {imageCaption && (
              <p className="text-xs text-neutral-400 font-light truncate mt-0.5">
                {imageCaption}
              </p>
            )}
          </div>
        </div>

        {/* Top-Right Control Buttons: Zoom Controls & Close */}
        <div className="flex items-center gap-2">
          {/* Zoom In Button */}
          <button
            onClick={zoomIn}
            aria-label={lang === 'ar' ? 'تكبير' : 'Zoom In'}
            title={lang === 'ar' ? 'تكبير (+)' : 'Zoom In (+)'}
            className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-neutral-200 hover:text-white border border-white/15 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Zoom Out Button */}
          <button
            onClick={zoomOut}
            aria-label={lang === 'ar' ? 'تصغير' : 'Zoom Out'}
            title={lang === 'ar' ? 'تصغير (-)' : 'Zoom Out (-)'}
            disabled={scale <= 1}
            className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-neutral-200 hover:text-white border border-white/15 transition-all disabled:opacity-40 disabled:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <ZoomOut className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Reset Zoom Button */}
          {scale > 1 && (
            <button
              onClick={resetZoom}
              aria-label={lang === 'ar' ? 'إعادة ضبط الحجم' : 'Reset Zoom'}
              title={lang === 'ar' ? 'إعادة ضبط الحجم (0)' : 'Reset Zoom (0)'}
              className="p-2 sm:p-2.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 flex items-center gap-1.5 px-3 text-xs font-mono font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{Math.round(scale * 100)}%</span>
            </button>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            aria-label={lang === 'ar' ? 'إغلاق العارض' : 'Close Viewer'}
            className="p-2 sm:p-2.5 rounded-full bg-white/15 hover:bg-rose-900/80 hover:border-rose-400/50 text-white border border-white/20 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 ml-1.5"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* 2. MAIN CANVAS VIEWPORT */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        className={`relative flex-1 min-h-0 w-full flex items-center justify-center overflow-hidden p-2 sm:p-6 ${
          scale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
        }`}
      >
        {/* Navigation Arrows (Fixed at Left & Right Screen Edges) */}
        {total > 1 && (
          <>
            <button
              onClick={handlePrev}
              aria-label={lang === 'ar' ? 'الصورة السابقة' : 'Previous Image'}
              className="absolute left-3 sm:left-6 z-30 p-3 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md text-white border border-white/20 hover:border-amber-400/50 transition-all transform hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 rtl:rotate-180" />
            </button>

            <button
              onClick={handleNext}
              aria-label={lang === 'ar' ? 'الصورة التالية' : 'Next Image'}
              className="absolute right-3 sm:right-6 z-30 p-3 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md text-white border border-white/20 hover:border-amber-400/50 transition-all transform hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 rtl:rotate-180" />
            </button>
          </>
        )}

        {/* Scaled & Panned Image Frame */}
        <div
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            transformOrigin: 'center center',
          }}
          className="relative w-full h-full max-w-full max-h-full flex items-center justify-center"
        >
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={imageTitle}
              className="max-w-full max-h-full w-auto h-auto object-contain rounded-xl shadow-2xl pointer-events-none select-none"
              draggable={false}
            />
          ) : (
            <ProjectArtwork
              id={currentImage.artworkId || 'artwork'}
              className="max-w-full max-h-full w-auto h-auto object-contain rounded-xl shadow-2xl"
              priority={true}
            />
          )}
        </div>
      </div>

      {/* 3. BOTTOM BAR: Localized Caption & Thumbnail Strip */}
      <div className="relative z-30 flex flex-col items-center gap-2 p-3 sm:p-5 bg-gradient-to-t from-black/90 via-black/60 to-transparent shrink-0">
        {imageCaption && (
          <p className="text-xs sm:text-sm text-neutral-300 font-light text-center max-w-2xl px-4 line-clamp-2">
            {imageCaption}
          </p>
        )}

        {/* Thumbnail Selector Strip */}
        {total > 1 && showThumbnails && (
          <div className="flex items-center justify-center gap-2 overflow-x-auto max-w-3xl w-full py-1.5 px-3 modal-scrollbar">
            {images.map((item, idx) => {
              const isSelected = idx === currentIndex;
              const thumbSrc =
                item.url || item.src || item.original_url || item.display_url || null;
              return (
                <button
                  key={item.id || idx}
                  onClick={() => {
                    resetZoom();
                    setCurrentIndex(idx);
                  }}
                  aria-label={`${imageTitle} - ${idx + 1}`}
                  className={`relative w-12 sm:w-16 h-10 sm:h-12 rounded-xl overflow-hidden shrink-0 transition-all border ${
                    isSelected
                      ? 'border-amber-400 ring-2 ring-amber-400/50 scale-105 shadow-lg'
                      : 'border-white/20 opacity-50 hover:opacity-100 hover:border-white/40'
                  }`}
                >
                  {thumbSrc ? (
                    <img
                      src={thumbSrc}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ProjectArtwork id={item.artworkId} className="w-full h-full object-cover" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default FullscreenImageViewer;
