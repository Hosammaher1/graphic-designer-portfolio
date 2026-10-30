import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BuilderCanvas } from '../src/page-builder/BuilderCanvas.jsx';
import { savePageDraft, fetchPageDraft } from '../src/page-builder/pageBuilderApi.js';

describe('Page Builder Draft Save & Optimistic Locking (Task 05.08)', () => {
  const sampleBlocks = [
    {
      id: 'blk-hero-1',
      type: 'hero',
      version: 1,
      data: {
        title: 'عنوان تجريبي للمسودة',
      },
      settings: {},
    },
  ];

  it('triggers onSave callback with current blocks and lockVersion on explicit save', async () => {
    const handleSave = vi.fn().mockResolvedValue({ success: true });

    render(
      <BuilderCanvas
        pageId="test-save"
        initialBlocks={sampleBlocks}
        lockVersion={3}
        locale="ar"
        onSave={handleSave}
      />
    );

    const saveButton = screen.getByRole('button', { name: /حفظ المسودة|save draft/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalledTimes(1);
    });

    expect(handleSave).toHaveBeenCalledWith(
      expect.objectContaining({
        blocks: expect.arrayContaining([
          expect.objectContaining({ id: 'blk-hero-1' }),
        ]),
        lockVersion: 3,
      })
    );
  });

  it('displays conflict banner and retains editor changes on 409 conflict', async () => {
    const handleSave = vi.fn().mockResolvedValue({
      success: false,
      conflict: true,
      current_lock_version: 5,
    });

    render(
      <BuilderCanvas
        pageId="test-conflict"
        initialBlocks={sampleBlocks}
        lockVersion={3}
        locale="ar"
        onSave={handleSave}
      />
    );

    const saveButton = screen.getByRole('button', { name: /حفظ المسودة|save draft/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    // Verify conflict message is displayed
    expect(screen.getByText(/تعارض في التحديث|Stale update conflict/i)).toBeInTheDocument();

    // Verify editor state was retained and NOT cleared
    const matches = screen.getAllByText('عنوان تجريبي للمسودة');
    expect(matches.length).toBeGreaterThan(0);
  });

  it('retains modified blocks in editor and localStorage on network failure', async () => {
    const handleSave = vi.fn().mockRejectedValue(new Error('Network connection timeout'));

    render(
      <BuilderCanvas
        pageId="test-fail-retain"
        initialBlocks={sampleBlocks}
        lockVersion={1}
        locale="ar"
        onSave={handleSave}
      />
    );

    const saveButton = screen.getByRole('button', { name: /حفظ المسودة|save draft/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/حدث خطأ أثناء الحفظ|Network connection timeout/i)).toBeInTheDocument();
    });

    // Content still intact
    const matches = screen.getAllByText('عنوان تجريبي للمسودة');
    expect(matches.length).toBeGreaterThan(0);
  });

  it('pageBuilderApi savePageDraft normalizes 409 conflict response correctly', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({
        message: 'Stale update conflict: this page was modified in another session.',
        conflict: true,
        current_lock_version: 7,
      }),
    });
    global.fetch = mockFetch;

    const res = await savePageDraft('home', {
      lock_version: 4,
      blocks: sampleBlocks,
    });

    expect(res.success).toBe(false);
    expect(res.conflict).toBe(true);
    expect(res.status).toBe(409);
    expect(res.current_lock_version).toBe(7);
  });
});
