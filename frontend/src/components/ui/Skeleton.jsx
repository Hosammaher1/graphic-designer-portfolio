import React from 'react';

/**
 * Elegant Skeleton & Shimmer primitive matching the Studio Design System.
 * Non-blocking, GPU-accelerated, responsive, and zero layout shift.
 */
export const Skeleton = ({
  className = '',
  variant = 'rect', // 'rect' | 'circle' | 'pill'
  style = {},
  ...props
}) => {
  let roundedClass = 'rounded-xl';
  if (variant === 'circle') roundedClass = 'rounded-full';
  if (variant === 'pill') roundedClass = 'rounded-full';

  return (
    <div
      role="presentation"
      aria-hidden="true"
      className={`skeleton-shimmer ${roundedClass} ${className}`}
      style={style}
      {...props}
    />
  );
};

/**
 * Multi-line Text Skeleton with realistic line length distribution.
 */
export const TextSkeleton = ({
  lines = 3,
  className = '',
  lineClassName = 'h-4',
  lastLineWidth = '68%',
}) => {
  return (
    <div className={`space-y-2 ${className}`} role="presentation" aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`${lineClassName} ${i === lines - 1 ? '' : 'w-full'}`}
          style={i === lines - 1 ? { width: lastLineWidth } : undefined}
        />
      ))}
    </div>
  );
};

export default Skeleton;
