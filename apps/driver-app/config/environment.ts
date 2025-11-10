/**
 * Environment configuration for the Cribnosh driver app
 * This file centralizes all environment variables and provides type safety
 */

export interface DriverAppConfig {
  // App Information
  appName: string;
  appVersion: string;
  appEnv: 'development' | 'staging' | 'production';
  appId: string;
  
  // Convex Configuration
  convexUrl: string;
  
  // Feature Flags
  enableDebugLogs: boolean;
  enablePushNotifications: boolean;
  enableLocationServices: boolean;
  
  // Location Configuration
  defaultLocation: {
    latitude: number;
    longitude: number;
  };
  
  // Security Configuration
  sessionTimeout: number;
}

/**
 * Get environment variable with fallback
 */
function getEnvVar(key: string, fallback?: string): string {
  const value = process.env[key];
  if (!value && fallback === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || fallback || '';
}

/**
 * Validate HTTPS for production URLs
 */
function validateProductionUrl(url: string, envName: string): string {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.EXPO_PUBLIC_ENVIRONMENT === 'production';
  
  if (isProduction && url.startsWith('http://')) {
    throw new Error(`Production environment requires HTTPS. ${envName} must use https:// protocol.`);
  }
  
  return url;
}

/**
 * Get boolean environment variable
 */
function getBooleanEnvVar(key: string, fallback: boolean = false): boolean {
  const value = process.env[key];
  if (!value) return fallback;
  return value.toLowerCase() === 'true';
}

/**
 * Get number environment variable
 */
function getNumberEnvVar(key: string, fallback: number): number {
  const value = process.env[key];
  if (!value) return fallback;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Driver app configuration
 */
export const config: DriverAppConfig = {
  // App Information
  appName: getEnvVar('EXPO_PUBLIC_APP_NAME', 'Cribnosh Driver'),
  appVersion: getEnvVar('EXPO_PUBLIC_APP_VERSION', '1.0.0'),
  appEnv: (getEnvVar('EXPO_PUBLIC_APP_ENV', 'development') as 'development' | 'staging' | 'production'),
  appId: getEnvVar('EXPO_PUBLIC_APP_ID', 'c93333d4-88c5-4dcc-901a-5c7469ad1949'),
  
  // Convex Configuration
  convexUrl: getEnvVar('EXPO_PUBLIC_CONVEX_URL', ''),
  
  // Feature Flags
  enableDebugLogs: getBooleanEnvVar('EXPO_PUBLIC_ENABLE_DEBUG_LOGS', false),
  enablePushNotifications: getBooleanEnvVar('EXPO_PUBLIC_PUSH_NOTIFICATION_ENABLED', true),
  enableLocationServices: getBooleanEnvVar('EXPO_PUBLIC_LOCATION_SERVICES_ENABLED', true),
  
  // Location Configuration (Default to Lagos, Nigeria)
  defaultLocation: {
    latitude: getNumberEnvVar('EXPO_PUBLIC_DEFAULT_LOCATION_LAT', 6.5244),
    longitude: getNumberEnvVar('EXPO_PUBLIC_DEFAULT_LOCATION_LNG', 3.3792),
  },
  
  // Security Configuration
  sessionTimeout: getNumberEnvVar('EXPO_PUBLIC_SESSION_TIMEOUT', 3600000), // 1 hour
};

/**
 * Check if running in production
 */
export const isProduction = config.appEnv === 'production';

/**
 * Check if running in development
 */
export const isDevelopment = config.appEnv === 'development';

/**
 * Check if running in staging
 */
export const isStaging = config.appEnv === 'staging';

/**
 * Validate configuration
 */
export function validateConfig(): void {
  const requiredVars = [
    'EXPO_PUBLIC_CONVEX_URL',
  ];
  
  const missingVars = requiredVars.filter(key => !process.env[key]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
  
  // Validate Convex URL format
  try {
    new URL(config.convexUrl);
  } catch {
    throw new Error('Invalid EXPO_PUBLIC_CONVEX_URL format');
  }
}

// Validate configuration on import
if (isProduction) {
  validateConfig();
}
