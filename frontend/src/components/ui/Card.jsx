import React from 'react';

export function Card({
  as: Component = 'div',
  interactive = false,
  className = '',
  children,
  ...props
}) {
  const classes = [
    'card',
    interactive ? 'card-interactive' : '',
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

export function CardHeader({ className = '', children, ...props }) {
  return (
    <div className={`card-header ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ as: Component = 'h3', className = '', children, ...props }) {
  return (
    <Component className={`card-title ${className}`.trim()} {...props}>
      {children}
    </Component>
  );
}

export function CardDescription({ className = '', children, ...props }) {
  return (
    <p className={`card-description ${className}`.trim()} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className = '', children, ...props }) {
  return (
    <div className={`card-content ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className = '', children, ...props }) {
  return (
    <div className={`card-footer ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

export default Card;
