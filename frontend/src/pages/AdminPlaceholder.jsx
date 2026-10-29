import React from 'react';

export default function AdminPlaceholder() {
  return (
    <div className="admin-shell site-container" style={{ padding: 'var(--space-12) 0' }}>
      <header style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ fontSize: 'var(--font-size-3xl)', marginBottom: 'var(--space-2)' }}>
          Admin Dashboard
        </h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Portfolio Content Management & Site Administration Shell
        </p>
      </header>

      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-8)'
      }}>
        <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-4)' }}>
          Administration Shell Status
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
          Authentication (Sanctum session cookies) and admin workflows will be initialized in Phase 02.
        </p>
        <ul style={{ paddingLeft: 'var(--space-6)', color: 'var(--color-text-secondary)' }}>
          <li>Phase 02: Admin Auth & Session Management</li>
          <li>Phase 03: Projects, Categories, Media Management</li>
          <li>Phase 05: Block-based Page Builder</li>
          <li>Phase 06: Search & Analytics Dashboard</li>
        </ul>
      </div>
    </div>
  );
}
