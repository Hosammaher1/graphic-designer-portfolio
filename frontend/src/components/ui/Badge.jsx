import React from 'react';

export function Badge({
  variant = 'default',
  size = 'md',
  className = '',
  children,
  ...props
}) {
  const classes = [
    'badge',
    `badge-${variant}`,
    `badge-${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
}

export default Badge;
