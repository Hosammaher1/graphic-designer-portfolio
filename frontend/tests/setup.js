import '@testing-library/jest-dom';

// Ensure standard Web Storage & MatchMedia implementation in jsdom test environment
if (typeof window !== 'undefined') {
  let store = {};
  const mockStorage = {
    getItem: (key) => store[key] ?? null,
    setItem: (key, val) => {
      store[key] = String(val);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (i) => Object.keys(store)[i] ?? null,
  };

  try {
    Object.defineProperty(window, 'localStorage', {
      value: mockStorage,
      writable: true,
      configurable: true,
    });
  } catch (e) {
    window.localStorage = mockStorage;
  }

  // Also assign to globalThis.localStorage for Node/jsdom consistency
  try {
    globalThis.localStorage = mockStorage;
  } catch (e) {
    // Ignore if not configurable
  }

  // Ensure window.matchMedia polyfill for GSAP and responsive tests
  if (typeof window.matchMedia !== 'function') {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  }

  // Ensure requestAnimationFrame & cancelAnimationFrame for GSAP ScrollTrigger
  if (typeof globalThis.requestAnimationFrame !== 'function') {
    globalThis.requestAnimationFrame = (callback) => setTimeout(() => callback(Date.now()), 16);
  }
  if (typeof globalThis.cancelAnimationFrame !== 'function') {
    globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
  }
  if (typeof window.requestAnimationFrame !== 'function') {
    window.requestAnimationFrame = globalThis.requestAnimationFrame;
  }
  if (typeof window.cancelAnimationFrame !== 'function') {
    window.cancelAnimationFrame = globalThis.cancelAnimationFrame;
  }
}
