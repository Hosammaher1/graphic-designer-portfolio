import React from 'react';
import { AdminProvider, useAdmin } from './context/AdminContext.jsx';
import { AdminLayout } from './layouts/AdminLayout.jsx';
import { AdminLoginPage } from './pages/AdminLoginPage.jsx';
import { OverviewDashboardPage } from './pages/OverviewDashboardPage.jsx';
import { ProjectsListPage } from './pages/ProjectsListPage.jsx';
import { ProjectEditorPage } from './pages/ProjectEditorPage.jsx';
import { CategoriesPage } from './pages/CategoriesPage.jsx';
import { MediaLibraryPage } from './pages/MediaLibraryPage.jsx';
import { PageBuilderListPage } from './pages/PageBuilderListPage.jsx';
import { PageBuilderEditorPage } from './pages/PageBuilderEditorPage.jsx';
import { JourneyPage } from './pages/JourneyPage.jsx';
import { AnalyticsPage } from './pages/AnalyticsPage.jsx';
import { SeoPage } from './pages/SeoPage.jsx';
import { SettingsPage } from './pages/SettingsPage.jsx';
import { TrashPage } from './pages/TrashPage.jsx';

function AdminRouter() {
  const { currentRoute, isAuthenticated } = useAdmin();

  // If user is not authenticated or explicitly visiting /admin/login, show login screen
  if (!isAuthenticated || currentRoute === '/admin/login') {
    return <AdminLoginPage />;
  }

  // Parse path and route to target admin page
  const renderPage = () => {
    // 1. Projects Edit: /admin/projects/:id/edit or /admin/projects/new
    if (currentRoute === '/admin/projects/new') {
      return <ProjectEditorPage projectId="new" />;
    }
    const projectEditMatch = currentRoute.match(/^\/admin\/projects\/([^/]+)\/edit$/);
    if (projectEditMatch) {
      return <ProjectEditorPage projectId={projectEditMatch[1]} />;
    }

    // 2. Projects List: /admin/projects
    if (currentRoute === '/admin/projects') {
      return <ProjectsListPage />;
    }

    // 3. Categories: /admin/categories
    if (currentRoute === '/admin/categories') {
      return <CategoriesPage />;
    }

    // 4. Media Library: /admin/media
    if (currentRoute === '/admin/media') {
      return <MediaLibraryPage />;
    }

    // 5. Page Builder: /admin/pages/:id/edit
    const pageEditMatch = currentRoute.match(/^\/admin\/pages\/([^/]+)\/edit$/);
    if (pageEditMatch) {
      return <PageBuilderEditorPage pageId={pageEditMatch[1]} />;
    }
    if (currentRoute === '/admin/pages') {
      return <PageBuilderListPage />;
    }

    // 6. Creative Journey: /admin/journey
    if (currentRoute === '/admin/journey') {
      return <JourneyPage />;
    }

    // 7. Analytics: /admin/analytics
    if (currentRoute === '/admin/analytics') {
      return <AnalyticsPage />;
    }

    // 7. SEO: /admin/seo
    if (currentRoute === '/admin/seo') {
      return <SeoPage />;
    }

    // 8. Settings: /admin/settings
    if (currentRoute === '/admin/settings') {
      return <SettingsPage />;
    }

    // 9. Trash: /admin/trash
    if (currentRoute === '/admin/trash') {
      return <TrashPage />;
    }

    // Default overview dashboard: /admin, /admin/dashboard
    return <OverviewDashboardPage />;
  };

  return <AdminLayout currentPath={currentRoute}>{renderPage()}</AdminLayout>;
}

export default function AdminApp() {
  return (
    <AdminProvider>
      <AdminRouter />
    </AdminProvider>
  );
}
