import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Eye,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Calendar,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Table as TableIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function DashboardPage() {
  const { user } = useAuth();

  const [range, setRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [overview, setOverview] = useState(null);
  const [topProjects, setTopProjects] = useState([]);
  const [trafficSources, setTrafficSources] = useState({ categories: [], domains: [] });
  const [devices, setDevices] = useState([]);
  const [showDataTable, setShowDataTable] = useState(false);

  const fetchAnalytics = useCallback(async (selectedRange) => {
    setLoading(true);
    setError(null);

    try {
      const [overviewRes, projectsRes, trafficRes, devicesRes] = await Promise.all([
        fetch(`/api/v1/admin/analytics/overview?range=${selectedRange}`, {
          headers: { Accept: 'application/json' },
          credentials: 'include',
        }),
        fetch(`/api/v1/admin/analytics/top-projects?range=${selectedRange}&limit=5`, {
          headers: { Accept: 'application/json' },
          credentials: 'include',
        }),
        fetch(`/api/v1/admin/analytics/traffic-sources?range=${selectedRange}`, {
          headers: { Accept: 'application/json' },
          credentials: 'include',
        }),
        fetch(`/api/v1/admin/analytics/devices?range=${selectedRange}`, {
          headers: { Accept: 'application/json' },
          credentials: 'include',
        }),
      ]);

      if (!overviewRes.ok || !projectsRes.ok || !trafficRes.ok || !devicesRes.ok) {
        throw new Error('Failed to load analytics data from server');
      }

      const [overviewJson, projectsJson, trafficJson, devicesJson] = await Promise.all([
        overviewRes.json(),
        projectsRes.json(),
        trafficRes.json(),
        devicesRes.json(),
      ]);

      setOverview(overviewJson.data || null);
      setTopProjects(projectsJson.data?.projects || []);
      setTrafficSources(trafficJson.data || { categories: [], domains: [] });
      setDevices(devicesJson.data?.devices || []);
    } catch (err) {
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics(range);
  }, [range, fetchAnalytics]);

  const handleRangeChange = (newRange) => {
    if (newRange !== range) {
      setRange(newRange);
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num || 0);
  };

  const renderTrendSvg = (trendData) => {
    if (!trendData || trendData.length === 0) return null;

    const width = 800;
    const height = 240;
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };

    const maxViews = Math.max(1, ...trendData.map((d) => d.total_views));
    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;

    const stepX = trendData.length > 1 ? innerWidth / (trendData.length - 1) : innerWidth;

    const viewsPoints = trendData.map((d, idx) => {
      const x = padding.left + idx * stepX;
      const y = padding.top + innerHeight - (d.total_views / maxViews) * innerHeight;
      return `${x},${y}`;
    });

    const visitorsPoints = trendData.map((d, idx) => {
      const x = padding.left + idx * stepX;
      const y = padding.top + innerHeight - (d.unique_visitors / maxViews) * innerHeight;
      return `${x},${y}`;
    });

    return (
      <svg
        role="img"
        aria-label="Daily visits and unique visitors trend chart"
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible select-none"
      >
        {/* Horizontal gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = padding.top + innerHeight * (1 - ratio);
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="var(--color-border,#27272a)"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={padding.left - 8}
                y={y + 4}
                textAnchor="end"
                className="text-[10px] fill-[var(--color-text-muted,#71717a)]"
              >
                {Math.round(maxViews * ratio)}
              </text>
            </g>
          );
        })}

        {/* Views Area & Line */}
        <polyline
          fill="none"
          stroke="#3b82f6"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={viewsPoints.join(' ')}
        />

        {/* Unique Visitors Line */}
        <polyline
          fill="none"
          stroke="#a855f7"
          strokeWidth="2.5"
          strokeDasharray="4 2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={visitorsPoints.join(' ')}
        />

        {/* Data points */}
        {trendData.map((d, idx) => {
          const x = padding.left + idx * stepX;
          const yViews = padding.top + innerHeight - (d.total_views / maxViews) * innerHeight;
          const yVisitors = padding.top + innerHeight - (d.unique_visitors / maxViews) * innerHeight;

          return (
            <g key={d.date} className="group">
              <circle cx={x} cy={yViews} r="4" fill="#3b82f6" className="transition-transform group-hover:r-6" />
              <circle cx={x} cy={yVisitors} r="3" fill="#a855f7" />
              {/* X-axis labels for sparse points */}
              {(idx === 0 || idx === Math.floor(trendData.length / 2) || idx === trendData.length - 1) && (
                <text
                  x={x}
                  y={height - 10}
                  textAnchor="middle"
                  className="text-[11px] fill-[var(--color-text-muted,#71717a)]"
                >
                  {d.date.substring(5)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="admin-dashboard-page p-6 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Page Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--color-border,#27272a)] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--color-text,#fafafa)]">
              لوحة التحكم والتحليلات
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950/40 text-emerald-400 border border-emerald-800/50">
              <ShieldCheck size={14} aria-hidden="true" />
              <span>خصوصية معتمدة (No Raw IP)</span>
            </span>
          </div>
          <p className="text-sm text-[var(--color-text-muted,#a1a1aa)] mt-1">
            مرحباً بك، {user?.name || 'المدير'} ({user?.email}) — تقرير الزيارات والتفاعل
          </p>
        </div>

        {/* Range Selector Controls */}
        <div className="flex items-center gap-2 bg-[var(--color-surface,#18181b)] p-1 rounded-xl border border-[var(--color-border,#27272a)] self-start md:self-auto">
          {[
            { id: '7d', label: '7 أيام' },
            { id: '30d', label: '30 يوماً' },
            { id: '90d', label: '90 يوماً' },
          ].map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => handleRangeChange(r.id)}
              aria-pressed={range === r.id}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                range === r.id
                  ? 'bg-[var(--color-primary,#3b82f6)] text-white shadow-sm'
                  : 'text-[var(--color-text-muted,#a1a1aa)] hover:text-[var(--color-text,#fafafa)] hover:bg-[var(--color-surface-hover,#202023)]'
              }`}
            >
              {r.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => fetchAnalytics(range)}
            aria-label="تحديث البيانات"
            className="p-1.5 text-[var(--color-text-muted,#a1a1aa)] hover:text-[var(--color-text,#fafafa)] rounded-lg transition-colors ml-1"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Loading Skeleton */}
      {loading && !overview && (
        <div data-testid="analytics-loading" aria-busy="true" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-28 rounded-2xl bg-[var(--color-surface,#18181b)] border border-[var(--color-border,#27272a)] animate-pulse"
              />
            ))}
          </div>
          <div className="h-72 rounded-2xl bg-[var(--color-surface,#18181b)] border border-[var(--color-border,#27272a)] animate-pulse" />
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-red-950/40 border border-red-900/60 text-red-200 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="text-red-400 shrink-0" aria-hidden="true" />
            <span className="text-sm">failed to load analytics data: {error}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchAnalytics(range)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-900/40 hover:bg-red-800/50 text-red-100 border border-red-700/50 transition-colors shrink-0"
          >
            إعادة المحاولة (Retry)
          </button>
        </div>
      )}

      {/* Main Analytics Content */}
      {!loading && !error && overview && (
        <>
          {/* Summary Stat Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Views */}
            <div className="p-5 rounded-2xl bg-[var(--color-surface,#18181b)] border border-[var(--color-border,#27272a)] flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between text-[var(--color-text-muted,#a1a1aa)]">
                <span className="text-xs font-medium uppercase tracking-wider">إجمالي المشاهدات</span>
                <Eye size={18} className="text-[var(--color-primary,#3b82f6)]" aria-hidden="true" />
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <div className="text-2xl md:text-3xl font-extrabold text-[var(--color-text,#fafafa)]">
                  {formatNumber(overview.summary?.total_views)}
                </div>
                {overview.previous_period && (
                  <span
                    className={`text-xs font-semibold inline-flex items-center gap-0.5 ${
                      overview.previous_period.views_change_percentage >= 0
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {overview.previous_period.views_change_percentage >= 0 ? (
                      <ArrowUpRight size={14} aria-hidden="true" />
                    ) : (
                      <ArrowDownRight size={14} aria-hidden="true" />
                    )}
                    {Math.abs(overview.previous_period.views_change_percentage)}%
                  </span>
                )}
              </div>
              <span className="text-[11px] text-[var(--color-text-muted,#71717a)] mt-1">
                مقارنة بالفترة السابقة ({overview.previous_period?.days_count || range})
              </span>
            </div>

            {/* Card 2: Unique Visitors */}
            <div className="p-5 rounded-2xl bg-[var(--color-surface,#18181b)] border border-[var(--color-border,#27272a)] flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between text-[var(--color-text-muted,#a1a1aa)]">
                <span className="text-xs font-medium uppercase tracking-wider">الزوار الفريدين</span>
                <Users size={18} className="text-purple-400" aria-hidden="true" />
              </div>
              <div className="mt-3">
                <div className="text-2xl md:text-3xl font-extrabold text-[var(--color-text,#fafafa)]">
                  {formatNumber(overview.summary?.unique_visitors)}
                </div>
              </div>
              <span className="text-[11px] text-[var(--color-text-muted,#71717a)] mt-1">
                تقدير يومي مشفر عبر Salted Hash
              </span>
            </div>

            {/* Card 3: Top Project */}
            <div className="p-5 rounded-2xl bg-[var(--color-surface,#18181b)] border border-[var(--color-border,#27272a)] flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between text-[var(--color-text-muted,#a1a1aa)]">
                <span className="text-xs font-medium uppercase tracking-wider">المشروع الأكثر تفاعلاً</span>
                <Award size={18} className="text-amber-400" aria-hidden="true" />
              </div>
              <div className="mt-3">
                <div className="text-base font-bold text-[var(--color-text,#fafafa)] truncate">
                  {topProjects[0]?.title || 'لا توجد بيانات بعد'}
                </div>
              </div>
              <span className="text-[11px] text-[var(--color-text-muted,#71717a)] mt-1">
                {topProjects[0] ? `${formatNumber(topProjects[0].views)} مشاهدة` : 'في الفترة المختارة'}
              </span>
            </div>

            {/* Card 4: Top Traffic Category */}
            <div className="p-5 rounded-2xl bg-[var(--color-surface,#18181b)] border border-[var(--color-border,#27272a)] flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between text-[var(--color-text-muted,#a1a1aa)]">
                <span className="text-xs font-medium uppercase tracking-wider">المصدر الأساسي</span>
                <Globe size={18} className="text-cyan-400" aria-hidden="true" />
              </div>
              <div className="mt-3">
                <div className="text-base font-bold text-[var(--color-text,#fafafa)] capitalize">
                  {trafficSources?.categories?.[0]?.name || 'Direct'}
                </div>
              </div>
              <span className="text-[11px] text-[var(--color-text-muted,#71717a)] mt-1">
                {trafficSources?.categories?.[0]
                  ? `${trafficSources.categories[0].percentage}% من الزيارات`
                  : 'زيارات مباشرة'}
              </span>
            </div>
          </section>

          {/* Empty State Banner if no traffic in selected range */}
          {overview.summary?.total_views === 0 ? (
            <div className="p-8 rounded-2xl bg-[var(--color-surface,#18181b)] border border-[var(--color-border,#27272a)] text-center space-y-3">
              <BarChart3 size={40} className="mx-auto text-[var(--color-text-muted,#71717a)]" aria-hidden="true" />
              <h3 className="text-lg font-bold text-[var(--color-text,#fafafa)]">
                No analytics events recorded yet in this date range
              </h3>
              <p className="text-sm text-[var(--color-text-muted,#a1a1aa)] max-w-md mx-auto">
                لا توجد بيانات مسجلة في هذا النطاق الزمني حتى الآن. جرّب تغيير نطاق التاريخ أو تصفح الموقع بموافقة مفعلة.
              </p>
            </div>
          ) : (
            <>
              {/* Visits Trend Chart Card */}
              <section className="p-6 rounded-2xl bg-[var(--color-surface,#18181b)] border border-[var(--color-border,#27272a)] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-[var(--color-text,#fafafa)]">
                      مخطط حركة الزيارات اليومية
                    </h2>
                    <p className="text-xs text-[var(--color-text-muted,#a1a1aa)]">
                      تطور المشاهدات والزوار الفريدين على مدار الفترة ({overview.start_date} إلى {overview.end_date})
                    </p>
                  </div>

                  {/* Legend & Tabular Toggle */}
                  <div className="flex items-center gap-4 text-xs font-medium">
                    <span className="flex items-center gap-1.5 text-[var(--color-text,#fafafa)]">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#3b82f6]" aria-hidden="true" />
                      المشاهدات
                    </span>
                    <span className="flex items-center gap-1.5 text-[var(--color-text,#fafafa)]">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#a855f7]" aria-hidden="true" />
                      الزوار الفريدين
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowDataTable(!showDataTable)}
                      className="px-2.5 py-1 rounded-lg border border-[var(--color-border,#3f3f46)] hover:bg-[var(--color-surface-hover,#202023)] text-[var(--color-text-muted,#a1a1aa)] hover:text-[var(--color-text,#fafafa)] transition-colors inline-flex items-center gap-1"
                    >
                      <TableIcon size={13} aria-hidden="true" />
                      <span>{showDataTable ? 'إخفاء الجدول' : 'عرض الجدول'}</span>
                    </button>
                  </div>
                </div>

                {/* SVG Visualizer */}
                <div className="pt-2">
                  {renderTrendSvg(overview.daily_trend)}
                </div>

                {/* Accessible Screen Reader Data Table */}
                <table
                  className={showDataTable ? 'w-full text-xs mt-4 border border-[var(--color-border,#27272a)]' : 'sr-only'}
                  aria-label="Visits and unique visitors trend data"
                >
                  <thead>
                    <tr className="border-b border-[var(--color-border,#27272a)] text-[var(--color-text-muted,#a1a1aa)]">
                      <th className="p-2 text-start">التاريخ (Date)</th>
                      <th className="p-2 text-start">المشاهدات (Total Views)</th>
                      <th className="p-2 text-start">الزوار الفريدين (Unique Visitors)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.daily_trend.map((row) => (
                      <tr key={row.date} className="border-b border-[var(--color-border,#27272a)]/50">
                        <td className="p-2 font-mono text-[var(--color-text,#fafafa)]">{row.date}</td>
                        <td className="p-2 text-[var(--color-text,#fafafa)]">{formatNumber(row.total_views)}</td>
                        <td className="p-2 text-[var(--color-text,#fafafa)]">{formatNumber(row.unique_visitors)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              {/* Secondary Grid: Top Projects & Breakdown Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Projects */}
                <section className="p-6 rounded-2xl bg-[var(--color-surface,#18181b)] border border-[var(--color-border,#27272a)] space-y-4">
                  <div className="flex items-center justify-between border-b border-[var(--color-border,#27272a)] pb-3">
                    <h2 className="text-base font-bold text-[var(--color-text,#fafafa)]">
                      المشاريع الأكثر تفاعلاً
                    </h2>
                    <Link
                      to="/admin/projects"
                      className="text-xs text-[var(--color-primary,#3b82f6)] hover:underline inline-flex items-center gap-1"
                    >
                      إدارة المشاريع
                      <ExternalLink size={12} aria-hidden="true" />
                    </Link>
                  </div>

                  <div className="space-y-3">
                    {topProjects.length === 0 ? (
                      <p className="text-xs text-[var(--color-text-muted,#a1a1aa)] py-4 text-center">
                        لا توجد مشاريع مسجلة بعد.
                      </p>
                    ) : (
                      topProjects.map((proj, idx) => {
                        const topViews = topProjects[0]?.views || 1;
                        const pct = Math.round((proj.views / topViews) * 100);

                        return (
                          <div key={proj.id} className="p-3 rounded-xl bg-[var(--color-bg,#09090b)]/50 space-y-2">
                            <div className="flex items-center justify-between gap-3 text-sm">
                              <div className="flex items-center gap-2 truncate">
                                <span className="text-xs font-mono font-bold text-[var(--color-text-muted,#71717a)]">
                                  #{idx + 1}
                                </span>
                                <span className="font-semibold text-[var(--color-text,#fafafa)] truncate">
                                  {proj.title}
                                </span>
                              </div>
                              <span className="text-xs font-bold text-[var(--color-primary,#3b82f6)] shrink-0">
                                {formatNumber(proj.views)} مشاهدة
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-[var(--color-surface,#18181b)] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[var(--color-primary,#3b82f6)] rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </section>

                {/* Traffic Sources & Devices */}
                <section className="p-6 rounded-2xl bg-[var(--color-surface,#18181b)] border border-[var(--color-border,#27272a)] space-y-6">
                  {/* Sources */}
                  <div>
                    <h2 className="text-base font-bold text-[var(--color-text,#fafafa)] mb-3 border-b border-[var(--color-border,#27272a)] pb-2">
                      مصادر الزيارات (Traffic Sources)
                    </h2>
                    <div className="space-y-2.5">
                      {trafficSources.categories.map((cat) => (
                        <div key={cat.name} className="flex items-center justify-between text-xs">
                          <span className="capitalize text-[var(--color-text,#fafafa)]">{cat.name}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-[var(--color-text-muted,#a1a1aa)]">{formatNumber(cat.views)}</span>
                            <span className="w-12 text-end font-bold text-[var(--color-text,#fafafa)]">
                              {cat.percentage}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Devices */}
                  <div>
                    <h2 className="text-base font-bold text-[var(--color-text,#fafafa)] mb-3 border-b border-[var(--color-border,#27272a)] pb-2">
                      الأجهزة المستخدمة (Devices)
                    </h2>
                    <div className="grid grid-cols-3 gap-2">
                      {devices.map((dev) => (
                        <div
                          key={dev.name}
                          className="p-3 rounded-xl bg-[var(--color-bg,#09090b)]/50 text-center space-y-1"
                        >
                          <div className="flex justify-center text-[var(--color-text-muted,#a1a1aa)]">
                            {dev.name === 'mobile' && <Smartphone size={16} aria-hidden="true" />}
                            {dev.name === 'tablet' && <Tablet size={16} aria-hidden="true" />}
                            {dev.name === 'desktop' && <Monitor size={16} aria-hidden="true" />}
                          </div>
                          <div className="text-sm font-bold text-[var(--color-text,#fafafa)]">{dev.percentage}%</div>
                          <div className="text-[10px] text-[var(--color-text-muted,#71717a)] capitalize">
                            {dev.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
