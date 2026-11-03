import React, { useState, useEffect, useRef } from 'react';
import { t } from '../i18n/config.js';

export function ThemeToggle({ locale = 'en', className = '' }) {
  const [theme, setTheme] = useState('dark');
  const isTransitioningRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const saved = localStorage.getItem('portfolio-theme');
    if (saved === 'dark' || saved === 'light') {
      setTheme(saved);
      applyTheme(saved);
    } else if (
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)')?.matches
    ) {
      setTheme('dark');
      applyTheme('dark');
    } else if (
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: light)')?.matches
    ) {
      setTheme('light');
      applyTheme('light');
    } else {
      setTheme('dark');
      applyTheme('dark');
    }
  }, []);

  const applyTheme = (nextTheme) => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
    try {
      localStorage.setItem('portfolio-theme', nextTheme);
    } catch (e) {}
  };

  const toggleTheme = (e) => {
    if (isTransitioningRef.current) return;

    const nextTheme = theme === 'dark' ? 'light' : 'dark';

    // Respect prefers-reduced-motion or missing document.startViewTransition
    const prefersReduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)')?.matches;

    if (
      typeof document === 'undefined' ||
      !document.startViewTransition ||
      prefersReduced
    ) {
      setTheme(nextTheme);
      applyTheme(nextTheme);
      return;
    }

    // Compute exact center of the clicked Eclipse toggle button
    const rect = e?.currentTarget?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const y = rect ? rect.top + rect.height / 2 : 0;

    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    isTransitioningRef.current = true;

    const transition = document.startViewTransition(() => {
      setTheme(nextTheme);
      applyTheme(nextTheme);
    });

    transition.ready
      .then(() => {
        const animation = document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 750,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            pseudoElement: '::view-transition-new(root)',
          }
        );

        animation.onfinish = () => {
          isTransitioningRef.current = false;
        };
        animation.oncancel = () => {
          isTransitioningRef.current = false;
        };
      })
      .catch(() => {
        isTransitioningRef.current = false;
      });
  };

  const isDark = theme === 'dark';
  const label = isDark ? t('theme.toggleLight', locale) : t('theme.toggleDark', locale);

  return (
    <button
      type="button"
      data-testid="theme-toggle"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={`relative inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C1628] cursor-pointer group shrink-0 ${
        isDark
          ? 'bg-white/5 border border-[rgba(244,164,150,0.2)] hover:bg-white/10 hover:border-[rgba(244,164,150,0.35)] shadow-sm'
          : 'bg-[#FFFFFF] border border-[#E7D9D9] hover:border-[#5C1628] shadow-sm'
      } ${className}`.trim()}
    >
      {/* Eclipse Symbol: Two overlapping astronomical discs */}
      <svg
        viewBox="0 0 24 24"
        className={`w-5 h-5 pointer-events-none transition-transform duration-700 ease-in-out ${
          isDark ? 'rotate-0' : 'rotate-180'
        }`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Disc 1: Warm Ivory Disc (#F6F1EB) */}
        <circle
          cx={isDark ? '9.5' : '14.5'}
          cy="12"
          r="5.5"
          fill="#F6F1EB"
          stroke="#5C1628"
          strokeWidth="0.75"
          className="transition-all duration-500 ease-in-out"
        />
        {/* Disc 2: Primary Burgundy Disc (#5C1628) */}
        <circle
          cx={isDark ? '14.5' : '9.5'}
          cy="12"
          r="5.5"
          fill="#5C1628"
          stroke="#F6F1EB"
          strokeWidth="0.75"
          strokeOpacity="0.4"
          className="transition-all duration-500 ease-in-out"
        />
      </svg>
    </button>
  );
}

export default ThemeToggle;
