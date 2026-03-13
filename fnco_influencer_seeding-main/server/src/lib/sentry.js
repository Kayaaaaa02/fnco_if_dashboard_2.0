import * as Sentry from '@sentry/node';

export function initSentry(app) {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    console.log('[Sentry] No DSN configured, skipping initialization');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  });

  // The request handler must be the first middleware
  app.use(Sentry.Handlers.requestHandler());

  console.log('[Sentry] Server initialized');
}

export function setupSentryErrorHandler(app) {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  // The error handler must be before any other error middleware
  app.use(Sentry.Handlers.errorHandler());
}

export { Sentry };
