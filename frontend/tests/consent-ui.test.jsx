import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ConsentProvider, useConsent, CONSENT_STORAGE_KEY } from '../src/context/ConsentContext.jsx';
import ConsentBanner from '../src/components/ConsentBanner.jsx';
import ConsentModal from '../src/components/ConsentModal.jsx';
import Footer from '../src/components/Footer.jsx';

function TestConsumer({ locale = 'ar' }) {
  const { consent, hasConsent, withdrawConsent, openSettings } = useConsent();

  return (
    <div>
      <div data-testid="status">{consent.status}</div>
      <div data-testid="analytics-consent">{String(hasConsent('analytics'))}</div>
      <div data-testid="personalization-consent">{String(hasConsent('personalization'))}</div>
      <div data-testid="essential-consent">{String(hasConsent('essential'))}</div>
      <button onClick={openSettings} data-testid="btn-open-settings">
        Open Settings
      </button>
      <button onClick={withdrawConsent} data-testid="btn-withdraw">
        Withdraw
      </button>
      <ConsentBanner locale={locale} />
      <ConsentModal locale={locale} />
      <Footer locale={locale} />
    </div>
  );
}

function renderWithConsent(ui, locale = 'ar') {
  return render(
    <BrowserRouter>
      <ConsentProvider locale={locale}>{ui}</ConsentProvider>
    </BrowserRouter>
  );
}

