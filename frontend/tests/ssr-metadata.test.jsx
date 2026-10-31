import { describe, it, expect } from 'vitest';
import { resolvePageMetadata } from '../src/utils/seo.js';
import { render } from '../src/entry-server.jsx';

describe('SSR Metadata & Open Graph (Task 07.01)', () => {
  it('generates Arabic metadata and Open Graph tags for Arabic home route', () => {
    const meta = resolvePageMetadata('/ar/');

    expect(meta.locale).toBe('ar');
    expect(meta.direction).toBe('rtl');
    expect(meta.title).toMatch(/محمد.*مصمم جرافيك/);
    expect(meta.description).toBeTruthy();
    expect(meta.canonicalUrl).toBe('https://mohammed-portfolio.com/ar/');

    // Open Graph
    expect(meta.og.title).toBe(meta.title);
    expect(meta.og.type).toBe('website');
    expect(meta.og.locale).toBe('ar_EG');
    expect(meta.og.localeAlternate).toBe('en_US');
    expect(meta.og.image).toBeTruthy();

    // Twitter Card
    expect(meta.twitter.card).toBe('summary_large_image');
    expect(meta.twitter.title).toBe(meta.title);
    expect(meta.twitter.image).toBe(meta.og.image);

    // Rendered HTML Head Tags
    const tags = meta.renderHeadTags();
    expect(tags).toContain('<meta name="description"');
    expect(tags).toContain('<meta property="og:type" content="website"');
    expect(tags).toContain('<meta property="og:locale" content="ar_EG"');
    expect(tags).toContain('<meta name="twitter:card" content="summary_large_image"');
  });

  it('generates English metadata and Open Graph tags for English home route', () => {
    const meta = resolvePageMetadata('/en/');

    expect(meta.locale).toBe('en');
    expect(meta.direction).toBe('ltr');
    expect(meta.title).toMatch(/Mohammed.*Graphic & Brand Identity Designer/);
    expect(meta.canonicalUrl).toBe('https://mohammed-portfolio.com/en/');

    // Open Graph
    expect(meta.og.locale).toBe('en_US');
    expect(meta.og.localeAlternate).toBe('ar_EG');

    const tags = meta.renderHeadTags();
    expect(tags).toContain('<meta property="og:locale" content="en_US"');
  });

  it('generates specific metadata for standard routes (work, about, contact)', () => {
    const workMeta = resolvePageMetadata('/ar/work');
    expect(workMeta.title).toMatch(/الأعمال والمشاريع/);

    const aboutMeta = resolvePageMetadata('/en/about');
    expect(aboutMeta.title).toMatch(/About Mohammed/);

    const contactMeta = resolvePageMetadata('/ar/contact');
    expect(contactMeta.title).toMatch(/تواصل معي/);
  });

  it('generates article type and project cover image for project detail routes', () => {
    const mockProject = {
      title: 'هوية استوديو كرافت',
      description: 'تصميم هوية بصرية كاملة ودليل العلامة التجارية.',
      cover_url: 'https://images.example.com/craft-cover.jpg',
      seo_title: 'كرافت — هوية بصرية متميزة',
      seo_description: 'توثيق هوية كرافت باللغتين العربية والإنجليزية.',
    };

    const meta = resolvePageMetadata('/ar/projects/craft-studio', {
      project: mockProject,
    });

    expect(meta.type).toBe('article');
    expect(meta.og.type).toBe('article');
    expect(meta.title).toContain('كرافت — هوية بصرية متميزة');
    expect(meta.description).toBe(mockProject.seo_description);
    expect(meta.og.image).toBe(mockProject.cover_url);
    expect(meta.twitter.image).toBe(mockProject.cover_url);

    const tags = meta.renderHeadTags();
    expect(tags).toContain('<meta property="og:type" content="article"');
    expect(tags).toContain('craft-cover.jpg');
  });

  it('SSR entry render(url) injects complete dynamic head tags and lang/dir attributes', () => {
    const arabicRender = render('/ar/');
    expect(arabicRender.lang).toBe('ar');
    expect(arabicRender.dir).toBe('rtl');
    expect(arabicRender.title).toMatch(/محمد/);
    expect(arabicRender.head).toContain('<title>');
    expect(arabicRender.head).toContain('og:title');
    expect(arabicRender.head).toContain('og:locale');
    expect(arabicRender.head).toContain('twitter:card');

    const englishRender = render('/en/work');
    expect(englishRender.lang).toBe('en');
    expect(englishRender.dir).toBe('ltr');
    expect(englishRender.title).toMatch(/Selected Work/);
    expect(englishRender.head).toContain('en_US');
  });

  it('full SSR HTML template replacement injects lang, dir, title, and open graph tags', () => {
    const fs = require('fs');
    const path = require('path');
    const indexPath = path.resolve(__dirname, '../dist/client/index.html');
    if (!fs.existsSync(indexPath)) return;

    const template = fs.readFileSync(indexPath, 'utf-8');
    const { html, title, lang, dir, metadata } = render('/ar/');
    const headTags = metadata.renderHeadTags();

    let fullHtml = template
      .replace(/<html[^>]*>/, `<html lang="${lang}" dir="${dir}">`)
      .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
      .replace('<!--ssr-outlet-->', html);

    if (fullHtml.includes('<!--ssr-head-tags-->')) {
      fullHtml = fullHtml.replace('<!--ssr-head-tags-->', headTags);
    } else {
      fullHtml = fullHtml.replace('</head>', `    ${headTags}\n  </head>`);
    }

    expect(fullHtml).toContain('lang="ar"');
    expect(fullHtml).toContain('dir="rtl"');
    expect(fullHtml).toContain('<title>');
    expect(fullHtml).toContain('property="og:locale" content="ar_EG"');
    expect(fullHtml).toContain('property="og:type" content="website"');
    expect(fullHtml).toContain('name="twitter:card" content="summary_large_image"');
  });
});
