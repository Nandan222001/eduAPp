import * as Sentry from '@sentry/react';
import { useEffect } from 'react';
import {
  useLocation,
  useNavigationType,
  createRoutesFromChildren,
  matchRoutes,
} from 'react-router-dom';
import type { CaptureContext, SeverityLevel } from '@sentry/types';

interface SentryConfig {
  dsn?: string;
  environment?: string;
  release?: string;
  tracesSampleRate?: number;
  replaysSessionSampleRate?: number;
  replaysOnErrorSampleRate?: number;
  enabled?: boolean;
}

export const initSentry = (): void => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE;
  const release = import.meta.env.VITE_APP_VERSION || '0.0.0';
  const enabled = import.meta.env.VITE_SENTRY_ENABLED !== 'false' && !import.meta.env.DEV;

  if (!enabled || !dsn) {
    console.info('Sentry monitoring is disabled');
    return;
  }

  const config: SentryConfig = {
    dsn,
    environment,
    release,
    tracesSampleRate: import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE
      ? parseFloat(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE)
      : 1.0,
    replaysSessionSampleRate: import.meta.env.VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE
      ? parseFloat(import.meta.env.VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE)
      : 0.1,
    replaysOnErrorSampleRate: import.meta.env.VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE
      ? parseFloat(import.meta.env.VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE)
      : 1.0,
  };

  Sentry.init({
    dsn: config.dsn,
    environment: config.environment,
    release: config.release,
    integrations: [
      Sentry.reactRouterV6BrowserTracingIntegration({
        useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes,
      }),
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: config.tracesSampleRate,
    replaysSessionSampleRate: config.replaysSessionSampleRate,
    replaysOnErrorSampleRate: config.replaysOnErrorSampleRate,
    beforeSend(event) {
      if (import.meta.env.DEV) {
        console.log('Sentry Event:', event);
        return null;
      }
      return event;
    },
  });

  console.info('Sentry monitoring initialized', {
    environment: config.environment,
    release: config.release,
  });
};

export const captureException = (error: Error | unknown, context?: CaptureContext): string => {
  if (import.meta.env.DEV) {
    console.error('Exception captured:', error, context);
  }
  return Sentry.captureException(error, context);
};

export const captureMessage = (
  message: string,
  level?: SeverityLevel,
  context?: CaptureContext
): string => {
  if (import.meta.env.DEV) {
    console.log(`Message captured [${level || 'info'}]:`, message, context);
  }
  return Sentry.captureMessage(message, {
    level: level || 'info',
    ...context,
  });
};

export { Sentry };
