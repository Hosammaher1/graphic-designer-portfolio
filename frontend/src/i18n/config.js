import ar from './ar.json';
import en from './en.json';

export const supportedLocales = ['ar', 'en'];
export const defaultLocale = 'ar';

export const localeDirections = {
  ar: 'rtl',
  en: 'ltr',
};

export const translations = {
  ar,
  en,
};

/**
 * Extract locale from URL pathname.
 */
export function getLocaleFromPath(pathname = '') {
  const segment = pathname.split('/').filter(Boolean)[0];
  if (supportedLocales.includes(segment)) {
    return segment;
  }
  return defaultLocale;
}

/**
 * Get direction for a given locale.
 */
export function getDirection(locale) {
  return localeDirections[locale] || 'rtl';
}

/**
 * Translate a dot-notated key with fallback.
 */
export function t(key, locale = defaultLocale) {
  const activeLocale = supportedLocales.includes(locale) ? locale : defaultLocale;
  const dict = translations[activeLocale] || translations[defaultLocale];

  const keys = key.split('.');
  let current = dict;
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      current = undefined;
      break;
    }
  }

  if (current !== undefined) {
    return current;
  }

  // Fallback to default locale dictionary if primary failed
  if (activeLocale !== defaultLocale) {
    let fallback = translations[defaultLocale];
    for (const k of keys) {
      if (fallback && typeof fallback === 'object' && k in fallback) {
        fallback = fallback[k];
      } else {
        fallback = undefined;
        break;
      }
    }
    if (fallback !== undefined) {
      return fallback;
    }
  }

  return key;
}

/**
 * Calculate target path when switching locale.
 */
export function switchLocalePath(currentPath = '/', targetLocale) {
  const clean = currentPath.split('?')[0];
  const query = currentPath.includes('?') ? currentPath.slice(currentPath.indexOf('?')) : '';

  if (clean.startsWith('/ar/')) {
    return `/en/${clean.slice(4)}${query}`;
  }
  if (clean.startsWith('/en/')) {
    return `/ar/${clean.slice(4)}${query}`;
  }
  if (clean === '/ar' || clean === '/ar/') {
    return `/en/${query}`;
  }
  if (clean === '/en' || clean === '/en/') {
    return `/ar/${query}`;
  }
  return `/${targetLocale}/${query}`;
}
