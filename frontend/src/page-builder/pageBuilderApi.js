/**
 * Page Builder Admin API Client
 * Versioned REST API endpoints for draft management, optimistic locking, secure previews, and publishing.
 */

const API_BASE = '/api/v1/admin/pages';

function getAuthHeaders(extra = {}) {
  const headers = { Accept: 'application/json', ...extra };
  if (typeof window !== 'undefined' && window.localStorage) {
    const token = window.localStorage.getItem('studio_admin_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Fetch active draft and current lock version for a page.
 */
export async function fetchPageDraft(slug) {
  try {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(slug)}/draft`, {
      headers: {
        ...getAuthHeaders(),
      },
      credentials: 'include',
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
        ...getAuthHeaders(),
      },
      credentials: 'include',
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

/**
 * Generate a short-lived cryptographically signed preview URL.
 */
export async function generatePreviewUrl(slug) {
  try {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(slug)}/preview-url`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
      },
      credentials: 'include',
    });

    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        error: `Failed to generate preview URL (${res.status})`,
      };
    }

    const data = await res.json();
    return {
      success: true,
      preview_url: data.preview_url,
      expires_at: data.expires_at,
    };
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Network error generating preview URL',
    };
  }
}

/**
 * Fetch preview data (can use signed URL query string or admin session).
 */
export async function fetchSecurePreview(slug, queryParams = '') {
  try {
    const url = queryParams
      ? `/api/v1/pages/${encodeURIComponent(slug)}/preview?${queryParams}`
      : `${API_BASE}/${encodeURIComponent(slug)}/preview`;

    const res = await fetch(url, {
      headers: {
        ...getAuthHeaders(),
      },
      credentials: 'include',
    });

    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        error: `Preview access denied (${res.status})`,
      };
    }

    const data = await res.json();
    return {
      success: true,
      page: data.page,
      draft_version: data.draft_version,
      blocks: data.blocks || [],
      is_preview: true,
    };
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Network error fetching secure preview',
    };
  }
}

/**
 * Atomically publish the current draft version.
 */
export async function publishPage(slug) {
  try {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(slug)}/publish`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
      },
      credentials: 'include',
    });

    const data = await res.json().catch(() => ({}));

    if (res.status === 422) {
      return {
        success: false,
        policy_violation: true,
        status: 422,
        errors: data.errors || {},
        message: data.message || 'Localized completeness policy violation',
      };
    }

    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        message: data.message || `Failed to publish page (${res.status})`,
      };
    }

    return {
      success: true,
      page: data.page,
      published_version: data.published_version,
      message: data.message,
    };
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Network error publishing page',
    };
  }
}

/**
 * Fetch public published page for anonymous visitors.
 */
export async function fetchPublicPage(slug) {
  try {
    const res = await fetch(`/api/v1/pages/${encodeURIComponent(slug)}`, {
      headers: {
        ...getAuthHeaders(),
      },
    });

    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        error: `Page not found or not published (${res.status})`,
      };
    }

    const data = await res.json();
    return {
      success: true,
      page: data.page,
      blocks: data.blocks || [],
    };
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Network error fetching public page',
    };
  }
}
