import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { render as renderServer } from '../src/entry-server.jsx';

describe('Server-Side Rendering (SSR)', () => {
  it('RED/GREEN: renders Arabic route with title and semantic HTML before client JS', () => {
    const result = renderServer('/ar/');
    expect(result).toBeDefined();
    expect(result.html).toContain('تصميم بصري هادف');
    expect(result.lang).toBe('ar');
    expect(result.dir).toBe('rtl');
    expect(result.title).toContain('محمد — مصمم جرافيك');
  });

  it('renders English route with English title and LTR direction', () => {
    const result = renderServer('/en/');
    expect(result).toBeDefined();
    expect(result.html).toContain('Intentional visual design');
    expect(result.lang).toBe('en');
    expect(result.dir).toBe('ltr');
    expect(result.title).toContain('Mohammed — Graphic Designer');
  });

  it('renders Admin placeholder route on the server without errors', () => {
    const result = renderServer('/admin/');
    expect(result).toBeDefined();
    expect(result.html).toContain('Admin Dashboard');
  });
});
