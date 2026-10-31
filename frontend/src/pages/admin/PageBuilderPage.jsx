import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Share2,
  Send,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Container, Button, Badge } from '../../components/ui';
import BuilderCanvas from '../../page-builder/BuilderCanvas.jsx';
import SecurePreviewModal from '../../page-builder/SecurePreviewModal.jsx';
import {
  fetchPageDraft,
  savePageDraft,
  publishPage,
} from '../../page-builder/pageBuilderApi.js';

export default function PageBuilderPage() {
  const { slug: routeSlug } = useParams();
  const slug = routeSlug || 'home';
  const [locale, setLocale] = useState('ar');
  const isAr = locale === 'ar';

  const [loading, setLoading] = useState(true);
  const [pageData, setPageData] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [lockVersion, setLockVersion] = useState(1);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [publishStatus, setPublishStatus] = useState(null); // { type: 'success'|'error', message }
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      const res = await fetchPageDraft(slug);
      if (!isMounted) return;

      if (res.success) {
        setPageData(res.page);
        setBlocks(res.blocks || []);
        setLockVersion(res.page?.lock_version || 1);
      }
      setLoading(false);
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Handle Draft Save
  const handleSaveDraft = async ({ blocks: currentBlocks, lockVersion: currentLock }) => {
    const res = await savePageDraft(slug, {
      lock_version: currentLock,
      blocks: currentBlocks,
      title_ar: pageData?.title_ar || 'الصفحة الرئيسية',
      title_en: pageData?.title_en || 'Home Page',
    });

    if (res.success) {
      setPageData(res.page);
      setLockVersion(res.page.lock_version);
      setBlocks(currentBlocks);
    }
    return res;
  };

  // Handle Publish
  const handlePublish = async () => {
    setIsPublishing(true);
    setPublishStatus(null);
    try {
      const res = await publishPage(slug);
      if (res.success) {
        setPublishStatus({
          type: 'success',
          message: isAr
            ? `تم نشر الصفحة بنجاح! النسخة المنشورة الآن رقم ${res.published_version.version_number}.`
            : `Page published successfully! Published version #${res.published_version.version_number} is now live.`,
        });
        setPageData(res.page);
      } else {
        setPublishStatus({
          type: 'error',
          message:
            res.message ||
            (isAr ? 'فشل نشر الصفحة بسبب نقص محتوى مطلوب' : 'Failed to publish page due to policy violation'),
        });
      }
    } catch (err) {
      setPublishStatus({
        type: 'error',
        message: err.message || (isAr ? 'حدث خطأ غير متوقع أثناء النشر' : 'Unexpected error during publish'),
      });
    } finally {
      setIsPublishing(false);
    }
  };

  if (loading) {
    return (
      <Container size="site">
        <div className="py-20 text-center text-muted">
          <p>{isAr ? 'جاري تحميل محرر الصفحة والكتل...' : 'Loading Page Builder workspace...'}</p>
        </div>
      </Container>
    );
  }

  return (
    <div className="page-builder-page-wrapper space-y-4">
      {/* Top Page Builder Admin Bar */}
      <div className="builder-admin-topbar bg-surface border-b border-border py-3 px-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/admin"
            className="flex items-center gap-1 text-xs text-muted hover:text-foreground transition-colors"
          >
            {isAr ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
            <span>{isAr ? 'لوحة التحكم' : 'Dashboard'}</span>
          </Link>
          <span className="text-muted">/</span>
          <h2 className="text-sm font-bold flex items-center gap-2">
            <span>{isAr ? 'محرر الصفحة:' : 'Page:'}</span>
            <Badge variant="outline" className="font-mono text-xs">
              {slug}
            </Badge>
          </h2>
          <Badge variant="secondary" className="text-xs">
            {isAr ? `نسخة القفل: v${lockVersion}` : `Lock: v${lockVersion}`}
          </Badge>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <div className="flex items-center gap-1 bg-muted p-0.5 rounded-md text-xs">
            <button
              type="button"
              className={`px-2 py-1 rounded font-medium transition-all ${
                isAr ? 'bg-surface text-primary shadow-xs' : 'text-muted'
              }`}
              onClick={() => setLocale('ar')}
            >
              العربية
            </button>
            <button
              type="button"
              className={`px-2 py-1 rounded font-medium transition-all ${
                !isAr ? 'bg-surface text-primary shadow-xs' : 'text-muted'
              }`}
              onClick={() => setLocale('en')}
            >
              English
            </button>
          </div>

          {/* Secure Preview Modal Trigger */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreviewModal(true)}
            aria-label={isAr ? 'مشاركة رابط معاينة آمن' : 'Share Secure Preview'}
          >
            <Share2 size={14} aria-hidden="true" />
            <span>{isAr ? 'رابط المعاينة' : 'Share Preview'}</span>
          </Button>

          {/* View Public Live Page */}
          <a
            href={`/${locale}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md border border-border hover:bg-muted text-foreground transition-colors"
          >
            <ExternalLink size={14} aria-hidden="true" />
            <span>{isAr ? 'عرض المنشور' : 'View Live'}</span>
          </a>

          {/* Atomic Publish Action */}
          <Button
            variant="primary"
            size="sm"
            onClick={handlePublish}
            disabled={isPublishing}
            aria-busy={isPublishing}
          >
            <Send size={14} aria-hidden="true" />
            <span>{isPublishing ? (isAr ? 'جاري النشر...' : 'Publishing...') : (isAr ? 'نشر الصفحة' : 'Publish Page')}</span>
          </Button>
        </div>
      </div>

      {/* Publish Notification Banner */}
      {publishStatus && (
        <div
          className={`publish-status-banner mx-4 p-3 rounded-lg flex items-center justify-between text-sm ${
            publishStatus.type === 'success'
              ? 'bg-success/10 text-success border border-success/20'
              : 'bg-destructive/10 text-destructive border border-destructive/20'
          }`}
          role="alert"
        >
          <div className="flex items-center gap-2">
            {publishStatus.type === 'success' ? (
              <CheckCircle2 size={18} aria-hidden="true" />
            ) : (
              <AlertCircle size={18} aria-hidden="true" />
            )}
            <span className="font-medium">{publishStatus.message}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setPublishStatus(null)}>
            {isAr ? 'إغلاق' : 'Dismiss'}
          </Button>
        </div>
      )}

      {/* Builder Workspace Canvas */}
      <BuilderCanvas
        pageId={slug}
        initialBlocks={blocks}
        lockVersion={lockVersion}
        locale={locale}
        onSave={handleSaveDraft}
      />

      {/* Secure Preview Dialog */}
      <SecurePreviewModal
        slug={slug}
        locale={locale}
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
      />
    </div>
  );
}
