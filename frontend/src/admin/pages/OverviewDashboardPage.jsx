import React from 'react';
import {
  FolderKanban,
  FileCheck,
  FileEdit,
  Eye,
  Users,
  Clock,
  Plus,
  Upload,
  Layout,
  BarChart3,
  ArrowUpRight,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext.jsx';
import { StatCard } from '../components/StatCard.jsx';
import { Badge } from '../components/Badge.jsx';
import { DEMO_ANALYTICS } from '../data/adminData.js';

export function OverviewDashboardPage() {
  const { lang, t, projects, activities, navigateAdmin } = useAdmin();

  const totalCount = projects.length;
  const publishedCount = projects.filter((p) => p.status === 'published').length;
  const draftCount = projects.filter((p) => p.status === 'draft').length;
  const totalViews = projects.reduce((acc, curr) => acc + (curr.views || 0), 12480);

  const recentProjects = [...projects].slice(0, 4);
  const popularProjects = [...projects].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 4);

  // SVG Chart points calculation for the 14-day views
  const chartData = DEMO_ANALYTICS.dailyViews;
  const maxViews = Math.max(...chartData.map((d) => d.views));
  const svgWidth = 700;
  const svgHeight = 180;
  const padding = 20;

  const points = chartData.map((d, index) => {
    const x = padding + (index / (chartData.length - 1)) * (svgWidth - padding * 2);
    const y = svgHeight - padding - (d.views / maxViews) * (svgHeight - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `${padding},${svgHeight - padding} ${points} ${svgWidth - padding},${svgHeight - padding}`;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#f4a496]/15">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-[#f4a496]/80 mb-1">
            {lang === 'ar' ? 'نظرة عامة على النشاط' : 'Portfolio Performance'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-normal tracking-tight text-white font-serif">
            <span>{t.overview.title} </span>
            <span className="text-[#f4a496] italic font-serif">Studio</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 font-light">
            {t.overview.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateAdmin('/admin/media')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-medium text-neutral-300 hover:text-white glass-panel hover:border-[#f4a496]/40 transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4 text-[#f4a496]" />
            <span>{t.overview.uploadMediaBtn}</span>
          </button>

          <button
            onClick={() => navigateAdmin('/admin/projects/new')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold text-[#fcdcd4] bg-gradient-to-r from-[#842b45] to-[#591b2e] hover:from-[#9c3252] border border-[#f4a496]/40 transition-all shadow-lg shadow-black/50 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 text-[#f4a496]" />
            <span>{t.overview.newProjectBtn}</span>
          </button>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t.overview.statTotalProjects}
          value={totalCount}
          change="+3 new"
          icon={FolderKanban}
          description={`${publishedCount} ${t.projects.statusPublished} • ${draftCount} ${t.projects.statusDraft}`}
        />
        <StatCard
          title={t.overview.statViews}
          value={totalViews.toLocaleString()}
          change="+24.6%"
          icon={Eye}
          description="High engagement from Behance"
        />
        <StatCard
          title={t.overview.statVisitors}
          value="4,890"
          change="+18.2%"
          icon={Users}
          description="Unique global visitors"
        />
        <StatCard
          title={t.overview.statAvgTime}
          value="3m 42s"
          change="+12.4%"
          icon={Clock}
          description="Portfolio case study depth"
        />
      </div>

      {/* Analytics Graph & Quick Actions Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual Chart Card */}
        <div className="lg:col-span-2 p-6 sm:p-7 rounded-3xl glass-panel border border-[#f4a496]/15 shadow-xl shadow-black/60 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#f4a496]/80 mb-0.5">
                {lang === 'ar' ? 'التحليلات اللحظية' : 'Real-time Metrics'}
              </div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-white">{t.overview.viewsGraphTitle}</h2>
              <p className="text-xs text-neutral-400 font-light mt-0.5">Peak interaction during luxury packaging release</p>
            </div>
            <button
              onClick={() => navigateAdmin('/admin/analytics')}
              className="text-xs text-[#f4a496] hover:text-[#fcdcd4] flex items-center gap-1 cursor-pointer font-medium glass-panel-subtle px-3 py-1.5 rounded-full hover:border-[#f4a496]/40 transition-colors"
            >
              <span>{t.overview.viewAnalyticsBtn}</span>
              <ArrowUpRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </button>
          </div>

          {/* Responsive SVG Chart */}
          <div className="w-full overflow-x-auto py-2">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-44 overflow-visible">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f4a496" stopOpacity="0.4" />
                  <stop offset="50%" stopColor="#842b45" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#842b45" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="20" y1="30" x2="680" y2="30" stroke="rgba(244,164,150,0.08)" strokeDasharray="4" />
              <line x1="20" y1="90" x2="680" y2="90" stroke="rgba(244,164,150,0.08)" strokeDasharray="4" />
              <line x1="20" y1="150" x2="680" y2="150" stroke="rgba(244,164,150,0.08)" strokeDasharray="4" />

              {/* Gradient Fill Area */}
              <polygon points={areaPoints} fill="url(#chartGradient)" />

              {/* Glowing Line */}
              <polyline
                fill="none"
                stroke="#f4a496"
                strokeWidth="2.5"
                points={points}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Interactive Dots on high points */}
              {chartData.map((d, index) => {
                const x = padding + (index / (chartData.length - 1)) * (svgWidth - padding * 2);
                const y = svgHeight - padding - (d.views / maxViews) * (svgHeight - padding * 2);
                return (
                  <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r={index === chartData.length - 1 ? '4' : '2.5'}
                    fill="#fff"
                    stroke="#842b45"
                    strokeWidth="2"
                    className="hover:scale-150 transition-transform cursor-pointer"
                  >
                    <title>{`${d.date}: ${d.views} views (${d.visitors} visitors)`}</title>
                  </circle>
                );
              })}
            </svg>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-white/5 text-[11px] text-neutral-400 font-mono">
            <span>{chartData[0].date}</span>
            <span>{chartData[Math.floor(chartData.length / 2)].date}</span>
            <span className="text-[#f4a496] font-semibold">{chartData[chartData.length - 1].date} ({chartData[chartData.length - 1].views} views)</span>
          </div>
        </div>

        {/* Quick Actions & Short Studio Status */}
        <div className="p-6 sm:p-7 rounded-3xl glass-panel border border-[#f4a496]/15 shadow-xl shadow-black/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-[#f4a496]" />
              <h2 className="text-base font-serif font-bold text-white">{t.overview.quickActions}</h2>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={() => navigateAdmin('/admin/projects/new')}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl glass-panel-subtle hover:border-[#f4a496]/35 text-neutral-200 transition-all text-xs font-medium cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-[#842b45]/30 text-[#f4a496]">
                    <Plus className="w-4 h-4" />
                  </div>
                  <span>{t.overview.newProjectBtn}</span>
                </div>
                <span className="text-neutral-500 group-hover:text-[#f4a496] rtl:rotate-180 transition-colors">→</span>
              </button>

              <button
                onClick={() => navigateAdmin('/admin/pages')}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl glass-panel-subtle hover:border-[#f4a496]/35 text-neutral-200 transition-all text-xs font-medium cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-[#842b45]/30 text-[#f4a496]">
                    <Layout className="w-4 h-4" />
                  </div>
                  <span>{t.overview.managePagesBtn}</span>
                </div>
                <span className="text-neutral-500 group-hover:text-[#f4a496] rtl:rotate-180 transition-colors">→</span>
              </button>

              <button
                onClick={() => navigateAdmin('/admin/media')}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl glass-panel-subtle hover:border-[#f4a496]/35 text-neutral-200 transition-all text-xs font-medium cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-[#842b45]/30 text-[#f4a496]">
                    <Upload className="w-4 h-4" />
                  </div>
                  <span>{t.overview.uploadMediaBtn}</span>
                </div>
                <span className="text-neutral-500 group-hover:text-[#f4a496] rtl:rotate-180 transition-colors">→</span>
              </button>
            </div>
          </div>

          {/* Activity Feed Preview */}
          <div className="mt-6 pt-4 border-t border-white/5">
            <h3 className="text-[11px] font-mono uppercase tracking-widest text-[#f4a496]/80 mb-3">
              {t.overview.recentActivity}
            </h3>
            <div className="space-y-2.5">
              {activities.slice(0, 3).map((act) => (
                <div key={act.id} className="text-xs">
                  <div className="text-neutral-300 leading-snug font-light">
                    {lang === 'ar' ? act.textAr : act.textEn}
                  </div>
                  <div className="text-[10px] text-neutral-500 font-mono mt-0.5">{act.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dual Column: Recent Projects and Most Viewed Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <div className="p-6 sm:p-7 rounded-3xl glass-panel border border-[#f4a496]/15 shadow-xl shadow-black/60">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base sm:text-lg font-serif font-bold text-white">{t.overview.recentProjects}</h2>
            <button
              onClick={() => navigateAdmin('/admin/projects')}
              className="text-xs text-[#f4a496] hover:text-[#fcdcd4] font-medium cursor-pointer"
            >
              {t.overview.viewAll} →
            </button>
          </div>

          <div className="space-y-3">
            {recentProjects.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 rounded-2xl glass-panel-subtle hover:border-[#f4a496]/35 transition-all group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <img
                    src={p.coverImage || p.image}
                    alt={p.titleEn || 'Project thumbnail'}
                    className="w-12 h-12 rounded-xl object-cover border border-[#f4a496]/20 flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-serif font-bold text-white truncate group-hover:text-[#f4a496] transition-colors">
                      {lang === 'ar' ? p.titleAr : p.titleEn}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={p.status} size="sm">
                        {p.status === 'published' ? t.projects.statusPublished : t.projects.statusDraft}
                      </Badge>
                      <span className="text-[11px] text-neutral-400 font-light">
                        {lang === 'ar' ? p.categoryAr : p.categoryEn}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigateAdmin(`/admin/projects/${p.id}/edit`)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium text-[#fcdcd4] bg-[#842b45]/25 hover:bg-[#842b45]/45 border border-[#f4a496]/30 transition-colors cursor-pointer"
                  >
                    {t.overview.edit}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Projects */}
        <div className="p-6 sm:p-7 rounded-3xl glass-panel border border-[#f4a496]/15 shadow-xl shadow-black/60">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base sm:text-lg font-serif font-bold text-white">{t.overview.popularProjects}</h2>
            <button
              onClick={() => navigateAdmin('/admin/analytics')}
              className="text-xs text-[#f4a496] hover:text-[#fcdcd4] font-medium cursor-pointer"
            >
              {t.overview.viewAll} →
            </button>
          </div>

          <div className="space-y-3">
            {popularProjects.map((p, rank) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 rounded-2xl glass-panel-subtle hover:border-[#f4a496]/35 transition-all"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-6 text-center font-bold font-serif text-[#f4a496] text-sm">
                    #{rank + 1}
                  </div>
                  <img
                    src={p.coverImage || p.image}
                    alt={p.titleEn || 'Popular project'}
                    className="w-12 h-12 rounded-xl object-cover border border-[#f4a496]/20 flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-serif font-bold text-white truncate">
                      {lang === 'ar' ? p.titleAr : p.titleEn}
                    </div>
                    <div className="text-[11px] text-neutral-400 font-light mt-0.5">
                      {p.views?.toLocaleString()} {lang === 'ar' ? 'مشاهدة' : 'views'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {p.featured && (
                    <Badge variant="featured" size="sm">
                      {t.projects.featuredBadge.split(' ')[0]}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
