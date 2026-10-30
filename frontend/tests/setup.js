import '@testing-library/jest-dom';

// Ensure standard Web Storage implementation in jsdom test environment
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
}
