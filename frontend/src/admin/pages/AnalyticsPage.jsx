import React, { useState } from 'react';
import {
  BarChart3,
  Users,
  Eye,
  Clock,
  ExternalLink,
  ArrowUpRight,
  TrendingUp,
  Globe,
  Smartphone,
  Laptop,
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext.jsx';
import { StatCard } from '../components/StatCard.jsx';
import { DEMO_ANALYTICS } from '../data/adminData.js';

export function AnalyticsPage() {
  const { lang, t, projects } = useAdmin();
  const [dateRange, setDateRange] = useState('30d'); // '7d' | '30d' | '90d' | '1y'

  const multiplier = dateRange === '7d' ? 0.35 : dateRange === '30d' ? 1 : dateRange === '90d' ? 2.6 : 8.4;
  const visitors = Math.round(4890 * multiplier);
  const impressions = Math.round(18620 * multiplier);

  const topProjects = [...projects]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5);

  const chartData = DEMO_ANALYTICS.dailyViews;
  const maxViews = Math.max(...chartData.map((d) => d.views));
  const svgWidth = 720;
  const svgHeight = 200;
  const padding = 25;

  const points = chartData.map((d, index) => {
    const x = padding + (index / (chartData.length - 1)) * (svgWidth - padding * 2);
    const y = svgHeight - padding - (d.views / maxViews) * (svgHeight - padding * 2);
    return `${x},${y}`;
  }).join(' ');

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

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t.analytics.totalVisitors}
          value={visitors.toLocaleString()}
          change="+28.4%"
          icon={Users}
          description="Verified unique sessions"
        />
        <StatCard
          title={t.analytics.projectImpressions}
          value={impressions.toLocaleString()}
          change="+34.1%"
          icon={Eye}
          description="Case study modal opens"
        />
        <StatCard
          title={t.analytics.modalOpenRate}
          value="48.2%"
          change="+6.5%"
          icon={TrendingUp}
          description="High conversion on Selected Work"
        />
        <StatCard
          title={t.analytics.avgTimeOnSite}
          value="3m 48s"
          change="+14.2%"
          icon={Clock}
          description="In-depth portfolio reading"
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
              {lang === 'ar' ? 'مؤشرات يومية للزيارات والمشاهدات' : 'Daily trends for case study visits'}
            </p>
          </div>
          <span className="text-xs font-mono text-[#fcdcd4] bg-[#842b45]/30 border border-[#f4a496]/35 px-3 py-1 rounded-full shadow-sm">
            +32% vs prior cycle
          </span>
        </div>

        <div className="w-full overflow-x-auto py-2">
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
            <polygon points={areaPoints} fill="url(#analyticsGradient)" />

            {/* Line */}
            <polyline
              fill="none"
              stroke="#f4a496"
              strokeWidth="2.5"
              points={points}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Points */}
            {chartData.map((d, index) => {
              const x = padding + (index / (chartData.length - 1)) * (svgWidth - padding * 2);
              const y = svgHeight - padding - (d.views / maxViews) * (svgHeight - padding * 2);
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
                  <title>{`${d.date}: ${d.views} views (${d.visitors} visitors)`}</title>
                </circle>
              );
            })}
          </svg>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-white/5 text-[11px] text-neutral-400 font-mono">
          {chartData.map((d, i) => (
            i % 2 === 0 ? <span key={d.date}>{d.date}</span> : null
          ))}
        </div>
      </div>

      {/* Dual Grid: Traffic Sources & Top Performing Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Sources */}
        <div className="p-6 sm:p-7 rounded-3xl glass-panel border border-[#f4a496]/15 shadow-xl space-y-4">
          <h2 className="text-base sm:text-lg font-serif font-bold text-white">{t.analytics.trafficSources}</h2>
          <div className="space-y-4">
            {DEMO_ANALYTICS.trafficSources.map((item) => (
              <div key={item.source} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-white">{item.source}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-400 font-mono">{item.count}</span>
                    <span className="text-emerald-400 font-medium">{item.change}</span>
                  </div>
                </div>

                <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/5">
                  <div
                    className="bg-gradient-to-r from-[#842b45] to-[#f4a496] h-full rounded-full"
                    style={{ width: `${item.share}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Projects Leaderboard */}
        <div className="p-6 sm:p-7 rounded-3xl glass-panel border border-[#f4a496]/15 shadow-xl space-y-4">
          <h2 className="text-base sm:text-lg font-serif font-bold text-white">{t.analytics.topProjects}</h2>
          <div className="space-y-3">
            {topProjects.map((p, idx) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 rounded-2xl glass-panel-subtle hover:border-[#f4a496]/35 transition-all"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className="w-6 text-center font-bold font-serif text-[#f4a496] text-sm">
                    #{idx + 1}
                  </span>
                  <img
                    src={p.coverImage || p.image}
                    alt={p.titleEn || 'Thumbnail'}
                    className="w-11 h-11 rounded-xl object-cover border border-[#f4a496]/20 flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-serif font-bold text-white truncate">
                      {lang === 'ar' ? p.titleAr : p.titleEn}
                    </div>
                    <div className="text-[11px] text-neutral-400 font-light truncate">
                      {lang === 'ar' ? p.categoryAr : p.categoryEn}
                    </div>
                  </div>
                </div>

                <div className="text-right rtl:text-left">
                  <div className="text-xs font-mono font-bold text-[#fcdcd4]">
                    {p.views?.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-neutral-500 font-light">{lang === 'ar' ? 'مشاهدة' : 'views'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
