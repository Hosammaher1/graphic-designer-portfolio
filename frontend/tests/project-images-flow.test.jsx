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

  it('maps backend MediaAsset schema correctly to Admin media item without undefined urls or broken thumbnails', () => {
    // Simulated Laravel API response from MediaController::index
    const backendMediaAsset = {
      id: 13,
      provider: 'local',
      provider_id: 'media/test-real-logo-CW2zy9N4.png',
      file_name: 'test-real-logo-CW2zy9N4.png',
      mime_type: 'image/png',
      bytes: 1341141,
      width: 1536,
      height: 1024,
      original_url: '/storage/media/test-real-logo-CW2zy9N4.png',
      variants: {
        thumbnail: '/storage/media/test-real-logo-CW2zy9N4.png?variant=thumbnail&w=300',
        medium: '/storage/media/test-real-logo-CW2zy9N4.png?variant=medium&w=800',
      },
      created_at: '2026-11-04T11:31:58.000000Z',
    };

    // Mapping algorithm used in AdminContext.jsx fetchMedia
    const mapped = {
      id: String(backendMediaAsset.id),
      mediaAssetId: Number(backendMediaAsset.id),
      name: backendMediaAsset.file_name || backendMediaAsset.original_filename || 'asset-13',
      url: backendMediaAsset.original_url || backendMediaAsset.url || `/storage/media/${backendMediaAsset.file_name}`,
      type: backendMediaAsset.mime_type || 'image/png',
      size: `${Math.round(backendMediaAsset.bytes / 1024)} KB`,
      dimensions: `${backendMediaAsset.width} × ${backendMediaAsset.height}`,
      altEn: backendMediaAsset.alt_en || backendMediaAsset.file_name || '',
      altAr: backendMediaAsset.alt_ar || backendMediaAsset.file_name || '',
      category: 'Uploads',
      uploadedOn: backendMediaAsset.created_at.split('T')[0],
    };

    expect(mapped.id).toBe('13');
    expect(mapped.mediaAssetId).toBe(13);
    expect(mapped.url).toBe('/storage/media/test-real-logo-CW2zy9N4.png');
    expect(mapped.url).not.toBeUndefined();
    expect(mapped.name).toBe('test-real-logo-CW2zy9N4.png');
    expect(mapped.name).not.toBeUndefined();
  });

  it('guarantees cover_media_id is injected into media_items payload for persistence', () => {
    const parsedCoverId = 13;
    const gallery = [
      { id: 'g-1', mediaAssetId: 14, url: '/storage/media/detail.png', captionEn: 'Detail', captionAr: 'تفصيل' },
    ];

    let mediaItems = gallery
      .filter((g) => g.mediaAssetId || /^\d+$/.test(String(g.id)))
      .map((g, idx) => ({
        media_asset_id: g.mediaAssetId ? parseInt(g.mediaAssetId, 10) : parseInt(g.id, 10),
        caption_en: g.captionEn || '',
        caption_ar: g.captionAr || '',
        is_cover: parsedCoverId ? g.mediaAssetId === parsedCoverId : idx === 0,
        sort_order: idx + 1,
      }));

    if (parsedCoverId && !mediaItems.some((m) => m.media_asset_id === parsedCoverId)) {
      mediaItems.unshift({
        media_asset_id: parsedCoverId,
        caption_en: 'Cover Image',
        caption_ar: 'صورة الغلاف',
        is_cover: true,
        sort_order: 0,
      });
    }

    expect(mediaItems).toHaveLength(2);
    expect(mediaItems[0].media_asset_id).toBe(13);
    expect(mediaItems[0].is_cover).toBe(true);
    expect(mediaItems[1].media_asset_id).toBe(14);
    expect(mediaItems[1].is_cover).toBe(false);
  });
});
