import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { projectsData } from '../../data/portfolioData.js';
import {
  ADMIN_I18N,
  INITIAL_ADMIN_CATEGORIES,
  INITIAL_ADMIN_PAGES,
  INITIAL_ADMIN_JOURNEY,
  INITIAL_STUDIO_SETTINGS,
} from '../data/adminData.js';
import { resolveLocalized, normalizeAdminProject, formatAuditActivity, formatRelativeTime } from '../utils/localization.js';

const isDemoAuthEnabled =
  typeof import.meta !== 'undefined' &&
  Boolean(import.meta.env?.DEV) &&
  import.meta.env?.VITE_ENABLE_DEMO_AUTH === 'true';

const AdminContext = createContext(null);

function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
  return null;
}

// Helper for standardized API fetch calls with credentials
async function requestApi(endpoint, options = {}) {
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const xsrfToken = getCookie('XSRF-TOKEN');
  const defaultHeaders = {
    Accept: 'application/json',
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {}),
  };

  try {
    const res = await fetch(endpoint, {
      ...options,
      headers: { ...defaultHeaders, ...options.headers },
      credentials: 'include',
    });
    const data = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, status: 0, data: null, error: err };
  }
}

const safeGetItem = (key) => {
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined' && typeof window.localStorage.getItem === 'function') {
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }
  return null;
};

const safeSetItem = (key, val) => {
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined' && typeof window.localStorage.setItem === 'function') {
    try {
      window.localStorage.setItem(key, val);
    } catch (e) {}
  }
};

const safeRemoveItem = (key) => {
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined' && typeof window.localStorage.removeItem === 'function') {
    try {
      window.localStorage.removeItem(key);
    } catch (e) {}
  }
};

