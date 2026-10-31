import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DashboardPage from '../src/pages/admin/DashboardPage.jsx';

// Mock AuthContext
vi.mock('../src/context/AuthContext.jsx', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Mohammed Admin', email: 'admin@example.com', is_admin: true },
  }),
}));

const mockOverview30d = {
  success: true,
  data: {
    range: '30d',
    start_date: '2026-10-01',
    end_date: '2026-10-30',
    summary: {
      total_views: 1250,
      unique_visitors: 820,
      days_count: 30,
    },
    daily_trend: [
      { date: '2026-10-01', total_views: 40, unique_visitors: 25 },
      { date: '2026-10-02', total_views: 55, unique_visitors: 35 },
      { date: '2026-10-03', total_views: 0, unique_visitors: 0 },
    ],
    previous_period: {
      start_date: '2026-09-01',
      end_date: '2026-09-30',
      total_views: 1000,
      unique_visitors: 650,
      views_change_percentage: 25.0,
    },
  },
};

const mockOverview7d = {
  success: true,
  data: {
    range: '7d',
    start_date: '2026-10-24',
    end_date: '2026-10-30',
    summary: {
      total_views: 310,
      unique_visitors: 210,
      days_count: 7,
    },
    daily_trend: [
      { date: '2026-10-24', total_views: 45, unique_visitors: 30 },
      { date: '2026-10-25', total_views: 50, unique_visitors: 32 },
    ],
    previous_period: {
      start_date: '2026-10-17',
      end_date: '2026-10-23',
      total_views: 280,
      unique_visitors: 190,
      views_change_percentage: 10.7,
    },
  },
};

const mockTopProjects = {
  success: true,
  data: {
    projects: [
      { id: 1, slug: 'brand-identity-pro', title: 'Brand Identity Project', views: 420, unique_visitors: 310 },
      { id: 2, slug: 'packaging-art', title: 'Luxury Packaging Art', views: 280, unique_visitors: 190 },
    ],
  },
};

const mockTrafficSources = {
  success: true,
  data: {
    categories: [
      { name: 'social', views: 600, unique_visitors: 400, percentage: 48.0 },
      { name: 'search', views: 400, unique_visitors: 250, percentage: 32.0 },
      { name: 'direct', views: 250, unique_visitors: 170, percentage: 20.0 },
    ],
    domains: [
      { domain: 'behance.net', views: 350 },
      { domain: 'google.com', views: 300 },
    ],
  },
};

const mockDevices = {
  success: true,
  data: {
    devices: [
      { name: 'desktop', views: 700, unique_visitors: 450, percentage: 56.0 },
      { name: 'mobile', views: 500, unique_visitors: 340, percentage: 40.0 },
      { name: 'tablet', views: 50, unique_visitors: 30, percentage: 4.0 },
    ],
  },
};

describe('Dashboard Charts & Analytics (Task 06.11)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state initially while fetching metrics', () => {
    // Hang fetch promise to observe loading state
    globalThis.fetch = vi.fn(() => new Promise(() => {}));

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    expect(screen.getByTestId('analytics-loading')).toBeInTheDocument();
  });

  it('renders overview metrics and chart with accessible text alternative', async () => {
    globalThis.fetch = vi.fn((url) => {
      if (url.includes('/analytics/overview')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockOverview30d) });
      if (url.includes('/analytics/top-projects')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockTopProjects) });
      if (url.includes('/analytics/traffic-sources')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockTrafficSources) });
      if (url.includes('/analytics/devices')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockDevices) });
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    // Wait for metrics to load
    await waitFor(() => {
      expect(screen.getByText('1,250')).toBeInTheDocument(); // total views formatted
      expect(screen.getByText('820')).toBeInTheDocument(); // unique visitors
    });

    // Chart has accessible label
    const chart = screen.getByRole('img', { name: /visits and unique visitors trend chart/i });
    expect(chart).toBeInTheDocument();

    // Chart has accessible tabular data for screen readers
    const dataTable = screen.getByRole('table', { name: /visits and unique visitors trend data|visits trend data/i });
    expect(dataTable).toBeInTheDocument();
    expect(screen.getByText('2026-10-01')).toBeInTheDocument();
  });

  it('switches date filter and updates analytics data', async () => {
    globalThis.fetch = vi.fn((url) => {
      if (url.includes('range=7d') && url.includes('/analytics/overview')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockOverview7d) });
      }
      if (url.includes('/analytics/overview')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockOverview30d) });
      if (url.includes('/analytics/top-projects')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockTopProjects) });
      if (url.includes('/analytics/traffic-sources')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockTrafficSources) });
      if (url.includes('/analytics/devices')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockDevices) });
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('1,250')).toBeInTheDocument();
    });

    // Click 7d filter button
    const btn7d = screen.getByRole('button', { name: /7 أيام|7 days|7d/i });
    fireEvent.click(btn7d);

    await waitFor(() => {
      expect(screen.getByText('310')).toBeInTheDocument(); // 7d total views
      expect(screen.getByText('210')).toBeInTheDocument(); // 7d unique visitors
    });
  });

  it('renders empty state when no analytics data exists in range', async () => {
    const emptyOverview = {
      success: true,
      data: {
        range: '30d',
        start_date: '2026-10-01',
        end_date: '2026-10-30',
        summary: { total_views: 0, unique_visitors: 0, days_count: 30 },
        daily_trend: [],
        previous_period: { total_views: 0, unique_visitors: 0, views_change_percentage: 0 },
      },
    };

    globalThis.fetch = vi.fn((url) => {
      if (url.includes('/analytics/overview')) return Promise.resolve({ ok: true, json: () => Promise.resolve(emptyOverview) });
      if (url.includes('/analytics/top-projects')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: { projects: [] } }) });
      if (url.includes('/analytics/traffic-sources')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: { categories: [], domains: [] } }) });
      if (url.includes('/analytics/devices')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: { devices: [] } }) });
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/no analytics events recorded yet/i)).toBeInTheDocument();
    });
  });

  it('renders error state and recovers on retry', async () => {
    let shouldFail = true;

    globalThis.fetch = vi.fn((url) => {
      if (shouldFail) {
        return Promise.reject(new Error('Network connection failed'));
      }
      if (url.includes('/analytics/overview')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockOverview30d) });
      if (url.includes('/analytics/top-projects')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockTopProjects) });
      if (url.includes('/analytics/traffic-sources')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockTrafficSources) });
      if (url.includes('/analytics/devices')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockDevices) });
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/failed to load analytics data/i)).toBeInTheDocument();
    });

    const retryBtn = screen.getByRole('button', { name: /retry|إعادة المحاولة/i });
    expect(retryBtn).toBeInTheDocument();

    // Now allow succeed on retry
    shouldFail = false;
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText('1,250')).toBeInTheDocument();
    });
  });

  it('renders top projects and traffic sources breakdown', async () => {
    globalThis.fetch = vi.fn((url) => {
      if (url.includes('/analytics/overview')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockOverview30d) });
      if (url.includes('/analytics/top-projects')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockTopProjects) });
      if (url.includes('/analytics/traffic-sources')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockTrafficSources) });
      if (url.includes('/analytics/devices')) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockDevices) });
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText('Brand Identity Project')[0]).toBeInTheDocument();
      expect(screen.getByText('Luxury Packaging Art')).toBeInTheDocument();
      expect(screen.getByText('48%')).toBeInTheDocument(); // Social 48%
      expect(screen.getByText('32%')).toBeInTheDocument(); // Search 32%
    });
  });
});
