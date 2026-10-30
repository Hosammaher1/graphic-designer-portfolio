import React from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  Type,
  Layers,
  Download,
  Mail,
  Send,
  Sparkles,
  Award,
  CheckCircle,
} from 'lucide-react';
import { t } from '../i18n/config.js';
import {
  Container,
  Grid,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
} from '../components/ui';

export default function AboutPage({ locale = 'ar', cvUrl = null }) {
  const philosophies = [
    {
      icon: Compass,
      title: t('about.philosophy1Title', locale),
      desc: t('about.philosophy1Desc', locale),
    },
    {
      icon: Type,
      title: t('about.philosophy2Title', locale),
      desc: t('about.philosophy2Desc', locale),
    },
    {
      icon: Layers,
      title: t('about.philosophy3Title', locale),
      desc: t('about.philosophy3Desc', locale),
    },
  ];

  const disciplines = [
    'Brand Identity Systems',
    'Logomark & Symbol Design',
    'Packaging & Label Architecture',
    'Editorial & Book Design',
    'Custom Typography & Arabic Calligraphy',
    'Print Production & Tactile Finishes',
    'Visual Direction & Style Guides',
    'Digital Design Systems',
  ];

  const tools = [
    'Adobe Illustrator',
    'Adobe InDesign',
    'Adobe Photoshop',
    'Figma',
    'Cinema 4D',
    'Glyphs / FontLab',
  ];

  const milestones = [
    {
      period: '2023 — Present',
      role: 'Independent Brand & Identity Designer',
      organization: 'Studio Practice',
      desc: 'Partnering with regional startups, cultural foundations, and luxury consumer brands on comprehensive visual identities and tactile packaging systems.',
    },
    {
      period: '2020 — 2023',
      role: 'Senior Brand Designer',
      organization: 'Aesthetic Agency',
      desc: 'Directed visual identity deliverables for retail and hospitality clients across the MENA region, overseeing brand guidelines and print production.',
    },
    {
      period: '2018 — 2020',
      role: 'Graphic & Editorial Designer',
      organization: 'Cultural Publishing Initiative',
      desc: 'Specialized in Arabic bilingual typography, exhibition catalogs, and annual publication design.',
    },
  ];

  return (
    <div className="about-page">
      {/* 1. Header Section */}
      <section className="about-header-section" aria-labelledby="about-main-title">
        <Container size="site">
          <div className="about-header-content">
            <span className="about-badge">{t('site.role', locale)}</span>
            <h1 id="about-main-title" className="about-title">
              {t('about.pageTitle', locale)}
            </h1>
            <p className="about-lead">{t('about.lead', locale)}</p>
          </div>
        </Container>
      </section>

      {/* 2. Biography & Vision */}
      <section className="about-section" aria-labelledby="bio-heading">
        <Container size="content">
          <div className="about-bio-card">
            <h2 id="bio-heading" className="section-title">
              {t('about.bioTitle', locale)}
            </h2>
            <div className="about-bio-text">
              <p>{t('about.bioParagraph1', locale)}</p>
              <p>{t('about.bioParagraph2', locale)}</p>
            </div>
          </div>
        </Container>
      </section>

      {/* 3. Design Philosophy */}
      <section className="about-section about-section-muted" aria-labelledby="philosophy-heading">
        <Container size="site">
          <div className="section-header text-center">
            <h2 id="philosophy-heading" className="section-title">
              {t('about.philosophyTitle', locale)}
            </h2>
          </div>

          <Grid cols="auto-fit" gap="lg" className="philosophy-grid">
            {philosophies.map((item, idx) => {
              const Icon = item.icon;
              return (
                <Card key={idx} className="philosophy-card">
                  <CardHeader>
                    <div className="philosophy-icon-wrap">
                      <Icon size={24} aria-hidden="true" />
                    </div>
                    <CardTitle as="h3">{item.title}</CardTitle>
                    <CardDescription>{item.desc}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </Grid>
        </Container>
      </section>

      {/* 4. Disciplines & Tools */}
      <section className="about-section" aria-labelledby="skills-heading">
        <Container size="site">
          <div className="skills-tools-grid">
            {/* Disciplines */}
            <div className="skills-column">
              <h2 id="skills-heading" className="column-title">
                {t('about.skillsTitle', locale)}
              </h2>
              <ul className="disciplines-list">
                {disciplines.map((d, i) => (
                  <li key={i} className="discipline-item">
                    <CheckCircle size={18} className="discipline-icon" aria-hidden="true" />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tools */}
            <div className="tools-column">
              <h2 className="column-title">{t('about.toolsTitle', locale)}</h2>
              <div className="tools-pills-wrap">
                {tools.map((tItem, i) => (
                  <span key={i} className="tool-tag">
                    {tItem}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 5. Experience Milestones */}
      <section className="about-section about-section-muted" aria-labelledby="exp-heading">
        <Container size="content">
          <h2 id="exp-heading" className="section-title text-center" style={{ marginBottom: 'var(--space-8)' }}>
            {t('about.experienceTitle', locale)}
          </h2>

          <div className="timeline-wrap">
            {milestones.map((m, idx) => (
              <div key={idx} className="timeline-item">
                <div className="timeline-period">{m.period}</div>
                <div className="timeline-content">
                  <h3 className="timeline-role">{m.role}</h3>
                  <p className="timeline-org">{m.organization}</p>
                  <p className="timeline-desc">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* 6. CV Download & Fallback Section */}
      <section className="about-section cv-section" aria-label="Curriculum Vitae">
        <Container size="content">
          <Card className="cv-card">
            <CardContent className="cv-card-content">
              {cvUrl ? (
                <>
                  <Download size={36} className="cv-icon" aria-hidden="true" />
                  <h2 className="cv-title">{t('about.cvDownload', locale)}</h2>
                  <Button as="a" href={cvUrl} download variant="primary" size="lg">
                    <Download size={18} aria-hidden="true" />
                    <span>{t('about.cvDownload', locale)}</span>
                  </Button>
                </>
              ) : (
                <>
                  <Award size={36} className="cv-icon" aria-hidden="true" />
                  <h2 className="cv-title">{t('about.cvUponRequest', locale)}</h2>
                  <Button as={Link} to={`/${locale}/contact`} variant="outline" size="md">
                    <Mail size={16} aria-hidden="true" />
                    <span>{t('about.requestCv', locale)}</span>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </Container>
      </section>

      {/* 7. Contact CTA Banner */}
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
