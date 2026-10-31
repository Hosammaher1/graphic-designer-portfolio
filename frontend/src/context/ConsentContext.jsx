import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export const CONSENT_STORAGE_KEY = 'portfolio_consent_state';
export const CONSENT_VERSION = '1.0';

const DEFAULT_STATE = {
  status: 'undecided', // 'undecided' | 'accepted' | 'rejected' | 'customized' | 'withdrawn'
  categories: {
    essential: true,
    analytics: false,
    personalization: false,
  },
  updatedAt: null,
  version: CONSENT_VERSION,
  consentId: null,
};

function generateConsentId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'c_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

function loadInitialConsent() {
  if (typeof window === 'undefined') {
    return DEFAULT_STATE;
  }

  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_STATE;
    }
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return {
        ...DEFAULT_STATE,
        ...parsed,
        categories: {
          ...DEFAULT_STATE.categories,
          ...(parsed.categories || {}),
          essential: true, // Invariant: essential cannot be disabled
        },
      };
    }
  } catch (e) {
    // Malformed JSON fallback
  }

  return DEFAULT_STATE;
}

const ConsentContext = createContext(null);

export function ConsentProvider({ children, locale = 'ar' }) {
  const [consent, setConsent] = useState(loadInitialConsent);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const persistAndNotify = useCallback((nextState, action) => {
    setConsent(nextState);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(nextState));
      } catch (e) {
        // Storage cap / private mode fallback
      }

      const event = new CustomEvent('portfolio:consent-changed', {
        detail: {
          consent: nextState,
          action,
        },
      });
      window.dispatchEvent(event);

      // Async sync to privacy backend
      if (action === 'withdraw') {
        if (nextState.consentId) {
          fetch('/api/v1/consent/withdraw', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ consent_token: nextState.consentId }),
          }).catch(() => {});
        }
      } else if (action === 'accept_all' || action === 'reject_all' || action === 'customized') {
        fetch('/api/v1/consent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            consent_token: nextState.consentId,
            status: nextState.status,
            categories: {
              analytics: Boolean(nextState.categories?.analytics),
              personalization: Boolean(nextState.categories?.personalization),
            },
            policy_version: nextState.version || '1.0',
          }),
        }).catch(() => {});
      }
    }
  }, []);

  const acceptAll = useCallback(() => {
    const nextState = {
      status: 'accepted',
      categories: {
        essential: true,
        analytics: true,
        personalization: true,
      },
      updatedAt: new Date().toISOString(),
      version: CONSENT_VERSION,
      consentId: consent.consentId || generateConsentId(),
    };
    persistAndNotify(nextState, 'accept_all');
    setIsSettingsOpen(false);
  }, [consent.consentId, persistAndNotify]);

  const rejectAll = useCallback(() => {
    const nextState = {
      status: 'rejected',
      categories: {
        essential: true,
        analytics: false,
        personalization: false,
      },
      updatedAt: new Date().toISOString(),
      version: CONSENT_VERSION,
      consentId: consent.consentId || generateConsentId(),
    };
    persistAndNotify(nextState, 'reject_all');
    setIsSettingsOpen(false);
  }, [consent.consentId, persistAndNotify]);

  const savePreferences = useCallback((selectedCategories) => {
    const nextState = {
      status: 'customized',
      categories: {
        essential: true,
        analytics: Boolean(selectedCategories?.analytics),
        personalization: Boolean(selectedCategories?.personalization),
      },
      updatedAt: new Date().toISOString(),
      version: CONSENT_VERSION,
      consentId: consent.consentId || generateConsentId(),
    };
    persistAndNotify(nextState, 'customized');
    setIsSettingsOpen(false);
  }, [consent.consentId, persistAndNotify]);

  const withdrawConsent = useCallback(() => {
    const nextState = {
      status: 'withdrawn',
      categories: {
        essential: true,
        analytics: false,
        personalization: false,
      },
      updatedAt: new Date().toISOString(),
      version: CONSENT_VERSION,
      consentId: consent.consentId || generateConsentId(),
    };
    persistAndNotify(nextState, 'withdraw');
    setIsSettingsOpen(false);
  }, [consent.consentId, persistAndNotify]);

  const hasConsent = useCallback((category) => {
    if (category === 'essential') return true;
    if (consent.status === 'undecided') return false;
    if (consent.status === 'rejected' || consent.status === 'withdrawn') return false;
    return Boolean(consent.categories?.[category]);
  }, [consent]);

  const openSettings = useCallback(() => {
    setIsSettingsOpen(true);
  }, []);

  const closeSettings = useCallback(() => {
    setIsSettingsOpen(false);
  }, []);

  const value = {
    consent,
    isSettingsOpen,
    openSettings,
    closeSettings,
    acceptAll,
    rejectAll,
    savePreferences,
    withdrawConsent,
    hasConsent,
    locale,
  };

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent() {
  const context = useContext(ConsentContext);
  if (!context) {
    return {
      consent: DEFAULT_STATE,
      isSettingsOpen: false,
      openSettings: () => {},
      closeSettings: () => {},
      acceptAll: () => {},
      rejectAll: () => {},
      savePreferences: () => {},
      withdrawConsent: () => {},
      hasConsent: () => false,
      locale: 'ar',
    };
  }
  return context;
}

export default ConsentContext;