describe('Consent UI (Task 06.05)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders consent banner when undecided with 3 distinct actions', () => {
    renderWithConsent(<TestConsumer locale="ar" />, 'ar');

    expect(screen.getByTestId('status')).toHaveTextContent('undecided');
    expect(screen.getByRole('region', { name: /تفضيلات الخصوصية والكوكيز|إشعار الخصوصية/i })).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /قبول الكل/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /رفض الكل/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /تخصيص الخيارات|إعدادات الخصوصية/i })).toBeInTheDocument();
  });

  it('reject all blocks analytics and personalization tracking', async () => {
    renderWithConsent(<TestConsumer locale="ar" />, 'ar');

    const rejectBtn = screen.getByRole('button', { name: /رفض الكل/i });
    fireEvent.click(rejectBtn);

    expect(screen.getByTestId('status')).toHaveTextContent('rejected');
    expect(screen.getByTestId('analytics-consent')).toHaveTextContent('false');
    expect(screen.getByTestId('personalization-consent')).toHaveTextContent('false');
    expect(screen.getByTestId('essential-consent')).toHaveTextContent('true');

    // Banner is dismissed
    expect(screen.queryByRole('region', { name: /تفضيلات الخصوصية والكوكيز|إشعار الخصوصية/i })).not.toBeInTheDocument();

    // Verify localStorage persistence
    const saved = JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY));
    expect(saved.status).toBe('rejected');
    expect(saved.categories.analytics).toBe(false);
    expect(saved.categories.personalization).toBe(false);
  });

  it('accept all enables both analytics and personalization tracking', async () => {
    renderWithConsent(<TestConsumer locale="ar" />, 'ar');

    const acceptBtn = screen.getByRole('button', { name: /قبول الكل/i });
    fireEvent.click(acceptBtn);

    expect(screen.getByTestId('status')).toHaveTextContent('accepted');
    expect(screen.getByTestId('analytics-consent')).toHaveTextContent('true');
    expect(screen.getByTestId('personalization-consent')).toHaveTextContent('true');
    expect(screen.getByTestId('essential-consent')).toHaveTextContent('true');

    // Banner is dismissed
    expect(screen.queryByRole('region', { name: /تفضيلات الخصوصية والكوكيز|إشعار الخصوصية/i })).not.toBeInTheDocument();

    const saved = JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY));
    expect(saved.status).toBe('accepted');
    expect(saved.categories.analytics).toBe(true);
    expect(saved.categories.personalization).toBe(true);
  });

  it('settings modal opens with NO pre-ticked consent for optional categories', async () => {
    renderWithConsent(<TestConsumer locale="ar" />, 'ar');

    const customizeBtn = screen.getByRole('button', { name: /تخصيص الخيارات|إعدادات الخصوصية/i });
    fireEvent.click(customizeBtn);

    // Modal dialog is open
    const modal = screen.getByRole('dialog', { name: /إعدادات الخصوصية والتتبع/i });
    expect(modal).toBeInTheDocument();

    // Essential checkbox is checked and disabled
    const essentialCheck = screen.getByRole('checkbox', { name: /ملفات الكوكيز الأساسية/i });
    expect(essentialCheck).toBeChecked();
    expect(essentialCheck).toBeDisabled();

    // Analytics and Personalization checkboxes MUST NOT be pre-ticked
    const analyticsCheck = screen.getByRole('checkbox', { name: /تحليلات الأداء/i });
    const personalizationCheck = screen.getByRole('checkbox', { name: /التوصيات المخصصة/i });

    expect(analyticsCheck).not.toBeChecked();
    expect(personalizationCheck).not.toBeChecked();
  });

  it('allows granular preferences selection (e.g. analytics enabled without personalization)', async () => {
    renderWithConsent(<TestConsumer locale="ar" />, 'ar');

    const customizeBtn = screen.getByRole('button', { name: /تخصيص الخيارات|إعدادات الخصوصية/i });
    fireEvent.click(customizeBtn);

    const analyticsCheck = screen.getByRole('checkbox', { name: /تحليلات الأداء/i });
    const personalizationCheck = screen.getByRole('checkbox', { name: /التوصيات المخصصة/i });

    // Explicitly tick analytics only
    fireEvent.click(analyticsCheck);
    expect(analyticsCheck).toBeChecked();
    expect(personalizationCheck).not.toBeChecked();

    // Save preferences
    const saveBtn = screen.getByRole('button', { name: /حفظ التفضيلات/i });
    fireEvent.click(saveBtn);

    expect(screen.getByTestId('status')).toHaveTextContent('customized');
    expect(screen.getByTestId('analytics-consent')).toHaveTextContent('true');
    expect(screen.getByTestId('personalization-consent')).toHaveTextContent('false');

    const saved = JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY));
    expect(saved.status).toBe('customized');
    expect(saved.categories.analytics).toBe(true);
    expect(saved.categories.personalization).toBe(false);
  });

  it('withdrawal resets consent, stops future tracking, and dispatches event', async () => {
    // Start with pre-accepted consent in localStorage
    localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({
        status: 'accepted',
        categories: { essential: true, analytics: true, personalization: true },
        updatedAt: new Date().toISOString(),
        version: '1.0',
      })
    );

    const eventListener = vi.fn();
    window.addEventListener('portfolio:consent-changed', eventListener);

    renderWithConsent(<TestConsumer locale="ar" />, 'ar');

    expect(screen.getByTestId('status')).toHaveTextContent('accepted');
    expect(screen.getByTestId('analytics-consent')).toHaveTextContent('true');
    expect(screen.getByTestId('personalization-consent')).toHaveTextContent('true');

    // Banner is not displayed when already consented
    expect(screen.queryByRole('region', { name: /تفضيلات الخصوصية والكوكيز|إشعار الخصوصية/i })).not.toBeInTheDocument();

    // Open privacy preferences via footer link
    const footerPrivacyBtn = screen.getByRole('button', { name: /تفضيلات الخصوصية/i });
    fireEvent.click(footerPrivacyBtn);

    // Modal is open, and withdrawal button is visible
    const withdrawBtn = screen.getByRole('button', { name: /سحب الموافقة بالكامل/i });
    expect(withdrawBtn).toBeInTheDocument();

    fireEvent.click(withdrawBtn);

    // After withdrawal: tracking is blocked and status is withdrawn
    expect(screen.getByTestId('status')).toHaveTextContent('withdrawn');
    expect(screen.getByTestId('analytics-consent')).toHaveTextContent('false');
    expect(screen.getByTestId('personalization-consent')).toHaveTextContent('false');
    expect(screen.getByTestId('essential-consent')).toHaveTextContent('true');

    const saved = JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY));
    expect(saved.status).toBe('withdrawn');
    expect(saved.categories.analytics).toBe(false);
    expect(saved.categories.personalization).toBe(false);

    // Event was dispatched
    expect(eventListener).toHaveBeenCalled();

    window.removeEventListener('portfolio:consent-changed', eventListener);
  });

  it('renders correctly in English (LTR)', () => {
    renderWithConsent(<TestConsumer locale="en" />, 'en');

    expect(screen.getByRole('region', { name: /Privacy Preferences & Cookies|Privacy Notice/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Accept All/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reject All/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Customize Settings/i })).toBeInTheDocument();
  });
});