export function AdminProvider({ children, initialPath = '/admin/dashboard' }) {
  // Localization: 'en' or 'ar'
  const [lang, setLang] = useState(() => {
    return safeGetItem('studio_admin_lang') || 'en';
  });

  // Current sub-route in Admin (supports both standard pathname and hash routing)
  const [currentRoute, setCurrentRoute] = useState(() => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const hash = window.location.hash;
      if (pathname.startsWith('/admin')) {
        return pathname;
      }
      if (hash.startsWith('#/admin')) {
        return hash.slice(1);
      }
      if (hash.startsWith('#admin')) {
        return '/' + hash.slice(1);
      }
    }
    return initialPath;
  });

  // Authentication state
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const hash = window.location.hash;
      const isLoginPath = pathname.includes('/login') || hash.includes('/login');
      if (isLoginPath) {
        return false;
      }
      const auth = safeGetItem('studio_admin_auth');
      return auth === 'true' || (isDemoAuthEnabled && auth === 'demo');
    }
    return false;
  });

  // Notifications & Toasts
  const [customNotifications, setCustomNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Sync document direction when admin lang changes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }
    safeSetItem('studio_admin_lang', lang);
  }, [lang]);

  // Sync route on popstate and hashchange events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleRouteSync = () => {
      const pathname = window.location.pathname;
      const hash = window.location.hash;
      if (pathname.startsWith('/admin')) {
        setCurrentRoute(pathname);
        if (pathname.includes('/login')) {
          setIsAuthenticated(false);
        }
      } else if (hash.startsWith('#/admin')) {
        const routePart = hash.slice(1);
        setCurrentRoute(routePart);
        if (routePart.includes('/login')) {
          setIsAuthenticated(false);
        }
      }
    };
    window.addEventListener('popstate', handleRouteSync);
    window.addEventListener('hashchange', handleRouteSync);
    return () => {
      window.removeEventListener('popstate', handleRouteSync);
      window.removeEventListener('hashchange', handleRouteSync);
    };
  }, []);

  // Check authentication on initial client mount against real Sanctum session
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isMounted = true;
    async function verifySanctumSession() {
      const res = await requestApi('/api/v1/auth/me');
      if (!isMounted) return;
      if (res.ok && res.data?.data?.user) {
        setUser(res.data.data.user);
        setIsAuthenticated(true);
        safeSetItem('studio_admin_auth', 'true');
      } else {
        const localAuth = safeGetItem('studio_admin_auth');
        if (!isDemoAuthEnabled || localAuth !== 'demo') {
          setUser(null);
          setIsAuthenticated(false);
          safeRemoveItem('studio_admin_auth');
          if (typeof window !== 'undefined') {
            const path = window.location.pathname;
            if (path.startsWith('/admin') && !path.includes('/login')) {
              window.history.replaceState(null, '', '/admin/login');
              setCurrentRoute('/admin/login');
            }
          }
        }
      }
    }
    verifySanctumSession();
    return () => {
      isMounted = false;
    };
  }, []);

  // Dictionary for active language
  const t = useMemo(() => ADMIN_I18N[lang] || ADMIN_I18N.en, [lang]);

  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === 'en' ? 'ar' : 'en'));
  }, []);

  // Projects State
  const [projects, setProjects] = useState(() => {
    const saved = safeGetItem('studio_admin_projects_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p, idx) => normalizeAdminProject(p, idx));
        }
      } catch (e) {
        console.error('Failed to parse saved projects', e);
      }
    }
    return [];
  });

  useEffect(() => {
    safeSetItem('studio_admin_projects_v2', JSON.stringify(projects));
  }, [projects]);

  // Categories State
  const [categories, setCategories] = useState(() => {
    const saved = safeGetItem('studio_admin_categories');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    safeSetItem('studio_admin_categories', JSON.stringify(categories));
  }, [categories]);

  // Media Library State (real backend assets only)
  const [media, setMedia] = useState(() => {
    const saved = safeGetItem('studio_admin_media');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    safeSetItem('studio_admin_media', JSON.stringify(media));
  }, [media]);

  // Page Builder Pages
  const [pages, setPages] = useState(() => {
    const saved = safeGetItem('studio_admin_pages');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_ADMIN_PAGES;
  });

  useEffect(() => {
    safeSetItem('studio_admin_pages', JSON.stringify(pages));
  }, [pages]);

  // Creative Journey Milestones
  const [milestones, setMilestones] = useState(() => {
    const saved = safeGetItem('studio_admin_journey');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_ADMIN_JOURNEY;
  });

  useEffect(() => {
    safeSetItem('studio_admin_journey', JSON.stringify(milestones));
  }, [milestones]);

  // Trash & Recovery (real backend soft-deleted items only)
  const [trash, setTrash] = useState(() => {
    const saved = safeGetItem('studio_admin_trash_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => ({
            ...item,
            titleEn: resolveLocalized(item.titleEn, 'en') || resolveLocalized(item.title, 'en') || 'Deleted Item',
            titleAr: resolveLocalized(item.titleAr, 'ar') || resolveLocalized(item.title, 'ar') || 'عنصر محذوف',
          }));
        }
      } catch (e) {
        console.error('Failed to parse saved trash', e);
      }
    }
    return [];
  });

  useEffect(() => {
    safeSetItem('studio_admin_trash_v2', JSON.stringify(trash));
  }, [trash]);

  // Studio Settings
  const [settings, setSettings] = useState(() => {
    const saved = safeGetItem('studio_admin_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_STUDIO_SETTINGS;
  });

  useEffect(() => {
    safeSetItem('studio_admin_settings', JSON.stringify(settings));
  }, [settings]);

  // Activity Log (real audit logs from MySQL)
  const [activities, setActivities] = useState([]);

  // Inquiries & Contact Messages
  const [inquiries, setInquiries] = useState([]);
  const [inquiriesCount, setInquiriesCount] = useState({ total: 0, unread: 0 });

  // Analytics State
  const [analyticsOverview, setAnalyticsOverview] = useState({
    summary: { total_views: 0, unique_visitors: 0, days_count: 30 },
    daily_trend: [],
    previous_period: { total_views: 0, unique_visitors: 0, views_change_percentage: 0 },
  });
  const [topAnalyticsProjects, setTopAnalyticsProjects] = useState([]);
  const [trafficSources, setTrafficSources] = useState([]);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  // Dynamic notifications derived strictly from verified real database state
  const notifications = useMemo(() => {
    const list = [...customNotifications];
    if (inquiriesCount.unread > 0) {
      list.push({
        id: 'notif-unread-inquiries',
        titleEn: 'New Client Inquiry',
        titleAr: 'رسالة استفسار جديدة',
        descEn: `You have ${inquiriesCount.unread} unread client inquiry.`,
        descAr: `لديك ${inquiriesCount.unread} رسائل استفسار جديدة من العملاء.`,
        time: 'Recent',
        unread: true,
      });
    }
    if (trash.length > 0) {
      list.push({
        id: 'notif-trash-staged',
        titleEn: 'Trash Retention Notice',
        titleAr: 'عناصر بسلة المحذوفات',
        descEn: `${trash.length} project(s) currently staged in trash.`,
        descAr: `يوجد ${trash.length} مشروع في سلة المحذوفات.`,
        time: 'Active',
        unread: false,
      });
    }
    const draftProjects = projects.filter((p) => p.status === 'draft');
    if (draftProjects.length > 0) {
      list.push({
        id: 'notif-drafts-review',
        titleEn: 'Drafts Ready for Review',
        titleAr: 'مسودات قيد المراجعة',
        descEn: `${draftProjects.length} project(s) currently saved as draft.`,
        descAr: `يوجد ${draftProjects.length} مشروع محفوظ كمسودة.`,
        time: 'Active',
        unread: false,
      });
    }
    return list;
  }, [customNotifications, inquiriesCount.unread, trash.length, projects]);

  // Admin Navigation Helper
  const navigateAdmin = useCallback((path) => {
    const targetPath = (!isAuthenticated && path !== '/admin/login') ? '/admin/login' : path;
    if (typeof window !== 'undefined') {
      try {
        window.history.pushState({ route: targetPath }, '', targetPath);
      } catch (e) {
        window.location.hash = targetPath;
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setCurrentRoute(targetPath);
  }, [isAuthenticated]);

  // Fetch real projects from Laravel API if available
  const fetchProjects = useCallback(async () => {
    const res = await requestApi('/api/v1/admin/projects');
    if (res.ok && res.data?.data?.projects?.data) {
      const mapped = res.data.data.projects.data.map((p, idx) => {
        const enTrans = p.translations?.find((t) => t.locale === 'en') || {};
        const arTrans = p.translations?.find((t) => t.locale === 'ar') || {};
        const cat = p.categories?.[0];
        return normalizeAdminProject(
          {
            id: String(p.id),
            slug: p.slug,
            titleEn: enTrans.title || p.slug,
            titleAr: arTrans.title || enTrans.title || p.slug,
            categoryEn: cat?.slug || 'Branding',
            categoryAr: cat?.slug || 'هوية بصرية',
            status: p.status || 'published',
            featured: Boolean(p.is_featured),
            year: String(p.year || new Date().getFullYear()),
            clientEn: p.client || '',
            clientAr: p.client || '',
            descEn: enTrans.description || enTrans.summary || '',
            descAr: arTrans.description || arTrans.summary || '',
            coverImage: p.cover_url || p.coverMedia?.url || '',
            views: p.view_count || 0,
            updatedAt: p.updated_at ? p.updated_at.split('T')[0] : new Date().toISOString().split('T')[0],
            tools: (p.tools || []).map((t) => t.name || t.slug).join(', ') || 'Illustrator, Photoshop',
            gallery: p.gallery || [],
          },
          idx
        );
      });
      setProjects(mapped);
      return mapped;
    }
    return [];
  }, []);

  // Fetch real media from Laravel API if available
  const fetchMedia = useCallback(async () => {
    const res = await requestApi('/api/v1/admin/media');
    if (res.ok && res.data?.data?.assets?.data) {
      const mapped = res.data.data.assets.data.map((m) => ({
        id: String(m.id),
        name: m.original_filename || m.filename,
        url: m.url,
        type: m.mime_type || 'image/png',
        size: m.human_readable_size || `${Math.round((m.file_size_bytes || 0) / 1024)} KB`,
        dimensions: m.width && m.height ? `${m.width} × ${m.height}` : '2560 × 1440',
        altEn: m.alt_en || m.original_filename,
        altAr: m.alt_ar || m.original_filename,
        category: 'Uploads',
        uploadedOn: m.created_at ? m.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
      }));
      setMedia(mapped);
      return mapped;
    }
    return [];
  }, []);

  // Fetch real categories from Laravel API if available
  const fetchCategories = useCallback(async () => {
    const res = await requestApi('/api/v1/admin/categories');
    if (res.ok && res.data?.data?.categories) {
      const mapped = res.data.data.categories.map((c, idx) => {
        const enTrans = c.translations?.find((t) => t.locale === 'en') || {};
        const arTrans = c.translations?.find((t) => t.locale === 'ar') || {};
        return {
          id: String(c.id),
          nameEn: enTrans.name || c.slug,
          nameAr: arTrans.name || enTrans.name || c.slug,
          slug: c.slug,
          count: c.projects_count || 0,
          order: c.sort_order || idx + 1,
          status: c.is_active ? 'active' : 'inactive',
        };
      });
      setCategories(mapped);
      return mapped;
    }
    return [];
  }, []);

  // Fetch real creative journey milestones from Laravel API if available
  const fetchMilestones = useCallback(async () => {
    const res = await requestApi('/api/v1/admin/journey');
    if (res.ok && Array.isArray(res.data?.data?.milestones)) {
      setMilestones(res.data.data.milestones);
      return res.data.data.milestones;
    }
    return null;
  }, []);

  // Fetch studio site settings from Laravel API
  const fetchSettings = useCallback(async () => {
    const res = await requestApi('/api/v1/admin/settings');
    if (res.ok && res.data?.data?.settings) {
      setSettings(res.data.data.settings);
      return res.data.data.settings;
    }
    return null;
  }, []);

  // Fetch real soft-deleted projects from Laravel API
  const fetchTrash = useCallback(async () => {
    const res = await requestApi('/api/v1/admin/projects/trash?per_page=50');
    if (res.ok && res.data?.data?.projects?.data) {
      const mapped = res.data.data.projects.data.map((p) => {
        const enTrans = p.translations?.find((t) => t.locale === 'en') || {};
        const arTrans = p.translations?.find((t) => t.locale === 'ar') || {};
        const cat = p.categories?.[0];
        const deletedAt = p.deleted_at ? new Date(p.deleted_at).getTime() : Date.now();
        const daysElapsed = Math.floor((Date.now() - deletedAt) / (1000 * 60 * 60 * 24));
        const daysRemaining = Math.max(0, 30 - daysElapsed);

        return {
          id: String(p.id),
          originalId: p.id,
          itemType: 'project',
          title: { en: enTrans.title || p.slug, ar: arTrans.title || enTrans.title || p.slug },
          titleEn: enTrans.title || p.slug,
          titleAr: arTrans.title || enTrans.title || p.slug,
          category: cat?.slug || 'Branding',
          coverImage: p.cover_url || p.coverMedia?.url || '',
          deletedOn: p.deleted_at ? p.deleted_at.split('T')[0] : new Date().toISOString().split('T')[0],
          daysRemaining,
          backupData: p,
        };
      });
      setTrash(mapped);
      return mapped;
    }
    return [];
  }, []);

  // Fetch real audit logs from Laravel API
  const fetchActivities = useCallback(async () => {
    const res = await requestApi('/api/v1/admin/audit-logs?per_page=20');
    if (res.ok && Array.isArray(res.data?.data?.logs)) {
      const mapped = res.data.data.logs
        .map((log) => formatAuditActivity(log))
        .filter(Boolean);
      setActivities(mapped);
      return mapped;
    }
    return [];
  }, []);

  // Fetch real client inquiries from Laravel API
  const fetchInquiries = useCallback(async () => {
    const res = await requestApi('/api/v1/admin/inquiries?per_page=50');
    if (res.ok && res.data?.data) {
      const items = res.data.data.data || res.data.data;
      const list = Array.isArray(items) ? items : [];
      const unread = list.filter((i) => !i.is_read).length;
      setInquiries(list);
      setInquiriesCount({ total: res.data.data.total ?? list.length, unread });
      return list;
    }
    return [];
  }, []);

  // Fetch real analytics (overview, top projects, traffic sources)
  const fetchAnalytics = useCallback(async (range = '30d') => {
    setIsLoadingAnalytics(true);
    try {
      const apiRange = range === '1y' ? '90d' : range;
      const [overviewRes, topRes, sourcesRes] = await Promise.all([
        requestApi(`/api/v1/admin/analytics/overview?range=${apiRange}`),
        requestApi(`/api/v1/admin/analytics/top-projects?range=${apiRange}`),
        requestApi(`/api/v1/admin/analytics/traffic-sources?range=${apiRange}`),
      ]);

      if (overviewRes.ok && overviewRes.data?.data) {
        setAnalyticsOverview(overviewRes.data.data);
      }
      if (topRes.ok && Array.isArray(topRes.data?.data?.projects)) {
        setTopAnalyticsProjects(topRes.data.data.projects);
      }
      if (sourcesRes.ok && sourcesRes.data?.data) {
        const cats = sourcesRes.data.data.categories || [];
        setTrafficSources(cats);
      }
    } finally {
      setIsLoadingAnalytics(false);
    }
  }, []);

  // On mount or auth change, sync backend data
  useEffect(() => {
    fetchProjects();
    fetchCategories();
    fetchMilestones();
    fetchSettings();
    fetchAnalytics('30d');
    if (isAuthenticated) {
      fetchMedia();
      fetchTrash();
      fetchActivities();
      fetchInquiries();
    }
  }, [
    isAuthenticated,
    fetchProjects,
    fetchCategories,
    fetchMilestones,
    fetchSettings,
    fetchMedia,
    fetchTrash,
    fetchActivities,
    fetchInquiries,
    fetchAnalytics,
  ]);

  // Authentication Actions
  const login = useCallback(
    async (email, password) => {
      setIsLoadingAuth(true);
      try {
        if (typeof fetch !== 'undefined') {
          await fetch('/sanctum/csrf-cookie', { credentials: 'include' }).catch(() => {});
        }

        const res = await requestApi('/api/v1/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });

        if (res.ok && res.data?.status === 'success') {
          const authedUser = res.data.data?.user || { email, name: email.split('@')[0] };
          setUser(authedUser);
          setIsAuthenticated(true);
          safeSetItem('studio_admin_auth', 'true');
          addToast(lang === 'ar' ? 'تم تسجيل الدخول بنجاح إلى لوحة الإدارة' : 'Signed in successfully to Studio Admin', 'success');
          navigateAdmin('/admin/dashboard');
          return { success: true, user: authedUser };
        } else {
          let errorMsg = res.data?.message;
          if (!errorMsg) {
            if (res.status >= 500 || res.status === 0) {
              errorMsg =
                lang === 'ar'
                  ? 'تعذر الاتصال بالخادم الخلفي. يرجى التأكد من تشغيل خادم Laravel.'
                  : 'Unable to reach backend server. Please verify the Laravel server is running.';
            } else if (res.status === 419) {
              errorMsg =
                lang === 'ar'
                  ? 'انتهت صلاحية جلسة الأمان (CSRF). يرجى تحديث الصفحة والمحاولة مجدداً.'
                  : 'Security session expired (CSRF). Please refresh the page and try again.';
            } else {
              errorMsg =
                lang === 'ar'
                  ? 'بيانات الاعتماد غير صالحة. يرجى التحقق من البريد وكلمة المرور.'
                  : 'Invalid credentials. Please check email and password.';
            }
          }
          return { success: false, error: errorMsg };
        }
      } catch (err) {
        return { success: false, error: err.message || 'Network error during login' };
      } finally {
        setIsLoadingAuth(false);
      }
    },
    [addToast, lang, navigateAdmin]
  );

  const loginDemo = useCallback(() => {
    if (!isDemoAuthEnabled) {
      addToast(
        lang === 'ar' ? 'وضع الدخول التجريبي معطل في بيئة الإنتاج' : 'Demo authentication is disabled in production',
        'error'
      );
      return false;
    }
    const demoUser = { id: 1, name: 'Admin Demo', email: 'demo@mohammed-portfolio.test' };
    setUser(demoUser);
    setIsAuthenticated(true);
    safeSetItem('studio_admin_auth', 'demo');
    addToast(lang === 'ar' ? 'تم الدخول إلى وضع النموذج التجريبي للاستوديو' : 'Signed in successfully to Demo Mode', 'success');
    navigateAdmin('/admin/dashboard');
    return true;
  }, [addToast, lang, navigateAdmin]);

  const logout = useCallback(async () => {
    try {
      await requestApi('/api/v1/auth/logout', { method: 'POST' });
    } catch (e) {
      // Ignore network errors on logout
    }
    setUser(null);
    setIsAuthenticated(false);
    safeSetItem('studio_admin_auth', 'false');
    addToast(lang === 'ar' ? 'تم تسجيل الخروج بنجاح' : 'Signed out successfully', 'info');
    navigateAdmin('/admin/login');
  }, [addToast, lang, navigateAdmin]);

  // Project Actions
  const addProject = useCallback(
    async (newProj) => {
      const slug =
        newProj.slug ||
        (newProj.titleEn || newProj.title || 'project')
          .toLowerCase()
          .replace(/[^a-z0-9-]+/g, '-')
          .replace(/^-|-$/g, '') ||
        `proj-${Date.now()}`;

      // Find matching category ID from categories state if slugs/names provided
      const matchedCategoryIds = [];
      if (Array.isArray(newProj.categories) && categories.length > 0) {
        newProj.categories.forEach((cName) => {
          const found = categories.find(
            (cat) => cat.nameEn === cName || cat.slug === cName || String(cat.id) === String(cName)
          );
          if (found && /^\d+$/.test(String(found.id))) {
            matchedCategoryIds.push(parseInt(found.id, 10));
          }
        });
      }

      const payload = {
        slug,
        status: newProj.status || 'published',
        is_featured: Boolean(newProj.featured),
        year: parseInt(newProj.year, 10) || new Date().getFullYear(),
        client: newProj.clientEn || newProj.client || '',
        cover_media_id: newProj.coverMediaId || null,
        category_ids: matchedCategoryIds.length > 0 ? matchedCategoryIds : undefined,
        translations: [
          {
            locale: 'en',
            title: newProj.titleEn || newProj.title || 'Untitled Project',
            summary: newProj.descEn || newProj.summary || newProj.subtitle?.en || '',
            description: newProj.descEn || newProj.description?.en || newProj.summary || '',
            seo_title: newProj.seoTitle || newProj.titleEn || newProj.title || 'Project',
            seo_description: newProj.seoDesc || newProj.descEn || '',
          },
          {
            locale: 'ar',
            title: newProj.titleAr || newProj.titleEn || newProj.title || 'مشروع جديد',
            summary: newProj.descAr || newProj.descEn || newProj.summary || newProj.subtitle?.ar || '',
            description: newProj.descAr || newProj.descEn || newProj.description?.ar || newProj.summary || '',
            seo_title: newProj.seoTitle || newProj.titleAr || newProj.titleEn || 'مشروع',
            seo_description: newProj.seoDesc || newProj.descAr || '',
          },
        ],
      };

      const res = await requestApi('/api/v1/admin/projects', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.ok && res.data?.data?.project) {
        const backendProj = res.data.data.project;
        const normalized = normalizeAdminProject(
          {
            ...newProj,
            id: String(backendProj.id),
            slug: backendProj.slug,
            status: backendProj.status,
            coverImage: newProj.coverImage || backendProj.cover_url || '',
          },
          0
        );

        setProjects((prev) => [normalized, ...prev.filter((p) => p.id !== normalized.id)]);
        setActivities((prev) => [
          {
            id: `act-${Date.now()}`,
            type: 'publish',
            textEn: `Created project "${normalized.titleEn}"`,
            textAr: `تم إنشاء المشروع "${normalized.titleAr}"`,
            time: 'Just now',
          },
          ...prev,
        ]);
        addToast(lang === 'ar' ? 'تم إنشاء المشروع بنجاح' : 'Project created successfully', 'success');
        return normalized;
      } else {
        const errMsg = res.data?.message || (lang === 'ar' ? 'فشل إنشاء المشروع' : 'Failed to create project');
        addToast(errMsg, 'error');
        const localNormalized = normalizeAdminProject(newProj, 0);
        setProjects((prev) => [localNormalized, ...prev]);
        return localNormalized;
      }
    },
    [addToast, lang, categories]
  );

  const updateProject = useCallback(
    async (id, updatedFields) => {
      let updatedTitleEn = '';
      let updatedTitleAr = '';

      setProjects((prev) =>
        prev.map((p) => {
          if (p.id === id) {
            const merged = normalizeAdminProject({
              ...p,
              ...updatedFields,
              updatedAt: new Date().toISOString().split('T')[0],
            });
            updatedTitleEn = merged.titleEn;
            updatedTitleAr = merged.titleAr;
            return merged;
          }
          return p;
        })
      );

      // Async backend persistence if id is numeric
      if (/^\d+$/.test(String(id))) {
        const payload = {
          slug: updatedFields.slug,
          status: updatedFields.status,
          is_featured: updatedFields.featured !== undefined ? Boolean(updatedFields.featured) : undefined,
          year: updatedFields.year ? parseInt(updatedFields.year, 10) : undefined,
          client: updatedFields.clientEn || updatedFields.client,
        };

        if (updatedFields.titleEn || updatedFields.titleAr) {
          payload.translations = [
            {
              locale: 'en',
              title: updatedFields.titleEn || updatedFields.title,
              summary: updatedFields.descEn || '',
              description: updatedFields.descEn || '',
            },
            {
              locale: 'ar',
              title: updatedFields.titleAr || updatedFields.titleEn,
              summary: updatedFields.descAr || updatedFields.descEn || '',
              description: updatedFields.descAr || updatedFields.descEn || '',
            },
          ].filter((t) => t.title);
        }

        await requestApi(`/api/v1/admin/projects/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      }

      setActivities((prev) => [
        {
          id: `act-${Date.now()}`,
          type: 'publish',
          textEn: `Updated project "${updatedTitleEn || id}"`,
          textAr: `تم تحديث بيانات المشروع "${updatedTitleAr || id}"`,
          time: 'Just now',
        },
        ...prev,
      ]);
      addToast(lang === 'ar' ? 'تم تحديث المشروع بنجاح' : 'Project updated successfully', 'success');
    },
    [addToast, lang]
  );

  const deleteProject = useCallback(
    async (id) => {
      const projectToDelete = projects.find((p) => p.id === id);
      if (!projectToDelete) return;

      const titleEn = resolveLocalized(projectToDelete.title, 'en') || projectToDelete.titleEn || 'Project';
      const titleAr = resolveLocalized(projectToDelete.title, 'ar') || projectToDelete.titleAr || titleEn;
      const categoryName = resolveLocalized(projectToDelete.category, 'en') || projectToDelete.categoryEn || 'General';

      // Remove from projects
      setProjects((prev) => prev.filter((p) => p.id !== id));

      // Add to trash with 30-day recovery window
      setTrash((prev) => [
        {
          id: `trash-${Date.now()}`,
          itemType: 'project',
          titleEn,
          titleAr,
          originalId: projectToDelete.id,
          deletedOn: new Date().toISOString().split('T')[0],
          daysRemaining: 30,
          category: categoryName,
          coverImage: projectToDelete.coverImage || projectToDelete.image,
          backupData: projectToDelete,
        },
        ...prev,
      ]);

      // Async backend delete
      if (/^\d+$/.test(String(id))) {
        await requestApi(`/api/v1/admin/projects/${id}`, { method: 'DELETE' });
        fetchTrash();
        fetchActivities();
      }

      addToast(lang === 'ar' ? 'تم نقل المشروع إلى سلة المحذوفات' : 'Project moved to Trash (restorable for 30 days)', 'info');
    },
    [projects, addToast, lang, fetchTrash, fetchActivities]
  );

  const toggleFeaturedProject = useCallback(
    (id) => {
      let isNowFeatured = false;
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id === id) {
            isNowFeatured = !p.featured;
            return { ...p, featured: isNowFeatured };
          }
          return p;
        })
      );

      if (/^\d+$/.test(String(id))) {
        requestApi(`/api/v1/admin/projects/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ is_featured: isNowFeatured }),
        }).catch(() => {});
      }

      addToast(lang === 'ar' ? 'تم تحديث حالة تمييز المشروع' : 'Featured status updated', 'success');
    },
    [addToast, lang]
  );

  // Category Actions
  const addCategory = useCallback(
    async (cat) => {
      const slug = cat.slug || (cat.nameEn || 'category').toLowerCase().replace(/\s+/g, '-');
      const res = await requestApi('/api/v1/admin/categories', {
        method: 'POST',
        body: JSON.stringify({
          slug,
          sort_order: categories.length + 1,
          is_active: true,
          translations: [
            { locale: 'en', name: cat.nameEn || 'Category' },
            { locale: 'ar', name: cat.nameAr || cat.nameEn || 'تصنيف' },
          ],
        }),
      });

      const newCat = {
        id: res.ok && res.data?.data?.category ? String(res.data.data.category.id) : `cat-${Date.now()}`,
        count: 0,
        order: categories.length + 1,
        status: 'active',
        nameEn: cat.nameEn || 'New Category',
        nameAr: cat.nameAr || 'تصنيف جديد',
        slug,
      };

      setCategories((prev) => [...prev, newCat]);
      addToast(lang === 'ar' ? 'تم إضافة التصنيف الجديد' : 'New category added', 'success');
      return newCat;
    },
    [categories.length, addToast, lang]
  );

  const updateCategory = useCallback(
    async (id, updated) => {
      setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));

      if (/^\d+$/.test(String(id))) {
        requestApi(`/api/v1/admin/categories/${id}`, {
          method: 'PUT',
          body: JSON.stringify({
            slug: updated.slug,
            sort_order: updated.order,
            is_active: updated.status === 'active',
          }),
        }).catch(() => {});
      }

      addToast(lang === 'ar' ? 'تم حفظ تعديلات التصنيف' : 'Category updated', 'success');
    },
    [addToast, lang]
  );

  const deleteCategory = useCallback(
    async (id) => {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      if (/^\d+$/.test(String(id))) {
        requestApi(`/api/v1/admin/categories/${id}`, { method: 'DELETE' }).catch(() => {});
      }
      addToast(lang === 'ar' ? 'تم حذف التصنيف' : 'Category removed', 'info');
    },
    [addToast, lang]
  );

  // Media Actions (Upload and Delete with real Laravel API support)
  const addMedia = useCallback(
    (newMedia) => {
      const item = {
        id: `med-${Date.now()}`,
        uploadedOn: new Date().toISOString().split('T')[0],
        ...newMedia,
      };
      setMedia((prev) => [item, ...prev]);
      addToast(lang === 'ar' ? 'تم إضافة الأصل إلى مكتبة الوسائط' : 'Asset added to Media Library', 'success');
      return item;
    },
    [addToast, lang]
  );

  const uploadMediaFile = useCallback(
    async (file, altText = '') => {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('alt_en', altText);
        formData.append('alt_ar', altText);

        const res = await requestApi('/api/v1/admin/media/upload', {
          method: 'POST',
          body: formData,
        });

        if (res.ok && res.data?.data?.asset) {
          const asset = res.data.data.asset;
          const newItem = {
            id: String(asset.id),
            name: asset.original_filename || file.name,
            url: asset.url || URL.createObjectURL(file),
            type: asset.mime_type || file.type || 'image/png',
            size: `${((asset.file_size_bytes || file.size) / (1024 * 1024)).toFixed(1)} MB`,
            dimensions: asset.width && asset.height ? `${asset.width} × ${asset.height}` : '2560 × 1440',
            altEn: asset.alt_en || altText || file.name,
            altAr: asset.alt_ar || altText || file.name,
            category: 'Uploads',
            uploadedOn: new Date().toISOString().split('T')[0],
          };
          setMedia((prev) => [newItem, ...prev]);
          addToast(lang === 'ar' ? 'تم رفع الأصل بنجاح إلى مكتبة الوسائط' : 'Asset uploaded successfully to Media Library', 'success');
          return newItem;
        }
      } catch (e) {
        console.warn('Real upload failed, using local asset fallback', e);
      }

      // Local asset fallback
      const localUrl = typeof URL !== 'undefined' && URL.createObjectURL ? URL.createObjectURL(file) : '/assets/aistudio/Selected_Work__Noya_Skincare_Portfolio_6434c76f.png';
      const fallbackItem = {
        id: `med-${Date.now()}`,
        name: file.name,
        url: localUrl,
        type: file.type || 'image/png',
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        dimensions: '2560 × 1440',
        altEn: altText || file.name.replace(/\.[^/.]+$/, ''),
        altAr: altText || file.name.replace(/\.[^/.]+$/, ''),
        category: 'Uploads',
        uploadedOn: new Date().toISOString().split('T')[0],
      };
      setMedia((prev) => [fallbackItem, ...prev]);
      addToast(lang === 'ar' ? 'تم حفظ الأصل محلياً' : 'Asset saved to local library', 'info');
      return fallbackItem;
    },
    [addToast, lang]
  );

  const deleteMedia = useCallback(
    async (id) => {
      setMedia((prev) => prev.filter((m) => m.id !== id));
      if (/^\d+$/.test(String(id))) {
        requestApi(`/api/v1/admin/media/${id}`, { method: 'DELETE' }).catch(() => {});
      }
      addToast(lang === 'ar' ? 'تم حذف الملف من المكتبة' : 'Media asset deleted', 'info');
    },
    [addToast, lang]
  );

  // Trash Actions
  const restoreTrashItem = useCallback(
    async (trashId) => {
      const item = trash.find((t) => t.id === trashId);
      if (!item) return;

      if (item.itemType === 'project' && item.backupData) {
        setProjects((prev) => [normalizeAdminProject(item.backupData), ...prev]);
      }
      setTrash((prev) => prev.filter((t) => t.id !== trashId));

      const numericId = item.originalId || item.id;
      if (numericId && /^\d+$/.test(String(numericId))) {
        await requestApi(`/api/v1/admin/projects/${numericId}/restore`, { method: 'POST' }).catch(() => {});
        fetchProjects();
        fetchTrash();
        fetchActivities();
      }

      addToast(lang === 'ar' ? 'تم استرجاع العنصر إلى المشاريع النشطة' : 'Item restored successfully', 'success');
    },
    [trash, addToast, lang, fetchProjects, fetchTrash, fetchActivities]
  );

  const purgeTrashItem = useCallback(
    async (trashId) => {
      const item = trash.find((t) => t.id === trashId);
      setTrash((prev) => prev.filter((t) => t.id !== trashId));

      const numericId = item?.originalId || item?.id;
      if (numericId && /^\d+$/.test(String(numericId))) {
        await requestApi(`/api/v1/admin/projects/${numericId}/force`, { method: 'DELETE' }).catch(() => {});
        fetchTrash();
        fetchActivities();
      }

      addToast(lang === 'ar' ? 'تم حذف العنصر نهائياً' : 'Item permanently deleted', 'info');
    },
    [trash, addToast, lang, fetchTrash, fetchActivities]
  );

  const emptyTrash = useCallback(async () => {
    for (const item of trash) {
      const numericId = item.originalId || item.id;
      if (numericId && /^\d+$/.test(String(numericId))) {
        requestApi(`/api/v1/admin/projects/${numericId}/force`, { method: 'DELETE' }).catch(() => {});
      }
    }
    setTrash([]);
    fetchActivities();
    addToast(lang === 'ar' ? 'تم تفريغ سلة المحذوفات بالكامل' : 'Trash emptied completely', 'info');
  }, [trash, addToast, lang, fetchActivities]);

  // Creative Journey Actions
  const addMilestone = useCallback(
    async (milestoneData) => {
      const res = await requestApi('/api/v1/admin/journey', {
        method: 'POST',
        body: JSON.stringify(milestoneData),
      });

      const newMilestone =
        res.ok && res.data?.data?.milestone
          ? res.data.data.milestone
          : {
              ...milestoneData,
              id: Date.now(),
              sort_order: milestones.length + 1,
              is_visible: milestoneData.is_visible ?? true,
              is_published: milestoneData.is_published ?? true,
            };

      setMilestones((prev) => [...prev, newMilestone]);
      addToast(
        lang === 'ar' ? 'تمت إضافة المحطة المهنية بنجاح' : 'Milestone added successfully',
        'success'
      );
      return newMilestone;
    },
    [addToast, lang, milestones.length]
  );

  const updateMilestone = useCallback(
    async (id, fields) => {
      setMilestones((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...fields } : m))
      );

      if (/^\d+$/.test(String(id))) {
        requestApi(`/api/v1/admin/journey/${id}`, {
          method: 'PUT',
          body: JSON.stringify(fields),
        }).catch(() => {});
      }

      addToast(
        lang === 'ar' ? 'تم تحديث بيانات المحطة' : 'Milestone updated successfully',
        'success'
      );
    },
    [addToast, lang]
  );

  const deleteMilestone = useCallback(
    async (id) => {
      setMilestones((prev) => prev.filter((m) => m.id !== id));

      if (/^\d+$/.test(String(id))) {
        requestApi(`/api/v1/admin/journey/${id}`, {
          method: 'DELETE',
        }).catch(() => {});
      }

      addToast(
        lang === 'ar' ? 'تم حذف المحطة المهنية' : 'Milestone deleted',
        'info'
      );
    },
    [addToast, lang]
  );

  const reorderMilestones = useCallback(
    async (orderedIds) => {
      const orderMap = new Map(orderedIds.map((id, idx) => [id, idx + 1]));
      setMilestones((prev) => {
        const updated = prev.map((m) => ({
          ...m,
          sort_order: orderMap.get(m.id) ?? m.sort_order,
        }));
        return updated.sort((a, b) => a.sort_order - b.sort_order);
      });

      requestApi('/api/v1/admin/journey/reorder', {
        method: 'POST',
        body: JSON.stringify({ order: orderedIds }),
      }).catch(() => {});
    },
    []
  );

  const togglePublishMilestone = useCallback(
    async (id) => {
      let newState = false;
      setMilestones((prev) =>
        prev.map((m) => {
          if (m.id === id) {
            newState = !m.is_published;
            return { ...m, is_published: newState };
          }
          return m;
        })
      );

      if (/^\d+$/.test(String(id))) {
        requestApi(`/api/v1/admin/journey/${id}/publish`, {
          method: 'POST',
          body: JSON.stringify({ is_published: newState }),
        }).catch(() => {});
      }

      addToast(
        lang === 'ar'
          ? (newState ? 'تم نشر المحطة' : 'تم نقل المحطة إلى المسودة')
          : (newState ? 'Milestone published' : 'Milestone moved to draft'),
        'success'
      );
    },
    [addToast, lang]
  );

  // Settings Actions
  const updateStudioSettings = useCallback(
    async (newSettings) => {
      setSettings((prev) => ({
        ...prev,
        ...newSettings,
      }));

      const res = await requestApi('/api/v1/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(newSettings),
      });

      if (res.ok && res.data?.data?.settings) {
        setSettings(res.data.data.settings);
      }

      fetchActivities();
      addToast(lang === 'ar' ? 'تم حفظ إعدادات الاستوديو بنجاح' : 'Studio settings saved', 'success');
    },
    [addToast, lang, fetchActivities]
  );

  // Helper bound to current language
  const getLocalized = useCallback(
    (val, fallback = '') => {
      return resolveLocalized(val, lang, fallback);
    },
    [lang]
  );

  const value = {
    lang,
    setLang,
    toggleLang,
    t,
    getLocalized,
    resolveLocalized,
    user,
    isAuthenticated,
    isLoadingAuth,
    isDemoAuthEnabled,
    login,
    loginDemo,
    logout,
    currentRoute,
    navigateAdmin,
    projects,
    fetchProjects,
    addProject,
    updateProject,
    deleteProject,
    toggleFeaturedProject,
    categories,
    fetchCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    media,
    fetchMedia,
    addMedia,
    uploadMediaFile,
    deleteMedia,
    pages,
    setPages,
    milestones,
    fetchMilestones,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    reorderMilestones,
    togglePublishMilestone,
    trash,
    fetchTrash,
    restoreTrashItem,
    purgeTrashItem,
    emptyTrash,
    settings,
    fetchSettings,
    updateStudioSettings,
    activities,
    fetchActivities,
    inquiries,
    inquiriesCount,
    fetchInquiries,
    analyticsOverview,
    topAnalyticsProjects,
    trafficSources,
    isLoadingAnalytics,
    fetchAnalytics,
    notifications,
    setCustomNotifications,
    toasts,
    addToast,
    removeToast,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
