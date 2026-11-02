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

  const [publishedProjects, setPublishedProjects] = useState(() => getAllPublishedProjects());
  const [selectedProjectId, setSelectedProjectId] = useState(null);
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
    const match = pathname.match(/(?:\/(?:ar|en))?\/projects\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      const slug = match[1];
      const allProjects = getAllPublishedProjects();
      const found = allProjects.find((p) => p.id === slug || p.slug === slug);
      if (found) {
        setSelectedProjectId(found.id);
        setModalCollection(allProjects);
        setIsModalOpen(true);
      }
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
        return;
      }

      if (pathname.includes('/work') || hash.startsWith('#/work') || hash === '#work') {
        setRoute('work');
        window.scrollTo({ top: 0, behavior: 'auto' });
        return;
      }

      // Check for deep-linked project
      const match = pathname.match(/(?:\/(?:ar|en))?\/projects\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        const slug = match[1];
        const allProjects = getAllPublishedProjects();
        const found = allProjects.find((p) => p.id === slug || p.slug === slug);
        if (found) {
          setSelectedProjectId(found.id);
          setIsModalOpen(true);
        }
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

  // Fetch real published projects from backend API to augment catalog
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isMounted = true;
    async function loadBackendProjects() {
      try {
        const res = await fetch(`/api/v1/projects?locale=${lang}`, {
          headers: { Accept: 'application/json' },
        });
        if (res.ok) {
          const json = await res.json();
          const apiProjects = json.data?.projects?.data;
          if (Array.isArray(apiProjects) && apiProjects.length > 0 && isMounted) {
            // Keep curated demo projects while ensuring real projects appear
            const normalizedApi = apiProjects.map((p) => ({
              id: p.slug || String(p.id),
              title: { en: p.title || p.slug, ar: p.title || p.slug },
              subtitle: { en: p.summary || '', ar: p.summary || '' },
              category: { en: p.categories?.[0]?.name || 'Branding', ar: p.categories?.[0]?.name || 'هوية بصرية' },
              tags: p.tools?.map((t) => t.name || t.slug) || ['Design', 'Brand'],
              year: String(p.year || new Date().getFullYear()),
              image: p.cover_url || '/assets/aistudio/Selected_Work__Noya_Skincare_Portfolio_6434c76f.png',
              client: { en: p.client || 'Studio Client', ar: p.client || 'عميل الاستوديو' },
              featured: Boolean(p.is_featured),
              metrics: [],
              artworks: [],
            }));

            setPublishedProjects((prev) => {
              const existingIds = new Set(prev.map((item) => item.id));
              const newItems = normalizedApi.filter((item) => !existingIds.has(item.id));
              return [...newItems, ...prev];
            });
          }
        }
      } catch (e) {
        // Fallback to portfolioData.js projects
      }
    }

    loadBackendProjects();
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

  const openProjectModal = useCallback((projectId, collection) => {
    setSelectedProjectId(projectId);
    setModalCollection(collection || getAllPublishedProjects());
    setIsModalOpen(true);
  }, []);

  const closeProjectModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const navigateProjectModal = useCallback((projectId) => {
    setSelectedProjectId(projectId);
  }, []);

  const allPublished = publishedProjects;
  const activeProject = selectedProjectId
    ? allPublished.find((p) => p.id === selectedProjectId) ||
      projectsData.find((p) => p.id === selectedProjectId) ||
      allPublished[0]
    : null;

  if (route === 'admin') {
    return <AdminApp />;
  }

  return (
    <div
      className={`min-h-screen bg-[#09070c] text-neutral-100 flex flex-col font-sans selection:bg-rose-500/30 selection:text-rose-200 ${
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
      />

      {/* Conditional View Rendering: Continuous Single-Page Homepage OR All Projects Screen */}
      {route === 'work' ? (
        <div className="flex-1">
          <AllProjectsScreen
            lang={lang}
            onBackToHome={() => navigateRoute('home', 'selected-work')}
            onOpenProject={(id, collection) => openProjectModal(id, collection)}
          />
        </div>
      ) : (
        <main className="flex-1">
          {/* Section 1: Hero */}
          <HeroSection lang={lang} onOpenProject={(id) => openProjectModal(id)} />

          {/* Section 2: Selected Work Carousel */}
          <SelectedWorkSection
            lang={lang}
            onOpenProject={(id) => openProjectModal(id)}
            onNavigateAllProjects={() => navigateRoute('work')}
          />

          {/* Section 3: About Me */}
          <AboutSection lang={lang} />

          {/* Section 4: Skills & Expertise Glassmorphism Dashboard */}
          <SkillsSection lang={lang} />

          {/* Section 5: Creative Journey Timeline */}
          <JourneySection lang={lang} />

          {/* Section 6: Contact Section */}
          <ContactSection lang={lang} />
        </main>
      )}

      {/* Section 7: Footer */}
      <Footer lang={lang} />

      {/* Section 8: The CRITICAL Project Details Modal (Overlays above either screen) */}
      <ProjectDetailsModal
        project={activeProject}
        isOpen={isModalOpen}
        onClose={closeProjectModal}
        lang={lang}
        onNavigateProject={navigateProjectModal}
        projectCollection={modalCollection}
      />
    </div>
  );
}
