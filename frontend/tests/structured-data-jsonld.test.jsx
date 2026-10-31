import { describe, it, expect } from 'vitest';
import { resolvePageMetadata, syncDocumentHead } from '../src/utils/seo.js';
import { buildJsonLd } from '../src/utils/schemaOrg.js';

describe('Structured Data JSON-LD (Task 07.04)', () => {
  it('generates WebSite and Person structured data for Home routes', () => {
    const jsonLdAr = buildJsonLd('/ar/');
    expect(jsonLdAr).toBeDefined();
    expect(Array.isArray(jsonLdAr) ? jsonLdAr[0]['@context'] : jsonLdAr['@context']).toBe('https://schema.org');

    const websiteNode = Array.isArray(jsonLdAr)
      ? jsonLdAr.find((node) => node['@type'] === 'WebSite')
      : (jsonLdAr['@type'] === 'WebSite' ? jsonLdAr : null);
    expect(websiteNode).toBeDefined();
    expect(websiteNode.url).toBe('https://mohammed-portfolio.com/ar/');
    expect(websiteNode.inLanguage).toBe('ar');

    const personNode = Array.isArray(jsonLdAr)
      ? jsonLdAr.find((node) => node['@type'] === 'Person')
      : null;
    expect(personNode).toBeDefined();
    expect(personNode.name).toContain('محمد');
    expect(personNode.jobTitle).toBeDefined();

    // English Home route
    const jsonLdEn = buildJsonLd('/en/');
    const websiteEn = Array.isArray(jsonLdEn)
      ? jsonLdEn.find((node) => node['@type'] === 'WebSite')
      : null;
    expect(websiteEn.url).toBe('https://mohammed-portfolio.com/en/');
    expect(websiteEn.inLanguage).toBe('en');

    const personEn = Array.isArray(jsonLdEn)
      ? jsonLdEn.find((node) => node['@type'] === 'Person')
      : null;
    expect(personEn.name).toContain('Mohammed Maher');
  });

  it('generates detailed Person structured data for About route', () => {
    const jsonLd = buildJsonLd('/en/about');
    const person = Array.isArray(jsonLd)
      ? jsonLd.find((node) => node['@type'] === 'Person')
      : jsonLd;

    expect(person).toBeDefined();
    expect(person['@type']).toBe('Person');
    expect(person.name).toBe('Mohammed Maher');
    expect(person.url).toBe('https://mohammed-portfolio.com/en/about');
    expect(person.knowsAbout).toContain('Brand Identity');
    expect(person.knowsAbout).toContain('Packaging Design');
  });

  it('generates VisualArtwork / CreativeWork schema for Project detail route', () => {
    const projectMock = {
      slug: 'nile-heritage-coffee',
      title: 'قهوة تراث النيل',
      title_ar: 'قهوة تراث النيل',
      title_en: 'Nile Heritage Coffee',
      client: 'Nile Roasters Inc.',
      year: 2024,
      published_at: '2024-05-15T10:00:00Z',
      cover_url: 'https://res.cloudinary.com/demo/image/upload/v1/nile-coffee.jpg',
      category: { name: 'تصميم العبوات', name_en: 'Packaging Design' },
      description: 'هوية بصرية وعبوات فاخرة للقهوة المختصة',
    };

    const jsonLd = buildJsonLd('/ar/projects/nile-heritage-coffee', { project: projectMock });
    const artwork = Array.isArray(jsonLd) ? jsonLd[0] : jsonLd;

    expect(artwork).toBeDefined();
    expect(['VisualArtwork', 'CreativeWork']).toContain(artwork['@type']);
    expect(artwork.name).toBe('قهوة تراث النيل');
    expect(artwork.image).toBe('https://res.cloudinary.com/demo/image/upload/v1/nile-coffee.jpg');
    expect(artwork.creator).toBeDefined();
    expect(artwork.creator['@type']).toBe('Person');
    expect(artwork.dateCreated).toBe(2024);
    expect(artwork.sponsor?.name || artwork.provider?.name).toBe('Nile Roasters Inc.');
  });

  it('embeds valid parseable application/ld+json script in SSR head tags', () => {
    const meta = resolvePageMetadata('/ar/');
    expect(meta.jsonLd).toBeDefined();

    const headTags = meta.renderHeadTags();
    expect(headTags).toContain('<script type="application/ld+json">');
    expect(headTags).toContain('https://schema.org');

    // Extract script payload and verify JSON parseability
    const match = headTags.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    expect(match).not.toBeNull();
    const parsed = JSON.parse(match[1]);
    expect(parsed).toBeDefined();
  });

  it('synchronizes JSON-LD script into DOM via syncDocumentHead and cleans up on admin routes', () => {
    const metaHome = resolvePageMetadata('/en/');
    syncDocumentHead(metaHome);

    let scriptEl = document.querySelector('script[type="application/ld+json"]');
    expect(scriptEl).not.toBeNull();
    const data = JSON.parse(scriptEl.textContent);
    expect(data).toBeDefined();

    // Navigating to admin route should remove public structured data
    const metaAdmin = resolvePageMetadata('/admin/projects');
    syncDocumentHead(metaAdmin);

    scriptEl = document.querySelector('script[type="application/ld+json"]');
    expect(scriptEl).toBeNull();
  });
});
