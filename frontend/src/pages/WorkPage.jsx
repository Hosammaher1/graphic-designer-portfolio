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
import SearchFilterBar from '../components/SearchFilterBar.jsx';

export default function WorkPage({ locale = 'ar' }) {
  const isAr = locale === 'ar';
  const [searchParams, setSearchParams] = useSearchParams();

  const searchQuery = searchParams.get('q') || '';
  const selectedCategory = searchParams.get('category') || '';
  const selectedTool = searchParams.get('tool') || '';
  const selectedYear = searchParams.get('year') || '';
  const selectedSort = searchParams.get('sort') || 'newest';

  const [categories, setCategories] = useState([]);
  const [tools, setTools] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  // Fetch categories & tools metadata once on locale change
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

  // Update URL Search Parameters
  const updateParams = (newParams) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        next.set(key, String(val));
      } else {
        next.delete(key);
      }
    });
    setSearchParams(next);
  };

  const handleClearFilters = () => {
    setSearchParams({});
  };

  // Fetch projects when filters, query, sort, or locale change
  const fetchProjects = (page = 1, append = false) => {
    if (page === 1) {
      setLoading(true);
      setError(null);
    } else {
      setLoadingMore(true);
    }

    const endpoint = searchQuery ? '/api/v1/search' : '/api/v1/projects';
    const params = new URLSearchParams({
      locale,
      page: String(page),
    });

    if (searchQuery) params.set('q', searchQuery);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedTool) params.set('tool', selectedTool);
    if (selectedYear) params.set('year', selectedYear);
    if (selectedSort && selectedSort !== 'newest') params.set('sort', selectedSort);

    fetch(`${endpoint}?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error('API request failed');
        return res.json();
      })
      .then((resData) => {
        const paginated = resData?.data?.projects;
        const items = Array.isArray(paginated)
          ? paginated
          : paginated?.data || [];
        const pageNum = resData?.data?.meta?.current_page || paginated?.current_page || 1;
        const lastPageNum = resData?.data?.meta?.last_page || paginated?.last_page || 1;

        if (append) {
          setProjects((prev) => [...prev, ...items]);
        } else {
          setProjects(items);
        }
        setCurrentPage(pageNum);
        setLastPage(lastPageNum);
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
  }, [locale, searchQuery, selectedCategory, selectedTool, selectedYear, selectedSort]);

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
          <div className="work-header-content text-center mb-6">
            <h1 id="work-title" className="work-title">
              {t('work.title', locale)}
            </h1>
            <p className="work-subtitle">{t('work.subtitle', locale)}</p>
          </div>

          {/* Unified Search and Multi-Criteria Filter Bar */}
          <SearchFilterBar
            locale={locale}
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            selectedTool={selectedTool}
            selectedYear={selectedYear}
            selectedSort={selectedSort}
            categories={categories}
            tools={tools}
            onSearchChange={(q) => updateParams({ q })}
            onCategoryChange={(cat) => updateParams({ category: cat })}
            onToolChange={(tool) => updateParams({ tool })}
            onYearChange={(year) => updateParams({ year })}
            onSortChange={(sort) => updateParams({ sort })}
            onClearFilters={handleClearFilters}
            isLoading={loading}
          />
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
                <div className="load-more-wrap mt-8 flex justify-center">
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
              <CardContent className="fallback-content text-center py-12">
                <Layers size={36} className="fallback-icon mx-auto text-muted mb-3" aria-hidden="true" />
                <h2 className="fallback-title text-lg font-bold mb-1">
                  {searchQuery
                    ? (isAr ? 'لم يتم العثور على أي أعمال تطابق بحثك' : 'No projects found matching your search')
                    : t('work.emptyTitle', locale)}
                </h2>
                <p className="fallback-desc text-sm text-muted mb-4">
                  {searchQuery
                    ? (isAr ? 'جرب البحث بكلمات أخرى أو مسح الفلاتر المحددة.' : 'Try different keywords or clear active filters.')
                    : t('work.emptyDesc', locale)}
                </p>
                <Button variant="outline" size="md" onClick={handleClearFilters}>
                  {isAr ? 'مسح الفلاتر' : 'Clear Filters'}
                </Button>
              </CardContent>
            </Card>
          )}
        </Container>
      </section>
    </div>
  );
}
