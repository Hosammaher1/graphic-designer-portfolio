import React, { useState, useEffect, useCallback, useRef } from 'react';
import { projectsData, getAllPublishedProjects, categoriesData } from './data/portfolioData';

/**
 * Resilient fetch helper with strict AbortSignal timeout.
 * Prevents slow cold-start backend requests from hanging mobile reloads.
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

/**
 * Resilient fetch with single retry on transient network timeout.
 */
async function fetchWithRetry(url, options = {}, timeoutMs = 5000, maxRetries = 1) {
  try {
    return await fetchWithTimeout(url, options, timeoutMs);
  } catch (err) {
    if (maxRetries > 0) {
      await new Promise((r) => setTimeout(r, 1200));
      return await fetchWithTimeout(url, options, timeoutMs);
    }
    throw err;
  }
}
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { SelectedWorkSection, isProjectFeatured, getProjectFeaturedOrder } from './components/SelectedWorkSection';
import { AboutSection } from './components/AboutSection';
import { SkillsSection } from './components/SkillsSection';
import { JourneySection } from './components/JourneySection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { ProjectDetailsModal } from './components/ProjectDetailsModal';
import { AllProjectsScreen } from './components/AllProjectsScreen';
import { ConsentProvider, useConsent } from './context/ConsentContext.jsx';
import { ConsentBanner } from './components/ConsentBanner.jsx';
import { ConsentModal } from './components/ConsentModal.jsx';
const AdminApp = React.lazy(() => import('./admin/AdminApp'));

