/**
 * Core Web Vitals Monitoring and Audit Utility (Task 07.09)
 * Official thresholds defined by Google Web Vitals initiative:
 * - LCP (Largest Contentful Paint): <= 2500ms
 * - FID (First Input Delay): <= 100ms
 * - INP (Interaction to Next Paint): <= 200ms
 * - CLS (Cumulative Layout Shift): <= 0.1
 * - FCP (First Contentful Paint): <= 1800ms
 * - TTFB (Time to First Byte): <= 800ms
 */

export const CWV_BUDGETS = {
  LCP: { good: 2500, needsImprovement: 4000, unit: 'ms' },
  FID: { good: 100, needsImprovement: 300, unit: 'ms' },
  INP: { good: 200, needsImprovement: 500, unit: 'ms' },
  CLS: { good: 0.1, needsImprovement: 0.25, unit: 'score' },
  FCP: { good: 1800, needsImprovement: 3000, unit: 'ms' },
  TTFB: { good: 800, needsImprovement: 1800, unit: 'ms' },
};

/**
 * Categorize a metric value against official CWV budget thresholds.
 * @param {string} metricName
 * @param {number} value
 * @returns {'good' | 'needs-improvement' | 'poor'}
 */
export function getRating(metricName, value) {
  const budget = CWV_BUDGETS[metricName];
  if (!budget || typeof value !== 'number') return 'good';

  if (value <= budget.good) return 'good';
  if (value <= budget.needsImprovement) return 'needs-improvement';
  return 'poor';
}

/**
 * Check if a metric value satisfies the "good" budget threshold.
 * @param {string} metricName
 * @param {number} value
 * @returns {boolean}
 */
export function isWithinBudget(metricName, value) {
  return getRating(metricName, value) === 'good';
}

/**
 * Check if the user has consented to analytics/performance tracking (Task 06.05/06.06).
 */
export function hasAnalyticsConsent() {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem('cookie_consent_preferences');
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Boolean(parsed.analytics);
  } catch (e) {
    return false;
  }
}

/**
 * Report a metric to an optional callback and/or analytics endpoint.
 */
function reportMetric(metric, callback) {
  const payload = {
    name: metric.name,
    value: Math.round(metric.value * 1000) / 1000,
    rating: getRating(metric.name, metric.value),
    id: metric.id || `v1-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
  };

  if (typeof callback === 'function') {
    callback(payload);
  }

  // If analytics consent is granted, report to backend analytics endpoint
  if (typeof window !== 'undefined' && hasAnalyticsConsent()) {
    try {
      const endpoint = '/api/analytics/events';
      const body = JSON.stringify({
        event_type: 'web_vital',
        metric_name: payload.name,
        metric_value: payload.value,
        metric_rating: payload.rating,
        url: window.location.pathname,
      });

      if (navigator.sendBeacon) {
        navigator.sendBeacon(endpoint, new Blob([body], { type: 'application/json' }));
      } else {
        fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true,
        }).catch(() => {});
      }
    } catch (e) {
      // Non-blocking silently fail
    }
  }
}

/**
 * Observe Largest Contentful Paint (LCP)
 */
export function observeLCP(callback) {
  if (typeof window === 'undefined' || !window.PerformanceObserver) return () => {};

  try {
    const supported = PerformanceObserver.supportedEntryTypes || [];
    if (!supported.includes('largest-contentful-paint')) return () => {};

    let lastLcp = null;
    const observer = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      if (entries.length > 0) {
        lastLcp = entries[entries.length - 1];
      }
    });

    observer.observe({ type: 'largest-contentful-paint', buffered: true });

    const flush = () => {
      if (lastLcp) {
        reportMetric(
          {
            name: 'LCP',
            value: lastLcp.startTime,
            id: lastLcp.id,
          },
          callback
        );
        lastLcp = null;
      }
    };

    // LCP is finalized on page hide or initial interaction
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush();
    }, { once: true });

    return () => {
      flush();
      observer.disconnect();
    };
  } catch (e) {
    return () => {};
  }
}

/**
 * Observe Cumulative Layout Shift (CLS)
 */
export function observeCLS(callback) {
  if (typeof window === 'undefined' || !window.PerformanceObserver) return () => {};

  try {
    const supported = PerformanceObserver.supportedEntryTypes || [];
    if (!supported.includes('layout-shift')) return () => {};

    let clsValue = 0;
    const observer = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        // Only count shifts without recent user input
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
    });

    observer.observe({ type: 'layout-shift', buffered: true });

    const flush = () => {
      reportMetric(
        {
          name: 'CLS',
          value: clsValue,
        },
        callback
      );
    };

    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush();
    }, { once: true });

    return () => {
      flush();
      observer.disconnect();
    };
  } catch (e) {
    return () => {};
  }
}

/**
 * Observe First Input Delay (FID)
 */
export function observeFID(callback) {
  if (typeof window === 'undefined' || !window.PerformanceObserver) return () => {};

  try {
    const supported = PerformanceObserver.supportedEntryTypes || [];
    if (!supported.includes('first-input')) return () => {};

    const observer = new PerformanceObserver((entryList) => {
      const entry = entryList.getEntries()[0];
      if (entry) {
        reportMetric(
          {
            name: 'FID',
            value: entry.processingStart - entry.startTime,
          },
          callback
        );
        observer.disconnect();
      }
    });

    observer.observe({ type: 'first-input', buffered: true });

    return () => observer.disconnect();
  } catch (e) {
    return () => {};
  }
}

/**
 * Observe First Contentful Paint (FCP)
 */
export function observeFCP(callback) {
  if (typeof window === 'undefined' || !window.PerformanceObserver) return () => {};

  try {
    const supported = PerformanceObserver.supportedEntryTypes || [];
    if (!supported.includes('paint')) return () => {};

    const observer = new PerformanceObserver((entryList) => {
      const entry = entryList.getEntries().find((e) => e.name === 'first-contentful-paint');
      if (entry) {
        reportMetric(
          {
            name: 'FCP',
            value: entry.startTime,
          },
          callback
        );
        observer.disconnect();
      }
    });

    observer.observe({ type: 'paint', buffered: true });

    return () => observer.disconnect();
  } catch (e) {
    return () => {};
  }
}

/**
 * Initialize all Core Web Vitals observers.
 * Returns a teardown function.
 * @param {Function} [callback] Optional metric callback
 */
export function initWebVitals(callback) {
  if (typeof window === 'undefined') return () => {};

  const cleanups = [
    observeLCP(callback),
    observeCLS(callback),
    observeFID(callback),
    observeFCP(callback),
  ];

  return () => {
    cleanups.forEach((cleanup) => {
      if (typeof cleanup === 'function') cleanup();
    });
  };
}

export default {
  CWV_BUDGETS,
  getRating,
  isWithinBudget,
  hasAnalyticsConsent,
  initWebVitals,
  observeLCP,
  observeCLS,
  observeFID,
  observeFCP,
};
