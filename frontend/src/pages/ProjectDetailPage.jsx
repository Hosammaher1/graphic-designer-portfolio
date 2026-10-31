import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Briefcase,
  Layers,
  Wrench,
  X,
  AlertCircle,
} from 'lucide-react';
import { t, getDirection } from '../i18n/config.js';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Button,
  Badge,
} from '../components/ui';
import { DocumentRenderer } from '../page-builder/BlockRenderer.jsx';
import { useConsent } from '../context/ConsentContext.jsx';

export default function ProjectDetailPage({ locale = 'ar' }) {
  const { slug } = useParams();
  const isRtl = getDirection(locale) === 'rtl';
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  const NextIcon = isRtl ? ArrowLeft : ArrowRight;

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(null);
  const { consent, hasConsent } = useConsent();
  const [recommendations, setRecommendations] = useState([]);
  const [isPersonalized, setIsPersonalized] = useState(false);
  const [loadingRecs, setLoadingRecs] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setNotFound(false);

    fetch(`/api/v1/projects/${slug}?locale=${locale}`)
      .then((res) => {
        if (res.status === 404) {
          throw new Error('404');
        }
        if (!res.ok) {
          throw new Error('API error');
        }
        return res.json();
      })
      .then((resData) => {
        if (!isMounted) return;
        const p = resData?.data?.project;
        if (p) {
          setProject(p);
          if (typeof document !== 'undefined') {
            document.title = `${p.seo_title || p.title} — ${t('site.designerName', locale)}`;
          }
        } else {
          setNotFound(true);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        if (err.message === '404') {
          setNotFound(true);
        } else {
          setNotFound(true);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug, locale]);

  // Fetch related recommendations and record interest if personalization consent is active
  useEffect(() => {
    if (!project?.slug) return;
    let isMounted = true;
    setLoadingRecs(true);

    const consentToken = hasConsent('personalization') && consent?.consentId ? consent.consentId : null;
    const url = `/api/v1/projects/${project.slug}/recommendations?locale=${locale}${consentToken ? `&consent_token=${consentToken}` : ''}`;

    fetch(url)
      .then((res) => (res.ok ? res.json() : null))
      .then((resData) => {
        if (!isMounted) return;
        const recs = resData?.data?.recommendations || [];
        setRecommendations(recs);
        setIsPersonalized(Boolean(resData?.data?.personalized));
      })
      .catch(() => {
        if (isMounted) setRecommendations([]);
      })
      .finally(() => {
        if (isMounted) setLoadingRecs(false);
      });

    // Consented browsing affinity tracking
    if (hasConsent('personalization') && consent?.consentId && project.id) {
      fetch('/api/v1/recommendations/interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consent_token: consent.consentId,
          project_id: project.id,
        }),
      }).catch(() => {});
    }

    return () => {
      isMounted = false;
    };
  }, [project?.slug, project?.id, locale, consent?.status, consent?.consentId, hasConsent]);

  // Gallery items including cover image
  const galleryItems = React.useMemo(() => {
    if (!project) return [];
    const items = [];
    if (project.media && project.media.length > 0) {
      project.media.forEach((m) => {
        items.push({
          id: m.id,
          url: m.url || m.original_url,
          title: m.title || project.title,
          caption: m.caption,
        });
      });
    } else if (project.cover_url) {
      items.push({
        id: 'cover',
        url: project.cover_url,
        title: project.title,
      });
    }
    return items;
  }, [project]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (activeImageIndex === null) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveImageIndex(null);
      } else if (e.key === 'ArrowRight') {
        setActiveImageIndex((prev) =>
          prev !== null ? (prev + 1) % galleryItems.length : 0
        );
      } else if (e.key === 'ArrowLeft') {
        setActiveImageIndex((prev) =>
          prev !== null ? (prev - 1 + galleryItems.length) % galleryItems.length : 0
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeImageIndex, galleryItems.length]);

  if (loading) {
    return (
      <div className="project-detail-loading" aria-busy="true">
        <Container size="site">
          <div className="detail-skeleton">
            <div className="skeleton-line sm" />
            <div className="skeleton-line lg" style={{ height: '3rem', margin: 'var(--space-4) 0' }} />
            <div className="skeleton-image" style={{ aspectRatio: '16/9', borderRadius: 'var(--radius-lg)' }} />
          </div>
        </Container>
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="project-not-found-page">
        <Container size="content">
          <Card className="not-found-card">
            <CardContent className="not-found-content">
              <AlertCircle size={48} className="not-found-icon" aria-hidden="true" />
              <h1 className="not-found-title">{t('project.notFoundTitle', locale)}</h1>
              <p className="not-found-desc">{t('project.notFoundDesc', locale)}</p>
              <Button as={Link} to={`/${locale}/work`} variant="primary" size="md">
                <BackIcon size={16} aria-hidden="true" />
                <span>{t('project.backToWork', locale)}</span>
              </Button>
            </CardContent>
          </Card>
        </Container>
      </div>
    );
  }

  return (
    <article className="project-detail-page">
      {/* 1. Header & Metadata Section */}
      <header className="project-detail-header">
        <Container size="site">
          <div className="detail-nav-back">
            <Button as={Link} to={`/${locale}/work`} variant="ghost" size="sm">
              <BackIcon size={16} aria-hidden="true" />
              <span>{t('project.backToWork', locale)}</span>
            </Button>
          </div>

          <div className="detail-header-grid">
            <div className="detail-title-col">
              <div className="detail-badges-row">
                {project.categories?.map((cat) => (
                  <Badge key={cat.id || cat.slug} variant="primary" size="sm">
                    {cat.name}
                  </Badge>
                ))}
              </div>
              <h1 className="detail-title">{project.title}</h1>
              {project.summary && <p className="detail-summary">{project.summary}</p>}
            </div>

            <div className="detail-meta-col">
              <dl className="meta-list">
                {project.client && (
                  <div className="meta-item">
                    <dt className="meta-term">
                      <Briefcase size={16} aria-hidden="true" />
                      <span>{t('project.client', locale)}</span>
                    </dt>
                    <dd className="meta-def">{project.client}</dd>
                  </div>
                )}
                {project.year && (
                  <div className="meta-item">
                    <dt className="meta-term">
                      <Calendar size={16} aria-hidden="true" />
                      <span>{t('project.year', locale)}</span>
                    </dt>
                    <dd className="meta-def">{project.year}</dd>
                  </div>
                )}
                {project.tools && project.tools.length > 0 && (
                  <div className="meta-item">
                    <dt className="meta-term">
                      <Wrench size={16} aria-hidden="true" />
                      <span>{t('project.tools', locale)}</span>
                    </dt>
                    <dd className="meta-def tools-list">
                      {project.tools.map((tool) => (
                        <span key={tool.id || tool.name} className="tool-pill">
                          {tool.name}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </Container>
      </header>

      {/* 2. Cover Hero Image */}
      {project.cover_url && (
        <section className="project-cover-section">
          <Container size="site">
            <div
              className="project-cover-wrap"
              onClick={() => setActiveImageIndex(0)}
              role="button"
              tabIndex="0"
              aria-label={`View full cover for ${project.title}`}
              onKeyDown={(e) => e.key === 'Enter' && setActiveImageIndex(0)}
            >
              <img
                src={project.cover_url}
                alt={project.title}
                className="project-cover-image"
              />
            </div>
          </Container>
        </section>
      )}

      {/* 2.5 Dynamic Custom Layout Blocks */}
      {project.layout_blocks && project.layout_blocks.length > 0 && (
        <section className="project-custom-layout-section my-8" aria-label="Project Layout">
          <DocumentRenderer blocks={project.layout_blocks} locale={locale} />
        </section>
      )}

      {/* 3. Description Section */}
      {project.description && (
        <section className="project-overview-section">
          <Container size="content">
            <div className="overview-content">
              <h2 className="overview-heading">{t('project.overview', locale)}</h2>
              <div className="overview-body">
                <p>{project.description}</p>
              </div>
            </div>
          </Container>
        </section>
      )}

      {/* 4. Visual Documentation / Media Gallery */}
      {galleryItems.length > 0 && (
        <section className="project-gallery-section" aria-labelledby="gallery-heading">
          <Container size="site">
            <h2 id="gallery-heading" className="gallery-section-title">
              {t('project.gallery', locale)}
            </h2>

            <Grid cols="auto-fit" gap="lg" className="detail-gallery-grid">
              {galleryItems.map((media, idx) => (
                <div
                  key={media.id || idx}
                  className="gallery-thumbnail-card"
                  onClick={() => setActiveImageIndex(idx)}
                  role="button"
                  tabIndex="0"
                  aria-label={`View ${media.title || 'image'} full size`}
                  onKeyDown={(e) => e.key === 'Enter' && setActiveImageIndex(idx)}
                >
                  <div className="gallery-thumb-image-wrap">
                    <img
                      src={media.url}
                      alt={media.title || `${project.title} image ${idx + 1}`}
                      className="gallery-thumb-image"
                      loading="lazy"
                    />
                  </div>
                  {media.title && <p className="gallery-thumb-caption">{media.title}</p>}
                </div>
              ))}
            </Grid>
          </Container>
        </section>
      )}

      {/* 4. Related Recommendations Section */}
      {recommendations && recommendations.length > 0 && (
        <section
          className="related-projects-section py-12 border-t border-[var(--color-border,#27272a)]"
          aria-labelledby="related-projects-title"
          data-testid="related-projects"
          data-personalized={String(isPersonalized)}
        >
          <Container size="site">
            <div className="mb-6">
              <h2 id="related-projects-title" className="text-2xl font-bold tracking-tight">
                {t('project.relatedProjects', locale)}
              </h2>
              <p className="text-sm text-[var(--color-text-muted,#a1a1aa)] mt-1">
                {t('project.relatedProjectsSubtitle', locale)}
              </p>
            </div>
            <Grid cols={3} gap="md" className="related-projects-grid">
              {recommendations.map((rec) => (
                <Card
                  key={rec.id}
                  className="related-project-card group overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow"
                  data-testid="related-project-card"
                >
                  <Link
                    to={`/${locale}/projects/${rec.slug}`}
                    className="flex flex-col h-full block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary,#3b82f6)] rounded-lg"
                  >
                    <div className="aspect-[16/10] bg-[var(--color-surface,#18181b)] overflow-hidden relative">
                      {rec.cover_image?.url || rec.cover_url ? (
                        <img
                          src={rec.cover_image?.url || rec.cover_url}
                          alt={rec.cover_image?.alt_text || rec.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--color-text-muted,#a1a1aa)]">
                          <Layers size={32} aria-hidden="true" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        {rec.category && (
                          <Badge variant="outline" size="sm" className="mb-2">
                            {rec.category.name}
                          </Badge>
                        )}
                        <h3 className="font-semibold text-base line-clamp-1 group-hover:text-[var(--color-primary,#3b82f6)] transition-colors">
                          {rec.title}
                        </h3>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </Grid>
          </Container>
        </section>
      )}

      {/* 5. Next & Previous Project Navigation */}
      <footer className="project-pagination-footer">
        <Container size="site">
          <div className="project-pagination-grid">
            {project.prev_project ? (
              <Link
                to={`/${locale}/projects/${project.prev_project.slug}`}
                className="adjacent-project-card prev"
              >
                <span className="adjacent-label">
                  <BackIcon size={14} aria-hidden="true" />
                  <span>{t('project.prevProject', locale)}</span>
                </span>
                <span className="adjacent-title">{project.prev_project.title}</span>
              </Link>
            ) : <div />}

            {project.next_project ? (
              <Link
                to={`/${locale}/projects/${project.next_project.slug}`}
                className="adjacent-project-card next"
              >
                <span className="adjacent-label">
                  <span>{t('project.nextProject', locale)}</span>
                  <NextIcon size={14} aria-hidden="true" />
                </span>
                <span className="adjacent-title">{project.next_project.title}</span>
              </Link>
            ) : <div />}
          </div>
        </Container>
      </footer>

      {/* Lightbox Image Viewer Modal */}
      {activeImageIndex !== null && galleryItems[activeImageIndex] && (
        <div
          className="lightbox-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
        >
          <div
            className="lightbox-backdrop"
            onClick={() => setActiveImageIndex(null)}
            aria-hidden="true"
          />

          <div className="lightbox-dialog">
            {/* Header / Controls */}
            <div className="lightbox-header">
              <span className="lightbox-counter">
                {t('lightbox.imageCount', locale)
                  .replace('{current}', activeImageIndex + 1)
                  .replace('{total}', galleryItems.length)}
              </span>
              <button
                type="button"
                className="lightbox-close-btn"
                aria-label={t('lightbox.close', locale)}
                onClick={() => setActiveImageIndex(null)}
              >
                <X size={24} aria-hidden="true" />
              </button>
            </div>

            {/* Media Display */}
            <div className="lightbox-body">
              {galleryItems.length > 1 && (
                <button
                  type="button"
                  className="lightbox-nav-btn prev"
                  aria-label={t('lightbox.prev', locale)}
                  onClick={() =>
                    setActiveImageIndex(
                      (activeImageIndex - 1 + galleryItems.length) % galleryItems.length
                    )
                  }
                >
                  <BackIcon size={28} aria-hidden="true" />
                </button>
              )}

              <div className="lightbox-image-wrap">
                <img
                  src={galleryItems[activeImageIndex].url}
                  alt={galleryItems[activeImageIndex].title}
                  className="lightbox-img"
                />
                {galleryItems[activeImageIndex].title && (
                  <p className="lightbox-caption">
                    {galleryItems[activeImageIndex].title}
                  </p>
                )}
              </div>

              {galleryItems.length > 1 && (
                <button
                  type="button"
                  className="lightbox-nav-btn next"
                  aria-label={t('lightbox.next', locale)}
                  onClick={() =>
                    setActiveImageIndex((activeImageIndex + 1) % galleryItems.length)
                  }
                >
                  <NextIcon size={28} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
