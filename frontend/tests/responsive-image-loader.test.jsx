import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ResponsiveImage from '../src/components/ui/ResponsiveImage.jsx';
import { buildSrcSet, buildCloudinaryUrl, buildLqipUrl } from '../src/utils/imageOptimization.js';

describe('Responsive Image Loader (Task 07.07)', () => {
  const sampleCloudinaryUrl = 'https://res.cloudinary.com/demo/image/upload/v1612345678/portfolio/branding-cover.jpg';
  const sampleGenericUrl = 'https://images.example.com/project-cover.jpg';

  it('buildSrcSet generates standard w-descriptors across formats for Cloudinary and generic URLs', () => {
    // Cloudinary format transformation
    const avifSrcSet = buildSrcSet(sampleCloudinaryUrl, { format: 'avif' });
    expect(avifSrcSet).toContain('320w');
    expect(avifSrcSet).toContain('640w');
    expect(avifSrcSet).toContain('1280w');
    expect(avifSrcSet).toContain('f_avif');
    expect(avifSrcSet).toContain('q_auto');

    const webpSrcSet = buildSrcSet(sampleCloudinaryUrl, { format: 'webp' });
    expect(webpSrcSet).toContain('f_webp');

    // Generic URL fallback
    const genericSrcSet = buildSrcSet(sampleGenericUrl);
    expect(genericSrcSet).toContain('320w');
    expect(genericSrcSet).toContain('1280w');
  });

  it('buildLqipUrl generates low-quality placeholder URL', () => {
    const lqip = buildLqipUrl(sampleCloudinaryUrl);
    expect(lqip).toContain('w_30');
    expect(lqip).toContain('e_blur');
  });

  it('renders a picture element with AVIF and WebP sources and fallback img', () => {
    const { container } = render(
      <ResponsiveImage
        src={sampleCloudinaryUrl}
        alt="Packaging Design Identity"
        sizes="(max-width: 768px) 100vw, 50vw"
      />
    );

    const picture = container.querySelector('picture');
    expect(picture).not.toBeNull();

    const avifSource = container.querySelector('source[type="image/avif"]');
    expect(avifSource).not.toBeNull();
    expect(avifSource.getAttribute('srcset')).toContain('320w');

    const webpSource = container.querySelector('source[type="image/webp"]');
    expect(webpSource).not.toBeNull();
    expect(webpSource.getAttribute('srcset')).toContain('320w');

    const img = screen.getByRole('img', { name: 'Packaging Design Identity' });
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('sizes')).toBe('(max-width: 768px) 100vw, 50vw');
  });

  it('preserves aspect ratio to eliminate Cumulative Layout Shift (CLS)', () => {
    const { container } = render(
      <ResponsiveImage
        src={sampleCloudinaryUrl}
        alt="Aspect Ratio Test"
        aspectRatio="16/9"
        width={1600}
        height={900}
      />
    );

    const picture = container.querySelector('picture');
    expect(picture.style.aspectRatio).toMatch(/16\s*\/\s*9/);

    const img = screen.getByRole('img', { name: 'Aspect Ratio Test' });
    expect(img.style.aspectRatio).toMatch(/16\s*\/\s*9/);
    expect(img.getAttribute('width')).toBe('1600');
    expect(img.getAttribute('height')).toBe('900');
  });

  it('applies native loading="lazy" by default, and loading="eager" when priority is true', () => {
    const { rerender } = render(
      <ResponsiveImage
        src={sampleCloudinaryUrl}
        alt="Lazy Image"
      />
    );

    const lazyImg = screen.getByRole('img', { name: 'Lazy Image' });
    expect(lazyImg.getAttribute('loading')).toBe('lazy');
    expect(lazyImg.getAttribute('decoding')).toBe('async');

    // Priority above-the-fold image
    rerender(
      <ResponsiveImage
        src={sampleCloudinaryUrl}
        alt="Priority Image"
        priority={true}
      />
    );

    const eagerImg = screen.getByRole('img', { name: 'Priority Image' });
    expect(eagerImg.getAttribute('loading')).toBe('eager');
    expect(eagerImg.getAttribute('decoding')).toBe('sync');
  });

  it('handles blur-up placeholder transition upon image load event', () => {
    const onLoadSpy = vi.fn();

    const { container } = render(
      <ResponsiveImage
        src={sampleCloudinaryUrl}
        alt="Blur Up Test"
        onLoad={onLoadSpy}
      />
    );

    const picture = container.querySelector('picture');
    expect(picture.className).toContain('is-loading');

    const img = screen.getByRole('img', { name: 'Blur Up Test' });
    expect(img.style.filter).toContain('blur');

    // Fire image load event
    fireEvent.load(img);

    expect(picture.className).toContain('is-loaded');
    expect(img.style.filter).toBe('none');
    expect(onLoadSpy).toHaveBeenCalledTimes(1);
  });
});
