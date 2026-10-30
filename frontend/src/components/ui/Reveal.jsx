import React, { useState, useEffect, useRef } from 'react';

/**
 * Reveal Component
 * Restrained scroll reveal transition (200-500ms bounds).
 * Strictly honors prefers-reduced-motion by disabling delays and transforms.
 * Never blocks pointer interaction.
 */
export function Reveal({
  as: Component = 'div',
  delay = 0,
  direction = 'up',
  className = '',
  children,
  ...props
}) {
  const [revealed, setRevealed] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const domRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    if (mediaQuery && mediaQuery.matches) {
      setPrefersReducedMotion(true);
      setRevealed(true);
      return;
    }

    if (!('IntersectionObserver' in window)) {
      setRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setRevealed(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    const currentEl = domRef.current;
    if (currentEl) {
      observer.observe(currentEl);
    }

    return () => {
      if (currentEl) observer.unobserve(currentEl);
    };
  }, []);

  const clampedDelay = Math.min(Math.max(delay, 0), 500);

  const classes = [
    'reveal-wrap',
    direction !== 'none' ? `reveal-${direction}` : '',
    revealed ? 'revealed' : 'reveal-hidden',
    prefersReducedMotion ? 'reduced-motion-active' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const style = prefersReducedMotion
    ? { transitionDuration: '0ms', animationDuration: '0ms' }
    : { transitionDelay: `${clampedDelay}ms` };

  return (
    <Component
      ref={domRef}
      className={classes}
      style={style}
      {...props}
    >
      {children}
    </Component>
  );
}

export default Reveal;
