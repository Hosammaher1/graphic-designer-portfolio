import React, { useState, useEffect } from 'react';
import { ShieldCheck, Copy, Check, ExternalLink, Clock, AlertTriangle, X } from 'lucide-react';
import { Button, Badge, Input } from '../components/ui';
import { generatePreviewUrl } from './pageBuilderApi.js';

export function SecurePreviewModal({
  slug = 'home',
  locale = 'ar',
  isOpen,
  onClose,
}) {
  const isAr = locale === 'ar';
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
      setError(null);
      return;
    }

    let isMounted = true;
    async function loadSignedUrl() {
      setLoading(true);
      setError(null);
      const res = await generatePreviewUrl(slug);
      if (!isMounted) return;

      if (res.success) {
        setPreviewUrl(res.preview_url);
        setExpiresAt(res.expires_at);
      } else {
        setError(res.error || (isAr ? 'فشل إنشاء رابط المعاينة' : 'Failed to generate preview URL'));
      }
      setLoading(false);
    }

    loadSignedUrl();
    return () => {
      isMounted = false;
    };
  }, [isOpen, slug, isAr]);

  const handleCopy = async () => {
    if (!previewUrl) return;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(previewUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // Clipboard fallback
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="secure-preview-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="secure-preview-title"
    >
      <div className="secure-preview-dialog w-full max-w-lg bg-surface border border-border rounded-xl shadow-2xl overflow-hidden p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <ShieldCheck size={22} className="text-primary" aria-hidden="true" />
            <h3 id="secure-preview-title" className="text-lg font-bold">
              {isAr ? 'رابط المعاينة الآمنة للمسودة' : 'Secure Draft Preview Link'}
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label={isAr ? 'إغلاق' : 'Close'}
          >
            <X size={18} aria-hidden="true" />
          </Button>
        </div>

        {/* Security & SEO Notice */}
        <div className="security-notice p-3 rounded-lg bg-muted text-xs space-y-2">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <Clock size={15} className="text-primary" aria-hidden="true" />
            <span>
              {isAr
                ? 'صلاحية الرابط: 30 دقيقة فقط من تاريخ التوليد'
                : 'Validity: Link expires in 30 minutes'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted">
            <AlertTriangle size={15} className="text-secondary" aria-hidden="true" />
            <span>
              {isAr
                ? 'محمي بوسوم منع الفهرسة (noindex, nofollow) لمنع تسريب المسودة لمحركات البحث.'
                : 'Enforces noindex, nofollow, and no-cache headers to prevent search indexing.'}
            </span>
          </div>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="py-8 text-center text-muted text-sm">
            <span>{isAr ? 'جاري إنشاء التوقيع الرقمي للرابط...' : 'Generating cryptographic signature...'}</span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm" role="alert">
            {error}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="signed-preview-input" className="text-xs font-semibold text-muted">
                {isAr ? 'الرابط الموقّع رقمياً' : 'Cryptographically Signed Preview URL'}
              </label>
              <div className="flex gap-2">
                <input
                  id="signed-preview-input"
                  type="text"
                  readOnly
                  value={previewUrl}
                  className="flex-1 text-xs font-mono bg-base border border-border rounded-md px-3 py-2 text-foreground truncate select-all focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopy}
                  aria-label={isAr ? 'نسخ الرابط' : 'Copy URL'}
                >
                  {copied ? (
                    <>
                      <Check size={14} className="text-success" aria-hidden="true" />
                      <span>{isAr ? 'تم النسخ!' : 'Copied!'}</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} aria-hidden="true" />
                      <span>{isAr ? 'نسخ' : 'Copy'}</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {expiresAt && (
              <div className="flex items-center justify-between text-xs text-muted">
                <span>{isAr ? 'تاريخ الانتهاء:' : 'Expires at:'}</span>
                <span className="font-mono">{new Date(expiresAt).toLocaleTimeString()}</span>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                {isAr ? 'إلغاء' : 'Close'}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => window.open(previewUrl, '_blank', 'noopener,noreferrer')}
              >
                <ExternalLink size={14} aria-hidden="true" />
                <span>{isAr ? 'فتح المعاينة' : 'Open Preview'}</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SecurePreviewModal;
