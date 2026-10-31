import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Check, RotateCcw } from 'lucide-react';
import { useConsent } from '../context/ConsentContext.jsx';
import { t } from '../i18n/config.js';

export function ConsentModal({ locale = 'ar' }) {
  const {
    consent,
    isSettingsOpen,
    closeSettings,
    savePreferences,
    acceptAll,
    rejectAll,
    withdrawConsent,
  } = useConsent();

  // Local state for checkboxes in the modal.
  // CRITICAL REQUIREMENT: NO PRE-TICKED CONSENT for optional categories!
  // If undecided, rejected, or withdrawn, optional categories are strictly false.
  const [analyticsChecked, setAnalyticsChecked] = useState(false);
  const [personalizationChecked, setPersonalizationChecked] = useState(false);

  useEffect(() => {
    if (isSettingsOpen) {
      if (consent.status === 'accepted' || consent.status === 'customized') {
        setAnalyticsChecked(Boolean(consent.categories?.analytics));
        setPersonalizationChecked(Boolean(consent.categories?.personalization));
      } else {
        // Strict privacy-by-default: never pre-ticked
        setAnalyticsChecked(false);
        setPersonalizationChecked(false);
      }
    }
  }, [isSettingsOpen, consent]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isSettingsOpen) {
        closeSettings();
      }
    }
    if (isSettingsOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSettingsOpen, closeSettings]);

  if (!isSettingsOpen) {
    return null;
  }

  const handleSave = () => {
    savePreferences({
      analytics: analyticsChecked,
      personalization: personalizationChecked,
    });
  };

  const hasPriorConsent = consent.status === 'accepted' || consent.status === 'customized';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={closeSettings}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-modal-title"
        className="w-full max-w-2xl bg-[var(--color-surface,#18181b)] text-[var(--color-text,#fafafa)] border border-[var(--color-border,#27272a)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--color-border,#27272a)] bg-[var(--color-surface-hover,#202023)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[var(--color-primary-light,#27272a)] text-[var(--color-primary,#3b82f6)]">
              <ShieldCheck size={22} aria-hidden="true" />
            </div>
            <h2 id="consent-modal-title" className="text-lg font-bold">
              {t('consent.modal.title', locale)}
            </h2>
          </div>
          <button
            type="button"
            onClick={closeSettings}
            className="p-2 text-[var(--color-text-muted,#a1a1aa)] hover:text-[var(--color-text,#fafafa)] hover:bg-[var(--color-surface,#18181b)] rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-focus,#3b82f6)]"
            aria-label={t('consent.modal.close', locale)}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          <p className="text-[var(--color-text-muted,#a1a1aa)] leading-relaxed">
            {t('consent.modal.description', locale)}
          </p>

          <div className="space-y-4">
            {/* Category: Essential */}
            <div className="p-4 rounded-xl border border-[var(--color-border,#27272a)] bg-[var(--color-bg,#09090b)]/50">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <label
                    htmlFor="consent-cat-essential"
                    className="font-semibold text-[var(--color-text,#fafafa)] flex items-center gap-2 cursor-not-allowed"
                  >
                    <span>{t('consent.category.essential.title', locale)}</span>
                  </label>
                  <p className="text-xs text-[var(--color-text-muted,#a1a1aa)] leading-relaxed">
                    {t('consent.category.essential.desc', locale)}
                  </p>
                </div>
                <input
                  id="consent-cat-essential"
                  type="checkbox"
                  checked={true}
                  disabled={true}
                  className="mt-1 h-5 w-5 rounded border-[var(--color-border,#3f3f46)] text-[var(--color-primary,#3b82f6)] opacity-70 cursor-not-allowed"
                  aria-label={t('consent.category.essential.title', locale)}
                />
              </div>
            </div>

            {/* Category: Analytics */}
            <div className="p-4 rounded-xl border border-[var(--color-border,#27272a)] bg-[var(--color-bg,#09090b)]/50 hover:border-[var(--color-border-hover,#3f3f46)] transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <label
                    htmlFor="consent-cat-analytics"
                    className="font-semibold text-[var(--color-text,#fafafa)] flex items-center gap-2 cursor-pointer"
                  >
                    <span>{t('consent.category.analytics.title', locale)}</span>
                  </label>
                  <p className="text-xs text-[var(--color-text-muted,#a1a1aa)] leading-relaxed">
                    {t('consent.category.analytics.desc', locale)}
                  </p>
                </div>
                <input
                  id="consent-cat-analytics"
                  type="checkbox"
                  checked={analyticsChecked}
                  onChange={(e) => setAnalyticsChecked(e.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-[var(--color-border,#3f3f46)] text-[var(--color-primary,#3b82f6)] cursor-pointer focus:ring-2 focus:ring-[var(--color-focus,#3b82f6)]"
                  aria-label={t('consent.category.analytics.title', locale)}
                />
              </div>
            </div>

            {/* Category: Personalization */}
            <div className="p-4 rounded-xl border border-[var(--color-border,#27272a)] bg-[var(--color-bg,#09090b)]/50 hover:border-[var(--color-border-hover,#3f3f46)] transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <label
                    htmlFor="consent-cat-personalization"
                    className="font-semibold text-[var(--color-text,#fafafa)] flex items-center gap-2 cursor-pointer"
                  >
                    <span>{t('consent.category.personalization.title', locale)}</span>
                  </label>
                  <p className="text-xs text-[var(--color-text-muted,#a1a1aa)] leading-relaxed">
                    {t('consent.category.personalization.desc', locale)}
                  </p>
                </div>
                <input
                  id="consent-cat-personalization"
                  type="checkbox"
                  checked={personalizationChecked}
                  onChange={(e) => setPersonalizationChecked(e.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-[var(--color-border,#3f3f46)] text-[var(--color-primary,#3b82f6)] cursor-pointer focus:ring-2 focus:ring-[var(--color-focus,#3b82f6)]"
                  aria-label={t('consent.category.personalization.title', locale)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-[var(--color-border,#27272a)] bg-[var(--color-surface-hover,#202023)] flex flex-wrap items-center justify-between gap-3">
          <div>
            {hasPriorConsent && (
              <button
                type="button"
                onClick={withdrawConsent}
                className="px-3.5 py-2 text-xs md:text-sm font-medium rounded-lg text-red-400 hover:text-red-300 hover:bg-red-950/30 border border-red-900/50 transition-colors inline-flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <RotateCcw size={15} aria-hidden="true" />
                <span>{t('consent.modal.withdraw', locale)}</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={rejectAll}
              className="px-3.5 py-2 text-xs md:text-sm font-medium rounded-lg border border-[var(--color-border,#3f3f46)] hover:bg-[var(--color-surface,#18181b)] text-[var(--color-text,#fafafa)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-focus,#3b82f6)]"
            >
              {t('consent.banner.rejectAll', locale)}
            </button>

            <button
              type="button"
              onClick={acceptAll}
              className="px-3.5 py-2 text-xs md:text-sm font-medium rounded-lg border border-[var(--color-border,#3f3f46)] hover:bg-[var(--color-surface,#18181b)] text-[var(--color-text,#fafafa)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-focus,#3b82f6)]"
            >
              {t('consent.banner.acceptAll', locale)}
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-xs md:text-sm font-medium rounded-lg bg-[var(--color-primary,#3b82f6)] hover:bg-[var(--color-primary-hover,#2563eb)] text-white transition-colors shadow-sm inline-flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-focus,#3b82f6)]"
            >
              <Check size={16} aria-hidden="true" />
              <span>{t('consent.modal.save', locale)}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConsentModal;
