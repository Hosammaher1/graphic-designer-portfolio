import React from 'react';
import { Link } from 'react-router-dom';
import {
  Palette,
  Layers,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  ImageIcon,
  AlertTriangle,
} from 'lucide-react';
import { getDirection, t } from '../i18n/config.js';
import {
  Container,
  Grid,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Badge,
} from '../components/ui';
import { Reveal } from '../components/ui/Reveal.jsx';

/**
 * Icon map for services and general block decorators
 */
const ICON_MAP = {
  Palette,
  Layers,
  Sparkles,
};

/**
 * Safe fallback for unrecognized or unsupported block types
 */
function UnknownBlockFallback({ block, locale }) {
  const isAr = locale === 'ar';
  return (
    <div
      data-testid="block-fallback"
      className="block-fallback-box"
      role="note"
      style={{
        padding: 'var(--space-4)',
        margin: 'var(--space-4) 0',
        borderRadius: 'var(--radius-md)',
        border: '1px dashed var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        color: 'var(--color-text-muted)',
        textAlign: 'center',
        fontSize: 'var(--text-sm)',
      }}
    >
      <AlertTriangle size={20} style={{ margin: '0 auto var(--space-2)' }} aria-hidden="true" />
      <p style={{ margin: 0 }}>
        {isAr
          ? `نوع الكتلة غير مدعوم: "${block?.type || 'مجهول'}" (الإصدار ${block?.version || '1'})`
          : `Unsupported block type: "${block?.type || 'unknown'}" (version ${block?.version || '1'})`}
      </p>
    </div>
  );
}

/**
 * 1. Hero Block
 */
function HeroBlock({ data = {}, locale }) {
  const isRtl = getDirection(locale) === 'rtl';
  const Arrow = isRtl ? ArrowLeft : ArrowRight;

  return (
    <section className={`block-hero text-${data.align || 'center'}`}>
      <Container size="site">
        {data.badge && (
          <Badge variant="primary" size="md" className="block-hero-badge">
            {data.badge}
          </Badge>
        )}
        <h1 className="block-hero-title">{data.title}</h1>
        {data.subtitle && <p className="block-hero-subtitle">{data.subtitle}</p>}
        {(data.cta_primary || data.cta_secondary) && (
          <div className="block-hero-actions">
            {data.cta_primary && (
              <Button as={Link} to={data.cta_primary.url} variant="primary" size="lg">
                <span>{data.cta_primary.text}</span>
                <Arrow size={18} aria-hidden="true" />
              </Button>
            )}
            {data.cta_secondary && (
              <Button as={Link} to={data.cta_secondary.url} variant="outline" size="lg">
                <span>{data.cta_secondary.text}</span>
              </Button>
            )}
          </div>
        )}
      </Container>
    </section>
  );
}

/**
 * 2. Heading Block
 */
function HeadingBlock({ data = {} }) {
  const Tag = data.level || 'h2';
  return (
    <div className={`block-heading text-${data.align || 'left'}`}>
      <Container size="site">
        <Tag className={`heading-${Tag}`}>{data.text}</Tag>
        {data.subtitle && <p className="heading-subtitle">{data.subtitle}</p>}
      </Container>
    </div>
  );
}

/**
 * 3. Text / Prose Block
 */
function TextBlock({ data = {} }) {
  const isLead = Boolean(data.lead);
  const maxWidth = data.max_width || 'prose';
  const align = data.align || 'left';

  return (
    <div className={`block-text max-w-${maxWidth} text-${align}`}>
      <Container size="site">
        <p className={`block-text-body ${isLead ? 'block-text-lead' : ''}`}>
          {data.body}
        </p>
      </Container>
    </div>
  );
}

/**
 * 4. Image Block
 */
