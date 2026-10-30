import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SecurePreviewModal } from '../src/page-builder/SecurePreviewModal.jsx';
import { generatePreviewUrl, fetchSecurePreview } from '../src/page-builder/pageBuilderApi.js';

describe('Page Builder Secure Preview (Task 05.09)', () => {
  const mockSignedUrl = 'https://portfolio.test/api/v1/pages/home/preview?expires=1793400000&signature=abc123mock';
  const mockExpiresAt = '2026-10-30T23:59:00Z';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders SecurePreviewModal and fetches signed preview URL', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        preview_url: mockSignedUrl,
        expires_at: mockExpiresAt,
      }),
    });

    render(
      <SecurePreviewModal
        slug="home"
        locale="ar"
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    // Verify modal title
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/رابط المعاينة الآمنة للمسودة/i)).toBeInTheDocument();

    // Verify loading transitions to loaded URL
    await waitFor(() => {
      const input = screen.getByRole('textbox', { name: /الرابط الموقّع رقمياً/i });
      expect(input).toHaveValue(mockSignedUrl);
    });

    // Verify expiration and noindex notice are present
    expect(screen.getByText(/30 دقيقة/i)).toBeInTheDocument();
    expect(screen.getByText(/noindex/i)).toBeInTheDocument();
  });

  it('copies signed preview link to clipboard on copy button click', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        preview_url: mockSignedUrl,
        expires_at: mockExpiresAt,
      }),
    });

    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(
      <SecurePreviewModal
        slug="home"
        locale="ar"
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toHaveValue(mockSignedUrl);
    });

    const copyBtn = screen.getByRole('button', { name: /نسخ الرابط/i });
    fireEvent.click(copyBtn);

    expect(writeTextMock).toHaveBeenCalledWith(mockSignedUrl);
    await waitFor(() => {
      expect(screen.getByText(/تم النسخ!/i)).toBeInTheDocument();
    });
  });

  it('pageBuilderApi generatePreviewUrl calls endpoint correctly', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        preview_url: mockSignedUrl,
        expires_at: mockExpiresAt,
      }),
    });
    global.fetch = mockFetch;

    const res = await generatePreviewUrl('about');

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/admin/pages/about/preview-url',
      expect.objectContaining({ method: 'POST' })
    );
    expect(res.success).toBe(true);
    expect(res.preview_url).toBe(mockSignedUrl);
  });

  it('pageBuilderApi fetchSecurePreview handles 403 denied response gracefully', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      json: async () => ({ message: 'Unauthorized preview access' }),
    });
    global.fetch = mockFetch;

    const res = await fetchSecurePreview('home', 'expires=123&signature=expired');

    expect(res.success).toBe(false);
    expect(res.status).toBe(403);
    expect(res.error).toContain('403');
  });
});
