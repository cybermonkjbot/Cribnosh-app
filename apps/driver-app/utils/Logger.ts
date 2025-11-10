// Logger utility for driver app

export const logger = {
  info: (message: string, data?: unknown) => {
    console.log(`[INFO] ${message}`, data || '');
  },
  warn: (message: string, data?: unknown) => {
    console.warn(`[WARN] ${message}`, data || '');
  },
  error: (message: string, error?: unknown) => {
    console.error(`[ERROR] ${message}`, error || '');
  },
  debug: (message: string, data?: unknown) => {
    console.log(`[DEBUG] ${message}`, data || '');
  },
};

export const errorHandler: ErrorHandler = (error: Error, context?: string) => {
  logger.error(`Error in ${context || 'unknown context'}: ${error.message}`, error);
};

export const notificationService = {
  show: (title: string, message: string) => {
    logger.info(`Notification: ${title} - ${message}`);
  },
  schedule: (title: string, message: string, delay: number) => {
    logger.info(`Scheduled notification: ${title} - ${message} (${delay}ms)`);
  },
};