import { onCLS, onFID, onFCP, onLCP, onTTFB, Metric } from 'web-vitals';
import { analytics } from './analytics';
import { captureMessage } from './sentry';

const reportMetric = (metric: Metric): void => {
  try {
    const metricData = {
      metric_name: metric.name,
      metric_value: metric.value,
      metric_id: metric.id,
      metric_rating: metric.rating,
      metric_delta: metric.delta,
    };

    analytics.trackEvent('web_vitals', metricData);

    captureMessage(`Web Vital: ${metric.name}`, 'info', {
      tags: {
        metric_name: metric.name,
        metric_rating: metric.rating,
      },
      extra: metricData,
    });
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error reporting web vital metric:', error);
    }
  }
};

export const initWebVitals = (): void => {
  try {
    if (typeof window === 'undefined') {
      console.warn('Web Vitals: window is undefined, skipping initialization');
      return;
    }

    if (!('performance' in window)) {
      console.warn('Web Vitals: Performance API not supported in this browser');
      return;
    }

    onCLS(reportMetric);
    onFID(reportMetric);
    onFCP(reportMetric);
    onLCP(reportMetric);
    onTTFB(reportMetric);

    if (import.meta.env.DEV) {
      console.info('Web Vitals monitoring initialized');
    }
  } catch (error) {
    console.error('Failed to initialize Web Vitals:', error);
  }
};
