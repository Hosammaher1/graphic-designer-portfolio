import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import { useConsent } from '../context/ConsentContext.jsx';

export function PublicLayout({ locale = 'ar', children }) {
  const location = useLocation();
  const { consent, hasConsent } = useConsent();

  // Privacy invariant: only dispatch analytics page_view if user explicitly consented to analytics
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (hasConsent('analytics') && consent?.consentId) {
      fetch('/api/v1/analytics/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Consent-Token': consent.consentId,
        },
        body: JSON.stringify({
          event_type: 'page_view',
          path: location.pathname,
          locale,
          consent_token: consent.consentId,
          referrer: document.referrer || '',
        }),
      }).catch(() => {});
    }
  }, [location.pathname, locale, consent?.status, consent?.consentId, hasConsent]);

  return (
    <div className="public-shell">
      <Header locale={locale} />
      <main id="main-content" className="public-main" tabIndex="-1">
        {children}
      </main>
      <Footer locale={locale} />
    </div>
  );
}

export default PublicLayout;
