import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProjectsPage from '../src/pages/admin/ProjectsPage.jsx';
import ProjectFormPage from '../src/pages/admin/ProjectFormPage.jsx';
import CategoriesPage from '../src/pages/admin/CategoriesPage.jsx';

describe('Admin Project and Category Pages', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('ProjectsPage', () => {
    it('displays loading state, then renders projects list with status badge', async () => {
      const mockProjects = [
        {
          id: 1,
          slug: 'brand-identity',
          status: 'published',
          year: 2026,
          translations: [{ locale: 'en', title: 'Brand Identity Project' }],
          cover_media: null,
        },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'success',
          data: {
            projects: {
              data: mockProjects,
              total: 1,
              current_page: 1,
              last_page: 1,
            },
          },
        }),
      });

      render(
        <MemoryRouter>
          <ProjectsPage />
        </MemoryRouter>
      );

      // Loading state
      expect(screen.getByRole('status')).toHaveTextContent(/Loading projects/i);

      // Loaded content
      await waitFor(() => {
        expect(screen.getByText('Brand Identity Project')).toBeInTheDocument();
        expect(screen.getByText('brand-identity')).toBeInTheDocument();
        expect(screen.getByText('published')).toBeInTheDocument();
      });
    });

    it('displays empty state when no projects are returned', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'success',
          data: {
            projects: {
              data: [],
              total: 0,
              current_page: 1,
              last_page: 1,
            },
          },
        }),
      });

      render(
        <MemoryRouter>
          <ProjectsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/No projects found/i)).toBeInTheDocument();
      });
    });

    it('displays error alert when API fetch fails', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      render(
        <MemoryRouter>
          <ProjectsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/Failed to load projects/i);
      });
    });

    it('switches to trash view and handles project restore', async () => {
      const trashedProject = {
        id: 7,
        slug: 'trashed-work',
        status: 'draft',
        deleted_at: '2026-10-25T10:00:00Z',
        translations: [{ locale: 'en', title: 'Deleted Work' }],
      };

      global.fetch = vi.fn().mockImplementation((url) => {
        if (url.includes('/trash')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              status: 'success',
              data: {
                projects: {
                  data: [trashedProject],
                  total: 1,
                  current_page: 1,
                  last_page: 1,
                },
              },
            }),
          });
        }
        if (url.includes('/restore')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              status: 'success',
              message: 'Project restored.',
            }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            status: 'success',
            data: { projects: { data: [], total: 0 } },
          }),
        });
      });

      render(
        <MemoryRouter>
          <ProjectsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /Trash/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('tab', { name: /Trash/i }));

      await waitFor(() => {
        expect(screen.getByText('Deleted Work')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Restore/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Restore/i }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/v1/admin/projects/7/restore'),
          expect.objectContaining({ method: 'POST' })
        );
      });
    });
  });

  describe('ProjectFormPage', () => {
    it('displays validation error alerts when required inputs are missing or invalid', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({
          status: 'error',
          message: 'The given data was invalid.',
          errors: {
            slug: ['The slug field is required.'],
            'translations.ar.title': ['Arabic title is required.'],
          },
        }),
      });

      render(
        <MemoryRouter>
          <ProjectFormPage />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByRole('button', { name: /Save Project/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getAllByText(/The slug field is required/i).length).toBeGreaterThan(0);
        expect(screen.getByText(/Arabic title is required/i)).toBeInTheDocument();
      });
    });

    it('provides keyboard-accessible Move Up and Move Down buttons for media reordering', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'success', data: { categories: [] } }),
      });

      render(
        <MemoryRouter>
          <ProjectFormPage
            initialMedia={[
              { id: 101, file_name: 'first.png', is_cover: true, sort_order: 1 },
              { id: 102, file_name: 'second.png', is_cover: false, sort_order: 2 },
            ]}
          />
        </MemoryRouter>
      );

      expect(screen.getByText('first.png')).toBeInTheDocument();
      expect(screen.getByText('second.png')).toBeInTheDocument();

      const moveDownBtn = screen.getByRole('button', { name: /Move first\.png down/i });
      fireEvent.click(moveDownBtn);

      // Verify reordered positions in DOM
      const mediaItems = screen.getAllByTestId('media-item-row');
      expect(mediaItems[0]).toHaveTextContent('second.png');
      expect(mediaItems[1]).toHaveTextContent('first.png');
    });

    it('warns user about unsaved changes when form is dirty and user clicks Cancel', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

      render(
        <MemoryRouter>
          <ProjectFormPage />
        </MemoryRouter>
      );

      const slugInput = screen.getByLabelText(/Slug/i);
      fireEvent.change(slugInput, { target: { value: 'my-new-slug' } });

      const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelBtn);

      expect(confirmSpy).toHaveBeenCalledWith(
        expect.stringMatching(/unsaved changes/i)
      );
    });
  });

  describe('CategoriesPage', () => {
    it('renders category list and allows creating new category with bilingual fields', async () => {
      const mockCategories = [
        {
          id: 1,
          slug: 'branding',
          sort_order: 1,
          translations: [
            { locale: 'en', name: 'Branding' },
            { locale: 'ar', name: 'الهويات البصرية' },
          ],
        },
      ];

      global.fetch = vi.fn().mockImplementation((url, options) => {
        if (options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              status: 'success',
              data: {
                category: {
                  id: 2,
                  slug: 'packaging',
                  sort_order: 2,
                  translations: [
                    { locale: 'en', name: 'Packaging' },
                    { locale: 'ar', name: 'التغليف' },
                  ],
                },
              },
            }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            status: 'success',
            data: { categories: mockCategories },
          }),
        });
      });

      render(
        <MemoryRouter>
          <CategoriesPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Branding')).toBeInTheDocument();
        expect(screen.getByText('branding')).toBeInTheDocument();
      });

      // Fill out new category form
      fireEvent.change(screen.getByLabelText(/Slug/i), { target: { value: 'packaging' } });
      fireEvent.change(screen.getByLabelText(/Arabic Name/i), { target: { value: 'التغليف' } });
      fireEvent.change(screen.getByLabelText(/English Name/i), { target: { value: 'Packaging' } });

      fireEvent.click(screen.getByRole('button', { name: /Add Category/i }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/v1/admin/categories'),
          expect.objectContaining({ method: 'POST' })
        );
      });
    });
  });
});