function ImageBlock({ data = {}, locale }) {
  const isAr = locale === 'ar';
  const aspectRatio = data.aspect_ratio || '16:9';
  const rounded = data.rounded !== false;

  if (!data.url) {
    return (
      <div
        data-testid="image-asset-missing"
        className="image-missing-placeholder"
        style={{
          aspectRatio,
          borderRadius: rounded ? 'var(--radius-lg)' : '0',
          border: '1px dashed var(--color-border)',
          backgroundColor: 'var(--color-surface)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text-muted)',
          padding: 'var(--space-6)',
        }}
      >
        <ImageIcon size={32} aria-hidden="true" />
        <span style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
          {isAr ? 'صورة غير متوفرة أو جاري التحميل' : 'Image asset missing or loading'}
        </span>
      </div>
    );
  }

  return (
    <figure className="block-image-figure">
      <Container size="site">
        <div
          className="block-image-wrap"
          style={{
            aspectRatio,
            borderRadius: rounded ? 'var(--radius-lg)' : '0',
            overflow: 'hidden',
          }}
        >
          <img
            src={data.url}
            alt={data.alt || 'Portfolio image'}
            className="block-img"
            loading="lazy"
          />
        </div>
        {data.caption && <figcaption className="block-image-caption">{data.caption}</figcaption>}
      </Container>
    </figure>
  );
}

/**
 * 5. Gallery Block
 */
