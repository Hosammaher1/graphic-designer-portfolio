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

  const firstCat = Array.isArray(p.categories) && p.categories[0] ? p.categories[0] : null;
  const firstCatEn = typeof firstCat === 'object' && firstCat !== null
    ? (firstCat.name_en || firstCat.nameEn || (typeof firstCat.name === 'object' ? firstCat.name?.en : null) || firstCat.slug)
    : (typeof firstCat === 'string' ? firstCat : null);
  const firstCatAr = typeof firstCat === 'object' && firstCat !== null
    ? (firstCat.name_ar || firstCat.nameAr || (typeof firstCat.name === 'object' ? firstCat.name?.ar : null) || firstCat.slug)
    : (typeof firstCat === 'string' ? firstCat : null);

  const categoryEn = resolveLocalized(p.category, 'en') || (typeof p.categoryEn === 'string' ? p.categoryEn : '') || firstCatEn || 'Branding';
  const categoryAr = resolveLocalized(p.category, 'ar') || (typeof p.categoryAr === 'string' ? p.categoryAr : '') || firstCatAr || categoryEn;

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
        mediaAssetId: item.mediaAssetId || item.media_asset_id || (Number.isInteger(Number(item.id)) ? Number(item.id) : null),
        url: item.url || item.display_url || p.coverImage || p.cover_url || p.image || '',
        captionEn: resolveLocalized(item.caption, 'en') || resolveLocalized(item.title, 'en') || item.captionEn || '',
        captionAr: resolveLocalized(item.caption, 'ar') || resolveLocalized(item.title, 'ar') || item.captionAr || '',
      }))
    : (Array.isArray(p.media) ? p.media.map((item, gIdx) => ({
        id: item.id || `g-${gIdx + 1}`,
        mediaAssetId: item.media_asset_id || item.id,
        url: item.display_url || item.url || '',
        captionEn: item.caption_en || '',
        captionAr: item.caption_ar || '',
      })) : []);

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
    views: typeof p.views === 'number' ? p.views : (typeof p.view_count === 'number' ? p.view_count : 0),
    updatedAt: p.updatedAt || (p.updated_at ? p.updated_at.split('T')[0] : new Date().toISOString().split('T')[0]),
    featured: Boolean(p.is_featured ?? p.isFeatured ?? p.featured ?? false),
    categories: Array.isArray(p.categories) ? p.categories : [categoryEn],
    tools: Array.isArray(p.tools) ? p.tools : ['Adobe Illustrator', 'Adobe Photoshop', 'Figma'],
    year: p.year || '2025',
    coverMediaId: p.coverMediaId || p.cover_media_id || null,
    coverImage: p.coverImage || p.cover_url || p.image || '',
    gallery,
    seoTitle: p.seoTitle || `${titleEn} — Brand Identity Case Study`,
    seoDesc: p.seoDesc || descEn || 'Creative graphic design showcase.',
  };
}

/**
 * Formats a timestamp into a human-readable relative time string.
 */
export function formatRelativeTime(dateInput, lang = 'en') {
  if (!dateInput) return lang === 'ar' ? 'الآن' : 'Just now';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return String(dateInput);
  const now = Date.now();
  const diffSec = Math.floor((now - date.getTime()) / 1000);
  if (diffSec < 60) return lang === 'ar' ? 'الآن' : 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return lang === 'ar' ? `منذ ${diffMin} دقيقة` : `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return lang === 'ar' ? `منذ ${diffHours} ساعة` : `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return lang === 'ar' ? `منذ ${diffDays} يوم` : `${diffDays}d ago`;
  return date.toISOString().split('T')[0];
}

/**
 * Transforms a backend audit log record into a formatted activity feed item.
 */
export function formatAuditActivity(log) {
  if (!log) return null;
  const action = log.action || '';
  const details = log.details || {};
  const slug = details.slug || details.title || (details.project_id ? `Project #${details.project_id}` : '');

  let textEn = action;
  let textAr = action;
  let type = 'general';

  if (action === 'auth.login.success') {
    textEn = 'Administrator signed in to Studio Admin';
    textAr = 'تم تسجيل دخول المدير إلى لوحة الإدارة';
    type = 'auth';
  } else if (action === 'auth.logout') {
    textEn = 'Administrator signed out';
    textAr = 'تم تسجيل الخروج من لوحة الإدارة';
    type = 'auth';
  } else if (action === 'auth.login.failed') {
    textEn = `Failed login attempt for ${details.email || log.actor_email || 'user'}`;
    textAr = `محاولة دخول فاشلة للحساب ${details.email || log.actor_email || ''}`;
    type = 'auth';
  } else if (action === 'project.created') {
    textEn = `Created project "${slug || 'New Case Study'}"`;
    textAr = `تم إنشاء المشروع "${slug || 'دراسة حالة جديدة'}"`;
    type = 'publish';
  } else if (action === 'project.updated') {
    textEn = `Updated project "${slug || 'Case Study'}"`;
    textAr = `تم تحديث بيانات المشروع "${slug || 'المشروع'}"`;
    type = 'publish';
  } else if (action === 'project.soft_deleted') {
    textEn = `Moved project "${slug || 'Project'}" to trash`;
    textAr = `تم نقل المشروع "${slug || 'المشروع'}" إلى سلة المحذوفات`;
    type = 'trash';
  } else if (action === 'project.restored') {
    textEn = `Restored project "${slug || 'Project'}" from trash`;
    textAr = `تم استرجاع المشروع "${slug || 'المشروع'}" من سلة المحذوفات`;
    type = 'restore';
  } else if (action === 'project.force_deleted') {
    textEn = `Permanently deleted project "${slug || 'Project'}"`;
    textAr = `تم الحذف النهائي للمشروع "${slug || 'المشروع'}"`;
    type = 'trash';
  } else if (action === 'project.published') {
    textEn = `Published project "${slug || 'Case Study'}"`;
    textAr = `تم نشر المشروع "${slug || 'المشروع'}"`;
    type = 'publish';
  } else if (action === 'project.unpublish') {
    textEn = `Unpublished project "${slug || 'Project'}"`;
    textAr = `تم إلغاء نشر المشروع "${slug || 'المشروع'}"`;
    type = 'draft';
  } else if (action === 'media.uploaded') {
    textEn = `Uploaded media asset "${details.filename || details.original_filename || 'file'}"`;
    textAr = `تم رفع ملف وسائط جديد "${details.filename || details.original_filename || 'ملف'}"`;
    type = 'media';
  } else if (action === 'media.deleted') {
    textEn = 'Deleted media asset from library';
    textAr = 'تم حذف ملف وسائط من المكتبة';
    type = 'media';
  } else if (action === 'settings.updated') {
    textEn = 'Updated portfolio studio settings';
    textAr = 'تم حفظ وتحديث إعدادات الاستوديو';
    type = 'settings';
  } else if (action === 'contact.inquiry') {
    textEn = `Received new client inquiry from ${details.name || details.email || 'Visitor'}`;
    textAr = `تم استلام استفسار جديد من ${details.name || details.email || 'زائر'}`;
    type = 'contact';
  }

  return {
    id: String(log.id || `act-${Date.now()}`),
    type,
    textEn,
    textAr,
    rawDate: log.created_at,
    timeEn: formatRelativeTime(log.created_at, 'en'),
    timeAr: formatRelativeTime(log.created_at, 'ar'),
    time: formatRelativeTime(log.created_at, 'en'),
    actorEmail: log.actor_email,
  };
}
