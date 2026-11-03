import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AdminProvider, useAdmin } from '../src/admin/context/AdminContext.jsx';
import { OverviewDashboardPage } from '../src/admin/pages/OverviewDashboardPage.jsx';
import { AnalyticsPage } from '../src/admin/pages/AnalyticsPage.jsx';
import { formatAuditActivity, formatRelativeTime } from '../src/admin/utils/localization.js';

describe('Admin Dashboard Real Data Audit & Integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('formatAuditActivity & formatRelativeTime', () => {
    it('formats real Laravel audit logs into bilingual activity items', () => {
      const loginLog = {
        id: 101,
        action: 'auth.login.success',
        actor_email: 'mohmmed.maher467@gmail.com',
        created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      };
      const formattedLogin = formatAuditActivity(loginLog);
      expect(formattedLogin.textEn).toContain('Administrator signed in to Studio Admin');
      expect(formattedLogin.textAr).toContain('تم تسجيل دخول المدير');
      expect(formattedLogin.type).toBe('auth');
      expect(formattedLogin.timeEn).toBe('5m ago');
      expect(formattedLogin.timeAr).toBe('منذ 5 دقيقة');

      const projectLog = {
        id: 102,
        action: 'project.created',
        details: { slug: 'noya-skincare' },
        actor_email: 'mohmmed.maher467@gmail.com',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      };
      const formattedProject = formatAuditActivity(projectLog);
      expect(formattedProject.textEn).toContain('Created project "noya-skincare"');
      expect(formattedProject.textAr).toContain('تم إنشاء المشروع "noya-skincare"');
      expect(formattedProject.timeEn).toBe('2h ago');
    });

    it('returns "Just now" / "الآن" for recent timestamps', () => {
      const nowIso = new Date().toISOString();
      expect(formatRelativeTime(nowIso, 'en')).toBe('Just now');
      expect(formatRelativeTime(nowIso, 'ar')).toBe('الآن');
    });
  });

  describe('AdminContext Real Backend State Initialization', () => {
    function TestConsumer() {
      const {
        media,
        trash,
        activities,
        analyticsOverview,
        inquiriesCount,
        notifications,
      } = useAdmin();

      return (
        <div>
          <div data-testid="media-count">{media.length}</div>
          <div data-testid="trash-count">{trash.length}</div>
          <div data-testid="activities-count">{activities.length}</div>
          <div data-testid="views-count">{analyticsOverview?.summary?.total_views}</div>
          <div data-testid="inquiries-unread">{inquiriesCount?.unread}</div>
          <div data-testid="notifications-count">{notifications.length}</div>
        </div>
      );
    }

    it('initializes media, trash, and activities with zero fake items', async () => {
      // Mock fetch responses for API calls
      global.fetch = vi.fn().mockImplementation((url) => {
        if (url.includes('/api/v1/auth/me')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ data: { user: { id: 1, email: 'admin@studio.com' } } }),
          });
        }
        if (url.includes('/api/v1/admin/projects/trash')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ data: { projects: { data: [] } } }),
          });
        }
        if (url.includes('/api/v1/admin/audit-logs')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ data: { logs: [] } }),
          });
        }
        if (url.includes('/api/v1/admin/media')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ data: { assets: { data: [] } } }),
          });
        }
        if (url.includes('/api/v1/admin/inquiries')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ data: { data: [], total: 0 } }),
          });
        }
        if (url.includes('/api/v1/admin/analytics/overview')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              data: {
                summary: { total_views: 0, unique_visitors: 0, days_count: 30 },
                daily_trend: [],
                previous_period: { total_views: 0, unique_visitors: 0, views_change_percentage: 0 },
              },
            }),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ data: {} }),
        });
      });

      render(
        <AdminProvider>
          <TestConsumer />
        </AdminProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('media-count').textContent).toBe('0');
        expect(screen.getByTestId('trash-count').textContent).toBe('0');
        expect(screen.getByTestId('activities-count').textContent).toBe('0');
        expect(screen.getByTestId('views-count').textContent).toBe('0');
        expect(screen.getByTestId('inquiries-unread').textContent).toBe('0');
        expect(screen.getByTestId('notifications-count').textContent).toBe('0');
      });
    });
  });

  describe('OverviewDashboardPage Real Data & Zero-Traffic Gracefulness', () => {
    it('renders zero-baseline without dividing by zero and displays real inquiries and verified metrics', async () => {
      global.fetch = vi.fn().mockImplementation((url) => {
        if (url.includes('/api/v1/admin/analytics/overview')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              data: {
                summary: { total_views: 45, unique_visitors: 12, days_count: 30 },
                daily_trend: [
                  { date: '2026-10-01', total_views: 0, unique_visitors: 0 },
                  { date: '2026-10-02', total_views: 45, unique_visitors: 12 },
                ],
                previous_period: { total_views: 0, unique_visitors: 0, views_change_percentage: 0 },
              },
            }),
          });
        }
        if (url.includes('/api/v1/admin/inquiries')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              data: {
                data: [
                  { id: 1, name: 'Brand Lead', email: 'lead@corp.com', is_read: false },
                ],
                total: 1,
              },
            }),
          });
        }
        if (url.includes('/api/v1/admin/projects')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              data: {
                projects: {
                  data: [
                    {
                      id: 1,
                      slug: 'noya-skincare',
                      status: 'published',
                      view_count: 45,
                      translations: [{ locale: 'en', title: 'Noya Skincare' }],
                    },
                  ],
                },
              },
            }),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ data: {} }),
        });
      });

      render(
        <AdminProvider>
          <OverviewDashboardPage />
        </AdminProvider>
      );

      // Verify that views do not have the hardcoded 12,480 number
      await waitFor(() => {
        expect(screen.queryByText(/12,480/)).toBeNull();
        expect(screen.queryByText(/4,890/)).toBeNull();
        expect(screen.queryByText(/3m 42s/)).toBeNull();
        // Client inquiries card displays real 1 count
        expect(screen.getByText('Client Inquiries')).toBeDefined();
        expect(screen.getByText('1')).toBeDefined();
      });
    });
  });

  describe('AnalyticsPage Real Data Connection', () => {
    it('eliminates mock multipliers and displays real database totals', async () => {
      global.fetch = vi.fn().mockImplementation((url) => {
        if (url.includes('/api/v1/admin/analytics/overview')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              data: {
                summary: { total_views: 0, unique_visitors: 0, days_count: 30 },
                daily_trend: [],
                previous_period: { total_views: 0, unique_visitors: 0, views_change_percentage: 0 },
              },
            }),
          });
        }
        if (url.includes('/api/v1/admin/analytics/top-projects')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ data: { projects: [] } }),
          });
        }
        if (url.includes('/api/v1/admin/analytics/traffic-sources')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ data: { categories: [] } }),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ data: {} }),
        });
      });

      render(
        <AdminProvider>
          <AnalyticsPage />
        </AdminProvider>
      );

      await waitFor(() => {
        // Assert mock values are completely gone
        expect(screen.queryByText(/18,620/)).toBeNull();
        expect(screen.queryByText(/3m 48s/)).toBeNull();
        expect(screen.queryByText(/48.2%/)).toBeNull();
        // Empty state notices display cleanly
        expect(screen.getByText(/No traffic activity recorded for this period yet/)).toBeDefined();
        expect(screen.getByText(/No traffic referral sources recorded yet/)).toBeDefined();
      });
    });
  });
});
