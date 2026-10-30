import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MediaUploader from '../src/components/admin/MediaUploader.jsx';

describe('MediaUploader Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders upload dropzone with accessible labels and instructions', () => {
    render(<MediaUploader />);

    expect(screen.getByRole('button', { name: /Upload images dropzone/i })).toBeInTheDocument();
    expect(screen.getByText(/Drag & drop images here/i)).toBeInTheDocument();
    expect(screen.getByText(/JPG, PNG, WebP up to 15MB/i)).toBeInTheDocument();
  });

  it('rejects disallowed file format immediately with accessible error message', async () => {
    render(<MediaUploader />);

    const dropzone = screen.getByRole('button', { name: /Upload images dropzone/i });
    const invalidFile = new File(['fake content'], 'bad-script.php', { type: 'application/x-php' });

    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [invalidFile],
      },
    });

    await waitFor(() => {
      expect(screen.getByText('bad-script.php')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveTextContent(/Invalid file format/i);
    });
  });

  it('successfully uploads valid image file and calls onUploadSuccess callback', async () => {
    const mockOnSuccess = vi.fn();
    const mockAsset = { id: 42, file_name: 'test-design.png', mime_type: 'image/png' };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'success', data: { asset: mockAsset } }),
    });

    render(<MediaUploader onUploadSuccess={mockOnSuccess} />);

    const dropzone = screen.getByRole('button', { name: /Upload images dropzone/i });
    const validFile = new File(['valid png data'], 'test-design.png', { type: 'image/png' });

    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [validFile],
      },
    });

    await waitFor(() => {
      expect(screen.getByText('Done')).toBeInTheDocument();
    });

    expect(mockOnSuccess).toHaveBeenCalledWith([mockAsset]);
  });

  it('displays Retry button on upload failure and allows retrying', async () => {
    global.fetch = vi
      .fn()
      .mockRejectedValueOnce(new Error('Network disconnected'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'success', data: { asset: { id: 99 } } }),
      });

    render(<MediaUploader />);

    const dropzone = screen.getByRole('button', { name: /Upload images dropzone/i });
    const validFile = new File(['image bytes'], 'retry-design.jpg', { type: 'image/jpeg' });

    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [validFile],
      },
    });

    await waitFor(() => {
      expect(screen.getByText('Failed')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveTextContent(/Network disconnected/i);
    });

    const retryBtn = screen.getByRole('button', { name: 'Retry' });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText('Done')).toBeInTheDocument();
    });
  });
});
