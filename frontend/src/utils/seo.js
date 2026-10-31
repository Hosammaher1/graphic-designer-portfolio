import { getLocaleFromPath, getDirection, t } from '../i18n/config.js';

export const DEFAULT_SITE_URL = 'https://mohammed-portfolio.com';
export const DEFAULT_OG_IMAGE = 'https://res.cloudinary.com/demo/image/upload/v1/portfolio/og-cover.jpg';

/**
 * Resolve full dynamic page metadata, Open Graph tags, and Twitter Cards for any given route.
 * Works seamlessly in both SSR server rendering and client-side hydration.
 */
export function resolvePageMetadata(url = '/', options = {}) {
  const cleanUrl = url.split('?')[0];
  const locale = getLocaleFromPath(cleanUrl);
  const isAr = locale === 'ar';
  const direction = getDirection(locale);
  const designer = t('site.designerName', locale) || (isAr ? 'محمد ماهر' : 'Mohammed Maher');
  const baseUrl = options.siteUrl || DEFAULT_SITE_URL;

  let title = '';
  let description = '';
  let type = 'website';
  let image = options.project?.cover_url || options.project?.cover_image?.url || options.image || DEFAULT_OG_IMAGE;
  let canonicalPath = cleanUrl;

  // Route-specific metadata mapping
  if (cleanUrl === `/${locale}/` || cleanUrl === `/${locale}` || cleanUrl === '/' || cleanUrl === '') {
    title = isAr
      ? `${designer} — مصمم جرافيك وهويات بصرية`
      : `${designer} — Graphic & Brand Identity Designer`;
    description = t('site.description', locale) || (isAr
      ? 'معرض أعمال وتجارب بصرية متخصصة في تصميم الهويات التجارية المتميزة والعبوات الفاخرة.'
      : 'Curated portfolio of brand identities, print artifacts, and creative digital systems.');
    canonicalPath = `/${locale}/`;
  } else if (cleanUrl.startsWith(`/${locale}/work`)) {
    title = isAr
      ? `الأعمال والمشاريع — ${designer}`
      : `Selected Work & Projects — ${designer}`;
    description = isAr
      ? 'استعرض مجموعة مختارة من مشاريع الهوية البصرية، تصميم العبوات، والأنظمة الطباعية.'
      : 'Explore a curated collection of brand identities, packaging design, and editorial systems.';
  } else if (cleanUrl.startsWith(`/${locale}/about`)) {
    title = isAr
      ? `عن المصمم والرؤية — ${designer}`
      : `About Mohammed — ${designer}`;
    description = isAr
      ? 'تعرف على المسيرة التصميمية والرؤية المنهجية لمحمد ماهر في بناء لغات بصرية استثنائية.'
      : 'Learn about Mohammed Maher’s design philosophy, milestones, and craft in brand identity design.';
  } else if (cleanUrl.startsWith(`/${locale}/contact`)) {
    title = isAr
      ? `تواصل معي — ${designer}`
      : `Get in Touch — ${designer}`;
    description = isAr
      ? 'ابدأ محادثة حول مشروعك القادم، استفسارات الهوية البصرية، أو التعاون الإبداعي.'
      : 'Start a conversation about your brand goals, identity inquiries, or creative commissions.';
  } else if (cleanUrl.includes('/projects/')) {
    type = 'article';
    const slug = cleanUrl.split('/projects/')[1]?.split('/')[0] || '';
    const proj = options.project;

    if (proj) {
      const projTitle = proj.title || proj.title_ar || proj.title_en || slug;
      title = `${proj.seo_title || projTitle} — ${designer}`;
      description = proj.seo_description || proj.description || proj.summary || (isAr
        ? `مشروع تصميم ${projTitle} بواسطة ${designer}`
        : `${projTitle} design case study by ${designer}`);
      if (proj.cover_url || proj.cover_image?.url) {
        image = proj.cover_url || proj.cover_image?.url;
      }
    } else {
      // Clean slug fallback
      const slugTitle = slug
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      title = `${slugTitle} — ${designer}`;
      description = isAr
        ? `دراسة حالة وتوثيق بصري لمشروع ${slugTitle} بواسطة ${designer}.`
        : `Design case study and documentation for ${slugTitle} by ${designer}.`;
    }
  } else if (cleanUrl.startsWith('/admin')) {
    title = isAr ? 'لوحة التحكم والتحليلات — الإدارة' : 'Admin Dashboard — Portfolio';
    description = 'Administrative portal for portfolio management.';
  } else {
    title = `${designer} — ${t('site.role', locale)}`;
    description = t('site.description', locale);
  }

  const canonicalUrl = `${baseUrl}${canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`}`;

  const og = {
    title,
    description,
    image,
    type,
    url: canonicalUrl,
    locale: isAr ? 'ar_EG' : 'en_US',
    localeAlternate: isAr ? 'en_US' : 'ar_EG',
    siteName: isAr ? `${designer} — معرض الأعمال` : `${designer} — Portfolio`,
  };

  const twitter = {
    card: 'summary_large_image',
    title,
    description,
    image,
  };

  return {
    title,
    description,
    canonicalUrl,
    locale,
    direction,
    image,
    type,
    og,
    twitter,
    renderHeadTags() {
      return [
        `<meta name="description" content="${escapeHtml(description)}" />`,
        `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`,
        `<!-- Open Graph / Facebook -->`,
        `<meta property="og:type" content="${escapeHtml(og.type)}" />`,
        `<meta property="og:title" content="${escapeHtml(og.title)}" />`,
        `<meta property="og:description" content="${escapeHtml(og.description)}" />`,
        `<meta property="og:url" content="${escapeHtml(og.url)}" />`,
        `<meta property="og:site_name" content="${escapeHtml(og.siteName)}" />`,
        `<meta property="og:image" content="${escapeHtml(og.image)}" />`,
        `<meta property="og:locale" content="${escapeHtml(og.locale)}" />`,
        `<meta property="og:locale:alternate" content="${escapeHtml(og.localeAlternate)}" />`,
        `<!-- Twitter Cards -->`,
        `<meta name="twitter:card" content="${escapeHtml(twitter.card)}" />`,
        `<meta name="twitter:title" content="${escapeHtml(twitter.title)}" />`,
        `<meta name="twitter:description" content="${escapeHtml(twitter.description)}" />`,
        `<meta name="twitter:image" content="${escapeHtml(twitter.image)}" />`,
      ].join('\n    ');
    },
  };
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Client-side DOM helper to sync <head> meta tags on client navigation.
 */
export function syncDocumentHead(metadata) {
  if (typeof document === 'undefined' || !metadata) return;

  document.title = metadata.title;

  function updateOrCreateMeta(attrName, attrValue, content) {
    if (!content) return;
    let el = document.querySelector(`meta[${attrName}="${attrValue}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attrName, attrValue);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  }

  updateOrCreateMeta('name', 'description', metadata.description);
  updateOrCreateMeta('property', 'og:type', metadata.og.type);
  updateOrCreateMeta('property', 'og:title', metadata.og.title);
  updateOrCreateMeta('property', 'og:description', metadata.og.description);
  updateOrCreateMeta('property', 'og:url', metadata.og.url);
  updateOrCreateMeta('property', 'og:site_name', metadata.og.siteName);
  updateOrCreateMeta('property', 'og:image', metadata.og.image);
  updateOrCreateMeta('property', 'og:locale', metadata.og.locale);
  updateOrCreateMeta('name', 'twitter:card', metadata.twitter.card);
  updateOrCreateMeta('name', 'twitter:title', metadata.twitter.title);
  updateOrCreateMeta('name', 'twitter:description', metadata.twitter.description);
  updateOrCreateMeta('name', 'twitter:image', metadata.twitter.image);
}

export default resolvePageMetadata;
