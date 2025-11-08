/**
 * Logger utility that conditionally logs based on environment
 * 
 * - In development: Logs everything to console
 * - In production: Only logs errors (and sends to monitoring service)
 * - Respects LOG_LEVEL environment variable
 * 
 * Usage:
 *   import { logger } from '@/lib/utils/logger';
 *   logger.log('Info message');
 *   logger.error('Error message');
 *   logger.warn('Warning message');
 *   logger.debug('Debug message');
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Get environment configuration
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';
const logLevel = (process.env.LOG_LEVEL || 'info').toLowerCase() as LogLevel;

// Log level hierarchy (higher number = more important)
const logLevels: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Check if we should log based on configured log level
function shouldLog(level: LogLevel): boolean {
  if (isTest) return false; // Never log in tests
  if (isDevelopment) return true; // Always log in development
  
  // In production, check against configured log level
  return logLevels[level] >= logLevels[logLevel];
}

// Check if we should log to console
function shouldLogToConsole(level: LogLevel): boolean {
  if (isTest) return false;
  if (isDevelopment) return true;
  
  // In production, only log errors to console
  return level === 'error';
}

// Format log message with context
function formatMessage(level: LogLevel, message: string, ...args: any[]): string {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  
  if (args.length === 0) {
    return `${prefix} ${message}`;
  }
  
  return `${prefix} ${message}`;
}

// Send error to monitoring service (for production, server-side only)
async function sendToMonitoring(level: LogLevel, message: string, ...args: any[]): Promise<void> {
  if (!isProduction || level !== 'error') return;
  
  // Extract error from args or create new Error
  const error = args.find(arg => arg instanceof Error) || new Error(message);
  
  // Extract additional context from args
  const additionalContext = args
    .filter(arg => !(arg instanceof Error))
    .reduce((acc, arg, index) => {
      if (typeof arg === 'object' && arg !== null) {
        return { ...acc, ...arg };
      }
      return { ...acc, [`arg${index}`]: arg };
    }, {});
  
  // Client-side: Send to Sentry
  if (typeof window !== 'undefined') {
    try {
      // Dynamic import to avoid circular dependencies and ensure Sentry is available
      const Sentry = await import('@sentry/nextjs');
      Sentry.captureException(error instanceof Error ? error : new Error(message), {
        tags: {
          source: 'logger',
          logLevel: level,
        },
        extra: {
          message,
          ...additionalContext,
        },
      });
    } catch (err) {
      // Fallback to console if Sentry fails (use console directly to avoid recursion)
      console.error('[LOGGER] Failed to send to Sentry:', err);
    }
    return;
  }
  
  // Server-side: Send to monitoring service
  try {
    // Dynamic import to avoid circular dependencies
    const { MonitoringService } = await import('@/lib/monitoring/monitoring.service');
    const monitoring = MonitoringService.getInstance();
    
    // Log to monitoring service
    monitoring.logError(error instanceof Error ? error : new Error(message), {
      context: 'logger',
      level,
      message,
      ...additionalContext,
    });
  } catch (err) {
    // Fallback to console if monitoring service fails
    // Use console.error directly here since this is a fallback to avoid recursion
    console.error('[LOGGER] Failed to send to monitoring service:', err);
  }
}

/**
 * Logger interface
 */
export const logger = {
  /**
   * Log debug messages (only in development)
   */
  debug: (message: string, ...args: any[]): void => {
    if (!shouldLog('debug')) return;
    
    if (shouldLogToConsole('debug')) {
      console.debug(formatMessage('debug', message), ...args);
    }
  },

  /**
   * Log info messages (development only, or if LOG_LEVEL=info in production)
   */
  log: (message: string, ...args: any[]): void => {
    if (!shouldLog('info')) return;
    
    if (shouldLogToConsole('info')) {
      console.log(formatMessage('info', message), ...args);
    }
  },

  /**
   * Log info messages (alias for log)
   */
  info: (message: string, ...args: any[]): void => {
    logger.log(message, ...args);
  },

  /**
   * Log warning messages (development only, or if LOG_LEVEL=warn in production)
   */
  warn: (message: string, ...args: any[]): void => {
    if (!shouldLog('warn')) return;
    
    if (shouldLogToConsole('warn')) {
      console.warn(formatMessage('warn', message), ...args);
    }
  },

  /**
   * Log error messages (always logged, sent to monitoring in production)
   */
  error: (message: string, ...args: any[]): void => {
    if (!shouldLog('error')) return;
    
    // Always log errors to console
    console.error(formatMessage('error', message), ...args);
    
    // Send to monitoring service in production
    if (isProduction) {
      sendToMonitoring('error', message, ...args).catch((err) => {
        // Use console.error directly to avoid recursion
        console.error('[LOGGER] Failed to send error to monitoring:', err);
      });
    }
  },
};

/**
 * Create a logger with a specific context/namespace
 * Useful for component or module-specific logging
 * 
 * Usage:
 *   const componentLogger = logger.withContext('ComponentName');
 *   componentLogger.log('Component initialized');
 */
export function createLogger(context: string) {
  return {
    debug: (message: string, ...args: any[]) => {
      logger.debug(`[${context}] ${message}`, ...args);
    },
    log: (message: string, ...args: any[]) => {
      logger.log(`[${context}] ${message}`, ...args);
    },
    info: (message: string, ...args: any[]) => {
      logger.info(`[${context}] ${message}`, ...args);
    },
    warn: (message: string, ...args: any[]) => {
      logger.warn(`[${context}] ${message}`, ...args);
    },
    error: (message: string, ...args: any[]) => {
      logger.error(`[${context}] ${message}`, ...args);
    },
  };
}

// Export default logger
export default logger;

