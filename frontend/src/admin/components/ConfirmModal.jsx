import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useAdmin } from '../context/AdminContext.jsx';

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  isDestructive = true,
}) {
  const { lang } = useAdmin();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-md p-6 sm:p-7 rounded-3xl glass-panel-active border border-[#f4a496]/25 shadow-2xl shadow-black/90 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onCancel}
          className="absolute top-5 right-5 p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-2xl border flex-shrink-0 ${
              isDestructive
                ? 'bg-[#842b45]/30 border-[#f4a496]/30 text-[#f4a496]'
                : 'bg-amber-500/20 border-amber-500/30 text-amber-300'
            }`}
          >
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="flex-1 pr-6 rtl:pr-0 rtl:pl-6">
            <h3 className="text-lg font-serif font-bold text-white mb-2">{title}</h3>
            <p className="text-sm text-neutral-300 leading-relaxed font-light mb-6">{message}</p>

            <div className="flex items-center gap-3 justify-end">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-full text-xs font-medium text-neutral-300 hover:text-white glass-panel hover:bg-white/10 transition-colors cursor-pointer"
              >
                {cancelLabel || (lang === 'ar' ? 'إلغاء' : 'Cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  onConfirm();
                  onCancel();
                }}
                className={`px-5 py-2 rounded-full text-xs font-semibold text-[#fcdcd4] transition-all shadow-lg cursor-pointer ${
                  isDestructive
                    ? 'bg-gradient-to-r from-[#842b45] to-[#591b2e] hover:from-[#9c3252] hover:to-[#6d2138] border border-[#f4a496]/40 shadow-black/50'
                    : 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 text-white border border-amber-400/40'
                }`}
              >
                {confirmLabel || (lang === 'ar' ? 'تأكيد الحذف' : 'Confirm')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
