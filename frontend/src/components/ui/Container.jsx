import React from 'react';

export function Container({
  as: Component = 'div',
  size = 'content',
  className = '',
  children,
  ...props
}) {
  const classes = [
    'container',
    `container-${size}`,
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

export default Container;
