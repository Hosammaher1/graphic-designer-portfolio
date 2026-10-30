import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Layers, AlertCircle, RefreshCw } from 'lucide-react';
import { t } from '../i18n/config.js';
import {
  Container,
  Grid,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
  CardContent,
  Button,
  Badge,
} from '../components/ui';

export default function WorkPage({ locale = 'ar' }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get('category') || '';

  const [categories, setCategories] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  // Fetch categories once on locale change
  useEffect(() => {
    let isMounted = true;
    fetch(`/api/v1/categories?locale=${locale}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.data?.categories) {
          setCategories(data.data.categories);
        }
      })
      .catch(() => {
        if (isMounted) setCategories([]);
      });

    return () => {
      isMounted = false;
    };
  }, [locale]);

  // Fetch projects when category or page changes
  const fetchProjects = (page = 1, append = false) => {
    if (page === 1) {
      setLoading(true);
      setError(null);
    } else {
      setLoadingMore(true);
    }

    let url = `/api/v1/projects?locale=${locale}&page=${page}`;
    if (selectedCategory) {
      url += `&category=${encodeURIComponent(selectedCategory)}`;
    }

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('API request failed');
        return res.json();
      })
      .then((resData) => {
        const paginated = resData?.data?.projects;
        const items = paginated?.data || [];
        if (append) {
          setProjects((prev) => [...prev, ...items]);
        } else {
          setProjects(items);
        }
        setCurrentPage(paginated?.current_page || 1);
        setLastPage(paginated?.last_page || 1);
        setError(null);
      })
      .catch((err) => {
        setError(err.message || 'Error loading projects');
      })
      .finally(() => {
        setLoading(false);
        setLoadingMore(false);
      });
  };

  useEffect(() => {
    fetchProjects(1, false);
  }, [locale, selectedCategory]);

  const handleCategorySelect = (slug) => {
    if (slug) {
      setSearchParams({ category: slug });
    } else {
      setSearchParams({});
    }
  };

  const handleLoadMore = () => {
    if (currentPage < lastPage && !loadingMore) {
      fetchProjects(currentPage + 1, true);
    }
  };

  return (
    <div className="work-page">
      {/* Header */}
      <section className="work-header-section" aria-labelledby="work-title">
        <Container size="site">
          <div className="work-header-content">
            <h1 id="work-title" className="work-title">
              {t('work.title', locale)}
            </h1>
            <p className="work-subtitle">{t('work.subtitle', locale)}</p>
          </div>

          {/* Category Tabs */}
          <nav className="category-tabs-nav" aria-label="Project Categories">
            <div className="category-tabs-list" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={!selectedCategory}
                className={`category-tab-btn ${!selectedCategory ? 'active' : ''}`}
                onClick={() => handleCategorySelect('')}
              >
                {t('work.allCategories', locale)}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id || cat.slug}
                  type="button"
                  role="tab"
                  aria-selected={selectedCategory === cat.slug}
                  className={`category-tab-btn ${selectedCategory === cat.slug ? 'active' : ''}`}
                  onClick={() => handleCategorySelect(cat.slug)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </nav>
        </Container>
      </section>

      {/* Projects Grid Section */}
      <section className="work-grid-section" aria-label="Projects Gallery">
        <Container size="site">
          {error ? (
            <Card className="work-error-card">
              <CardContent className="work-error-content">
                <AlertCircle size={40} className="work-error-icon" aria-hidden="true" />
                <h2 className="work-error-title">{t('work.errorTitle', locale)}</h2>
                <p className="work-error-desc">{t('work.errorDesc', locale)}</p>
                <Button variant="primary" size="md" onClick={() => fetchProjects(1, false)}>
                  <RefreshCw size={16} aria-hidden="true" />
                  <span>{t('work.retry', locale)}</span>
                </Button>
              </CardContent>
            </Card>
          ) : loading ? (
            <Grid cols="auto-fit" gap="lg" className="projects-grid" aria-busy="true">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="project-skeleton-card">
                  <div className="skeleton-image" />
                  <div className="skeleton-body">
                    <div className="skeleton-line sm" />
                    <div className="skeleton-line lg" />
                    <div className="skeleton-line md" />
                  </div>
                </div>
              ))}
            </Grid>
          ) : projects.length > 0 ? (
            <>
              <Grid cols="auto-fit" gap="lg" className="projects-grid">
                {projects.map((project) => (
                  <Card key={project.id} interactive className="project-card">
                    {project.cover_url && (
                      <div className="project-card-image-wrap">
                        <img
                          src={project.cover_url}
                          alt={project.title}
                          className="project-card-image"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <div className="project-card-meta">
                        {project.client && <span className="project-client">{project.client}</span>}
                        {project.year && <span className="project-year">{project.year}</span>}
                      </div>
                      <CardTitle as="h2">
                        <Link
                          to={`/${locale}/projects/${project.slug}`}
                          className="project-title-link"
                        >
                          {project.title}
                        </Link>
                      </CardTitle>
                      {project.summary && <CardDescription>{project.summary}</CardDescription>}
                    </CardHeader>
                    <CardFooter className="project-card-footer">
                      <div className="project-categories">
                        {project.categories?.map((cat) => (
                          <Badge key={cat.id || cat.slug} variant="default" size="sm">
                            {cat.name}
                          </Badge>
                        ))}
                      </div>
                      <Button
                        as={Link}
                        to={`/${locale}/projects/${project.slug}`}
                        variant="ghost"
                        size="sm"
                      >
                        {t('home.viewProject', locale)}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </Grid>

              {/* Load More Button */}
              {currentPage < lastPage && (
                <div className="load-more-wrap">
                  <Button
                    variant="outline"
                    size="lg"
                    loading={loadingMore}
                    onClick={handleLoadMore}
                  >
                    {t('work.loadMore', locale)}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <Card className="fallback-card">
              <CardContent className="fallback-content">
                <Layers size={36} className="fallback-icon" aria-hidden="true" />
                <h2 className="fallback-title">{t('work.emptyTitle', locale)}</h2>
                <p className="fallback-desc">{t('work.emptyDesc', locale)}</p>
                <Button variant="outline" size="md" onClick={() => handleCategorySelect('')}>
                  {t('work.allCategories', locale)}
                </Button>
              </CardContent>
            </Card>
          )}
        </Container>
      </section>
    </div>
  );
}
