import { getLocaleFromPath, getDirection, t } from '../i18n/config.js';
import buildJsonLd from './schemaOrg.js';

export const DEFAULT_SITE_URL = 'https://mohammed-portfolio.com';
export const DEFAULT_OG_IMAGE = 'https://res.cloudinary.com/demo/image/upload/v1/portfolio/og-cover.jpg';

/**
 * Resolve full dynamic page metadata, Open Graph tags, Twitter Cards, canonicals, and hreflang alternates.
 * Works seamlessly in both SSR server rendering and client-side hydration.
 */
export function resolvePageMetadata(url = '/', options = {}) {
  const cleanUrl = url.split('?')[0];
  const locale = getLocaleFromPath(cleanUrl);
  const isAr = locale === 'ar';
  const direction = getDirection(locale);
  const designer = t('site.designerName', locale) || (isAr ? 'محمد ماهر' : 'Mohammed Maher');
  const baseUrl = options.siteUrl || DEFAULT_SITE_URL;

  const isRobotsDisallowed = cleanUrl.startsWith('/admin');

  let title = '';
  let description = '';
  let type = 'website';
  let image = options.project?.cover_url || options.project?.cover_image?.url || options.image || DEFAULT_OG_IMAGE;
  let canonicalPath = cleanUrl;
  let routeSuffix = '/';

  // Route-specific metadata mapping
  if (cleanUrl === `/${locale}/` || cleanUrl === `/${locale}` || cleanUrl === '/' || cleanUrl === '') {
    title = isAr
      ? `${designer} — مصمم جرافيك وهويات بصرية`
      : `${designer} — Graphic & Brand Identity Designer`;
    description = t('site.description', locale) || (isAr
      ? 'معرض أعمال وتجارب بصرية متخصصة في تصميم الهويات التجارية المتميزة والعبوات الفاخرة.'
      : 'Curated portfolio of brand identities, print artifacts, and creative digital systems.');
    canonicalPath = `/${locale}/`;
    routeSuffix = '/';
  } else if (cleanUrl.startsWith(`/${locale}/work`)) {
    title = isAr
      ? `الأعمال والمشاريع — ${designer}`
      : `Selected Work & Projects — ${designer}`;
    description = isAr
      ? 'استعرض مجموعة مختارة من مشاريع الهوية البصرية، تصميم العبوات، والأنظمة الطباعية.'
      : 'Explore a curated collection of brand identities, packaging design, and editorial systems.';
    canonicalPath = `/${locale}/work`;
    routeSuffix = '/work';
  } else if (cleanUrl.startsWith(`/${locale}/about`)) {
    title = isAr
      ? `عن المصمم والرؤية — ${designer}`
      : `About Mohammed — ${designer}`;
    description = isAr
      ? 'تعرف على المسيرة التصميمية والرؤية المنهجية لمحمد ماهر في بناء لغات بصرية استثنائية.'
      : 'Learn about Mohammed Maher’s design philosophy, milestones, and craft in brand identity design.';
    canonicalPath = `/${locale}/about`;
    routeSuffix = '/about';
  } else if (cleanUrl.startsWith(`/${locale}/contact`)) {
    title = isAr
      ? `تواصل معي — ${designer}`
      : `Get in Touch — ${designer}`;
    description = isAr
      ? 'ابدأ محادثة حول مشروعك القادم، استفسارات الهوية البصرية، أو التعاون الإبداعي.'
      : 'Start a conversation about your brand goals, identity inquiries, or creative commissions.';
    canonicalPath = `/${locale}/contact`;
    routeSuffix = '/contact';
  } else if (cleanUrl.includes('/projects/')) {
    type = 'article';
    const slug = cleanUrl.split('/projects/')[1]?.split('/')[0] || '';
    canonicalPath = `/${locale}/projects/${slug}`;
    routeSuffix = `/projects/${slug}`;

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
      const slugTitle = slug
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      title = `${slugTitle} — ${designer}`;
      description = isAr
        ? `دراسة حالة وتوثيق بصري لمشروع ${slugTitle} بواسطة ${designer}.`
        : `Design case study and documentation for ${slugTitle} by ${designer}.`;
    }
  } else if (isRobotsDisallowed) {
    title = isAr ? 'لوحة التحكم والتحليلات — الإدارة' : 'Admin Dashboard — Portfolio';
    description = 'Administrative portal for portfolio management.';
    canonicalPath = cleanUrl;
    routeSuffix = cleanUrl;
  } else {
    title = `${designer} — ${t('site.role', locale)}`;
    description = t('site.description', locale);
    canonicalPath = cleanUrl;
    routeSuffix = cleanUrl.replace(/^\/(ar|en)/, '') || '/';
  }

  const canonicalUrl = `${baseUrl}${canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`}`;

  // Reciprocal hreflang alternate links (excluded on admin routes)
  const arPath = `/ar${routeSuffix === '/' ? '/' : routeSuffix}`;
  const enPath = `/en${routeSuffix === '/' ? '/' : routeSuffix}`;
  const alternates = isRobotsDisallowed
    ? null
    : {
        ar: `${baseUrl}${arPath}`,
        en: `${baseUrl}${enPath}`,
        'x-default': `${baseUrl}${arPath}`,
      };

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

  const jsonLd = buildJsonLd(cleanUrl, options);

  return {
    title,
    description,
    canonicalUrl,
    alternates,
    jsonLd,
    isRobotsDisallowed,
    locale,
    direction,
    image,
    type,
    og,
    twitter,
    renderHeadTags() {
      const tags = [
        `<meta name="description" content="${escapeHtml(description)}" />`,
      ];

      if (isRobotsDisallowed) {
        tags.push(`<meta name="robots" content="noindex, nofollow" />`);
      } else {
        tags.push(`<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`);
        if (alternates) {
          tags.push(`<!-- Hreflang Alternates -->`);
          tags.push(`<link rel="alternate" hreflang="ar" href="${escapeHtml(alternates.ar)}" />`);
          tags.push(`<link rel="alternate" hreflang="en" href="${escapeHtml(alternates.en)}" />`);
          tags.push(`<link rel="alternate" hreflang="x-default" href="${escapeHtml(alternates['x-default'])}" />`);
        }
      }

      tags.push(
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
        `<meta name="twitter:image" content="${escapeHtml(twitter.image)}" />`
      );

      if (jsonLd && !isRobotsDisallowed) {
        tags.push(
          `<!-- Schema.org JSON-LD -->`,
          `<script type="application/ld+json">\n${JSON.stringify(jsonLd, null, 2)}\n</script>`
        );
      }

      return tags.join('\n    ');
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
 * Client-side DOM helper to sync <head> meta, canonical, and hreflang tags on client navigation.
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

  // Meta description & robots
  updateOrCreateMeta('name', 'description', metadata.description);

  let robotsEl = document.querySelector('meta[name="robots"]');
  if (metadata.isRobotsDisallowed) {
    if (!robotsEl) {
      robotsEl = document.createElement('meta');
      robotsEl.setAttribute('name', 'robots');
      document.head.appendChild(robotsEl);
    }
    robotsEl.setAttribute('content', 'noindex, nofollow');
  } else if (robotsEl) {
    robotsEl.remove();
  }

  // Canonical link tag
  let canonicalEl = document.querySelector('link[rel="canonical"]');
  if (metadata.canonicalUrl && !metadata.isRobotsDisallowed) {
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute('href', metadata.canonicalUrl);
  } else if (canonicalEl) {
    canonicalEl.remove();
  }

  // Hreflang alternate link tags
  if (metadata.alternates && !metadata.isRobotsDisallowed) {
    Object.entries(metadata.alternates).forEach(([lang, href]) => {
      let altEl = document.querySelector(`link[rel="alternate"][hreflang="${lang}"]`);
      if (!altEl) {
        altEl = document.createElement('link');
        altEl.setAttribute('rel', 'alternate');
        altEl.setAttribute('hreflang', lang);
        document.head.appendChild(altEl);
      }
      altEl.setAttribute('href', href);
    });
  } else {
    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((el) => el.remove());
  }

  // Open Graph
  updateOrCreateMeta('property', 'og:type', metadata.og.type);
  updateOrCreateMeta('property', 'og:title', metadata.og.title);
  updateOrCreateMeta('property', 'og:description', metadata.og.description);
  updateOrCreateMeta('property', 'og:url', metadata.og.url);
  updateOrCreateMeta('property', 'og:site_name', metadata.og.siteName);
  updateOrCreateMeta('property', 'og:image', metadata.og.image);
  updateOrCreateMeta('property', 'og:locale', metadata.og.locale);
  updateOrCreateMeta('property', 'og:locale:alternate', metadata.og.localeAlternate);

  // Twitter Cards
  updateOrCreateMeta('name', 'twitter:card', metadata.twitter.card);
  updateOrCreateMeta('name', 'twitter:title', metadata.twitter.title);
  updateOrCreateMeta('name', 'twitter:description', metadata.twitter.description);
  updateOrCreateMeta('name', 'twitter:image', metadata.twitter.image);

  // Schema.org JSON-LD Script
  let jsonLdScript = document.querySelector('script[type="application/ld+json"]');
  if (metadata.jsonLd && !metadata.isRobotsDisallowed) {
    if (!jsonLdScript) {
      jsonLdScript = document.createElement('script');
      jsonLdScript.setAttribute('type', 'application/ld+json');
      document.head.appendChild(jsonLdScript);
    }
    jsonLdScript.textContent = JSON.stringify(metadata.jsonLd, null, 2);
  } else if (jsonLdScript) {
    jsonLdScript.remove();
  }
}

export default resolvePageMetadata;
