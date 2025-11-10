/**
 * Sentry Server Configuration
 * 
 * Configures Sentry for server-side error tracking
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',
  
  // Set environment
  environment: process.env.NODE_ENV || 'development',
  
  // Only send errors in production
  enabled: process.env.NODE_ENV === 'production' || !!(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN),
  
  // Filter out non-error exceptions
  ignoreErrors: [
    // Network errors
    'ECONNREFUSED',
    'ENOTFOUND',
    'ETIMEDOUT',
    'ECONNRESET',
    // Database connection errors (handled separately)
    'PrismaClientInitializationError',
  ],
  
  // Add user context when available
  beforeSend(event, hint) {
    // Add additional context if available
    if (hint.originalException) {
      // You can add custom context here
    }
    return event;
  },
});

