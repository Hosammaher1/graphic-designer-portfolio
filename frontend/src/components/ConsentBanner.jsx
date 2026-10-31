import React from 'react';
import { ShieldCheck, Sliders, XCircle, CheckCircle2 } from 'lucide-react';
import { useConsent } from '../context/ConsentContext.jsx';
import { t } from '../i18n/config.js';

export function ConsentBanner({ locale = 'ar' }) {
  const { consent, acceptAll, rejectAll, openSettings } = useConsent();

  // Banner only appears when user has not yet decided
  if (consent.status !== 'undecided') {
    return null;
  }

  const regionLabel = t('consent.banner.region', locale) || 'إشعار الخصوصية وتفضيلات التتبع';
  const title = t('consent.banner.title', locale) || 'خصوصيتك وتفضيلاتك محل اهتمامنا';
  const desc =
    t('consent.banner.description', locale) ||
    'نستخدم ملفات تعريف الارتباط الأساسية لضمان عمل الموقع وأمانه. بموافقتك الاختيارية، نستخدم تحليلات قياس مجهولة وتوصيات مخصصة لتحسين تجربتك. لن نفعّل التتبع إلا بعد موافقتك الصريحة، ويمكنك سحب الموافقة في أي وقت.';
  const acceptAllText = t('consent.banner.acceptAll', locale) || 'قبول الكل';
  const rejectAllText = t('consent.banner.rejectAll', locale) || 'رفض الكل';
  const customizeText = t('consent.banner.customize', locale) || 'تخصيص الخيارات';

  return (
    <aside
      role="region"
      aria-label={regionLabel}
      className="fixed bottom-0 inset-x-0 z-50 p-4 md:p-6 bg-[var(--color-surface,#18181b)] text-[var(--color-text,#fafafa)] border-t border-[var(--color-border,#27272a)] shadow-2xl backdrop-blur-md bg-opacity-95 transition-transform duration-300"
    >
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 md:gap-6">
        <div className="flex items-start gap-3 max-w-3xl">
          <div className="p-2 rounded-lg bg-[var(--color-primary-light,#27272a)] text-[var(--color-primary,#3b82f6)] shrink-0 mt-0.5">
            <ShieldCheck size={24} aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight text-[var(--color-text,#fafafa)] mb-1">
              {title}
            </h2>
            <p className="text-sm text-[var(--color-text-muted,#a1a1aa)] leading-relaxed">
              {desc}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto shrink-0 justify-end">
          <button
            type="button"
            onClick={openSettings}
            className="px-3.5 py-2 text-xs md:text-sm font-medium rounded-lg border border-[var(--color-border,#3f3f46)] hover:bg-[var(--color-surface-hover,#27272a)] text-[var(--color-text,#fafafa)] transition-colors inline-flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--color-focus,#3b82f6)]"
          >
            <Sliders size={16} aria-hidden="true" />
            <span>{customizeText}</span>
          </button>

          <button
            type="button"
            onClick={rejectAll}
            className="px-3.5 py-2 text-xs md:text-sm font-medium rounded-lg border border-[var(--color-border,#3f3f46)] hover:bg-[var(--color-surface-hover,#27272a)] text-[var(--color-text,#fafafa)] transition-colors inline-flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--color-focus,#3b82f6)]"
          >
            <XCircle size={16} aria-hidden="true" />
            <span>{rejectAllText}</span>
          </button>

          <button
            type="button"
            onClick={acceptAll}
            className="px-4 py-2 text-xs md:text-sm font-medium rounded-lg bg-[var(--color-primary,#3b82f6)] hover:bg-[var(--color-primary-hover,#2563eb)] text-white transition-colors shadow-sm inline-flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-focus,#3b82f6)]"
          >
            <CheckCircle2 size={16} aria-hidden="true" />
            <span>{acceptAllText}</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

export default ConsentBanner;
