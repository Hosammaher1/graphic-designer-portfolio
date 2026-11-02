/**
 * Safely resolves localized strings from either:
 * - A bilingual object { en: '...', ar: '...' }
 * - A plain string
 * - Null / undefined (returns fallback)
 * 
 * Guarantees a primitive string is returned, preventing React's:
 * "Objects are not valid as a React child (found: object with keys {en, ar})" error.
 */
export function resolveLocalized(val, lang = 'en', fallback = '') {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    // Check primary requested lang
    if (typeof val[lang] === 'string' && val[lang].trim() !== '') {
      return val[lang];
    }
    // Check fallback english
    if (typeof val.en === 'string' && val.en.trim() !== '') {
      return val.en;
    }
    // Check fallback arabic
    if (typeof val.ar === 'string' && val.ar.trim() !== '') {
      return val.ar;
    }
    // Any first string value in the object
    for (const key of Object.keys(val)) {
      if (typeof val[key] === 'string' && val[key].trim() !== '') {
        return val[key];
      }
    }
    return fallback;
  }
  return fallback;
}

/**
 * Normalizes a raw portfolio project object so all localized fields
 * can be accessed safely whether as objects or as explicit .titleEn / .titleAr strings.
 */
export function normalizeAdminProject(p, idx = 0) {
  if (!p) return null;

  const titleEn = resolveLocalized(p.title, 'en') || (typeof p.titleEn === 'string' ? p.titleEn : '') || 'Untitled Project';
  const titleAr = resolveLocalized(p.title, 'ar') || (typeof p.titleAr === 'string' ? p.titleAr : '') || titleEn;

  const categoryEn = resolveLocalized(p.category, 'en') || (typeof p.categoryEn === 'string' ? p.categoryEn : '') || 'Branding';
  const categoryAr = resolveLocalized(p.category, 'ar') || (typeof p.categoryAr === 'string' ? p.categoryAr : '') || categoryEn;

  const clientEn = resolveLocalized(p.client, 'en') || (typeof p.clientEn === 'string' ? p.clientEn : '') || 'Studio Client';
  const clientAr = resolveLocalized(p.client, 'ar') || (typeof p.clientAr === 'string' ? p.clientAr : '') || clientEn;

  const descEn = resolveLocalized(p.description, 'en') || (typeof p.descEn === 'string' ? p.descEn : '') || '';
  const descAr = resolveLocalized(p.description, 'ar') || (typeof p.descAr === 'string' ? p.descAr : '') || descEn;

  const subtitleEn = resolveLocalized(p.subtitle, 'en') || (typeof p.subtitleEn === 'string' ? p.subtitleEn : '') || '';
  const subtitleAr = resolveLocalized(p.subtitle, 'ar') || (typeof p.subtitleAr === 'string' ? p.subtitleAr : '') || subtitleEn;

  // Process gallery items so captions are guaranteed to be clean strings
  const gallery = Array.isArray(p.gallery)
    ? p.gallery.map((item, gIdx) => ({
        ...item,
        id: item.id || `g-${gIdx + 1}`,
        url: item.url || p.coverImage || p.image || '/assets/aistudio/Selected_Work__Noya_Skincare_Portfolio_6434c76f.png',
        captionEn: resolveLocalized(item.caption, 'en') || resolveLocalized(item.title, 'en') || item.captionEn || '',
        captionAr: resolveLocalized(item.caption, 'ar') || resolveLocalized(item.title, 'ar') || item.captionAr || '',
      }))
    : [
        {
          id: 'g-1',
          url: p.coverImage || p.image || '/assets/aistudio/Selected_Work__Noya_Skincare_Portfolio_6434c76f.png',
          captionEn: `${titleEn} Hero Showcase`,
          captionAr: `عرض رئيسي لمشروع ${titleAr}`,
        },
      ];

  return {
    ...p,
    id: p.id || `proj-${idx + 1}`,
    slug: p.slug || p.id || `proj-${idx + 1}`,
    title: { en: titleEn, ar: titleAr },
    titleEn,
    titleAr,
    category: { en: categoryEn, ar: categoryAr },
    categoryEn,
    categoryAr,
    client: { en: clientEn, ar: clientAr },
    clientEn,
    clientAr,
    description: { en: descEn, ar: descAr },
    descEn,
    descAr,
    subtitle: { en: subtitleEn, ar: subtitleAr },
    subtitleEn,
    subtitleAr,
    status: p.status || 'published',
    views: typeof p.views === 'number' ? p.views : Math.max(340, 1240 - idx * 180 + 45),
    updatedAt: p.updatedAt || `2026-10-${Math.max(1, 28 - idx)}`,
    featured: p.isFeatured !== undefined ? !!p.isFeatured : (p.featured !== undefined ? !!p.featured : idx < 3),
    categories: Array.isArray(p.categories) ? p.categories : [categoryEn],
    tools: Array.isArray(p.tools) ? p.tools : ['Adobe Illustrator', 'Adobe Photoshop', 'Figma'],
    year: p.year || '2025',
    coverImage: p.coverImage || p.image || '/assets/aistudio/Selected_Work__Noya_Skincare_Portfolio_6434c76f.png',
    gallery,
    seoTitle: p.seoTitle || `${titleEn} — Brand Identity Case Study`,
    seoDesc: p.seoDesc || descEn || 'Creative graphic design showcase.',
  };
}
