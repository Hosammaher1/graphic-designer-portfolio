import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { render as renderServer } from '../src/entry-server.jsx';
import { getSecurityHeaders } from '../server/index.js';

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
    expect(result.title).toContain('Mohammed — Graphic');
  });

  it('renders Admin authentication route on the server without errors', () => {
    const result = renderServer('/admin/login');
    expect(result).toBeDefined();
    expect(result.html).toContain('Portfolio Administration');
  });

  it('enforces strict CSP without unsafe-eval or localhost connect in production', () => {
    const prodHeaders = getSecurityHeaders(true);
    const csp = prodHeaders['Content-Security-Policy'];

    expect(csp).toBeDefined();
    expect(csp).not.toContain('unsafe-eval');
    expect(csp).not.toContain('localhost');
    expect(csp).not.toContain('127.0.0.1');
    expect(csp).not.toContain('ws:');
    expect(csp).toContain("default-src 'self'");
    expect(prodHeaders['Strict-Transport-Security']).toBe('max-age=31536000; includeSubDomains; preload');
    expect(prodHeaders['X-Frame-Options']).toBe('DENY');
    expect(prodHeaders['X-Content-Type-Options']).toBe('nosniff');
  });

  it('allows development tooling origins when not in production', () => {
    const devHeaders = getSecurityHeaders(false);
    const csp = devHeaders['Content-Security-Policy'];

    expect(csp).toContain('unsafe-eval');
    expect(csp).toContain('localhost');
    expect(devHeaders['Strict-Transport-Security']).toBeUndefined();
  });
});
