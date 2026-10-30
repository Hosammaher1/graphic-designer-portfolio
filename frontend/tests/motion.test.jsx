import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Reveal } from '../src/components/ui/Reveal.jsx';

describe('Subtle Motion & Transitions (Task 04.08)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children inside Reveal primitive with motion classes', () => {
    render(
      <Reveal className="custom-reveal">
        <p>Animated content</p>
      </Reveal>
    );

    const el = screen.getByText('Animated content');
    expect(el).toBeInTheDocument();
    const container = el.closest('.reveal-wrap');
    expect(container).toBeInTheDocument();
    expect(container.className).toContain('custom-reveal');
  });

  it('never blocks pointer events or button clicks inside Reveal', () => {
    const handleClick = vi.fn();
    render(
      <Reveal>
        <button type="button" onClick={handleClick}>
          Click Action
        </button>
      </Reveal>
    );

    const btn = screen.getByRole('button', { name: 'Click Action' });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('respects prefers-reduced-motion and skips motion delays', () => {
    // Mock matchMedia for prefers-reduced-motion
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(
      <Reveal delay={300}>
        <div data-testid="reduced-motion-target">Immediate Content</div>
      </Reveal>
    );

    const target = screen.getByTestId('reduced-motion-target');
    const container = target.closest('.reveal-wrap');
    expect(container).toHaveClass('reduced-motion-active');
  });
});
