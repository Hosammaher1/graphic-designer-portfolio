import React, { useState, useEffect, useCallback, useRef } from 'react';
import { projectsData, getAllPublishedProjects } from './data/portfolioData';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { SelectedWorkSection } from './components/SelectedWorkSection';
import { AboutSection } from './components/AboutSection';
import { SkillsSection } from './components/SkillsSection';
import { JourneySection } from './components/JourneySection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { ProjectDetailsModal } from './components/ProjectDetailsModal';
import { AllProjectsScreen } from './components/AllProjectsScreen';
import AdminApp from './admin/AdminApp';

export default function App({ initialUrl, initialLocale }) {
  // Locale state: default to 'en' with bilingual 'ar' support
  const [lang, setLang] = useState(() => {
    if (initialLocale) return initialLocale;
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      if (pathname.startsWith('/ar')) return 'ar';
      if (pathname.startsWith('/en')) return 'en';
    }
    return 'en';
  });

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

  const [publishedProjects, setPublishedProjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [siteSettings, setSiteSettings] = useState(null);
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

  // Fetch real published projects, categories, and settings from backend API
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isMounted = true;
    async function loadBackendData() {
      try {
        const [projRes, catRes, setRes] = await Promise.all([
          fetch(`/api/v1/projects?locale=${lang}`, { headers: { Accept: 'application/json' } }),
          fetch(`/api/v1/categories?locale=${lang}`, { headers: { Accept: 'application/json' } }),
          fetch(`/api/v1/settings?locale=${lang}`, { headers: { Accept: 'application/json' } }),
        ]);

        if (projRes.ok) {
          const json = await projRes.json();
          const apiProjects = json.data?.projects?.data || [];
          const normalizedApi = apiProjects.map((p) => {
            const titleEn = p.title || p.slug;
            const titleAr = p.title || p.slug;
            const summaryEn = p.summary || '';
            const summaryAr = p.summary || '';
            const rawCat = p.categories?.[0];
            const catNameEn = typeof rawCat?.name === 'object' ? (rawCat.name?.en || rawCat.slug) : (rawCat?.name || rawCat?.slug || 'Branding');
            const catNameAr = typeof rawCat?.name === 'object' ? (rawCat.name?.ar || rawCat.slug) : (rawCat?.name || rawCat?.slug || 'هوية بصرية');
            const cover = p.cover_url || null;
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
          });

          if (isMounted) {
            setPublishedProjects(normalizedApi);
          }
        }

        if (catRes.ok) {
          const catJson = await catRes.json();
          const apiCats = catJson.data?.categories || (Array.isArray(catJson.data) ? catJson.data : []);
          if (isMounted) {
            setCategories(apiCats);
          }
        }

        if (setRes.ok) {
          const setJson = await setRes.json();
          const apiSettings = setJson.data?.settings || setJson.data || null;
          if (isMounted) {
            setSiteSettings(apiSettings);
          }
        }
      } catch (e) {
        // Fallback safely to empty state without throwing runtime exceptions
      }
    }

    loadBackendData();
    return () => {
      isMounted = false;
    };
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
    setLang((prev) => (prev === 'en' ? 'ar' : 'en'));
  }, []);

  const openProjectModal = useCallback(async (projectId, collection) => {
    setSelectedProjectId(projectId);
    setModalCollection(collection || publishedProjects);
    setIsModalOpen(true);

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
    return <AdminApp />;
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
            featuredProject={publishedProjects.find((p) => p.featured) || (publishedProjects.length > 0 ? publishedProjects[0] : null)}
            onOpenProject={(id) => openProjectModal(id)}
          />

          {/* Section 2: Selected Work Carousel */}
          <SelectedWorkSection
            lang={lang}
            projects={publishedProjects}
            onOpenProject={(id, col) => openProjectModal(id, col)}
            onNavigateAllProjects={() => navigateRoute('work')}
          />

          {/* Section 3: About Me */}
          <AboutSection lang={lang} settings={siteSettings} />

          {/* Section 4: Skills & Expertise Glassmorphism Dashboard */}
          <SkillsSection lang={lang} settings={siteSettings} />

          {/* Section 5: Creative Journey Timeline */}
          <JourneySection lang={lang} />

          {/* Section 6: Contact Section */}
          <ContactSection lang={lang} settings={siteSettings} />
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
        projectCollection={modalCollection || publishedProjects}
      />
    </div>
  );
}
