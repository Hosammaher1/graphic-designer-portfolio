import { describe, it, expect } from 'vitest';
import { resolvePageMetadata, syncDocumentHead } from '../src/utils/seo.js';
import { render } from '../src/entry-server.jsx';

describe('Robots, Canonicals, and Hreflang (Task 07.03)', () => {
  it('generates canonical link and reciprocal hreflang alternate links for home route', () => {
    const metaAr = resolvePageMetadata('/ar/');
    expect(metaAr.canonicalUrl).toBe('https://mohammed-portfolio.com/ar/');
    expect(metaAr.alternates).toBeDefined();
    expect(metaAr.alternates.ar).toBe('https://mohammed-portfolio.com/ar/');
    expect(metaAr.alternates.en).toBe('https://mohammed-portfolio.com/en/');
    expect(metaAr.alternates['x-default']).toBe('https://mohammed-portfolio.com/ar/');

    const headTagsAr = metaAr.renderHeadTags();
    expect(headTagsAr).toContain('<link rel="canonical" href="https://mohammed-portfolio.com/ar/" />');
    expect(headTagsAr).toContain('<link rel="alternate" hreflang="ar" href="https://mohammed-portfolio.com/ar/" />');
    expect(headTagsAr).toContain('<link rel="alternate" hreflang="en" href="https://mohammed-portfolio.com/en/" />');
    expect(headTagsAr).toContain('<link rel="alternate" hreflang="x-default" href="https://mohammed-portfolio.com/ar/" />');

    // English reciprocal pairing
    const metaEn = resolvePageMetadata('/en/');
    expect(metaEn.canonicalUrl).toBe('https://mohammed-portfolio.com/en/');
    expect(metaEn.alternates.ar).toBe('https://mohammed-portfolio.com/ar/');
    expect(metaEn.alternates.en).toBe('https://mohammed-portfolio.com/en/');
    expect(metaEn.alternates['x-default']).toBe('https://mohammed-portfolio.com/ar/');

    const headTagsEn = metaEn.renderHeadTags();
    expect(headTagsEn).toContain('<link rel="canonical" href="https://mohammed-portfolio.com/en/" />');
    expect(headTagsEn).toContain('<link rel="alternate" hreflang="ar" href="https://mohammed-portfolio.com/ar/" />');
    expect(headTagsEn).toContain('<link rel="alternate" hreflang="en" href="https://mohammed-portfolio.com/en/" />');
    expect(headTagsEn).toContain('<link rel="alternate" hreflang="x-default" href="https://mohammed-portfolio.com/ar/" />');
  });

  it('generates canonical and hreflang pairs for inner routes (work, about, contact)', () => {
    const metaWork = resolvePageMetadata('/ar/work');
    expect(metaWork.canonicalUrl).toBe('https://mohammed-portfolio.com/ar/work');
    expect(metaWork.alternates.ar).toBe('https://mohammed-portfolio.com/ar/work');
    expect(metaWork.alternates.en).toBe('https://mohammed-portfolio.com/en/work');
    expect(metaWork.alternates['x-default']).toBe('https://mohammed-portfolio.com/ar/work');

    const metaContactEn = resolvePageMetadata('/en/contact');
    expect(metaContactEn.canonicalUrl).toBe('https://mohammed-portfolio.com/en/contact');
    expect(metaContactEn.alternates.ar).toBe('https://mohammed-portfolio.com/ar/contact');
    expect(metaContactEn.alternates.en).toBe('https://mohammed-portfolio.com/en/contact');
  });

  it('generates canonical and hreflang pairs for project detail routes', () => {
    const metaProject = resolvePageMetadata('/en/projects/brand-identity-craft', {
      project: {
        slug: 'brand-identity-craft',
        title: 'Brand Identity Craft',
      },
    });

    expect(metaProject.canonicalUrl).toBe('https://mohammed-portfolio.com/en/projects/brand-identity-craft');
    expect(metaProject.alternates.ar).toBe('https://mohammed-portfolio.com/ar/projects/brand-identity-craft');
    expect(metaProject.alternates.en).toBe('https://mohammed-portfolio.com/en/projects/brand-identity-craft');
    expect(metaProject.alternates['x-default']).toBe('https://mohammed-portfolio.com/ar/projects/brand-identity-craft');
  });

  it('emits noindex, nofollow robots directive on admin routes and omits public hreflang tags', () => {
    const metaAdmin = resolvePageMetadata('/admin/projects');
    expect(metaAdmin.isRobotsDisallowed).toBe(true);
    const tags = metaAdmin.renderHeadTags();
    expect(tags).toContain('<meta name="robots" content="noindex, nofollow" />');
    expect(tags).not.toContain('hreflang=');
  });

  it('synchronizes canonical and hreflang link tags into DOM via syncDocumentHead', () => {
    const meta = resolvePageMetadata('/ar/work');
    syncDocumentHead(meta);

    const canonicalEl = document.querySelector('link[rel="canonical"]');
    expect(canonicalEl).not.toBeNull();
    expect(canonicalEl.getAttribute('href')).toBe('https://mohammed-portfolio.com/ar/work');

    const hreflangAr = document.querySelector('link[rel="alternate"][hreflang="ar"]');
    expect(hreflangAr).not.toBeNull();
    expect(hreflangAr.getAttribute('href')).toBe('https://mohammed-portfolio.com/ar/work');

    const hreflangEn = document.querySelector('link[rel="alternate"][hreflang="en"]');
    expect(hreflangEn).not.toBeNull();
    expect(hreflangEn.getAttribute('href')).toBe('https://mohammed-portfolio.com/en/work');

    const hreflangDefault = document.querySelector('link[rel="alternate"][hreflang="x-default"]');
    expect(hreflangDefault).not.toBeNull();
    expect(hreflangDefault.getAttribute('href')).toBe('https://mohammed-portfolio.com/ar/work');
  });
});
