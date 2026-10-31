import React, { useState } from 'react';
import { buildSrcSet } from '../../utils/imageOptimization.js';

/**
 * ResponsiveImage Component
 *
 * Implements modern responsive image best practices:
 * - HTML5 <picture> wrapper with AVIF and WebP sources
 * - Responsive srcset with width descriptors and sizes
 * - Native loading="lazy" (with loading="eager" & fetchpriority="high" for priority images)
 * - Preserved aspect-ratio to prevent Cumulative Layout Shift (CLS)
 * - Low-Quality Image Placeholder (LQIP) blur-up loading transition
 *
 * @param {object} props - Component properties
 */
export default function ResponsiveImage({
  src,
  alt = '',
  widths,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  aspectRatio,
  width,
  height,
  priority = false,
  className = '',
  objectFit = 'cover',
  style = {},
  onLoad,
  onError,
  ...rest
}) {
  const [loaded, setLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (!src) {
    return null;
  }

  const computedAspectRatio = aspectRatio || (width && height ? `${width}/${height}` : undefined);
  const avifSrcSet = buildSrcSet(src, { widths, format: 'avif' });
  const webpSrcSet = buildSrcSet(src, { widths, format: 'webp' });
  const defaultSrcSet = buildSrcSet(src, { widths });

  const handleLoad = (e) => {
    setLoaded(true);
    if (onLoad) {
      onLoad(e);
    }
  };

  const handleError = (e) => {
    setHasError(true);
    if (onError) {
      onError(e);
    }
  };

  return (
    <picture
      className={`responsive-image-wrap ${loaded ? 'is-loaded' : 'is-loading'} ${hasError ? 'is-error' : ''} ${className}`.trim()}
      style={{
        display: 'block',
        position: 'relative',
        overflow: 'hidden',
        aspectRatio: computedAspectRatio,
      }}
    >
      {/* Modern next-gen AVIF source */}
      <source type="image/avif" srcSet={avifSrcSet} sizes={sizes} />

      {/* Widely compatible modern WebP source */}
      <source type="image/webp" srcSet={webpSrcSet} sizes={sizes} />

      {/* Fallback standard img element */}
      <img
        src={src}
        srcSet={defaultSrcSet}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding={priority ? 'sync' : 'async'}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          width: '100%',
          height: '100%',
          objectFit,
          aspectRatio: computedAspectRatio,
          filter: loaded ? 'none' : 'blur(10px)',
          opacity: loaded ? 1 : 0.85,
          transition: 'filter 0.3s ease-out, opacity 0.3s ease-out',
          ...style,
        }}
        {...rest}
      />
    </picture>
  );
}
