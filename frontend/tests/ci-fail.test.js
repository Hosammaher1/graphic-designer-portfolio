import { describe, it, expect } from 'vitest';

describe('Disposable CI failure probe', () => {
  it('deliberately fails to verify CI gating blocks failing checks', () => {
    expect(true).toBe(false);
  });
});
