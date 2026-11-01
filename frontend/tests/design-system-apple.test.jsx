import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Apple-Inspired Design System & Tokens (Task 10.01)', () => {
  const tokensPath = path.resolve(__dirname, '../src/styles/tokens.css');
  const tokensContent = fs.readFileSync(tokensPath, 'utf8');

  it('defines clamp-based editorial typography scales', () => {
    expect(tokensContent).toContain('--font-size-display-clamp: clamp(3.5rem, 8.5vw, 8.5rem)');
    expect(tokensContent).toContain('--font-size-heading-clamp: clamp(2.25rem, 5vw, 4.5rem)');
    expect(tokensContent).toContain('--font-size-subheading-clamp: clamp(1.25rem, 2.5vw, 2rem)');
  });

  it('defines glassmorphic blur and border tokens for light mode', () => {
    expect(tokensContent).toContain('--glass-bg: rgba(255, 255, 255, 0.75)');
    expect(tokensContent).toContain('--glass-border: rgba(0, 0, 0, 0.08)');
    expect(tokensContent).toContain('--glass-blur: 16px');
    expect(tokensContent).toContain('--color-amber-accent: #d97706');
  });

  it('defines high-contrast glassmorphic depth tokens for dark mode', () => {
    const darkSection = tokensContent.split('[data-theme="dark"]')[1];
    expect(darkSection).toBeDefined();
    expect(darkSection).toContain('--glass-bg: rgba(28, 25, 23, 0.65)');
    expect(darkSection).toContain('--glass-border: rgba(255, 255, 255, 0.1)');
    expect(darkSection).toContain('--color-amber-accent: #fbbf24');
  });

  it('enforces zero duration transitions under prefers-reduced-motion', () => {
    const reducedMotionSection = tokensContent.split('@media (prefers-reduced-motion: reduce)')[1];
    expect(reducedMotionSection).toBeDefined();
    expect(reducedMotionSection).toContain('--motion-fast: 0ms !important');
    expect(reducedMotionSection).toContain('--motion-normal: 0ms !important');
    expect(reducedMotionSection).toContain('--motion-slow: 0ms !important');
  });
});
