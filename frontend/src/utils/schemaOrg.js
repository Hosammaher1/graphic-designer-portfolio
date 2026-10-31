import { getLocaleFromPath, t } from '../i18n/config.js';

export const DEFAULT_SITE_URL = 'https://mohammed-portfolio.com';
export const DEFAULT_DESIGNER_AR = 'محمد ماهر';
export const DEFAULT_DESIGNER_EN = 'Mohammed Maher';

export const SOCIAL_PROFILES = [
  'https://behance.net/mohammedmaher',
  'https://linkedin.com/in/mohammedmaher',
  'https://instagram.com/mohammedmaher',
];

export const CORE_COMPETENCIES = [
  'Brand Identity',
  'Packaging Design',
  'Typography',
  'Visual Systems',
  'Art Direction',
  'Editorial Design',
];

/**
 * Construct Schema.org JSON-LD structured data graph for the given route.
 * Emits WebSite and Person for Home, detailed Person for About,
 * and VisualArtwork / CreativeWork for Project detail pages.
 *
 * @param {string} url - Route URL to generate structured data for
 * @param {object} options - Optional context including project data and siteUrl
 * @returns {object|array|null} Schema.org JSON-LD graph or null for private routes
 */
export function buildJsonLd(url = '/', options = {}) {
  const cleanUrl = url.split('?')[0];

  // Disallow structured data on admin paths
  if (cleanUrl.startsWith('/admin')) {
    return null;
  }

  const locale = getLocaleFromPath(cleanUrl);
  const isAr = locale === 'ar';
  const baseUrl = options.siteUrl || DEFAULT_SITE_URL;
  const designer = isAr ? DEFAULT_DESIGNER_AR : DEFAULT_DESIGNER_EN;

  // 1. Home route -> WebSite + Person
  if (cleanUrl === `/${locale}/` || cleanUrl === `/${locale}` || cleanUrl === '/' || cleanUrl === '') {
    return [
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: isAr ? `${designer} — مصمم جرافيك وهويات بصرية` : `${designer} — Graphic & Brand Identity Designer`,
        url: `${baseUrl}/${locale}/`,
        inLanguage: locale,
        description: isAr
          ? 'معرض أعمال وتجارب بصرية متخصصة في تصميم الهويات التجارية المتميزة والعبوات الفاخرة.'
          : 'Curated portfolio of brand identities, print artifacts, and creative digital systems.',
        creator: {
          '@type': 'Person',
          name: designer,
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: designer,
        jobTitle: isAr ? 'مصمم جرافيك وهويات بصرية' : 'Graphic & Brand Identity Designer',
        url: `${baseUrl}/${locale}/`,
        sameAs: SOCIAL_PROFILES,
        knowsAbout: CORE_COMPETENCIES,
      },
    ];
  }

  // 2. About route -> Detailed Person
  if (cleanUrl.startsWith(`/${locale}/about`)) {
    return {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: designer,
      jobTitle: isAr ? 'مصمم جرافيك وهويات بصرية' : 'Graphic & Brand Identity Designer',
      url: `${baseUrl}/${locale}/about`,
      description: isAr
        ? 'تعرف على المسيرة التصميمية والرؤية المنهجية لمحمد ماهر في بناء لغات بصرية استثنائية.'
        : 'Learn about Mohammed Maher’s design philosophy, milestones, and craft in brand identity design.',
      sameAs: SOCIAL_PROFILES,
      knowsAbout: CORE_COMPETENCIES,
      inLanguage: locale,
    };
  }

  // 3. Project Detail route -> VisualArtwork / CreativeWork
  if (cleanUrl.includes('/projects/')) {
    const slug = cleanUrl.split('/projects/')[1]?.split('/')[0] || '';
    const proj = options.project || {};
    const projTitle = proj.title || proj.title_ar || proj.title_en || slug;
    const coverUrl = proj.cover_url || proj.cover_image?.url || options.image || 'https://res.cloudinary.com/demo/image/upload/v1/portfolio/og-cover.jpg';
    const clientName = proj.client || null;
    const categoryName = proj.category?.name || proj.category?.name_en || proj.category?.name_ar || 'Brand Identity';
    const year = proj.year || (proj.published_at ? new Date(proj.published_at).getFullYear() : new Date().getFullYear());

    const artwork = {
      '@context': 'https://schema.org',
      '@type': 'VisualArtwork',
      name: projTitle,
      description: proj.seo_description || proj.description || proj.summary || (isAr
        ? `مشروع تصميم ${projTitle} بواسطة ${designer}`
        : `${projTitle} design case study by ${designer}`),
      url: `${baseUrl}/${locale}/projects/${slug}`,
      image: coverUrl,
      dateCreated: year,
      creator: {
        '@type': 'Person',
        name: designer,
        jobTitle: isAr ? 'مصمم جرافيك وهويات بصرية' : 'Graphic & Brand Identity Designer',
      },
      genre: categoryName,
      inLanguage: locale,
    };

    if (clientName) {
      artwork.sponsor = {
        '@type': 'Organization',
        name: clientName,
      };
      artwork.provider = {
        '@type': 'Organization',
        name: clientName,
      };
    }

    return artwork;
  }

  // 4. Contact Route -> ContactPage
  if (cleanUrl.startsWith(`/${locale}/contact`)) {
    return {
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: isAr ? `تواصل معي — ${designer}` : `Get in Touch — ${designer}`,
      url: `${baseUrl}/${locale}/contact`,
      inLanguage: locale,
      mainEntity: {
        '@type': 'Person',
        name: designer,
      },
    };
  }

  // 5. Work Route -> CollectionPage
  if (cleanUrl.startsWith(`/${locale}/work`)) {
    return {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: isAr ? `الأعمال والمشاريع — ${designer}` : `Selected Work & Projects — ${designer}`,
      url: `${baseUrl}/${locale}/work`,
      inLanguage: locale,
    };
  }

  return null;
}

export default buildJsonLd;
