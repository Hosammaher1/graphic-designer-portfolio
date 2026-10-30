import React from 'react';

export function Grid({
  as: Component = 'div',
  cols = 1,
  gap = 'md',
  className = '',
  children,
  ...props
}) {
  const classes = [
    'grid',
    `grid-cols-${cols}`,
    `gap-${gap}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Component className={classes} {...props}>
      {children}
    </Component>
  );
}

export default Grid;
