/**
 * Page Builder Admin API Client
 * Versioned REST API endpoints for draft management, optimistic locking, and publishing.
 */

const API_BASE = '/api/v1/admin/pages';

/**
 * Fetch active draft and current lock version for a page.
 */
export async function fetchPageDraft(slug) {
  try {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(slug)}/draft`, {
      headers: {
        Accept: 'application/json',
      },
      credentials: 'same-origin',
    });

    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        error: `Failed to fetch page draft: ${res.statusText}`,
      };
    }

    const data = await res.json();
    return {
      success: true,
      page: data.page,
      draft_version: data.draft_version,
      blocks: data.blocks || [],
    };
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Network error fetching draft',
    };
  }
}

/**
 * Save draft version with optimistic concurrency control.
 */
export async function savePageDraft(slug, payload) {
  try {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(slug)}/draft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'same-origin',
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (res.status === 409) {
      return {
        success: false,
        conflict: true,
        status: 409,
        current_lock_version: data.current_lock_version,
        message: data.message || 'Stale update conflict',
      };
    }

    if (!res.ok) {
      return {
        success: false,
        conflict: false,
        status: res.status,
        errors: data.errors || [],
        message: data.message || `Failed to save draft (${res.status})`,
      };
    }

    return {
      success: true,
      page: data.page,
      draft_version: data.draft_version,
      message: data.message,
    };
  } catch (err) {
    return {
      success: false,
      conflict: false,
      error: err.message || 'Network error saving draft',
    };
  }
}
