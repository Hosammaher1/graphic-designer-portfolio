import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { normalizeAdminProject } from '../src/admin/utils/localization.js';
import { ProjectArtwork } from '../src/components/ProjectArtworks.jsx';
import { ProjectDetailsModal } from '../src/components/ProjectDetailsModal.jsx';

describe('Project Images Flow & Persistence', () => {
  it('normalizeAdminProject retains coverMediaId, coverImage, and gallery mediaAssetId', () => {
    const rawProject = {
      id: 15,
      slug: 'brand-identity-2026',
      titleEn: 'Brand Identity 2026',
      titleAr: 'هوية بصرية 2026',
      cover_media_id: 42,
      cover_url: '/storage/media/cover-art-123.png',
      media: [
        {
          id: 101,
          media_asset_id: 42,
          display_url: '/storage/media/cover-art-123.png',
          caption_en: 'Cover Shot',
          caption_ar: 'لقطة الغلاف',
          is_cover: true,
        },
        {
          id: 102,
          media_asset_id: 43,
          display_url: '/storage/media/packaging-detail.png',
          caption_en: 'Packaging Detail',
          caption_ar: 'تفاصيل التغليف',
          is_cover: false,
        },
      ],
    };

    const normalized = normalizeAdminProject(rawProject);

    expect(normalized.coverMediaId).toBe(42);
    expect(normalized.coverImage).toBe('/storage/media/cover-art-123.png');
    expect(normalized.gallery).toHaveLength(2);
    expect(normalized.gallery[0].mediaAssetId).toBe(42);
    expect(normalized.gallery[0].url).toBe('/storage/media/cover-art-123.png');
    expect(normalized.gallery[1].mediaAssetId).toBe(43);
    expect(normalized.gallery[1].url).toBe('/storage/media/packaging-detail.png');
  });

  it('ProjectArtwork renders real img element when src is provided', () => {
    render(
      <ProjectArtwork
        id="sample"
        src="/storage/media/sample-art.png"
        alt="Sample Project Image"
        className="test-class"
      />
    );

    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toBe('/storage/media/sample-art.png');
    expect(img.getAttribute('alt')).toBe('Sample Project Image');
  });

  it('ProjectDetailsModal renders cover and gallery images from real project data', () => {
    const testProject = {
      id: 'luxury-perfume',
      slug: 'luxury-perfume',
      title: { en: 'Luxury Perfume', ar: 'عطر فاخر' },
      subtitle: { en: 'Bottle & Packaging', ar: 'الزجاجة والتغليف' },
      description: { en: 'Bespoke fragrance packaging design.', ar: 'تصميم تغليف العطور الفاخرة.' },
      category: { en: 'Branding', ar: 'هوية بصرية' },
      image: '/storage/media/perfume-cover.png',
      coverImage: '/storage/media/perfume-cover.png',
      gallery: [
        {
          id: 'g-1',
          url: '/storage/media/perfume-cover.png',
          src: '/storage/media/perfume-cover.png',
          title: { en: 'Hero Bottle', ar: 'الزجاجة الرئيسية' },
          caption: { en: 'Hero Bottle Shot', ar: 'لقطة الزجاجة' },
          type: 'cover',
        },
        {
          id: 'g-2',
          url: '/storage/media/perfume-box.png',
          src: '/storage/media/perfume-box.png',
          title: { en: 'Embossed Box', ar: 'العلبة البارزة' },
          caption: { en: 'Gold leaf foiled packaging', ar: 'علبة برقائق ذهبية' },
          type: 'detail',
        },
      ],
      tools: ['Illustrator', 'Cinema 4D'],
      year: '2026',
    };

    render(
      <ProjectDetailsModal
        project={testProject}
        isOpen={true}
        onClose={vi.fn()}
        lang="en"
      />
    );

    // Look for all rendered images
    const images = screen.getAllByRole('img');
    expect(images.length).toBeGreaterThanOrEqual(2);

    const imageSources = images.map((img) => img.getAttribute('src'));
    expect(imageSources).toContain('/storage/media/perfume-cover.png');
    expect(imageSources).toContain('/storage/media/perfume-box.png');
  });
});
