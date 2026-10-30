import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function ProjectsPage() {
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'trash'
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  const fetchProjects = async (tab = activeTab) => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = tab === 'trash' ? '/api/v1/admin/projects/trash' : '/api/v1/admin/projects';
      const res = await fetch(endpoint, {
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`Failed to load projects: ${res.statusText}`);
      }

      const json = await res.json();
      setProjects(json.data?.projects?.data || []);
    } catch (err) {
      setError(`Failed to load projects: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects(activeTab);
  }, [activeTab]);

  const handleTogglePublish = async (project) => {
    try {
      const action = project.status === 'published' ? 'unpublish' : 'publish';
      const res = await fetch(`/api/v1/admin/projects/${project.id}/${action}`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`Failed to ${action} project.`);
      }

      setActionMessage(`Project successfully ${action}ed.`);
      fetchProjects(activeTab);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleMoveToTrash = async (id) => {
    if (!window.confirm('Are you sure you want to move this project to trash?')) {
      return;
    }
    try {
      const res = await fetch(`/api/v1/admin/projects/${id}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to move project to trash.');
      setActionMessage('Project moved to trash.');
      fetchProjects(activeTab);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRestore = async (id) => {
    try {
      const res = await fetch(`/api/v1/admin/projects/${id}/restore`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to restore project.');
      setActionMessage('Project restored from trash.');
      fetchProjects(activeTab);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleForceDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this project? This cannot be undone.')) {
      return;
    }
    try {
      const res = await fetch(`/api/v1/admin/projects/${id}/force`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to permanently delete project.');
      setActionMessage('Project permanently deleted.');
      fetchProjects(activeTab);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="admin-page-container" style={{ padding: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)' }}>Projects</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            Manage portfolio projects, drafts, media, and publishing.
          </p>
        </div>
        <Link
          to="/admin/projects/new"
          className="btn btn-primary"
          style={{
            padding: 'var(--space-2) var(--space-4)',
            background: 'var(--color-primary)',
            color: '#fff',
            borderRadius: 'var(--radius-md)',
            textDecoration: 'none',
            fontWeight: 'var(--font-weight-medium)',
          }}
        >
          + New Project
        </Link>
      </div>

      {/* Tabs */}
      <div role="tablist" style={{ display: 'flex', gap: 'var(--space-2)', borderBottom: '1px solid var(--color-border)', marginBottom: 'var(--space-6)' }}>
        <button
          role="tab"
          aria-selected={activeTab === 'active'}
          onClick={() => setActiveTab('active')}
          style={{
            padding: 'var(--space-2) var(--space-4)',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'active' ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeTab === 'active' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            fontWeight: activeTab === 'active' ? 'bold' : 'normal',
            cursor: 'pointer',
          }}
        >
          Active Projects
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'trash'}
          onClick={() => setActiveTab('trash')}
          style={{
            padding: 'var(--space-2) var(--space-4)',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'trash' ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeTab === 'trash' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            fontWeight: activeTab === 'trash' ? 'bold' : 'normal',
            cursor: 'pointer',
          }}
        >
          Trash
        </button>
      </div>

      {/* Action Notice */}
      {actionMessage && (
        <div style={{ padding: 'var(--space-3)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
          {actionMessage}
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div role="alert" style={{ padding: 'var(--space-3)', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div role="status" style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          Loading projects...
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && projects.length === 0 && (
        <div className="empty-state" style={{ padding: 'var(--space-12)', textAlign: 'center', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)' }}>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
            {activeTab === 'trash' ? 'No trashed projects found.' : 'No projects found. Create your first portfolio project to get started.'}
          </p>
        </div>
      )}

      {/* Projects List / Table */}
      {!loading && !error && projects.length > 0 && (
        <div style={{ overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: 'var(--space-3)' }}>Title</th>
                <th style={{ padding: 'var(--space-3)' }}>Slug</th>
                <th style={{ padding: 'var(--space-3)' }}>Year</th>
                <th style={{ padding: 'var(--space-3)' }}>Status</th>
                <th style={{ padding: 'var(--space-3)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((proj) => {
                const title = proj.translations?.find((t) => t.locale === 'en')?.title
                  || proj.translations?.find((t) => t.locale === 'ar')?.title
                  || proj.title
                  || 'Untitled';

                return (
                  <tr key={proj.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 'var(--space-3)', fontWeight: 'var(--font-weight-medium)' }}>
                      {title}
                    </td>
                    <td style={{ padding: 'var(--space-3)', color: 'var(--color-text-secondary)' }}>
                      <code>{proj.slug}</code>
                    </td>
                    <td style={{ padding: 'var(--space-3)' }}>
                      {proj.year || '—'}
                    </td>
                    <td style={{ padding: 'var(--space-3)' }}>
                      <span
                        className={`badge badge-${proj.status}`}
                        style={{
                          padding: 'var(--space-1) var(--space-2)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: 'var(--font-size-xs)',
                          textTransform: 'uppercase',
                          fontWeight: 'bold',
                          background: proj.status === 'published' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                          color: proj.status === 'published' ? '#22c55e' : '#eab308',
                        }}
                      >
                        {proj.status}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>
                      {activeTab === 'active' ? (
                        <div style={{ display: 'inline-flex', gap: 'var(--space-2)' }}>
                          <Link
                            to={`/admin/projects/${proj.id}/edit`}
                            style={{ padding: 'var(--space-1) var(--space-2)', fontSize: 'var(--font-size-xs)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', textDecoration: 'none', color: 'inherit' }}
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleTogglePublish(proj)}
                            style={{ padding: 'var(--space-1) var(--space-2)', fontSize: 'var(--font-size-xs)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: 'none', color: 'inherit' }}
                          >
                            {proj.status === 'published' ? 'Unpublish' : 'Publish'}
                          </button>
                          <button
                            onClick={() => handleMoveToTrash(proj.id)}
                            style={{ padding: 'var(--space-1) var(--space-2)', fontSize: 'var(--font-size-xs)', border: '1px solid #ef4444', color: '#ef4444', borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: 'none' }}
                          >
                            Trash
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'inline-flex', gap: 'var(--space-2)' }}>
                          <button
                            onClick={() => handleRestore(proj.id)}
                            style={{ padding: 'var(--space-1) var(--space-2)', fontSize: 'var(--font-size-xs)', border: '1px solid #22c55e', color: '#22c55e', borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: 'none' }}
                          >
                            Restore
                          </button>
                          <button
                            onClick={() => handleForceDelete(proj.id)}
                            style={{ padding: 'var(--space-1) var(--space-2)', fontSize: 'var(--font-size-xs)', border: '1px solid #ef4444', color: '#ef4444', borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: 'none' }}
                          >
                            Delete Permanently
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