function AppContent({ initialUrl, initialLocale, lang, setLang }) {
  const { consent, hasConsent } = useConsent();

  // Route state: 'home' | 'work' | 'admin'
  const [route, setRoute] = useState(() => {
    const url = initialUrl || (typeof window !== 'undefined' ? window.location.pathname + window.location.hash : '/');
    if (url.includes('/admin') || url.includes('#admin')) {
      return 'admin';
    }
    if (url.includes('/work') || url.includes('#work')) {
      return 'work';
    }
    return 'home';
  });

  // Dynamic dashboard states initialized to null for seamless SSR hydration
  const [publishedProjects, setPublishedProjects] = useState(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [projectsError, setProjectsError] = useState(null);

  const [categories, setCategories] = useState(null);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [categoriesError, setCategoriesError] = useState(null);

  const [siteSettings, setSiteSettings] = useState(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [settingsError, setSettingsError] = useState(null);

  const [journeyMilestones, setJourneyMilestones] = useState(null);
  const [isLoadingJourney, setIsLoadingJourney] = useState(true);
  const [journeyError, setJourneyError] = useState(null);

  // Restore from client caches immediately upon hydration (0ms warm load)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      let cachedProjects = null;
      const localProjects = window.localStorage.getItem('studio_published_projects_cache') || window.sessionStorage.getItem('studio_published_projects_cache');
      if (localProjects) {
        const parsed = JSON.parse(localProjects);
        if (Array.isArray(parsed) && parsed.length > 0) {
          cachedProjects = parsed;
        }
      }

      // Merge dashboard-saved featured projects from studio_admin_projects_v2 or caches
      const rawAdmin = window.localStorage.getItem('studio_admin_projects_v2') || window.localStorage.getItem('studio_admin_projects');
      if (rawAdmin) {
        const parsedAdmin = JSON.parse(rawAdmin);
        if (Array.isArray(parsedAdmin) && parsedAdmin.length > 0) {
          if (cachedProjects) {
            cachedProjects = cachedProjects.map((p, idx) => {
              const adminMatch = parsedAdmin.find((ap) => ap.slug === p.slug || String(ap.id) === String(p.id));
              if (adminMatch) {
                const isFeatured = isProjectFeatured(adminMatch) || isProjectFeatured(p);
                return {
                  ...p,
                  featured: isFeatured,
                  is_featured: isFeatured,
                  isFeatured: isFeatured,
                  featuredOrder: getProjectFeaturedOrder(adminMatch, p.featuredOrder ?? idx + 1),
                };
              }
              return p;
            });
          }
        }
      }

      const rawFeaturedCache = window.sessionStorage.getItem('studio_featured_projects_cache') || window.localStorage.getItem('studio_featured_projects_cache');
      if (rawFeaturedCache && cachedProjects) {
        try {
          const parsedFeat = JSON.parse(rawFeaturedCache);
          if (Array.isArray(parsedFeat) && parsedFeat.length > 0) {
            cachedProjects = cachedProjects.map((p, idx) => {
              const featMatch = parsedFeat.find((fp) => fp.slug === p.slug || String(fp.id) === String(p.id));
              if (featMatch) {
                return {
                  ...p,
                  featured: true,
                  is_featured: true,
                  isFeatured: true,
                  featuredOrder: getProjectFeaturedOrder(featMatch, p.featuredOrder ?? idx + 1),
                };
              }
              return p;
            });
          }
        } catch (e) {}
      }

      if (cachedProjects) {
        setPublishedProjects(cachedProjects);
        setIsLoadingProjects(false);
      }

      const localCats = window.localStorage.getItem('studio_categories_cache') || window.sessionStorage.getItem('studio_categories_cache');
      if (localCats) {
        const parsed = JSON.parse(localCats);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCategories(parsed);
          setIsLoadingCategories(false);
        }
      }

      const localSettings = window.localStorage.getItem('studio_settings_cache') || window.sessionStorage.getItem('studio_settings_cache');
      if (localSettings) {
        const parsed = JSON.parse(localSettings);
        if (parsed) {
          setSiteSettings(parsed);
          setIsLoadingSettings(false);
        }
      }

      const localJourney = window.localStorage.getItem('studio_journey_cache') || window.sessionStorage.getItem('studio_journey_cache');
      if (localJourney) {
        const parsed = JSON.parse(localJourney);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setJourneyMilestones(parsed);
          setIsLoadingJourney(false);
        }
      }
    } catch (e) {}
  }, []);

  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [detailedProject, setDetailedProject] = useState(null);
  const [modalCollection, setModalCollection] = useState(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');

  // Ref to preserve homepage scroll position when navigating to and from /work
  const homepageScrollPos = useRef(0);

  // Sync document direction and language attribute with RTL/LTR support
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }
  }, [lang]);

  // Handle deep-linking to project detail /:locale/projects/:slug or /projects/:slug on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const pathname = window.location.pathname;
    if (pathname.startsWith('/admin')) return;

    const match = pathname.match(/^(?:\/(?:ar|en))?\/projects\/([a-zA-Z0-9_-]+)$/);
    if (match && match[1]) {
      const slug = match[1];
      openProjectModal(slug);
    }
  }, []);

  // Sync live project updates from Admin Dashboard
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleProjectsSync = () => {
      try {
        const rawAdmin = window.localStorage.getItem('studio_admin_projects_v2');
        if (rawAdmin) {
          const parsed = JSON.parse(rawAdmin);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setPublishedProjects((prev) => {
              if (!Array.isArray(prev)) return prev;
              return prev.map((p, idx) => {
                const match = parsed.find((ap) => ap.slug === p.slug || String(ap.id) === String(p.id));
                if (match) {
                  const isFeatured = isProjectFeatured(match);
                  return {
                    ...p,
                    featured: isFeatured,
                    is_featured: isFeatured,
                    isFeatured: isFeatured,
                    featuredOrder: getProjectFeaturedOrder(match, p.featuredOrder ?? idx + 1),
                  };
                }
                return p;
              });
            });
          }
        }
      } catch (e) {}
    };

    window.addEventListener('storage', handleProjectsSync);
    window.addEventListener('studio:projects-updated', handleProjectsSync);
    return () => {
      window.removeEventListener('storage', handleProjectsSync);
      window.removeEventListener('studio:projects-updated', handleProjectsSync);
    };
  }, []);

  // Sync route with browser back/forward buttons (popstate) and hash changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleRouteSync = () => {
      const pathname = window.location.pathname;
      const hash = window.location.hash;

      if (pathname.startsWith('/en')) {
        setLang('en');
      } else if (pathname.startsWith('/ar')) {
        setLang('ar');
      } else if (pathname === '/' || pathname === '') {
        setLang('en');
      }

      if (pathname.startsWith('/admin') || hash.startsWith('#/admin') || hash === '#admin') {
        setRoute('admin');
        setIsModalOpen(false);
        return;
      }

      if (pathname.includes('/work') || hash.startsWith('#/work') || hash === '#work') {
        setRoute('work');
        window.scrollTo({ top: 0, behavior: 'auto' });
        return;
      }

      // Check for deep-linked project
      const match = pathname.match(/^(?:\/(?:ar|en))?\/projects\/([a-zA-Z0-9_-]+)$/);
      if (match && match[1]) {
        const slug = match[1];
        openProjectModal(slug);
      }

      // Default home
      setRoute('home');
      if ((pathname === '/' || pathname === '/ar/' || pathname === '/en/') && !hash) {
        window.scrollTo({ top: homepageScrollPos.current, behavior: 'auto' });
      }
    };

    window.addEventListener('popstate', handleRouteSync);
    window.addEventListener('hashchange', handleRouteSync);
    return () => {
      window.removeEventListener('popstate', handleRouteSync);
      window.removeEventListener('hashchange', handleRouteSync);
    };
  }, []);

  // Fetch real published projects, categories, settings, and journey from backend API
  const loadProjects = useCallback(async () => {
    setIsLoadingProjects((prev) => (publishedProjects === null ? true : prev));
    setProjectsError(null);
    try {
      const projRes = await fetchWithRetry(
        `/api/v1/projects?locale=${lang}`,
        { headers: { Accept: 'application/json' } },
        5000,
        1
      );
      if (projRes && projRes.ok) {
        const json = await projRes.json();
        const apiProjects = json.data?.projects?.data ?? (Array.isArray(json.data) ? json.data : []);

        // Read dashboard-saved featured projects to preserve user curation & exact order
        let adminProjectsMap = {};
        try {
          if (typeof window !== 'undefined') {
            const rawAdmin = window.localStorage?.getItem('studio_admin_projects_v2') || window.localStorage?.getItem('studio_admin_projects');
            if (rawAdmin) {
              const parsedAdmin = JSON.parse(rawAdmin);
              if (Array.isArray(parsedAdmin)) {
                parsedAdmin.forEach((ap, aIdx) => {
                  const keySlug = ap.slug;
                  const keyId = String(ap.id);
                  if (keySlug) adminProjectsMap[keySlug] = { ...ap, _idx: aIdx };
                  if (keyId) adminProjectsMap[keyId] = { ...ap, _idx: aIdx };
                });
              }
            }

            const rawFeatured = window.sessionStorage?.getItem('studio_featured_projects_cache') || window.localStorage?.getItem('studio_featured_projects_cache');
            if (rawFeatured) {
              const parsedFeatured = JSON.parse(rawFeatured);
              if (Array.isArray(parsedFeatured)) {
                parsedFeatured.forEach((fp, fIdx) => {
                  const keySlug = fp.slug;
                  const keyId = String(fp.id);
                  const existing = adminProjectsMap[keySlug] || adminProjectsMap[keyId] || {};
                  const entry = { ...existing, ...fp, featured: true, is_featured: true, isFeatured: true, _idx: existing._idx ?? fIdx };
                  if (keySlug) adminProjectsMap[keySlug] = entry;
                  if (keyId) adminProjectsMap[keyId] = entry;
                });
              }
            }
          }
        } catch (e) {}

        const normalizedApi = (Array.isArray(apiProjects) ? apiProjects : []).map((p, idx) => {
          const titleEn = p.title || p.slug;
          const titleAr = p.title || p.slug;
          const summaryEn = p.summary || '';
          const summaryAr = p.summary || '';
          const rawCat = p.categories?.[0];
          const catNameEn = typeof rawCat?.name === 'object' ? (rawCat.name?.en || rawCat.slug) : (rawCat?.name || rawCat?.slug || 'Branding');
          const catNameAr = typeof rawCat?.name === 'object' ? (rawCat.name?.ar || rawCat.slug) : (rawCat?.name || rawCat?.slug || 'هوية بصرية');
          const cover = p.cover_url || null;

          const adminMatch = adminProjectsMap[p.slug] || adminProjectsMap[String(p.id)];
          const isFeatured = Boolean(
            isProjectFeatured(p) || (adminMatch && isProjectFeatured(adminMatch))
          );
          const featuredOrder = adminMatch ? getProjectFeaturedOrder(adminMatch, adminMatch._idx + 1) : getProjectFeaturedOrder(p, idx + 1);

          return {
            id: p.slug || String(p.id),
            slug: p.slug,
            title: { en: titleEn, ar: titleAr },
            subtitle: { en: summaryEn, ar: summaryAr },
            description: { en: p.description || summaryEn, ar: p.description || summaryAr },
            category: { en: catNameEn, ar: catNameAr },
            categoryIds: Array.isArray(p.categories) ? p.categories.map((c) => c.slug || String(c.id)) : [],
            categories: Array.isArray(p.categories) ? p.categories.map((c) => ({
              id: c.id,
              slug: c.slug,
              name: typeof c.name === 'object' ? c.name : { en: c.name || c.slug, ar: c.name || c.slug },
              nameEn: typeof c.name === 'object' ? (c.name.en || c.slug) : (c.name || c.slug),
              nameAr: typeof c.name === 'object' ? (c.name.ar || c.slug) : (c.name || c.slug),
            })) : [],
            tags: p.tools && p.tools.length > 0 ? p.tools.map((t) => t.name || t.slug) : ['Design', 'Brand'],
            tools: p.tools && p.tools.length > 0 ? p.tools.map((t) => t.name || t.slug) : ['Photoshop', 'Illustrator'],
            year: String(p.year || new Date().getFullYear()),
            image: cover,
            coverImage: cover,
            client: { en: p.client || 'Studio Client', ar: p.client || 'عميل الاستوديو' },
            featured: isFeatured,
            is_featured: isFeatured,
            isFeatured: isFeatured,
            featuredOrder,
            publicationDate: p.published_at || String(p.year || ''),
            gallery: Array.isArray(p.media) ? p.media.map((m, mIdx) => ({
              id: m.id || `${p.slug}-media-${mIdx}`,
              url: m.display_url || m.url,
              src: m.display_url || m.url,
              title: { en: m.caption_en || titleEn, ar: m.caption_ar || titleAr },
              caption: { en: m.caption_en || summaryEn, ar: m.caption_ar || summaryAr },
              type: m.is_cover ? 'cover' : 'gallery',
            })) : [],
            services: [{ en: 'Brand Identity', ar: 'الهوية البصرية' }, { en: 'Visual Design', ar: 'التصميم المرئي' }],
          };
        });

        setPublishedProjects(normalizedApi);
        try {
          window.localStorage.setItem('studio_published_projects_cache', JSON.stringify(normalizedApi));
          window.sessionStorage.setItem('studio_published_projects_cache', JSON.stringify(normalizedApi));
        } catch (e) {}
      } else {
        if (publishedProjects === null) {
          setProjectsError('Failed to load projects');
        }
      }
    } catch (e) {
      if (publishedProjects === null) {
        setProjectsError(e.message || 'Network error');
      }
    } finally {
      setIsLoadingProjects(false);
    }
  }, [lang, publishedProjects]);

  const loadCategories = useCallback(async () => {
    setIsLoadingCategories((prev) => (categories === null ? true : prev));
    setCategoriesError(null);
    try {
      const catRes = await fetchWithRetry(
        `/api/v1/categories?locale=${lang}`,
        { headers: { Accept: 'application/json' } },
        5000,
        1
      );
      if (catRes && catRes.ok) {
        const catJson = await catRes.json();
        const apiCats = catJson.data?.categories || (Array.isArray(catJson.data) ? catJson.data : []);
        setCategories(apiCats);
        try {
          window.localStorage.setItem('studio_categories_cache', JSON.stringify(apiCats));
          window.sessionStorage.setItem('studio_categories_cache', JSON.stringify(apiCats));
        } catch (e) {}
      } else {
        if (categories === null) {
          setCategoriesError('Failed to load categories');
        }
      }
    } catch (e) {
      if (categories === null) {
        setCategoriesError(e.message || 'Network error');
      }
    } finally {
      setIsLoadingCategories(false);
    }
  }, [lang, categories]);

  const loadSettings = useCallback(async () => {
    setIsLoadingSettings((prev) => (siteSettings === null ? true : prev));
    setSettingsError(null);
    try {
      const setRes = await fetchWithRetry(
        `/api/v1/settings?locale=${lang}`,
        { headers: { Accept: 'application/json' } },
        5000,
        1
      );
      if (setRes && setRes.ok) {
        const setJson = await setRes.json();
        const apiSettings = setJson.data?.settings || setJson.data || null;
        if (apiSettings) {
          setSiteSettings(apiSettings);
          try {
            window.localStorage.setItem('studio_settings_cache', JSON.stringify(apiSettings));
            window.sessionStorage.setItem('studio_settings_cache', JSON.stringify(apiSettings));
          } catch (e) {}
        }
      } else {
        if (siteSettings === null) {
          setSettingsError('Failed to load settings');
        }
      }
    } catch (e) {
      if (siteSettings === null) {
        setSettingsError(e.message || 'Network error');
      }
    } finally {
      setIsLoadingSettings(false);
    }
  }, [lang, siteSettings]);

  const loadJourney = useCallback(async () => {
    setIsLoadingJourney((prev) => (journeyMilestones === null ? true : prev));
    setJourneyError(null);
    try {
      const jRes = await fetchWithRetry(
        `/api/v1/journey?locale=${lang}`,
        { headers: { Accept: 'application/json' } },
        5000,
        1
      );
      if (jRes && jRes.ok) {
        const jJson = await jRes.json();
        const milestones = jJson.data?.milestones ?? [];
        setJourneyMilestones(milestones);
        try {
          window.localStorage.setItem('studio_journey_cache', JSON.stringify(milestones));
          window.sessionStorage.setItem('studio_journey_cache', JSON.stringify(milestones));
        } catch (e) {}
      } else {
        if (journeyMilestones === null) {
          setJourneyError('Failed to load journey');
        }
      }
    } catch (e) {
      if (journeyMilestones === null) {
        setJourneyError(e.message || 'Network error');
      }
    } finally {
      setIsLoadingJourney(false);
    }
  }, [lang, journeyMilestones]);

  // Fire parallel non-blocking loaders
  useEffect(() => {
    if (typeof window === 'undefined') return;
    loadProjects();
    loadCategories();
    loadSettings();
    loadJourney();
  }, [lang]);

  // Route transition handler
  const navigateRoute = useCallback(
    (newRoute, targetAnchor) => {
      if (typeof window === 'undefined') return;

      const langPrefix = lang === 'en' ? '/en' : '/ar';

      if (newRoute === 'work') {
        homepageScrollPos.current = window.scrollY;
        window.history.pushState({ route: 'work' }, '', `${langPrefix}/work`);
        setRoute('work');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.history.pushState({ route: 'home' }, '', `${langPrefix}/`);
        setRoute('home');
        if (targetAnchor) {
          setTimeout(() => {
            const el = document.getElementById(targetAnchor);
            if (el) {
              const navHeight = 80;
              const elementPosition = el.getBoundingClientRect().top + window.scrollY;
              window.scrollTo({ top: elementPosition - navHeight, behavior: 'smooth' });
            } else {
              window.scrollTo({ top: homepageScrollPos.current, behavior: 'smooth' });
            }
          }, 60);
        } else {
          setTimeout(() => {
            window.scrollTo({ top: homepageScrollPos.current, behavior: 'smooth' });
          }, 40);
        }
      }
    },
    [lang]
  );

  // Scroll spy to highlight active section in Navbar when on homepage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (route !== 'home') return;

    const sectionIds = [
      'hero',
      'selected-work',
      'about-me',
      'skills-expertise',
      'creative-journey',
      'contact',
    ];

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 180;
      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(sectionIds[i]);
        if (el && el.offsetTop <= scrollPosition) {
          setActiveSection(sectionIds[i]);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [route]);

  const toggleLanguage = useCallback(() => {
    setLang((prev) => {
      const nextLang = prev === 'en' ? 'ar' : 'en';
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        let newPath = currentPath;
        if (nextLang === 'ar') {
          if (currentPath.startsWith('/en/')) {
            newPath = currentPath.replace('/en/', '/ar/');
          } else if (currentPath === '/en') {
            newPath = '/ar/';
          } else if (!currentPath.startsWith('/ar/')) {
            newPath = '/ar' + (currentPath === '/' ? '/' : currentPath);
          }
        } else {
          if (currentPath.startsWith('/ar/')) {
            newPath = currentPath.replace('/ar/', '/en/');
          } else if (currentPath === '/ar') {
            newPath = '/en/';
          } else if (!currentPath.startsWith('/en/')) {
            newPath = currentPath === '/ar/' ? '/' : currentPath;
          }
        }
        window.history.pushState({}, '', newPath + window.location.search + window.location.hash);
      }
      return nextLang;
    });
  }, []);

  // Dispatches genuine analytics page_view event when visitor has consented to analytics
  const lastRecordedPathRef = useRef(null);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (route === 'admin') return;

    if (hasConsent('analytics') && consent?.consentId) {
      const currentPath = window.location.pathname || (route === 'work' ? `/${lang}/work` : `/${lang}/`);
      if (lastRecordedPathRef.current === currentPath) return;
      lastRecordedPathRef.current = currentPath;

      fetch('/api/v1/analytics/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Consent-Token': consent.consentId,
        },
        body: JSON.stringify({
          event_type: 'page_view',
          path: currentPath,
          locale: lang,
          consent_token: consent.consentId,
          consent_status: consent.status,
          referrer: typeof document !== 'undefined' ? (document.referrer || '') : '',
        }),
      }).catch(() => {});
    }
  }, [route, lang, hasConsent, consent?.status, consent?.consentId]);

  const openProjectModal = useCallback(async (projectId, collection) => {
    setSelectedProjectId(projectId);
    setModalCollection(collection || publishedProjects);
    setIsModalOpen(true);

    // Record privacy-respecting project view event when visitor consented to analytics
    if (hasConsent('analytics') && consent?.consentId) {
      fetch('/api/v1/analytics/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Consent-Token': consent.consentId,
        },
        body: JSON.stringify({
          event_type: 'project_view',
          path: `/${lang}/projects/${projectId}`,
          project_id: projectId,
          locale: lang,
          consent_token: consent.consentId,
          consent_status: consent.status,
          referrer: typeof document !== 'undefined' ? (document.referrer || '') : '',
        }),
      }).catch(() => {});
    }

    try {
      const res = await fetch(`/api/v1/projects/${projectId}?locale=${lang}`, {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const json = await res.json();
        const p = json.data?.project;
        if (p) {
          const titleEn = p.title || p.slug;
          const titleAr = p.title || p.slug;
          const summaryEn = p.summary || '';
          const summaryAr = p.summary || '';
          const rawCat = p.categories?.[0];
          const catNameEn = typeof rawCat?.name === 'object' ? (rawCat.name?.en || rawCat.slug) : (rawCat?.name || rawCat?.slug || 'Branding');
          const catNameAr = typeof rawCat?.name === 'object' ? (rawCat.name?.ar || rawCat.slug) : (rawCat?.name || rawCat?.slug || 'هوية بصرية');
          const cover = p.cover_url || null;

          const fullProject = {
            id: p.slug || String(p.id),
            slug: p.slug,
            title: { en: titleEn, ar: titleAr },
            subtitle: { en: summaryEn, ar: summaryAr },
            description: { en: p.description || summaryEn, ar: p.description || summaryAr },
            category: { en: catNameEn, ar: catNameAr },
            categoryIds: Array.isArray(p.categories) ? p.categories.map((c) => c.slug || String(c.id)) : [],
            categories: Array.isArray(p.categories) ? p.categories.map((c) => ({
              id: c.id,
              slug: c.slug,
              name: typeof c.name === 'object' ? c.name : { en: c.name || c.slug, ar: c.name || c.slug },
              nameEn: typeof c.name === 'object' ? (c.name.en || c.slug) : (c.name || c.slug),
              nameAr: typeof c.name === 'object' ? (c.name.ar || c.slug) : (c.name || c.slug),
            })) : [],
            tags: p.tools && p.tools.length > 0 ? p.tools.map((t) => t.name || t.slug) : ['Design', 'Brand'],
            tools: p.tools && p.tools.length > 0 ? p.tools.map((t) => t.name || t.slug) : ['Photoshop', 'Illustrator'],
            year: String(p.year || new Date().getFullYear()),
            image: cover,
            coverImage: cover,
            client: { en: p.client || 'Studio Client', ar: p.client || 'عميل الاستوديو' },
            featured: Boolean(p.is_featured),
            publicationDate: p.published_at || String(p.year || ''),
            gallery: Array.isArray(p.media) ? p.media.map((m, idx) => ({
              id: m.id || `${p.slug}-media-${idx}`,
              url: m.display_url || m.url,
              src: m.display_url || m.url,
              title: { en: m.caption_en || titleEn, ar: m.caption_ar || titleAr },
              caption: { en: m.caption_en || summaryEn, ar: m.caption_ar || summaryAr },
              type: m.is_cover ? 'cover' : 'gallery',
            })) : [],
            services: [{ en: 'Brand Identity', ar: 'الهوية البصرية' }, { en: 'Visual Design', ar: 'التصميم المرئي' }],
          };
          setDetailedProject(fullProject);
        }
      }
    } catch (e) {
      // Graceful fallback
    }
  }, [lang, publishedProjects]);

  const closeProjectModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const navigateProjectModal = useCallback((projectId) => {
    openProjectModal(projectId);
  }, [openProjectModal]);

  const allPublished = publishedProjects;
  const baseActive = selectedProjectId
    ? (modalCollection || allPublished).find((p) => p.id === selectedProjectId || p.slug === selectedProjectId) ||
      allPublished.find((p) => p.id === selectedProjectId || p.slug === selectedProjectId) ||
      null
    : null;

  const activeProject = (detailedProject && (detailedProject.id === selectedProjectId || detailedProject.slug === selectedProjectId))
    ? detailedProject
    : baseActive;

  if (route === 'admin') {
    return (
      <React.Suspense fallback={<div style={{ background: '#09070c', minHeight: '100vh' }} />}>
        <AdminApp />
      </React.Suspense>
    );
  }

  return (
    <div
      id="public-root"
      className={`public-root min-h-screen bg-[#09070c] text-neutral-100 flex flex-col font-sans selection:bg-rose-500/30 selection:text-rose-200 ${
        lang === 'ar' ? 'font-arabic' : ''
      }`}
    >
      {/* 1-Row Top Navigation */}
      <Navbar
        lang={lang}
        onToggleLanguage={toggleLanguage}
        activeSection={activeSection}
        currentRoute={route}
        onNavigateRoute={navigateRoute}
        settings={siteSettings}
      />

      {/* Conditional View Rendering: Continuous Single-Page Homepage OR All Projects Screen */}
      {route === 'work' ? (
        <div className="flex-1">
          <AllProjectsScreen
            lang={lang}
            projects={publishedProjects}
            categories={categories}
            settings={siteSettings}
            isLoadingProjects={isLoadingProjects}
            projectsError={projectsError}
            onRetryProjects={loadProjects}
            isLoadingCategories={isLoadingCategories}
            onBackToHome={() => navigateRoute('home', 'selected-work')}
            onOpenProject={(id, collection) => openProjectModal(id, collection)}
          />
        </div>
      ) : (
        <main className="flex-1">
          {/* Section 1: Hero */}
          <HeroSection
            lang={lang}
            settings={siteSettings}
            isLoadingSettings={isLoadingSettings}
            settingsError={settingsError}
            onRetrySettings={loadSettings}
            featuredProject={Array.isArray(publishedProjects) ? (publishedProjects.find((p) => isProjectFeatured(p)) || null) : null}
            isLoadingProjects={isLoadingProjects}
            onOpenProject={(id) => openProjectModal(id)}
          />

          {/* Section 2: Selected Work Carousel */}
          <SelectedWorkSection
            lang={lang}
            projects={publishedProjects}
            isLoadingProjects={isLoadingProjects}
            projectsError={projectsError}
            onRetryProjects={loadProjects}
            settings={siteSettings}
            onOpenProject={(id, col) => openProjectModal(id, col)}
            onNavigateAllProjects={() => navigateRoute('work')}
          />

          {/* Section 3: About Me */}
          <AboutSection
            lang={lang}
            settings={siteSettings}
            isLoadingSettings={isLoadingSettings}
            settingsError={settingsError}
            onRetrySettings={loadSettings}
          />

          {/* Section 4: Skills & Expertise Glassmorphism Dashboard */}
          <SkillsSection
            lang={lang}
            settings={siteSettings}
            isLoadingSettings={isLoadingSettings}
            settingsError={settingsError}
            onRetrySettings={loadSettings}
          />

          {/* Section 5: Creative Journey Timeline */}
          <JourneySection
            lang={lang}
            milestones={journeyMilestones}
            isLoadingJourney={isLoadingJourney}
            journeyError={journeyError}
            onRetryJourney={loadJourney}
          />

          {/* Section 6: Contact Section */}
          <ContactSection
            lang={lang}
            settings={siteSettings}
            isLoadingSettings={isLoadingSettings}
            settingsError={settingsError}
            onRetrySettings={loadSettings}
          />
        </main>
      )}

      {/* Section 7: Footer */}
      <Footer lang={lang} settings={siteSettings} />

      {/* Section 8: The CRITICAL Project Details Modal (Overlays above either screen) */}
      <ProjectDetailsModal
        project={activeProject}
        isOpen={isModalOpen && Boolean(activeProject) && route !== 'admin'}
        onClose={closeProjectModal}
        lang={lang}
        onNavigateProject={navigateProjectModal}
        projectCollection={modalCollection || (Array.isArray(publishedProjects) ? publishedProjects : [])}
      />

      {/* Section 9: Privacy Consent Banner & Preferences Modal */}
      {route !== 'admin' && <ConsentBanner locale={lang} />}
      {route !== 'admin' && <ConsentModal locale={lang} />}
    </div>
  );
}

export default function App({ initialUrl, initialLocale }) {
  // Locale state: default to 'en' with bilingual 'ar' support
  const [lang, setLang] = useState(() => {
    if (initialLocale) return initialLocale;
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      if (pathname.startsWith('/ar')) return 'ar';
      if (pathname.startsWith('/en')) return 'en';
      try {
        const initDataEl = document.getElementById('__INITIAL_DATA__');
        if (initDataEl) {
          const initData = JSON.parse(initDataEl.textContent);
          if (initData?.locale) return initData.locale;
        }
      } catch (e) {}
    }
    return 'en';
  });

  return (
    <ConsentProvider locale={lang}>
      <AppContent
        initialUrl={initialUrl}
        initialLocale={initialLocale}
        lang={lang}
        setLang={setLang}
      />
    </ConsentProvider>
  );
}
