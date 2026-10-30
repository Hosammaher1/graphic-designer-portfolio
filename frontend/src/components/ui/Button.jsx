import React from 'react';

/**
 * Accessible Button Primitive
 * Supports variants: primary | secondary | outline | ghost | danger
 * Supports sizes: sm | md | lg
 * Supports loading state with aria-busy and spinner
 * Supports rendering as custom element (e.g. 'a')
 */
export function Button({
  as: Component = 'button',
  variant = 'primary',
  size = 'md',
  block = false,
  loading = false,
  disabled = false,
  children,
  className = '',
  type = 'button',
  ...props
}) {
  const isButton = Component === 'button';
  const isDisabled = disabled || loading;

  const classes = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    block ? 'btn-block' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const componentProps = {
    className: classes,
    disabled: isButton ? isDisabled : undefined,
    'aria-disabled': !isButton && isDisabled ? 'true' : undefined,
    'aria-busy': loading ? 'true' : undefined,
    ...(isButton ? { type } : {}),
    ...props,
  };

  return (
    <Component {...componentProps}>
      {loading && <span className="btn-spinner" aria-hidden="true" />}
      {children}
    </Component>
  );
}

export default Button;
