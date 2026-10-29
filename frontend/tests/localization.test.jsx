import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { t, defaultLocale, supportedLocales, getLocaleFromPath } from '../src/i18n/config.js';
import LanguageSwitcher from '../src/components/LanguageSwitcher.jsx';
import arTranslations from '../src/i18n/ar.json';
import enTranslations from '../src/i18n/en.json';
import { render as renderServer } from '../src/entry-server.jsx';

describe('Localization Architecture & System', () => {
  it('RED/GREEN: verifies translation files contain matching top-level keys', () => {
    const arKeys = Object.keys(arTranslations);
    const enKeys = Object.keys(enTranslations);
    expect(arKeys.length).toBeGreaterThan(0);
    expect(arKeys).toEqual(enKeys);
  });

  it('translates keys with fallback to Arabic default', () => {
    expect(t('nav.home', 'ar')).toBe(arTranslations.nav.home);
    expect(t('nav.home', 'en')).toBe(enTranslations.nav.home);
    // Fallback on invalid locale
    expect(t('nav.home', 'fr')).toBe(arTranslations.nav.home);
  });

  it('identifies locale correctly from URL path', () => {
    expect(getLocaleFromPath('/ar/projects')).toBe('ar');
    expect(getLocaleFromPath('/en/projects')).toBe('en');
    expect(getLocaleFromPath('/random')).toBe('ar');
  });

  it('renders LanguageSwitcher component with toggle link to opposite locale', () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={['/ar/']}>
        <LanguageSwitcher currentLocale="ar" />
      </MemoryRouter>
    );
    const enLink = screen.getByRole('link', { name: 'English' });
    expect(enLink).toHaveAttribute('href', '/en/');
    unmount();

    render(
      <MemoryRouter initialEntries={['/en/']}>
        <LanguageSwitcher currentLocale="en" />
      </MemoryRouter>
    );
    const arLink = screen.getByRole('link', { name: 'العربية' });
    expect(arLink).toHaveAttribute('href', '/ar/');
  });

  it('server renders /ar/ with lang="ar" dir="rtl" and /en/ with lang="en" dir="ltr"', () => {
    const arResult = renderServer('/ar/');
    expect(arResult.lang).toBe('ar');
    expect(arResult.dir).toBe('rtl');

    const enResult = renderServer('/en/');
    expect(enResult.lang).toBe('en');
    expect(enResult.dir).toBe('ltr');
  });
});
