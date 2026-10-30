import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MediaPickerModal, BilingualTextEditor, getBilingualFallback } from '../src/page-builder/MediaPickerModal.jsx';

const mockAssets = [
  {
    id: 1,
    url: 'https://images.unsplash.com/asset-1',
    alt_text: 'Brand Identity Mockup',
    caption: 'Stationery and packaging showcase',
    is_published: true,
  },
  {
    id: 2,
    url: 'https://images.unsplash.com/asset-2',
    alt_text: 'Typography Specimen',
    caption: 'Arabic calligraphy details',
    is_published: true,
  },
  {
    id: 3,
    url: 'https://images.unsplash.com/asset-secret-draft',
    alt_text: 'Internal Unapproved Mockup',
    caption: 'Private draft',
    is_published: false, // Unpublished asset
  },
];

describe('Page Builder Media Picker and Bilingual Text (Task 05.06)', () => {
  it('renders media picker and filters out unpublished assets', () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();

    render(
      <MediaPickerModal
        isOpen={true}
        assets={mockAssets}
        onSelect={onSelect}
        onClose={onClose}
        locale="ar"
      />
    );

    expect(screen.getByRole('heading', { name: /مكتبة الوسائط المعتمدة/i })).toBeInTheDocument();
    expect(screen.getByText('Brand Identity Mockup')).toBeInTheDocument();
    expect(screen.getByText('Typography Specimen')).toBeInTheDocument();

    // Unpublished media must NEVER leak into the picker
    expect(screen.queryByText('Internal Unapproved Mockup')).not.toBeInTheDocument();
  });

  it('selects an asset and passes normalized metadata to caller', () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();

    render(
      <MediaPickerModal
        isOpen={true}
        assets={mockAssets}
        onSelect={onSelect}
        onClose={onClose}
        locale="ar"
      />
    );

    const assetCard = screen.getByRole('button', { name: /اختيار الأصل: Brand Identity Mockup/i });
    fireEvent.click(assetCard);

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://images.unsplash.com/asset-1',
        alt: 'Brand Identity Mockup',
        caption: 'Stationery and packaging showcase',
      })
    );
  });

  it('provides bilingual text editing with language switching tabs', () => {
    const onChange = vi.fn();
    const value = {
      ar: 'عنوان عربي أصيل',
      en: 'Authentic English Title',
    };

    render(
      <BilingualTextEditor
        label="عنوان الصفحة"
        value={value}
        onChange={onChange}
      />
    );

    // Initial Arabic tab active
    const arInput = screen.getByLabelText(/عنوان الصفحة \(العربية\)/i);
    expect(arInput).toHaveValue('عنوان عربي أصيل');

    // Switch to English tab
    const enTab = screen.getByRole('tab', { name: 'English' });
    fireEvent.click(enTab);

    const enInput = screen.getByLabelText(/عنوان الصفحة \(English\)/i);
    expect(enInput).toHaveValue('Authentic English Title');

    // Edit English text
    fireEvent.change(enInput, { target: { value: 'Refined English Title' } });
    expect(onChange).toHaveBeenCalledWith({
      ar: 'عنوان عربي أصيل',
      en: 'Refined English Title',
    });
  });

  it('falls back to Arabic when English translation is empty', () => {
    const dataWithMissingEnglish = {
      title_ar: 'تصميم هويات معاصرة',
      title_en: '',
    };

    const resolvedEn = getBilingualFallback(dataWithMissingEnglish, 'title', 'en');
    expect(resolvedEn).toBe('تصميم هويات معاصرة');

    const dataWithBoth = {
      title_ar: 'تصميم هويات معاصرة',
      title_en: 'Contemporary Brand Design',
    };
    expect(getBilingualFallback(dataWithBoth, 'title', 'en')).toBe('Contemporary Brand Design');
    expect(getBilingualFallback(dataWithBoth, 'title', 'ar')).toBe('تصميم هويات معاصرة');
  });

  it('falls back to English when Arabic is empty', () => {
    const dataWithMissingArabic = {
      desc_ar: '',
      desc_en: 'Default English narrative',
    };

    const resolvedAr = getBilingualFallback(dataWithMissingArabic, 'desc', 'ar');
    expect(resolvedAr).toBe('Default English narrative');
  });
});
