import React, { useState, useRef, useCallback } from 'react';

/**
 * Multi-image upload UI with drag/drop, per-file progress, cancel, retry,
 * concurrency limits, and accessible screen reader notifications.
 *
 * @param {Object} props
 * @param {Function} props.onUploadSuccess - Callback with array of newly created MediaAsset objects
 * @param {number} [props.maxConcurrency=3] - Maximum parallel upload requests
 * @param {number} [props.maxFiles=20] - Max files allowed in batch
 */
export default function MediaUploader({ onUploadSuccess, maxConcurrency = 3, maxFiles = 20 }) {
  const [fileItems, setFileItems] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const fileInputRef = useRef(null);
  const abortControllersRef = useRef(new Map());

  const updateItemStatus = (id, updates) => {
    setFileItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const uploadFile = async (item) => {
    const controller = new AbortController();
    abortControllersRef.current.set(item.id, controller);

    updateItemStatus(item.id, { status: 'uploading', progress: 10, error: null });

    const formData = new FormData();
    formData.append('file', item.file);

    try {
      const response = await fetch('/api/v1/admin/media/upload', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Upload failed with HTTP ${response.status}`);
      }

      const payload = await response.json();
      const asset = payload.data?.asset;

      updateItemStatus(item.id, {
        status: 'success',
        progress: 100,
        asset,
      });

      setStatusMessage(`Successfully uploaded ${item.file.name}`);

      if (onUploadSuccess && asset) {
        onUploadSuccess([asset]);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        updateItemStatus(item.id, { status: 'cancelled', progress: 0, error: 'Cancelled' });
        setStatusMessage(`Upload cancelled for ${item.file.name}`);
      } else {
        updateItemStatus(item.id, {
          status: 'error',
          progress: 0,
          error: err.message || 'Network error occurred',
        });
        setStatusMessage(`Error uploading ${item.file.name}: ${err.message}`);
      }
    } finally {
      abortControllersRef.current.delete(item.id);
    }
  };

  const processQueue = useCallback(
    (queue) => {
      const uploadingCount = queue.filter((i) => i.status === 'uploading').length;
      const pendingItems = queue.filter((i) => i.status === 'pending');
      const availableSlots = Math.max(0, maxConcurrency - uploadingCount);

      const toStart = pendingItems.slice(0, availableSlots);
      toStart.forEach((item) => uploadFile(item));
    },
    [maxConcurrency]
  );

  const handleFilesAdded = (rawFiles) => {
    const validMimes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxBytes = 15 * 1024 * 1024; // 15MB

    const newItems = Array.from(rawFiles).slice(0, maxFiles).map((file) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      if (!validMimes.includes(file.type)) {
        return {
          id,
          file,
          status: 'error',
          progress: 0,
          error: 'Invalid file format. Allowed: JPG, PNG, WebP.',
        };
      }

      if (file.size > maxBytes) {
        return {
          id,
          file,
          status: 'error',
          progress: 0,
          error: 'File exceeds 15MB limit.',
        };
      }

      return {
        id,
        file,
        status: 'pending',
        progress: 0,
        error: null,
      };
    });

    setFileItems((prev) => {
      const updated = [...prev, ...newItems];
      setTimeout(() => processQueue(updated), 0);
      return updated;
    });

    setStatusMessage(`Added ${newItems.length} file(s) to upload queue.`);
  };

  const handleCancel = (id) => {
    const controller = abortControllersRef.current.get(id);
    if (controller) {
      controller.abort();
    } else {
      updateItemStatus(id, { status: 'cancelled', error: 'Cancelled' });
    }
  };

  const handleRetry = (id) => {
    const item = fileItems.find((i) => i.id === id);
    if (!item) return;

    updateItemStatus(id, { status: 'pending', error: null, progress: 0 });
    setTimeout(() => {
      uploadFile({ ...item, status: 'pending' });
    }, 0);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer?.files) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  return (
    <div className="media-uploader" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Screen reader live region */}
      <div role="status" aria-live="polite" className="sr-only">
        {statusMessage}
      </div>

      {/* Dropzone area */}
      <div
        className={`dropzone ${isDragging ? 'dragging' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload images dropzone. Click or drag images here."
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        style={{
          border: `2px dashed ${isDragging ? 'var(--color-primary)' : 'var(--color-border)'}`,
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-8)',
          textAlign: 'center',
          cursor: 'pointer',
          background: isDragging ? 'var(--color-surface-hover)' : 'var(--color-surface)',
          transition: 'border-color var(--motion-fast), background var(--motion-fast)',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files) {
              handleFilesAdded(e.target.files);
              e.target.value = ''; // Reset for re-selection
            }
          }}
          aria-hidden="true"
        />
        <p style={{ fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-2)' }}>
          Drag & drop images here, or click to browse
        </p>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)' }}>
          JPG, PNG, WebP up to 15MB each. Max {maxFiles} files per batch.
        </p>
      </div>

      {/* File queue display */}
      {fileItems.length > 0 && (
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
          }}
          aria-label="Uploads queue"
        >
          {fileItems.map((item) => (
            <li
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-3) var(--space-4)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-surface)',
              }}
            >
              <div style={{ flex: 1, minWidth: 0, marginRight: 'var(--space-4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
                  <span
                    style={{
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-medium)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.file.name}
                  </span>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                    {item.status === 'uploading' && `${item.progress}%`}
                    {item.status === 'success' && 'Done'}
                    {item.status === 'error' && 'Failed'}
                    {item.status === 'cancelled' && 'Cancelled'}
                  </span>
                </div>

                {item.error && (
                  <p role="alert" style={{ color: 'var(--color-danger, #ef4444)', fontSize: 'var(--font-size-xs)' }}>
                    {item.error}
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                {item.status === 'uploading' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancel(item.id);
                    }}
                    style={{
                      padding: 'var(--space-1) var(--space-2)',
                      fontSize: 'var(--font-size-xs)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border)',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                )}

                {(item.status === 'error' || item.status === 'cancelled') && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRetry(item.id);
                    }}
                    style={{
                      padding: 'var(--space-1) var(--space-2)',
                      fontSize: 'var(--font-size-xs)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-primary)',
                      color: 'var(--color-primary)',
                      cursor: 'pointer',
                    }}
                  >
                    Retry
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
