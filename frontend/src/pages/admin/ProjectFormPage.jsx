import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MediaUploader from '../../components/admin/MediaUploader.jsx';

export default function ProjectFormPage({ initialMedia = [] }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  // Form Fields
  const [slug, setSlug] = useState('');
  const [status, setStatus] = useState('draft');
  const [year, setYear] = useState(new Date().getFullYear());
  const [client, setClient] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [enableWatermark, setEnableWatermark] = useState(true);

  // Translations
  const [titleAr, setTitleAr] = useState('');
  const [summaryAr, setSummaryAr] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [summaryEn, setSummaryEn] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');

  // Categories & Media
  const [availableCategories, setAvailableCategories] = useState([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [mediaList, setMediaList] = useState(initialMedia);

  // State
  const [isDirty, setIsDirty] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [topAlert, setTopAlert] = useState(null);

  // Fetch Categories & existing project if in edit mode
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/v1/admin/categories', { headers: { Accept: 'application/json' } });
        if (res?.ok) {
          const json = await res.json();
          setAvailableCategories(json.data?.categories || []);
        }
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };

    fetchCategories();

    if (isEdit) {
      const fetchProject = async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/v1/admin/projects/${id}`, { headers: { Accept: 'application/json' } });
          if (!res.ok) throw new Error('Project not found');
          const json = await res.json();
          const p = json.data?.project;
          if (p) {
            setSlug(p.slug || '');
            setStatus(p.status || 'draft');
            setYear(p.year || new Date().getFullYear());
            setClient(p.client || '');
            setIsFeatured(Boolean(p.is_featured));
            setEnableWatermark(Boolean(p.enable_watermark));

            const arTrans = p.translations?.find((t) => t.locale === 'ar') || {};
            setTitleAr(arTrans.title || '');
            setSummaryAr(arTrans.summary || '');
            setDescriptionAr(arTrans.description || '');

            const enTrans = p.translations?.find((t) => t.locale === 'en') || {};
            setTitleEn(enTrans.title || '');
            setSummaryEn(enTrans.summary || '');
            setDescriptionEn(enTrans.description || '');

            setSelectedCategoryIds(p.categories?.map((c) => c.id) || []);
            setMediaList(p.media || initialMedia);
          }
        } catch (err) {
          setTopAlert({ type: 'error', message: err.message });
        } finally {
          setLoading(false);
        }
      };

      fetchProject();
    }
  }, [id, isEdit]);

  // Window beforeunload warning
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const markDirty = () => {
    if (!isDirty) setIsDirty(true);
  };

  const handleMediaUploadSuccess = (asset) => {
    markDirty();
    const newItem = {
      id: Date.now(),
      media_asset_id: asset.id,
      file_name: asset.file_name,
      original_url: asset.original_url,
      is_cover: mediaList.length === 0,
      sort_order: mediaList.length + 1,
    };
    setMediaList((prev) => [...prev, newItem]);
  };

  const handleMoveMedia = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= mediaList.length) return;

    markDirty();
    const updated = [...mediaList];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    // Update sort_order
    const reordered = updated.map((item, idx) => ({
      ...item,
      sort_order: idx + 1,
    }));
    setMediaList(reordered);
  };

  const handleSetCover = (index) => {
    markDirty();
    setMediaList((prev) =>
      prev.map((item, idx) => ({
        ...item,
        is_cover: idx === index,
      }))
    );
  };

  const handleRemoveMedia = (index) => {
    markDirty();
    setMediaList((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleCancel = () => {
    if (isDirty) {
      const discard = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!discard) return;
    }
    navigate('/admin/projects');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setTopAlert(null);

    const payload = {
      slug,
      status,
      year: Number(year),
      client,
      is_featured: isFeatured,
      enable_watermark: enableWatermark,
      translations: {
        ar: { title: titleAr, summary: summaryAr, description: descriptionAr },
        en: { title: titleEn, summary: summaryEn, description: descriptionEn },
      },
      category_ids: selectedCategoryIds,
    };

    try {
      const url = isEdit ? `/api/v1/admin/projects/${id}` : '/api/v1/admin/projects';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        if (res.status === 422) {
          setErrors(json.errors || {});
          setTopAlert({ type: 'error', message: json.message || 'Validation failed. Please review errors.' });
        } else {
          throw new Error(json.message || 'Failed to save project.');
        }
        return;
      }

      setIsDirty(false);
      navigate('/admin/projects');
    } catch (err) {
      setTopAlert({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div role="status" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Loading project details...</div>;
  }

  return (
    <div className="admin-form-container" style={{ padding: 'var(--space-6)', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'bold' }}>
          {isEdit ? 'Edit Project' : 'New Project'}
        </h1>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button
            type="button"
            onClick={handleCancel}
            style={{ padding: 'var(--space-2) var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'none', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            style={{ padding: 'var(--space-2) var(--space-4)', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {saving ? 'Saving...' : 'Save Project'}
          </button>
        </div>
      </div>

      {topAlert && (
        <div role="alert" style={{ padding: 'var(--space-3)', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
          <p style={{ fontWeight: 'bold' }}>{topAlert.message}</p>
          {Object.keys(errors).length > 0 && (
            <ul style={{ margin: 'var(--space-2) 0 0 var(--space-4)' }}>
              {Object.entries(errors).map(([key, msgs]) => (
                <li key={key}>{Array.isArray(msgs) ? msgs.join(' ') : msgs}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        {/* Core Attributes */}
        <div style={{ padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)' }}>
          <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-4)' }}>Core Attributes</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
            <div>
              <label htmlFor="project-slug" style={{ display: 'block', marginBottom: 'var(--space-1)', fontWeight: 'medium' }}>Slug *</label>
              <input
                id="project-slug"
                type="text"
                value={slug}
                onChange={(e) => { setSlug(e.target.value); markDirty(); }}
                style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                placeholder="project-unique-slug"
              />
              {errors.slug && <span style={{ color: '#ef4444', fontSize: 'var(--font-size-xs)' }}>{errors.slug[0]}</span>}
            </div>

            <div>
              <label htmlFor="project-status" style={{ display: 'block', marginBottom: 'var(--space-1)', fontWeight: 'medium' }}>Status</label>
              <select
                id="project-status"
                value={status}
                onChange={(e) => { setStatus(e.target.value); markDirty(); }}
                style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div>
              <label htmlFor="project-year" style={{ display: 'block', marginBottom: 'var(--space-1)', fontWeight: 'medium' }}>Year</label>
              <input
                id="project-year"
                type="number"
                value={year}
                onChange={(e) => { setYear(e.target.value); markDirty(); }}
                style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
              />
            </div>

            <div>
              <label htmlFor="project-client" style={{ display: 'block', marginBottom: 'var(--space-1)', fontWeight: 'medium' }}>Client</label>
              <input
                id="project-client"
                type="text"
                value={client}
                onChange={(e) => { setClient(e.target.value); markDirty(); }}
                style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                placeholder="Client or organization name"
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-6)', marginTop: 'var(--space-4)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => { setIsFeatured(e.target.checked); markDirty(); }}
              />
              Featured Project
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={enableWatermark}
                onChange={(e) => { setEnableWatermark(e.target.checked); markDirty(); }}
              />
              Enable Watermark Protection
            </label>
          </div>
        </div>

        {/* Bilingual Content */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 'var(--space-4)' }}>
          {/* Arabic Content */}
          <div style={{ padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', direction: 'rtl' }}>
            <h2 style={{ fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-3)' }}>المحتوى العربي (العربية)</h2>
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <label htmlFor="title-ar" style={{ display: 'block', marginBottom: 'var(--space-1)' }}>عنوان المشروع *</label>
              <input
                id="title-ar"
                type="text"
                value={titleAr}
                onChange={(e) => { setTitleAr(e.target.value); markDirty(); }}
                style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
              />
            </div>
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <label htmlFor="summary-ar" style={{ display: 'block', marginBottom: 'var(--space-1)' }}>ملخص قصير</label>
              <textarea
                id="summary-ar"
                rows={2}
                value={summaryAr}
                onChange={(e) => { setSummaryAr(e.target.value); markDirty(); }}
                style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
              />
            </div>
            <div>
              <label htmlFor="desc-ar" style={{ display: 'block', marginBottom: 'var(--space-1)' }}>الوصف التفصيلي</label>
              <textarea
                id="desc-ar"
                rows={4}
                value={descriptionAr}
                onChange={(e) => { setDescriptionAr(e.target.value); markDirty(); }}
                style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
              />
            </div>
          </div>

          {/* English Content */}
          <div style={{ padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)' }}>
            <h2 style={{ fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-3)' }}>English Content</h2>
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <label htmlFor="title-en" style={{ display: 'block', marginBottom: 'var(--space-1)' }}>Project Title *</label>
              <input
                id="title-en"
                type="text"
                value={titleEn}
                onChange={(e) => { setTitleEn(e.target.value); markDirty(); }}
                style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
              />
            </div>
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <label htmlFor="summary-en" style={{ display: 'block', marginBottom: 'var(--space-1)' }}>Short Summary</label>
              <textarea
                id="summary-en"
                rows={2}
                value={summaryEn}
                onChange={(e) => { setSummaryEn(e.target.value); markDirty(); }}
                style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
              />
            </div>
            <div>
              <label htmlFor="desc-en" style={{ display: 'block', marginBottom: 'var(--space-1)' }}>Detailed Description</label>
              <textarea
                id="desc-en"
                rows={4}
                value={descriptionEn}
                onChange={(e) => { setDescriptionEn(e.target.value); markDirty(); }}
                style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
              />
            </div>
          </div>
        </div>

        {/* Categories */}
        {availableCategories.length > 0 && (
          <div style={{ padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)' }}>
            <h2 style={{ fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-3)' }}>Categories</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
              {availableCategories.map((cat) => (
                <label key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selectedCategoryIds.includes(cat.id)}
                    onChange={(e) => {
                      markDirty();
                      if (e.target.checked) {
                        setSelectedCategoryIds((prev) => [...prev, cat.id]);
                      } else {
                        setSelectedCategoryIds((prev) => prev.filter((cid) => cid !== cat.id));
                      }
                    }}
                  />
                  {cat.translations?.find((t) => t.locale === 'en')?.name || cat.slug}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Media Management & Reordering */}
        <div style={{ padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)' }}>
          <h2 style={{ fontSize: 'var(--font-size-md)', marginBottom: 'var(--space-3)' }}>Media Assets</h2>
          <MediaUploader onUploadSuccess={handleMediaUploadSuccess} />

          {mediaList.length > 0 && (
            <div style={{ marginTop: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                Drag or use the accessible Move Up / Move Down buttons to reorder media items. Exactly one item is the cover.
              </p>
              {mediaList.map((item, idx) => (
                <div
                  key={item.id}
                  data-testid="media-item-row"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-2) var(--space-3)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    background: item.is_cover ? 'rgba(34, 197, 94, 0.05)' : 'transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <span style={{ fontWeight: 'bold', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', minWidth: '24px' }}>
                      #{idx + 1}
                    </span>
                    <span style={{ fontWeight: 'medium' }}>{item.file_name}</span>
                    {item.is_cover && (
                      <span style={{ background: '#22c55e', color: '#fff', fontSize: 'var(--font-size-xs)', padding: '2px 6px', borderRadius: '4px' }}>
                        Cover
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    {!item.is_cover && (
                      <button
                        type="button"
                        onClick={() => handleSetCover(idx)}
                        style={{ fontSize: 'var(--font-size-xs)', padding: 'var(--space-1) var(--space-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: 'none' }}
                      >
                        Set Cover
                      </button>
                    )}
                    <button
                      type="button"
                      aria-label={`Move ${item.file_name} up`}
                      disabled={idx === 0}
                      onClick={() => handleMoveMedia(idx, -1)}
                      style={{ fontSize: 'var(--font-size-xs)', padding: 'var(--space-1) var(--space-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.5 : 1, background: 'none' }}
                    >
                      ▲ Up
                    </button>
                    <button
                      type="button"
                      aria-label={`Move ${item.file_name} down`}
                      disabled={idx === mediaList.length - 1}
                      onClick={() => handleMoveMedia(idx, 1)}
                      style={{ fontSize: 'var(--font-size-xs)', padding: 'var(--space-1) var(--space-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', cursor: idx === mediaList.length - 1 ? 'not-allowed' : 'pointer', opacity: idx === mediaList.length - 1 ? 0.5 : 1, background: 'none' }}
                    >
                      ▼ Down
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveMedia(idx)}
                      style={{ fontSize: 'var(--font-size-xs)', padding: 'var(--space-1) var(--space-2)', border: '1px solid #ef4444', color: '#ef4444', borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: 'none' }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
