import React, { useState, useEffect } from 'react';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  // New Category Form state
  const [slug, setSlug] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/admin/categories', {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to load categories');
      const json = await res.json();
      setCategories(json.data?.categories || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormErrors({});
    setNotice(null);

    const payload = {
      slug,
      translations: {
        ar: { name: nameAr },
        en: { name: nameEn },
      },
    };

    try {
      const res = await fetch('/api/v1/admin/categories', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        if (res.status === 422) {
          setFormErrors(json.errors || {});
        } else {
          throw new Error(json.message || 'Failed to add category');
        }
        return;
      }

      setSlug('');
      setNameAr('');
      setNameEn('');
      setNotice('Category created successfully.');
      fetchCategories();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMoveCategory = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const updated = [...categories];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    const reorderedCategories = updated.map((cat, idx) => ({
      ...cat,
      sort_order: idx + 1,
    }));

    setCategories(reorderedCategories);

    try {
      const payload = {
        orders: reorderedCategories.map((c) => ({ id: c.id, sort_order: c.sort_order })),
      };
      await fetch('/api/v1/admin/categories/reorder', {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error('Failed to persist category order', err);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;

    try {
      const res = await fetch(`/api/v1/admin/categories/${id}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to delete category');
      setNotice('Category deleted.');
      fetchCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="admin-page-container" style={{ padding: 'var(--space-6)', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'bold' }}>Categories</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
          Manage project categories, bilingual titles, and display order.
        </p>
      </div>

      {notice && (
        <div style={{ padding: 'var(--space-3)', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid #22c55e', color: '#22c55e', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
          {notice}
        </div>
      )}

      {error && (
        <div role="alert" style={{ padding: 'var(--space-3)', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
          {error}
        </div>
      )}

      {/* Create Category Form */}
      <div style={{ padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', marginBottom: 'var(--space-6)' }}>
        <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-3)' }}>Add New Category</h2>
        <form onSubmit={handleAddCategory} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)', alignItems: 'end' }}>
          <div>
            <label htmlFor="cat-slug" style={{ display: 'block', marginBottom: 'var(--space-1)', fontSize: 'var(--font-size-sm)' }}>Slug *</label>
            <input
              id="cat-slug"
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. branding"
              style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
            />
            {formErrors.slug && <span style={{ color: '#ef4444', fontSize: 'var(--font-size-xs)' }}>{formErrors.slug[0]}</span>}
          </div>

          <div>
            <label htmlFor="cat-ar-name" style={{ display: 'block', marginBottom: 'var(--space-1)', fontSize: 'var(--font-size-sm)' }}>Arabic Name *</label>
            <input
              id="cat-ar-name"
              type="text"
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              placeholder="الهويات البصرية"
              dir="rtl"
              style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
            />
          </div>

          <div>
            <label htmlFor="cat-en-name" style={{ display: 'block', marginBottom: 'var(--space-1)', fontSize: 'var(--font-size-sm)' }}>English Name *</label>
            <input
              id="cat-en-name"
              type="text"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="Brand Identity"
              style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={submitting}
              style={{ width: '100%', padding: 'var(--space-2)', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 'bold' }}
            >
              {submitting ? 'Adding...' : 'Add Category'}
            </button>
          </div>
        </form>
      </div>

      {/* Loading state */}
      {loading && (
        <div role="status" style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          Loading categories...
        </div>
      )}

      {/* Categories List */}
      {!loading && categories.length === 0 && (
        <div style={{ padding: 'var(--space-8)', textAlign: 'center', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)' }}>
          <p style={{ color: 'var(--color-text-secondary)' }}>No categories yet. Create your first category above.</p>
        </div>
      )}

      {!loading && categories.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {categories.map((cat, idx) => {
            const enName = cat.translations?.find((t) => t.locale === 'en')?.name || cat.slug;
            const arName = cat.translations?.find((t) => t.locale === 'ar')?.name || '';

            return (
              <div
                key={cat.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--space-3)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-surface)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--color-text-secondary)', minWidth: '24px' }}>
                    #{cat.sort_order || idx + 1}
                  </span>
                  <div>
                    <span style={{ fontWeight: 'bold', marginRight: 'var(--space-2)' }}>{enName}</span>
                    {arName && <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>({arName})</span>}
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                      <code>{cat.slug}</code>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <button
                    type="button"
                    aria-label={`Move ${cat.slug} up`}
                    disabled={idx === 0}
                    onClick={() => handleMoveCategory(idx, -1)}
                    style={{ fontSize: 'var(--font-size-xs)', padding: 'var(--space-1) var(--space-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.5 : 1, background: 'none' }}
                  >
                    ▲ Up
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${cat.slug} down`}
                    disabled={idx === categories.length - 1}
                    onClick={() => handleMoveCategory(idx, 1)}
                    style={{ fontSize: 'var(--font-size-xs)', padding: 'var(--space-1) var(--space-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', cursor: idx === categories.length - 1 ? 'not-allowed' : 'pointer', opacity: idx === categories.length - 1 ? 0.5 : 1, background: 'none' }}
                  >
                    ▼ Down
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(cat.id)}
                    style={{ fontSize: 'var(--font-size-xs)', padding: 'var(--space-1) var(--space-2)', border: '1px solid #ef4444', color: '#ef4444', borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: 'none' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