function GalleryBlock({ data = {} }) {
  const items = Array.isArray(data.items) ? data.items : [];
  const columns = data.columns || 3;
  const gap = data.gap || 'md';

  return (
    <div className="block-gallery">
      <Container size="site">
        <div
          className="gallery-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            gap: `var(--space-${gap === 'lg' ? '6' : gap === 'sm' ? '3' : '4'})`,
          }}
        >
          {items.map((item, idx) => (
            <div key={idx} className="gallery-item-card">
              <img
                src={item.url}
                alt={item.alt || `Gallery item ${idx + 1}`}
                className="gallery-item-img"
                loading="lazy"
                style={{ width: '100%', height: 'auto', borderRadius: 'var(--radius-md)' }}
              />
              {item.caption && <p className="gallery-item-caption">{item.caption}</p>}
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}

/**
 * 6. Columns Block (Recursive)
 */
function ColumnsBlock({ data = {}, locale, isEditor }) {
  const cols = Array.isArray(data.columns) ? data.columns : [];
  const gap = data.gap || 'lg';

  return (
    <div className="block-columns-wrapper">
      <Container size="site">
        <div
          className="block-columns-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols.length || 1}, minmax(0, 1fr))`,
            gap: `var(--space-${gap === 'lg' ? '6' : gap === 'sm' ? '3' : '4'})`,
          }}
        >
          {cols.map((colBlocks, colIdx) => (
            <div key={colIdx} className="block-column-col">
              {Array.isArray(colBlocks) &&
                colBlocks.map((b) => (
                  <BlockRenderer key={b.id} block={b} locale={locale} isEditor={isEditor} />
                ))}
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}

/**
 * 7. Spacer Block
 */
function SpacerBlock({ data = {} }) {
  const size = data.size || 'md';
  return <div className={`block-spacer block-spacer-${size}`} aria-hidden="true" />;
}

/**
 * 8. CTA Block
 */
function CtaBlock({ data = {}, locale }) {
  const isRtl = getDirection(locale) === 'rtl';
  const Arrow = isRtl ? ArrowLeft : ArrowRight;

  return (
    <div className={`block-cta text-${data.align || 'center'}`}>
      <Container size="content">
        <Card className="block-cta-card">
          <CardHeader>
            <CardTitle as="h2">{data.title}</CardTitle>
            {data.subtitle && <CardDescription>{data.subtitle}</CardDescription>}
          </CardHeader>
          {data.button_text && data.button_url && (
            <CardFooter className="justify-center">
              <Button
                as={Link}
                to={data.button_url}
                variant={data.button_variant || 'primary'}
                size="lg"
              >
                <span>{data.button_text}</span>
                <Arrow size={18} aria-hidden="true" />
              </Button>
            </CardFooter>
          )}
        </Card>
      </Container>
    </div>
  );
}

/**
 * 9. Stats Block
 */
function StatsBlock({ data = {} }) {
  const items = Array.isArray(data.items) ? data.items : [];

  return (
    <div className="block-stats">
      <Container size="site">
        <Grid cols="auto-fit" gap="lg" className="stats-grid">
          {items.map((item, idx) => (
            <Card key={idx} className="stat-card text-center">
              <CardContent className="stat-content">
                <div className="stat-value">
                  {item.prefix || ''}
                  {item.value}
                  {item.suffix || ''}
                </div>
                <div className="stat-label">{item.label}</div>
              </CardContent>
            </Card>
          ))}
        </Grid>
      </Container>
    </div>
  );
}

/**
 * 10. Services Block
 */
function ServicesBlock({ data = {} }) {
  const items = Array.isArray(data.items) ? data.items : [];

  return (
    <div className="block-services">
      <Container size="site">
        <Grid cols="auto-fit" gap="lg" className="services-grid">
          {items.map((item, idx) => {
            const Icon = (item.icon && ICON_MAP[item.icon]) || Sparkles;
            return (
              <Card key={idx} className="service-card">
                <CardHeader>
                  <div className="service-icon-wrap">
                    <Icon size={24} aria-hidden="true" />
                  </div>
                  <CardTitle as="h3">{item.title}</CardTitle>
                  {item.description && <CardDescription>{item.description}</CardDescription>}
                </CardHeader>
              </Card>
            );
          })}
        </Grid>
      </Container>
    </div>
  );
}

/**
 * 11. Category Preview Block
 */
function CategoryPreviewBlock({ data = {}, locale }) {
  const isRtl = getDirection(locale) === 'rtl';
  const Arrow = isRtl ? ArrowLeft : ArrowRight;

  return (
    <div className="block-category-preview">
      <Container size="site">
        <div className="category-preview-header flex justify-between items-center">
          <h2 className="category-preview-title">{data.title || 'Category'}</h2>
          <Button
            as={Link}
            to={`/${locale}/work?category=${data.category_slug || ''}`}
            variant="ghost"
            size="sm"
          >
            <span>{locale === 'ar' ? 'عرض الفئة' : 'View Category'}</span>
            <Arrow size={14} aria-hidden="true" />
          </Button>
        </div>
      </Container>
    </div>
  );
}

/**
 * 12. Featured Work Block
 */
function FeaturedWorkBlock({ data = {}, locale }) {
  const isRtl = getDirection(locale) === 'rtl';
  const Arrow = isRtl ? ArrowLeft : ArrowRight;

  return (
    <div className="block-featured-work">
      <Container size="site">
        <div className="featured-work-header flex justify-between items-center">
          <h2 className="featured-work-title">{data.title || 'Featured Work'}</h2>
          {data.show_view_all && (
            <Button as={Link} to={`/${locale}/work`} variant="ghost" size="sm">
              <span>{locale === 'ar' ? 'عرض جميع الأعمال' : 'View All Work'}</span>
              <Arrow size={14} aria-hidden="true" />
            </Button>
          )}
        </div>
      </Container>
    </div>
  );
}

/**
 * Block Component Map
 */
const BLOCK_COMPONENTS = {
  hero: HeroBlock,
  heading: HeadingBlock,
  text: TextBlock,
  image: ImageBlock,
  gallery: GalleryBlock,
  columns: ColumnsBlock,
  spacer: SpacerBlock,
  cta: CtaBlock,
  stats: StatsBlock,
  services: ServicesBlock,
  category_preview: CategoryPreviewBlock,
  featured_work: FeaturedWorkBlock,
};

/**
 * Polymorphic Single Block Renderer
 */
export function BlockRenderer({ block, locale = 'ar', isEditor = false }) {
  if (!block || typeof block !== 'object') {
    return null;
  }

  const Component = BLOCK_COMPONENTS[block.type];
  if (!Component || (block.version && block.version > 1)) {
    return <UnknownBlockFallback block={block} locale={locale} />;
  }

  const content = <Component data={block.data || {}} locale={locale} isEditor={isEditor} />;

  // Apply optional animation settings
  if (block.settings?.animation?.preset && block.settings.animation.preset !== 'none') {
    return (
      <Reveal
        preset={block.settings.animation.preset}
        duration={block.settings.animation.duration}
        delay={block.settings.animation.delay}
      >
        {content}
      </Reveal>
    );
  }

  return content;
}

/**
 * Full Document / Page Blocks Renderer
 */
export function DocumentRenderer({ blocks = [], locale = 'ar', isEditor = false }) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return null;
  }

  return (
    <div className="page-builder-document">
      {blocks.map((block) => (
        <BlockRenderer
          key={block.id || Math.random()}
          block={block}
          locale={locale}
          isEditor={isEditor}
        />
      ))}
    </div>
  );
}

export default BlockRenderer;
