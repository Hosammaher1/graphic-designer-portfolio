import React from 'react';

export function Flex({
  as: Component = 'div',
  direction = 'row',
  align = 'stretch',
  justify = 'start',
  wrap = false,
  gap = 'md',
  className = '',
  children,
  ...props
}) {
  const classes = [
    'flex',
    `flex-${direction}`,
    align ? `items-${align}` : '',
    justify ? `justify-${justify}` : '',
    wrap ? 'flex-wrap' : 'flex-nowrap',
    gap ? `gap-${gap}` : '',
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

export function Stack({
  as: Component = 'div',
  gap = 'md',
  align = 'stretch',
  justify = 'start',
  className = '',
  children,
  ...props
}) {
  return (
    <Flex
      as={Component}
      direction="column"
      gap={gap}
      align={align}
      justify={justify}
      className={className}
      {...props}
    >
      {children}
    </Flex>
  );
}

export default Flex;
