import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BlockRenderer, DocumentRenderer } from '../src/page-builder/BlockRenderer.jsx';

function renderWithRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('Shared Block Renderer (Task 05.03)', () => {
  it('renders Hero block with title, subtitle, badge, and CTA buttons', () => {
    const block = {
      id: 'hero-1',
      type: 'hero',
      version: 1,
      data: {
        title: 'تصميم بصري استثنائي',
        subtitle: 'صناعة الهويات التجارية وتصميم الكتب',
        badge: 'مصمم جرافيك',
        align: 'center',
        cta_primary: { text: 'استكشف الأعمال', url: '/ar/work' },
        cta_secondary: { text: 'تواصل معي', url: '/ar/contact' },
      },
    };

    renderWithRouter(<BlockRenderer block={block} locale="ar" />);

    expect(screen.getByRole('heading', { name: 'تصميم بصري استثنائي' })).toBeInTheDocument();
    expect(screen.getByText('صناعة الهويات التجارية وتصميم الكتب')).toBeInTheDocument();
    expect(screen.getByText('مصمم جرافيك')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'استكشف الأعمال' })).toHaveAttribute('href', '/ar/work');
    expect(screen.getByRole('link', { name: 'تواصل معي' })).toHaveAttribute('href', '/ar/contact');
  });

  it('renders Heading block with correct heading level and text', () => {
    const block = {
      id: 'h-1',
      type: 'heading',
      version: 1,
      data: {
        text: 'فلسفة التصميم والوضوح',
        level: 'h2',
        subtitle: 'المبادئ الإرشادية لعملنا',
        align: 'right',
      },
    };

    renderWithRouter(<BlockRenderer block={block} locale="ar" />);

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('فلسفة التصميم والوضوح');
    expect(screen.getByText('المبادئ الإرشادية لعملنا')).toBeInTheDocument();
  });

  it('renders Text block with prose content and lead styling', () => {
    const block = {
      id: 'txt-1',
      type: 'text',
      version: 1,
      data: {
        body: 'نحن نؤمن بأن التصميم الجيد ينبع من الفهم العميق لجوهر العلامة التجارية.',
        lead: true,
        align: 'right',
        max_width: 'prose',
      },
    };

    renderWithRouter(<BlockRenderer block={block} locale="ar" />);

    const paragraph = screen.getByText(/نحن نؤمن بأن التصميم الجيد ينبع من الفهم العميق/);
    expect(paragraph).toBeInTheDocument();
    expect(paragraph).toHaveClass('block-text-lead');
  });

  it('renders Image block with image URL, alt text, and caption', () => {
    const block = {
      id: 'img-1',
      type: 'image',
      version: 1,
      data: {
        url: 'https://images.unsplash.com/photo-test',
        alt: 'Stationery set showcase',
        caption: 'نموذج مطبوعات الهوية الأساسية',
        aspect_ratio: '16:9',
        rounded: true,
      },
    };

    renderWithRouter(<BlockRenderer block={block} locale="ar" />);

    const img = screen.getByRole('img', { name: 'Stationery set showcase' });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://images.unsplash.com/photo-test');
    expect(screen.getByText('نموذج مطبوعات الهوية الأساسية')).toBeInTheDocument();
  });

  it('renders Gallery block with multiple responsive image items', () => {
    const block = {
      id: 'gal-1',
      type: 'gallery',
      version: 1,
      data: {
        columns: 3,
        gap: 'md',
        items: [
          { url: 'https://images.unsplash.com/g1', alt: 'Brand mockup 1', caption: 'Item 1' },
          { url: 'https://images.unsplash.com/g2', alt: 'Brand mockup 2', caption: 'Item 2' },
        ],
      },
    };

    renderWithRouter(<BlockRenderer block={block} locale="ar" />);

    expect(screen.getByRole('img', { name: 'Brand mockup 1' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Brand mockup 2' })).toBeInTheDocument();
  });

  it('renders Columns block and recursively renders child blocks', () => {
    const block = {
      id: 'col-1',
      type: 'columns',
      version: 1,
      data: {
        gap: 'lg',
        stack_on_mobile: true,
        columns: [
          [
            {
              id: 'c1-txt',
              type: 'heading',
              version: 1,
              data: { text: 'العمود الأول', level: 'h3' },
            },
          ],
          [
            {
              id: 'c2-txt',
              type: 'text',
              version: 1,
              data: { body: 'محتوى العمود الثاني' },
            },
          ],
        ],
      },
    };

    renderWithRouter(<BlockRenderer block={block} locale="ar" />);

    expect(screen.getByRole('heading', { level: 3, name: 'العمود الأول' })).toBeInTheDocument();
    expect(screen.getByText('محتوى العمود الثاني')).toBeInTheDocument();
  });

  it('renders Spacer block with expected vertical spacing class', () => {
    const block = {
      id: 'sp-1',
      type: 'spacer',
      version: 1,
      data: { size: 'lg' },
    };

    const { container } = renderWithRouter(<BlockRenderer block={block} locale="ar" />);
    const spacer = container.querySelector('.block-spacer');
    expect(spacer).toBeInTheDocument();
    expect(spacer).toHaveClass('block-spacer-lg');
  });

  it('renders CTA block with call-to-action button', () => {
    const block = {
      id: 'cta-1',
      type: 'cta',
      version: 1,
      data: {
        title: 'هل ترغب في بدء مشروع جديد؟',
        subtitle: 'تواصل معنا لمناقشة أهدافك وتفاصيل هويتك البصرية.',
        button_text: 'ابدأ الآن',
        button_url: '/ar/contact',
        button_variant: 'primary',
        align: 'center',
      },
    };

    renderWithRouter(<BlockRenderer block={block} locale="ar" />);

    expect(screen.getByRole('heading', { name: 'هل ترغب في بدء مشروع جديد؟' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'ابدأ الآن' })).toHaveAttribute('href', '/ar/contact');
  });

  it('renders Stats block with numerical values and labels', () => {
    const block = {
      id: 'st-1',
      type: 'stats',
      version: 1,
      data: {
        items: [
          { value: '50', prefix: '+', suffix: '', label: 'مشروع منجز' },
          { value: '10', prefix: '', suffix: ' سنوات', label: 'خبرة عملية' },
        ],
      },
    };

    renderWithRouter(<BlockRenderer block={block} locale="ar" />);

    expect(screen.getByText('+50')).toBeInTheDocument();
    expect(screen.getByText('مشروع منجز')).toBeInTheDocument();
    expect(screen.getByText('10 سنوات')).toBeInTheDocument();
    expect(screen.getByText('خبرة عملية')).toBeInTheDocument();
  });

  it('renders Services block with service items and icons', () => {
    const block = {
      id: 'srv-1',
      type: 'services',
      version: 1,
      data: {
        items: [
          {
            title: 'الهويات البصرية الكاملة',
            description: 'بناء استراتيجية وتصميم متكامل للعلامات التجارية.',
            icon: 'Palette',
          },
        ],
      },
    };

    renderWithRouter(<BlockRenderer block={block} locale="ar" />);

    expect(screen.getByText('الهويات البصرية الكاملة')).toBeInTheDocument();
    expect(screen.getByText('بناء استراتيجية وتصميم متكامل للعلامات التجارية.')).toBeInTheDocument();
  });

  it('renders Category Preview and Featured Work blocks with proper links', () => {
    const catBlock = {
      id: 'cp-1',
      type: 'category_preview',
      version: 1,
      data: {
        category_slug: 'branding',
        title: 'أعمال الهوية البصرية',
        limit: 4,
      },
    };

    const featBlock = {
      id: 'fw-1',
      type: 'featured_work',
      version: 1,
      data: {
        title: 'مشاريع مختارة',
        limit: 6,
        show_view_all: true,
      },
    };

    renderWithRouter(
      <div>
        <BlockRenderer block={catBlock} locale="ar" />
        <BlockRenderer block={featBlock} locale="ar" />
      </div>
    );

    expect(screen.getByRole('heading', { name: 'أعمال الهوية البصرية' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'مشاريع مختارة' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /عرض جميع الأعمال/i })).toHaveAttribute('href', '/ar/work');
  });

  it('renders safe fallback placeholder for unknown block types without crashing', () => {
    const badBlock = {
      id: 'bad-1',
      type: 'custom_unrecognized_type',
      version: 1,
      data: { something: 123 },
    };

    renderWithRouter(<BlockRenderer block={badBlock} locale="ar" />);

    const fallback = screen.getByTestId('block-fallback');
    expect(fallback).toBeInTheDocument();
    expect(fallback).toHaveTextContent(/نوع الكتلة غير مدعوم/i);
  });

  it('renders safe fallback placeholder for missing image asset URL without crashing', () => {
    const missingImg = {
      id: 'missing-img-1',
      type: 'image',
      version: 1,
      data: {
        url: '', // Empty or missing
        alt: 'Missing asset',
        caption: 'Placeholder',
      },
    };

    renderWithRouter(<BlockRenderer block={missingImg} locale="ar" />);

    const fallback = screen.getByTestId('image-asset-missing');
    expect(fallback).toBeInTheDocument();
    expect(fallback).toHaveTextContent(/صورة غير متوفرة/i);
  });

  it('renders full document list through DocumentRenderer', () => {
    const document = [
      {
        id: 'b1',
        type: 'heading',
        version: 1,
        data: { text: 'العنوان الرئيسي', level: 'h1' },
      },
      {
        id: 'b2',
        type: 'text',
        version: 1,
        data: { body: 'النص التوضيحي للمستند' },
      },
    ];

    renderWithRouter(<DocumentRenderer blocks={document} locale="ar" />);

    expect(screen.getByRole('heading', { level: 1, name: 'العنوان الرئيسي' })).toBeInTheDocument();
    expect(screen.getByText('النص التوضيحي للمستند')).toBeInTheDocument();
  });
});
