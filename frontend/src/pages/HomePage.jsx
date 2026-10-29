import React from 'react';
import { t } from '../i18n/config.js';

export default function HomePage({ locale = 'ar' }) {
  return (
    <div className="home-page site-container">
      <header className="hero-section" style={{ padding: 'var(--space-16) 0 var(--space-8)' }}>
        <p style={{
          fontSize: 'var(--font-size-sm)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--color-text-secondary)',
          marginBottom: 'var(--space-2)'
        }}>
          {t('home.badge', locale)}
        </p>
        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, var(--font-size-5xl))',
          fontWeight: 'var(--font-weight-bold)',
          lineHeight: 'var(--line-height-tight)',
          maxWidth: '800px',
          color: 'var(--color-text-primary)'
        }}>
          {t('home.heroTitle', locale)}
        </h1>
        <p style={{
          fontSize: 'var(--font-size-lg)',
          color: 'var(--color-text-secondary)',
          marginTop: 'var(--space-4)',
          maxWidth: '600px',
          lineHeight: 'var(--line-height-relaxed)'
        }}>
          {t('home.heroSubtitle', locale)}
        </p>
      </header>

      <section className="featured-work" aria-labelledby="featured-work-heading" style={{ margin: 'var(--space-12) 0' }}>
        <h2 id="featured-work-heading" style={{
          fontSize: 'var(--font-size-2xl)',
          marginBottom: 'var(--space-6)',
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: 'var(--space-2)'
        }}>
          {t('home.featuredWork', locale)}
        </h2>
        <div className="projects-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 'var(--space-6)'
        }}>
          <article className="project-card-placeholder" style={{
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-8)',
            border: '1px dashed var(--color-border)',
            textAlign: 'center'
          }}>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
              {t('home.placeholderNotice', locale)}
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}
