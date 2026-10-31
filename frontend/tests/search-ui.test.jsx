import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SearchFilterBar from '../src/components/SearchFilterBar.jsx';
import WorkPage from '../src/pages/WorkPage.jsx';

describe('Search UI & Filter Controls (Task 06.03)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const mockCategories = [
    { id: 1, slug: 'branding', name: 'الهوية البصرية' },
    { id: 2, slug: 'packaging', name: 'تصميم التغليف' },
  ];

  const mockTools = [
    { id: 1, slug: 'illustrator', name: 'Illustrator' },
    { id: 2, slug: 'photoshop', name: 'Photoshop' },
  ];

  it('renders search input with placeholder and category chips', () => {
    render(
      <MemoryRouter>
        <SearchFilterBar
          locale="ar"
          searchQuery=""
          selectedCategory=""
          categories={mockCategories}
          tools={mockTools}
        />
      </MemoryRouter>
    );

    const searchInput = screen.getByRole('searchbox');
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute('placeholder', 'ابحث عن مشروع، هوية، أداة، أو سنة...');

    expect(screen.getByRole('button', { name: 'الكل' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'الهوية البصرية' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'تصميم التغليف' })).toBeInTheDocument();
  });

  it('debounces search input changes and fires onSearchChange after delay', async () => {
    const handleSearchChange = vi.fn();

    render(
      <MemoryRouter>
        <SearchFilterBar
          locale="en"
          searchQuery=""
          onSearchChange={handleSearchChange}
          categories={mockCategories}
        />
      </MemoryRouter>
    );

    const searchInput = screen.getByRole('searchbox');
    fireEvent.change(searchInput, { target: { value: 'Packaging' } });

    // Has not fired immediately
    expect(handleSearchChange).not.toHaveBeenCalled();

    // Fast-forward debounce timer (300ms)
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(handleSearchChange).toHaveBeenCalledTimes(1);
    expect(handleSearchChange).toHaveBeenCalledWith('Packaging');
  });

  it('triggers immediate search on Enter key and clears on Escape key', () => {
    const handleSearchChange = vi.fn();

    render(
      <MemoryRouter>
        <SearchFilterBar
          locale="en"
          searchQuery=""
          onSearchChange={handleSearchChange}
          categories={mockCategories}
        />
      </MemoryRouter>
    );

    const searchInput = screen.getByRole('searchbox');
    fireEvent.change(searchInput, { target: { value: 'Logo' } });

    // Press Enter -> should trigger immediately without waiting for debounce
    fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });
    expect(handleSearchChange).toHaveBeenCalledWith('Logo');

    // Press Escape -> should clear input and trigger empty search
    fireEvent.keyDown(searchInput, { key: 'Escape', code: 'Escape' });
    expect(searchInput.value).toBe('');
    expect(handleSearchChange).toHaveBeenCalledWith('');
  });

  it('toggles category filter and sets aria-pressed correctly', () => {
    const handleCategoryChange = vi.fn();

    render(
      <MemoryRouter>
        <SearchFilterBar
          locale="ar"
          selectedCategory="branding"
          onCategoryChange={handleCategoryChange}
          categories={mockCategories}
        />
      </MemoryRouter>
    );

    const brandingBtn = screen.getByRole('button', { name: 'الهوية البصرية' });
    const allBtn = screen.getByRole('button', { name: 'الكل' });

    expect(brandingBtn).toHaveAttribute('aria-pressed', 'true');
    expect(allBtn).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(screen.getByRole('button', { name: 'تصميم التغليف' }));
    expect(handleCategoryChange).toHaveBeenCalledWith('packaging');
  });

  it('renders clear filters button when filters are active and clears all', () => {
    const handleClear = vi.fn();

    render(
      <MemoryRouter>
        <SearchFilterBar
          locale="ar"
          searchQuery="قهوة"
          selectedCategory="packaging"
          onClearFilters={handleClear}
          categories={mockCategories}
        />
      </MemoryRouter>
    );

    const clearBtn = screen.getByRole('button', { name: /مسح الفلاتر/i });
    expect(clearBtn).toBeInTheDocument();

    fireEvent.click(clearBtn);
    expect(handleClear).toHaveBeenCalledTimes(1);
  });

  it('renders empty state in WorkPage when search returns no matching projects', async () => {
    vi.useRealTimers(); // Use real timers for full component fetch lifecycle

    // Mock empty response from API
    vi.spyOn(global, 'fetch').mockImplementation((url) => {
      if (url.includes('/api/v1/categories')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'success', data: { categories: mockCategories } }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            status: 'success',
            data: {
              projects: { data: [], current_page: 1, last_page: 1, total: 0 },
            },
          }),
      });
    });

    render(
      <MemoryRouter initialEntries={['/ar/work?q=nonexistent']}>
        <WorkPage locale="ar" />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/لم يتم العثور على أي أعمال/i)).toBeInTheDocument();
    });

    expect(screen.getAllByRole('button', { name: /مسح الفلاتر/i }).length).toBeGreaterThanOrEqual(1);
  });
});
