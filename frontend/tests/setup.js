import '@testing-library/jest-dom';

// Ensure global requestAnimationFrame & cancelAnimationFrame for Node/jsdom and GSAP ScrollTrigger
const rafPolyfill = (callback) => {
  return setTimeout(() => {
    try {
      if (typeof callback === 'function') {
        callback(Date.now());
      }
    } catch (e) {
      // Ignore background loop errors after test teardown (e.g. GSAP _rafBugFix)
    }
  }, 16);
};
const cafPolyfill = (id) => clearTimeout(id);

for (const target of [globalThis, global]) {
  if (typeof target !== 'undefined') {
    try {
      Object.defineProperty(target, 'requestAnimationFrame', {
        value: rafPolyfill,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(target, 'cancelAnimationFrame', {
        value: cafPolyfill,
        writable: true,
        configurable: true,
      });
    } catch {
      target.requestAnimationFrame = rafPolyfill;
      target.cancelAnimationFrame = cafPolyfill;
    }
  }
}

if (typeof window !== 'undefined') {
  window.requestAnimationFrame = rafPolyfill;
  window.cancelAnimationFrame = cafPolyfill;
}
if (typeof self !== 'undefined') {
  self.requestAnimationFrame = rafPolyfill;
  self.cancelAnimationFrame = cafPolyfill;
}

// Ensure standard Web Storage & MatchMedia implementation in jsdom test environment
if (typeof window !== 'undefined') {
  if (typeof window.requestAnimationFrame !== 'function') {
    window.requestAnimationFrame = rafPolyfill;
  }
  if (typeof window.cancelAnimationFrame !== 'function') {
    window.cancelAnimationFrame = cafPolyfill;
  }

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
}
