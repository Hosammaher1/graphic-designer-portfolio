import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  Tags,
  Image as ImageIcon,
  Layout,
  BarChart3,
  Search,
  Globe,
  Settings,
  Trash2,
  ExternalLink,
  LogOut,
  Bell,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext.jsx';
import { SearchModal } from '../components/SearchModal.jsx';
import { ToastContainer } from '../components/ToastContainer.jsx';

export function AdminLayout({ children, currentPath = '/admin/dashboard' }) {
  const {
    lang,
    toggleLang,
    t,
    currentRoute,
    navigateAdmin,
    logout,
    notifications,
    settings,
  } = useAdmin();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Close menus on escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setIsNotificationsOpen(false);
        setIsProfileMenuOpen(false);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const navItems = [
    { label: t.nav.overview, path: '/admin/dashboard', icon: LayoutDashboard },
    { label: t.nav.projects, path: '/admin/projects', icon: FolderKanban },
    { label: t.nav.categories, path: '/admin/categories', icon: Tags },
    { label: t.nav.media, path: '/admin/media', icon: ImageIcon },
    { label: t.nav.pages, path: '/admin/pages', icon: Layout },
    { label: t.nav.analytics, path: '/admin/analytics', icon: BarChart3 },
    { label: t.nav.seo, path: '/admin/seo', icon: Globe },
    { label: t.nav.settings, path: '/admin/settings', icon: Settings },
    { label: t.nav.trash, path: '/admin/trash', icon: Trash2 },
  ];

  // Helper to determine if link is active
  const isActive = (path) => {
    if (path === '/admin/dashboard') {
      return currentRoute === '/admin' || currentRoute === '/admin/dashboard';
    }
    return currentRoute.startsWith(path);
  };

  const handleNavClick = (path) => {
    navigateAdmin(path);
    setMobileMenuOpen(false);
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <div
      className={`min-h-screen bg-[#09070c] text-neutral-100 flex flex-col font-sans selection:bg-[#842b45]/60 selection:text-[#fcdcd4] ${
        lang === 'ar' ? 'font-arabic' : ''
      }`}
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Background ambient lighting matching public portfolio */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-[550px] h-[550px] bg-[#842b45]/15 rounded-full blur-[150px]" />
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-[#421a28]/20 rounded-full blur-[160px]" />
        <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] bg-[#f4a496]/10 rounded-full blur-[140px]" />
      </div>

      <div className="flex flex-1 relative z-10 overflow-hidden">
        {/* DESKTOP SIDEBAR */}
        <aside
          className={`hidden md:flex flex-col border-r border-[#f4a496]/15 bg-[#120a17]/90 backdrop-blur-2xl transition-all duration-300 relative z-20 ${
            sidebarCollapsed ? 'w-20' : 'w-64'
          }`}
        >
          {/* Logo & Brand Header */}
          <div className="h-18 px-5 flex items-center justify-between border-b border-white/5">
            {!sidebarCollapsed ? (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#842b45] to-[#421a28] border border-[#f4a496]/40 flex items-center justify-center text-[#fcdcd4] font-serif font-bold text-base shadow-lg shadow-black/40">
                  {settings.branding?.monogram || 'GD'}
                </div>
                <div>
                  <div className="text-sm font-bold tracking-tight text-white font-serif">
                    {lang === 'ar' ? 'استوديو حسام' : 'Hosam Studio'}
                  </div>
                  <div className="text-[10px] text-[#f4a496]/80 font-mono tracking-widest uppercase">
                    {lang === 'ar' ? 'لوحة الإدارة' : 'Admin Studio'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mx-auto w-9 h-9 rounded-xl bg-gradient-to-br from-[#842b45] to-[#421a28] border border-[#f4a496]/40 flex items-center justify-center text-[#fcdcd4] font-serif font-bold text-base shadow">
                {settings.branding?.monogram || 'GD'}
              </div>
            )}

            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? (
                lang === 'ar' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
              ) : (
                lang === 'ar' ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto modal-scrollbar">
            {navItems.map((item) => {
              const active = isActive(item.path);
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavClick(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all group cursor-pointer ${
                    active
                      ? 'glass-panel-active text-[#fcdcd4] font-semibold border border-[#f4a496]/30 shadow-md shadow-[#842b45]/20'
                      : 'text-neutral-400 hover:text-neutral-100 hover:bg-white/5 border border-transparent'
                  }`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 transition-colors ${
                      active ? 'text-[#f4a496]' : 'text-neutral-400 group-hover:text-[#f4a496]'
                    }`}
                  />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-white/5 space-y-2">
            {/* View live public portfolio */}
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-[#fcdcd4] hover:bg-[#842b45]/20 border border-white/5 hover:border-[#f4a496]/30 transition-all"
              title={sidebarCollapsed ? t.nav.publicSite : undefined}
            >
              <ExternalLink className="w-4 h-4 text-[#f4a496] flex-shrink-0" />
              {!sidebarCollapsed && <span>{t.nav.publicSite}</span>}
            </a>

            {/* Logout button */}
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-[#f4a496] hover:bg-white/5 transition-colors cursor-pointer"
              title={sidebarCollapsed ? t.nav.logout : undefined}
            >
              <LogOut className="w-4 h-4 text-neutral-400 group-hover:text-[#f4a496] flex-shrink-0" />
              {!sidebarCollapsed && <span>{t.nav.logout}</span>}
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto modal-scrollbar">
          {/* TOPBAR */}
          <header className="h-18 px-4 sm:px-8 border-b border-[#f4a496]/15 bg-[#16101a]/70 backdrop-blur-xl flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center gap-3 sm:gap-4 flex-1">
              {/* Mobile Menu Toggle Button */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 cursor-pointer"
                aria-label="Open navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* ⌘K Search trigger */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl glass-panel-subtle hover:border-[#f4a496]/35 text-neutral-400 hover:text-white transition-all text-xs sm:text-sm max-w-xs sm:max-w-md w-full cursor-pointer text-left rtl:text-right"
              >
                <Search className="w-4 h-4 text-[#f4a496] flex-shrink-0" />
                <span className="truncate flex-1">{t.topbar.searchPlaceholder}</span>
                <kbd className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-neutral-300">
                  ⌘K
                </kbd>
              </button>
            </div>

            {/* Topbar Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Prototype Mode Indicator */}
              <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#842b45]/30 border border-[#f4a496]/30 text-[#fcdcd4] text-[11px] font-medium shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-[#f4a496]" />
                <span>{t.topbar.prototypeBadge}</span>
              </div>

              {/* Language Switcher */}
              <button
                onClick={toggleLang}
                className="px-3 py-1.5 rounded-full glass-panel-subtle hover:border-[#f4a496]/40 text-xs font-semibold text-neutral-200 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
                title={lang === 'en' ? 'التبديل إلى العربية' : 'Switch to English'}
              >
                <Globe className="w-3.5 h-3.5 text-[#f4a496]" />
                <span>{lang === 'en' ? 'عربي' : 'EN'}</span>
              </button>

              {/* Notifications Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="p-2 rounded-xl glass-panel-subtle hover:border-[#f4a496]/40 text-neutral-300 hover:text-white transition-all relative cursor-pointer"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#f4a496] ring-2 ring-[#09070c] animate-pulse" />
                  )}
                </button>

                {isNotificationsOpen && (
                  <div
                    className={`absolute mt-2 w-80 rounded-2xl glass-panel-active border border-[#f4a496]/30 shadow-2xl shadow-black/90 p-3 z-50 animate-fadeIn ${
                      lang === 'ar' ? 'left-0' : 'right-0'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-white/5 px-2">
                      <span className="text-xs font-mono uppercase tracking-widest text-[#f4a496]/90">
                        {t.topbar.notifications}
                      </span>
                      <span className="text-[10px] text-[#fcdcd4] font-semibold bg-[#842b45]/40 border border-[#f4a496]/30 px-2 py-0.5 rounded-full">
                        {unreadCount} new
                      </span>
                    </div>
                    <div className="py-1 space-y-1 max-h-64 overflow-y-auto modal-scrollbar">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className="p-2.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          <div className="text-xs font-semibold text-white flex items-center justify-between">
                            <span>{lang === 'ar' ? n.titleAr : n.titleEn}</span>
                            <span className="text-[10px] text-neutral-500 font-light">{n.time}</span>
                          </div>
                          <p className="text-[11px] text-neutral-400 mt-1 font-light leading-relaxed">
                            {lang === 'ar' ? n.descAr : n.descEn}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile Avatar / Menu */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-full glass-panel-subtle hover:border-[#f4a496]/40 transition-all cursor-pointer"
                >
                  <img
                    src="/assets/aistudio/Cinematic_Designer_About_Me_Portfolio_c9684d8c.png"
                    alt="Hosam Maher"
                    className="w-7 h-7 rounded-full object-cover border border-[#f4a496]/40"
                  />
                  <span className="hidden sm:inline-block text-xs font-medium text-white">
                    {settings.profile?.name || 'Hosam Maher'}
                  </span>
                </button>

                {isProfileMenuOpen && (
                  <div
                    className={`absolute mt-2 w-56 rounded-2xl glass-panel-active border border-[#f4a496]/30 shadow-2xl shadow-black/90 p-2 z-50 animate-fadeIn ${
                      lang === 'ar' ? 'left-0' : 'right-0'
                    }`}
                  >
                    <div className="px-3 py-2 border-b border-white/5">
                      <div className="text-xs font-serif font-bold text-white">
                        {settings.profile?.name || 'Hosam Maher'}
                      </div>
                      <div className="text-[10px] text-neutral-400 truncate">
                        {settings.profile?.email || 'hosam.maher48@gmail.com'}
                      </div>
                    </div>
                    <div className="pt-1 space-y-0.5">
                      <button
                        onClick={() => {
                          navigateAdmin('/admin/settings');
                          setIsProfileMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-neutral-300 hover:text-white hover:bg-white/5 text-left rtl:text-right cursor-pointer"
                      >
                        <Settings className="w-3.5 h-3.5 text-[#f4a496]" />
                        <span>{t.nav.settings}</span>
                      </button>
                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#f4a496] hover:bg-[#842b45]/20 text-left rtl:text-right cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{t.nav.logout}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* PAGE MAIN CONTENT */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-72 bg-[#120a17] border-r border-[#f4a496]/20 h-full flex flex-col p-4 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#842b45] to-[#421a28] border border-[#f4a496]/40 flex items-center justify-center text-[#fcdcd4] font-serif font-bold text-sm">
                  GD
                </div>
                <span className="font-serif font-bold text-sm text-white">Hosam Studio</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const active = isActive(item.path);
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavClick(item.path)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left rtl:text-right ${
                      active
                        ? 'glass-panel-active text-[#fcdcd4] font-semibold border border-[#f4a496]/30'
                        : 'text-neutral-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-[#f4a496]' : 'text-neutral-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="pt-3 border-t border-white/10 space-y-2">
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-neutral-300 hover:text-white glass-panel-subtle"
              >
                <ExternalLink className="w-4 h-4 text-[#f4a496]" />
                <span>{t.nav.publicSite}</span>
              </a>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#f4a496] hover:bg-[#842b45]/20"
              >
                <LogOut className="w-4 h-4" />
                <span>{t.nav.logout}</span>
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Global ⌘K Command Palette Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Global Toast Notification System */}
      <ToastContainer />
    </div>
  );
}
