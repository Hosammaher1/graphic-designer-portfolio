import React, { useState, useEffect } from 'react';
import {
  Users,
  Eye,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext.jsx';
import { StatCard } from '../components/StatCard.jsx';

export function AnalyticsPage() {
  const {
    lang,
    t,
    projects,
    analyticsOverview,
    topAnalyticsProjects,
    trafficSources,
    fetchAnalytics,
  } = useAdmin();

  const [dateRange, setDateRange] = useState('30d'); // '7d' | '30d' | '90d' | '1y'

  // Refetch analytics whenever user selects another date range
  useEffect(() => {
    fetchAnalytics(dateRange);
  }, [dateRange, fetchAnalytics]);

  // Real aggregate numbers from API
  const visitors = analyticsOverview?.summary?.unique_visitors ?? 0;
  const impressions =
    analyticsOverview?.summary?.total_views !== undefined
      ? analyticsOverview.summary.total_views
      : projects.reduce((acc, curr) => acc + (curr.views || 0), 0);

  const viewsChangePercentage = analyticsOverview?.previous_period?.views_change_percentage ?? null;

  // Real projects for the leaderboard: API topProjects or fallback to active projects sorted by views
  const leaderboardProjects =
    Array.isArray(topAnalyticsProjects) && topAnalyticsProjects.length > 0
      ? topAnalyticsProjects.slice(0, 5)
      : [...projects].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);

  const chartData = analyticsOverview?.daily_trend || [];
  const maxViews = chartData.length > 0 ? Math.max(...chartData.map((d) => d.total_views || 0), 0) : 0;
  const hasTrafficData = maxViews > 0;
  const svgWidth = 720;
  const svgHeight = 200;
  const padding = 25;

  const points = chartData.length > 0
    ? chartData.map((d, index) => {
        const x = padding + (index / Math.max(1, chartData.length - 1)) * (svgWidth - padding * 2);
        const y = hasTrafficData
          ? svgHeight - padding - ((d.total_views || 0) / maxViews) * (svgHeight - padding * 2)
          : svgHeight - padding;
        return `${x},${y}`;
      }).join(' ')
    : `${padding},${svgHeight - padding} ${svgWidth - padding},${svgHeight - padding}`;

  const areaPoints = `${padding},${svgHeight - padding} ${points} ${svgWidth - padding},${svgHeight - padding}`;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header & Date Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#f4a496]/15">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-[#f4a496]/80 mb-1">
            {lang === 'ar' ? 'تحليلات الأداء والجمهور' : 'Audience Analytics & Insights'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-normal tracking-tight text-white font-serif">
            <span>{t.analytics.title} </span>
            <span className="text-[#f4a496] italic font-serif">Intelligence</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 font-light">
            {t.analytics.subtitle}
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center rounded-full glass-panel-subtle border border-white/10 p-1 self-start sm:self-auto">
          {['7d', '30d', '90d', '1y'].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                dateRange === range
                  ? 'bg-[#842b45]/40 text-[#fcdcd4] border border-[#f4a496]/40 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {t.analytics[`range${range}`]}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Row (Real metrics without fabricated numbers) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t.analytics.totalVisitors}
          value={visitors.toLocaleString()}
          change={null}
          icon={Users}
          description={lang === 'ar' ? 'جلسات فريدة تم التحقق منها' : 'Verified unique sessions'}
        />
        <StatCard
          title={t.analytics.projectImpressions}
          value={impressions.toLocaleString()}
          change={viewsChangePercentage !== null && viewsChangePercentage !== 0 ? `${viewsChangePercentage > 0 ? '+' : ''}${viewsChangePercentage}%` : null}
          icon={Eye}
          description={lang === 'ar' ? 'إجمالي مشاهدات المشاريع' : 'Case study modal views'}
        />
        <StatCard
          title={t.analytics.modalOpenRate}
          value="0%"
          change={null}
          icon={TrendingUp}
          description={lang === 'ar' ? 'معدل فتح النوافذ التفاعلية' : 'Interactive modal open rate'}
        />
        <StatCard
          title={t.analytics.avgTimeOnSite}
          value={lang === 'ar' ? 'غير متوفر' : 'Not available'}
          change={null}
          icon={Clock}
          description={lang === 'ar' ? 'يتطلب تفعيل قياس البقاء' : 'Telemetry not collected'}
        />
      </div>

      {/* Main Interactive Chart */}
      <div className="p-6 sm:p-7 rounded-3xl glass-panel border border-[#f4a496]/15 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-serif font-bold text-white">
              {lang === 'ar' ? 'نمو المشاهدات والتفاعل التراكمي' : 'Traffic Growth & Audience Engagement'}
            </h2>
            <p className="text-xs text-neutral-400 font-light mt-0.5">
              {hasTrafficData
                ? (lang === 'ar' ? 'مؤشرات يومية للزيارات والمشاهدات المسجلة' : 'Daily trends for case study visits')
                : (lang === 'ar' ? 'بانتظار تسجيل أولى الزيارات' : 'Awaiting visitor traffic events')}
            </p>
          </div>
          {viewsChangePercentage !== null && viewsChangePercentage !== 0 && (
            <span className="text-xs font-mono text-[#fcdcd4] bg-[#842b45]/30 border border-[#f4a496]/35 px-3 py-1 rounded-full shadow-sm">
              {viewsChangePercentage > 0 ? '+' : ''}{viewsChangePercentage}% vs prior cycle
            </span>
          )}
        </div>

        <div className="w-full overflow-x-auto py-2 relative">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-48 overflow-visible">
            <defs>
              <linearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f4a496" stopOpacity="0.4" />
                <stop offset="60%" stopColor="#842b45" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#842b45" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid */}
            <line x1="25" y1="40" x2="695" y2="40" stroke="rgba(244,164,150,0.08)" strokeDasharray="4" />
            <line x1="25" y1="100" x2="695" y2="100" stroke="rgba(244,164,150,0.08)" strokeDasharray="4" />
            <line x1="25" y1="160" x2="695" y2="160" stroke="rgba(244,164,150,0.08)" strokeDasharray="4" />

            {/* Fill */}
            {hasTrafficData && <polygon points={areaPoints} fill="url(#analyticsGradient)" />}

            {/* Line */}
            <polyline
              fill="none"
              stroke={hasTrafficData ? '#f4a496' : 'rgba(244,164,150,0.25)'}
              strokeWidth="2.5"
              points={points}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Points */}
            {hasTrafficData &&
              chartData.map((d, index) => {
                const x = padding + (index / Math.max(1, chartData.length - 1)) * (svgWidth - padding * 2);
                const y = svgHeight - padding - ((d.total_views || 0) / maxViews) * (svgHeight - padding * 2);
                return (
                  <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r="3.5"
                    fill="#fff"
                    stroke="#842b45"
                    strokeWidth="2"
                    className="hover:scale-150 transition-transform cursor-pointer"
                  >
                    <title>{`${d.date}: ${d.total_views || 0} views (${d.unique_visitors || 0} visitors)`}</title>
                  </circle>
                );
              })}
          </svg>

          {!hasTrafficData && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-xs text-neutral-400 font-light bg-black/60 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-sm">
                {lang === 'ar' ? 'لا توجد بيانات تفاعل وزيارات مسجلة لهذه الفترة بعد' : 'No traffic activity recorded for this period yet'}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-white/5 text-[11px] text-neutral-400 font-mono">
          {chartData.map((d, i) =>
            i % 2 === 0 ? <span key={d.date}>{d.date}</span> : null
          )}
        </div>
      </div>

      {/* Dual Grid: Traffic Sources & Top Performing Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Sources */}
        <div className="p-6 sm:p-7 rounded-3xl glass-panel border border-[#f4a496]/15 shadow-xl space-y-4">
          <h2 className="text-base sm:text-lg font-serif font-bold text-white">{t.analytics.trafficSources}</h2>
          <div className="space-y-4">
            {Array.isArray(trafficSources) && trafficSources.length > 0 ? (
              trafficSources.map((item) => (
                <div key={item.name || item.source} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-white">{item.name || item.source}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-400 font-mono">
                        {(item.views || 0).toLocaleString()} {lang === 'ar' ? 'زيارة' : 'views'}
                      </span>
                      <span className="text-emerald-400 font-medium">
                        {item.percentage ? `${item.percentage}%` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/5">
                    <div
                      className="bg-gradient-to-r from-[#842b45] to-[#f4a496] h-full rounded-full"
                      style={{ width: `${Math.min(100, item.percentage || 0)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center glass-panel-subtle rounded-2xl border border-white/5">
                <p className="text-xs text-neutral-400 font-light">
                  {lang === 'ar' ? 'لا توجد مصادر إحالة مسجلة لهذه الفترة بعد.' : 'No traffic referral sources recorded yet.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Top Projects Leaderboard */}
        <div className="p-6 sm:p-7 rounded-3xl glass-panel border border-[#f4a496]/15 shadow-xl space-y-4">
          <h2 className="text-base sm:text-lg font-serif font-bold text-white">{t.analytics.topProjects}</h2>
          <div className="space-y-3">
            {leaderboardProjects.length > 0 ? (
              leaderboardProjects.map((p, idx) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-2xl glass-panel-subtle hover:border-[#f4a496]/35 transition-all"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="w-6 text-center font-bold font-serif text-[#f4a496] text-sm">
                      #{idx + 1}
                    </span>
                    <img
                      src={p.cover_url || p.coverImage || p.image || '/assets/aistudio/Selected_Work__Noya_Skincare_Portfolio_6434c76f.png'}
                      alt={p.titleEn || p.title || 'Thumbnail'}
                      className="w-11 h-11 rounded-xl object-cover border border-[#f4a496]/20 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-serif font-bold text-white truncate">
                        {lang === 'ar' ? (p.titleAr || p.title) : (p.titleEn || p.title)}
                      </div>
                      <div className="text-[11px] text-neutral-400 font-light truncate">
                        {lang === 'ar' ? (p.categoryAr || 'هوية بصرية') : (p.categoryEn || 'Branding')}
                      </div>
                    </div>
                  </div>

                  <div className="text-right rtl:text-left">
                    <div className="text-xs font-mono font-bold text-[#fcdcd4]">
                      {(p.views || 0).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-neutral-500 font-light">{lang === 'ar' ? 'مشاهدة' : 'views'}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center glass-panel-subtle rounded-2xl border border-white/5">
                <p className="text-xs text-neutral-400 font-light">
                  {lang === 'ar' ? 'لا توجد مشاريع لعرضها.' : 'No projects available for analytics.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
