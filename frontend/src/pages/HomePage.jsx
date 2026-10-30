import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Layers, Package, BookOpen, Sparkles, Send, Palette } from 'lucide-react';
import { t, getDirection } from '../i18n/config.js';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
  Button,
  Badge,
} from '../components/ui';

export default function HomePage({ locale = 'ar' }) {
  const isRtl = getDirection(locale) === 'rtl';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const [featuredProjects, setFeaturedProjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.allSettled([
      fetch(`/api/v1/projects?is_featured=1&locale=${locale}`).then((res) => (res.ok ? res.json() : null)),
      fetch(`/api/v1/categories?locale=${locale}`).then((res) => (res.ok ? res.json() : null)),
    ])
      .then(([projectsResult, categoriesResult]) => {
        if (!isMounted) return;

        if (projectsResult.status === 'fulfilled' && projectsResult.value?.data?.projects?.data) {
          setFeaturedProjects(projectsResult.value.data.projects.data);
        } else {
          setFeaturedProjects([]);
        }

        if (categoriesResult.status === 'fulfilled' && categoriesResult.value?.data?.categories) {
          setCategories(categoriesResult.value.data.categories);
        } else {
          setCategories([]);
        }
      })
      .catch(() => {
        if (isMounted) {
          setFeaturedProjects([]);
          setCategories([]);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [locale]);

  const services = [
    {
      key: 'branding',
      icon: Palette,
      title: t('services.branding.title', locale),
      desc: t('services.branding.desc', locale),
    },
    {
      key: 'packaging',
      icon: Package,
      title: t('services.packaging.title', locale),
      desc: t('services.packaging.desc', locale),
    },
    {
      key: 'editorial',
      icon: BookOpen,
      title: t('services.editorial.title', locale),
      desc: t('services.editorial.desc', locale),
    },
    {
      key: 'digital',
      icon: Sparkles,
      title: t('services.digital.title', locale),
      desc: t('services.digital.desc', locale),
    },
  ];

  return (
    <div className="home-page-container">
      {/* 1. Hero Section */}
      <section className="hero-section" aria-labelledby="hero-title">
        <Container size="site">
          <div className="hero-content">
            <span className="hero-badge">{t('home.badge', locale)}</span>
            <h1 id="hero-title" className="hero-title">
              {t('home.heroTitle', locale)}
            </h1>
            <p className="hero-subtitle">{t('home.heroSubtitle', locale)}</p>

            <div className="hero-actions">
              <Button as={Link} to={`/${locale}/work`} variant="primary" size="lg">
                <span>{t('home.heroCtaWork', locale)}</span>
                <ArrowIcon size={18} aria-hidden="true" />
              </Button>
              <Button as={Link} to={`/${locale}/contact`} variant="secondary" size="lg">
                <span>{t('home.heroCtaContact', locale)}</span>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* 2. Featured Projects Section */}
      <section className="home-section" aria-labelledby="featured-heading">
        <Container size="site">
          <div className="section-header">
            <div>
              <h2 id="featured-heading" className="section-title">
                {t('home.featuredWork', locale)}
              </h2>
            </div>
            {featuredProjects.length > 0 && (
              <Button as={Link} to={`/${locale}/work`} variant="ghost" size="sm">
                <span>{t('home.viewAllWork', locale)}</span>
                <ArrowIcon size={16} aria-hidden="true" />
              </Button>
            )}
          </div>

          {loading ? (
            <div className="section-loading" aria-busy="true">
              <span className="btn-spinner" aria-hidden="true" />
            </div>
          ) : featuredProjects.length > 0 ? (
            <Grid cols="auto-fit" gap="lg" className="projects-grid">
              {featuredProjects.map((project) => (
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
                    <CardTitle as="h3">
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
          ) : (
            <Card className="fallback-card">
              <CardContent className="fallback-content">
                <Layers size={36} className="fallback-icon" aria-hidden="true" />
                <h3 className="fallback-title">{t('home.noFeaturedTitle', locale)}</h3>
                <p className="fallback-desc">{t('home.noFeaturedDesc', locale)}</p>
                <Button as={Link} to={`/${locale}/work`} variant="outline" size="md">
                  {t('home.viewAllWork', locale)}
                </Button>
              </CardContent>
            </Card>
          )}
        </Container>
      </section>

      {/* 3. Services / Craft Overview Section */}
      <section className="home-section home-section-muted" aria-labelledby="services-heading">
        <Container size="site">
          <div className="section-header text-center">
            <h2 id="services-heading" className="section-title">
              {t('home.servicesTitle', locale)}
            </h2>
            <p className="section-subtitle">{t('home.servicesSubtitle', locale)}</p>
          </div>

          <Grid cols="auto-fit" gap="lg" className="services-grid">
            {services.map((service) => {
              const ServiceIcon = service.icon;
              return (
                <Card key={service.key} className="service-card">
                  <CardHeader>
                    <div className="service-icon-wrap">
                      <ServiceIcon size={24} aria-hidden="true" />
                    </div>
                    <CardTitle as="h3">{service.title}</CardTitle>
                    <CardDescription>{service.desc}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </Grid>
        </Container>
      </section>

      {/* 4. About Snippet Section */}
      <section className="home-section" aria-labelledby="about-heading">
        <Container size="content">
          <div className="about-snippet">
            <span className="section-badge">{t('site.designerName', locale)}</span>
            <h2 id="about-heading" className="section-title">
              {t('home.aboutTitle', locale)}
            </h2>
            <p className="about-snippet-text">{t('home.aboutText', locale)}</p>
            <div>
              <Button as={Link} to={`/${locale}/about`} variant="outline" size="md">
                <span>{t('home.aboutCta', locale)}</span>
                <ArrowIcon size={16} aria-hidden="true" />
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* 5. Contact Call-to-Action Banner */}
      <section className="home-cta-section" aria-labelledby="cta-heading">
        <Container size="content">
          <div className="cta-banner">
            <h2 id="cta-heading" className="cta-title">
              {t('home.contactCtaTitle', locale)}
            </h2>
            <p className="cta-subtitle">{t('home.contactCtaSubtitle', locale)}</p>
            <Button as={Link} to={`/${locale}/contact`} variant="primary" size="lg">
              <span>{t('home.contactCtaButton', locale)}</span>
              <Send size={18} aria-hidden="true" />
            </Button>
          </div>
        </Container>
      </section>
    </div>
  );
}
