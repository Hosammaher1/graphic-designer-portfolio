import React from 'react';

/**
 * Accessible Skip Link Primitive
 * Positioned off-screen, visibly reveals on keyboard focus to bypass navigation
 */
export function SkipToContent({
  targetId = 'main-content',
  className = '',
  children = 'Skip to content',
  ...props
}) {
  return (
    <a
      href={`#${targetId}`}
      className={`skip-link ${className}`.trim()}
      {...props}
    >
      {children}
    </a>
  );
}

export default SkipToContent;
