export const DEFAULT_WIDTHS = [320, 640, 960, 1280, 1920];

/**
 * Check if the given URL is hosted on Cloudinary and supports dynamic transformations.
 *
 * @param {string} url - Image asset URL
 * @returns {boolean} True if Cloudinary upload URL
 */
export function isCloudinaryUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return url.includes('res.cloudinary.com') && url.includes('/upload/');
}

/**
 * Generate a transformed Cloudinary URL with specified width, crop, format, and effects.
 *
 * @param {string} url - Original Cloudinary image URL
 * @param {object} options - Transformation options
 * @returns {string} Transformed image URL
 */
export function buildCloudinaryUrl(url, options = {}) {
  if (!isCloudinaryUrl(url)) {
    return url;
  }

  const {
    width,
    height,
    format = 'auto',
    quality = 'auto',
    crop = 'limit',
    blur,
  } = options;

  const transforms = [];

  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  if (crop) transforms.push(`c_${crop}`);
  if (format) transforms.push(`f_${format}`);
  if (quality) transforms.push(`q_${quality}`);
  if (blur) transforms.push(`e_blur:${blur}`);

  const transformString = transforms.join(',');
  return url.replace('/upload/', `/upload/${transformString}/`);
}

/**
 * Build responsive srcset string with w-descriptors for responsive images.
 *
 * @param {string} src - Base image source URL
 * @param {object} options - Options including target widths, format, quality
 * @returns {string} Formatted srcset string (e.g. "url 320w, url 640w")
 */
export function buildSrcSet(src, options = {}) {
  if (!src) return '';

  const widths = options.widths || DEFAULT_WIDTHS;
  const format = options.format;
  const quality = options.quality || 'auto';

  if (isCloudinaryUrl(src)) {
    return widths
      .map((w) => `${buildCloudinaryUrl(src, { width: w, format, quality })} ${w}w`)
      .join(', ');
  }

  // Fallback for non-Cloudinary / generic URLs with query parameter notation
  return widths
    .map((w) => {
      const separator = src.includes('?') ? '&' : '?';
      const fmtQuery = format ? `&fmt=${format}` : '';
      return `${src}${separator}w=${w}${fmtQuery} ${w}w`;
    })
    .join(', ');
}

/**
 * Generate Low-Quality Image Placeholder (LQIP) URL for blur-up loading effect.
 *
 * @param {string} src - Base image URL
 * @returns {string} Micro-sized blurred placeholder URL
 */
export function buildLqipUrl(src) {
  if (!src) return '';

  if (isCloudinaryUrl(src)) {
    return buildCloudinaryUrl(src, {
      width: 30,
      crop: 'limit',
      blur: 1000,
      quality: 'low',
      format: 'auto',
    });
  }

  const separator = src.includes('?') ? '&' : '?';
  return `${src}${separator}w=30&blur=1`;
}

export default {
  isCloudinaryUrl,
  buildCloudinaryUrl,
  buildSrcSet,
  buildLqipUrl,
};
