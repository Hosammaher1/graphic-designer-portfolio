import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { projectsData } from '../../data/portfolioData.js';
import {
  ADMIN_I18N,
  INITIAL_ADMIN_CATEGORIES,
  INITIAL_ADMIN_MEDIA,
  INITIAL_ADMIN_PAGES,
  INITIAL_ADMIN_TRASH,
  INITIAL_ACTIVITY_LOG,
  INITIAL_STUDIO_SETTINGS,
} from '../data/adminData.js';
import { resolveLocalized, normalizeAdminProject } from '../utils/localization.js';

const AdminContext = createContext(null);

// Helper for standardized API fetch calls with credentials
async function requestApi(endpoint, options = {}) {
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const defaultHeaders = {
    Accept: 'application/json',
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
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

export function AdminProvider({ children, initialPath = '/admin/dashboard' }) {
  // Localization: 'en' or 'ar'
  const [lang, setLang] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('studio_admin_lang') || 'en';
    }
    return 'en';
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
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem('studio_admin_auth') !== 'false';
      }
    }
    return true;
  });

  // Notifications & Toasts
  const [notifications, setNotifications] = useState([
    { id: 'notif-1', titleEn: 'New Portfolio View Surge', titleAr: 'ارتفاع في زيارات المعرض', descEn: '+42% visitors from Behance featured feed today.', descAr: '+42% زوار من صفحة الاستكشاف في بيهانس اليوم.', time: '10m ago', unread: true },
    { id: 'notif-2', titleEn: 'Draft Ready for Review', titleAr: 'مسودة جاهزة للمراجعة', descEn: 'Aura Minimalist editorial layout is saved as draft.', descAr: 'تم حفظ مسودة مشروع أورا مينيمالست.', time: '2h ago', unread: true },
    { id: 'notif-3', titleEn: 'Trash Reminder', titleAr: 'تذكير بسلة المحذوفات', descEn: '1 project will be purged in 6 days.', descAr: 'مشروع واحد سينتهي موعد استرجاعه خلال 6 أيام.', time: '1d ago', unread: false },
  ]);
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
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('studio_admin_lang', lang);
    }
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
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('studio_admin_projects_v2');
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
    }
    return projectsData.map((p, idx) => normalizeAdminProject(p, idx));
  });

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('studio_admin_projects_v2', JSON.stringify(projects));
    }
  }, [projects]);

  // Categories State
  const [categories, setCategories] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('studio_admin_categories');
      if (saved) return JSON.parse(saved);
    }
    return INITIAL_ADMIN_CATEGORIES;
  });

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('studio_admin_categories', JSON.stringify(categories));
    }
  }, [categories]);

  // Media Library State
  const [media, setMedia] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('studio_admin_media');
      if (saved) return JSON.parse(saved);
    }
    return INITIAL_ADMIN_MEDIA;
  });

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('studio_admin_media', JSON.stringify(media));
    }
  }, [media]);

  // Page Builder Pages
  const [pages, setPages] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('studio_admin_pages');
      if (saved) return JSON.parse(saved);
    }
    return INITIAL_ADMIN_PAGES;
  });

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('studio_admin_pages', JSON.stringify(pages));
    }
  }, [pages]);

  // Trash & Recovery
  const [trash, setTrash] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('studio_admin_trash_v2');
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
    }
    return INITIAL_ADMIN_TRASH.map((item) => ({
      ...item,
      titleEn: resolveLocalized(item.titleEn, 'en') || 'Deleted Item',
      titleAr: resolveLocalized(item.titleAr, 'ar') || 'عنصر محذوف',
    }));
  });

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('studio_admin_trash_v2', JSON.stringify(trash));
    }
  }, [trash]);

  // Studio Settings
  const [settings, setSettings] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('studio_admin_settings');
      if (saved) return JSON.parse(saved);
    }
    return INITIAL_STUDIO_SETTINGS;
  });

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('studio_admin_settings', JSON.stringify(settings));
    }
  }, [settings]);

  // Activity Log
  const [activities, setActivities] = useState(INITIAL_ACTIVITY_LOG);

  // Admin Navigation Helper
  const navigateAdmin = useCallback((path) => {
    if (typeof window !== 'undefined') {
      try {
        window.history.pushState({ route: path }, '', path);
      } catch (e) {
        window.location.hash = path;
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setCurrentRoute(path);
  }, []);

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
            coverImage: p.cover_url || p.coverMedia?.url || '/assets/aistudio/Selected_Work__Noya_Skincare_Portfolio_6434c76f.png',
            views: p.view_count || 1200,
            updatedAt: p.updated_at ? p.updated_at.split('T')[0] : new Date().toISOString().split('T')[0],
            tools: (p.tools || []).map((t) => t.name || t.slug).join(', ') || 'Illustrator, Photoshop',
            gallery: p.gallery || [],
          },
          idx
        );
      });
      if (mapped.length > 0) {
        setProjects(mapped);
        return mapped;
      }
    }
    return null;
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
      if (mapped.length > 0) {
        setMedia(mapped);
        return mapped;
      }
    }
    return null;
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
      if (mapped.length > 0) {
        setCategories(mapped);
        return mapped;
      }
    }
    return null;
  }, []);

  // On mount if authenticated, attempt to sync backend data
  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
      fetchMedia();
      fetchCategories();
    }
  }, [isAuthenticated, fetchProjects, fetchMedia, fetchCategories]);

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
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('studio_admin_auth', 'true');
          }
          addToast(lang === 'ar' ? 'تم تسجيل الدخول بنجاح إلى لوحة الإدارة' : 'Signed in successfully to Studio Admin', 'success');
          navigateAdmin('/admin/dashboard');
          return { success: true, user: authedUser };
        } else {
          const errorMsg =
            res.data?.message ||
            (lang === 'ar' ? 'بيانات الاعتماد غير صالحة. يرجى المحاولة مرة أخرى.' : 'Invalid credentials. Please check email and password.');
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
    const demoUser = { id: 1, name: 'Admin Demo', email: 'hosam.maher48@gmail.com' };
    setUser(demoUser);
    setIsAuthenticated(true);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('studio_admin_auth', 'true');
    }
    addToast(lang === 'ar' ? 'تم الدخول إلى وضع النموذج التجريبي للاستوديو' : 'Signed in successfully to Demo Mode', 'success');
    navigateAdmin('/admin/dashboard');
  }, [addToast, lang, navigateAdmin]);

  const logout = useCallback(async () => {
    try {
      await requestApi('/api/v1/auth/logout', { method: 'POST' });
    } catch (e) {
      // Ignore network errors on logout
    }
    setUser(null);
    setIsAuthenticated(false);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('studio_admin_auth', 'false');
    }
    addToast(lang === 'ar' ? 'تم تسجيل الخروج بنجاح' : 'Signed out successfully', 'info');
    navigateAdmin('/admin/login');
  }, [addToast, lang, navigateAdmin]);

  // Project Actions
  const addProject = useCallback(
    async (newProj) => {
      const normalized = normalizeAdminProject(newProj, 0);

      // Async backend persistence
      requestApi('/api/v1/admin/projects', {
        method: 'POST',
        body: JSON.stringify({
          slug: normalized.slug || normalized.titleEn.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          status: normalized.status || 'draft',
          is_featured: Boolean(normalized.featured),
          year: parseInt(normalized.year, 10) || new Date().getFullYear(),
          client: normalized.clientEn || '',
          translations: [
            {
              locale: 'en',
              title: normalized.titleEn,
              summary: normalized.descEn,
              description: normalized.descEn,
              seo_title: normalized.titleEn,
              seo_description: normalized.descEn,
            },
            {
              locale: 'ar',
              title: normalized.titleAr || normalized.titleEn,
              summary: normalized.descAr || normalized.descEn,
              description: normalized.descAr || normalized.descEn,
              seo_title: normalized.titleAr || normalized.titleEn,
              seo_description: normalized.descAr || normalized.descEn,
            },
          ],
        }),
      }).catch(() => {});

      setProjects((prev) => [normalized, ...prev]);
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
    },
    [addToast, lang]
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
        requestApi(`/api/v1/admin/projects/${id}`, {
          method: 'PUT',
          body: JSON.stringify({
            slug: updatedFields.slug,
            status: updatedFields.status,
            is_featured: updatedFields.featured,
            year: updatedFields.year ? parseInt(updatedFields.year, 10) : undefined,
            client: updatedFields.clientEn,
          }),
        }).catch(() => {});
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
        requestApi(`/api/v1/admin/projects/${id}`, { method: 'DELETE' }).catch(() => {});
      }

      addToast(lang === 'ar' ? 'تم نقل المشروع إلى سلة المحذوفات' : 'Project moved to Trash (restorable for 30 days)', 'info');
    },
    [projects, addToast, lang]
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
      const newCat = {
        id: `cat-${Date.now()}`,
        count: 0,
        order: categories.length + 1,
        status: 'active',
        nameEn: resolveLocalized(cat.name, 'en') || cat.nameEn || 'New Category',
        nameAr: resolveLocalized(cat.name, 'ar') || cat.nameAr || 'تصنيف جديد',
        slug: cat.slug || 'category',
      };

      requestApi('/api/v1/admin/categories', {
        method: 'POST',
        body: JSON.stringify({
          slug: newCat.slug,
          sort_order: newCat.order,
          is_active: true,
          translations: [
            { locale: 'en', name: newCat.nameEn },
            { locale: 'ar', name: newCat.nameAr },
          ],
        }),
      }).catch(() => {});

      setCategories((prev) => [...prev, newCat]);
      addToast(lang === 'ar' ? 'تم إضافة التصنيف الجديد' : 'New category added', 'success');
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

      if (item.originalId && /^\d+$/.test(String(item.originalId))) {
        requestApi(`/api/v1/admin/projects/${item.originalId}/restore`, { method: 'POST' }).catch(() => {});
      }

      addToast(lang === 'ar' ? 'تم استرجاع العنصر إلى المشاريع النشطة' : 'Item restored successfully', 'success');
    },
    [trash, addToast, lang]
  );

  const purgeTrashItem = useCallback(
    async (trashId) => {
      const item = trash.find((t) => t.id === trashId);
      setTrash((prev) => prev.filter((t) => t.id !== trashId));

      if (item?.originalId && /^\d+$/.test(String(item.originalId))) {
        requestApi(`/api/v1/admin/projects/${item.originalId}/force`, { method: 'DELETE' }).catch(() => {});
      }

      addToast(lang === 'ar' ? 'تم حذف العنصر نهائياً' : 'Item permanently deleted', 'info');
    },
    [trash, addToast, lang]
  );

  const emptyTrash = useCallback(() => {
    setTrash([]);
    addToast(lang === 'ar' ? 'تم تفريغ سلة المحذوفات بالكامل' : 'Trash emptied completely', 'info');
  }, [addToast, lang]);

  // Settings Actions
  const updateStudioSettings = useCallback(
    (newSettings) => {
      setSettings((prev) => ({
        ...prev,
        ...newSettings,
      }));
      addToast(lang === 'ar' ? 'تم حفظ إعدادات الاستوديو' : 'Studio settings saved', 'success');
    },
    [addToast, lang]
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
    trash,
    restoreTrashItem,
    purgeTrashItem,
    emptyTrash,
    settings,
    updateStudioSettings,
    activities,
    notifications,
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
