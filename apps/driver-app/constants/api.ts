/**
 * API Configuration
 * Uses environment variables with fallback to production URLs
 * In Expo development, automatically uses localhost
 */

import { Platform } from 'react-native';

// Hardcoded fallback to Cribnosh API
const FALLBACK_API_URL = 'https://cribnosh.com/api';

// Determine the API base URL
function getApiBaseUrl(): string {
  // Get API URL from environment
  const envApiUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

  // Validate env URL - if it points to old FuelFinder API, ignore it
  const isValidApiUrl = envApiUrl && 
    !envApiUrl.includes('fuelfinder') && 
    !envApiUrl.includes('fuel-finder');

  // If valid environment variable is set, use it
  if (envApiUrl && isValidApiUrl) {
    return envApiUrl;
  }

  // In development mode, use localhost
  if (__DEV__) {
    // Android emulator uses 10.0.2.2 to access host machine's localhost
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:3000/api';
    }
    // iOS simulator and web can use localhost directly
    return 'http://localhost:3000/api';
  }

  // Production fallback
  return FALLBACK_API_URL;
}

const API_BASE_URL = getApiBaseUrl();

// Log which URL is being used (only in development)
if (__DEV__) {
  const envApiUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  const isValidApiUrl = envApiUrl && 
    !envApiUrl.includes('fuelfinder') && 
    !envApiUrl.includes('fuel-finder');
  
  console.log('[API Config] Using API URL:', API_BASE_URL);
  if (envApiUrl && isValidApiUrl && envApiUrl !== FALLBACK_API_URL) {
    console.log('[API Config] Using environment variable:', envApiUrl);
  } else if (envApiUrl && !isValidApiUrl) {
    console.warn('[API Config] Invalid env URL detected:', envApiUrl, '- Using fallback');
  } else if (__DEV__ && !envApiUrl) {
    console.log('[API Config] Development mode - using localhost');
  } else {
    console.log('[API Config] Using production URL:', FALLBACK_API_URL);
  }
}

export const API_CONFIG = {
  baseUrl: API_BASE_URL,
  // Ensure baseUrl doesn't have trailing slash
  get baseUrlNoTrailing(): string {
    return this.baseUrl.replace(/\/$/, '');
  },
};

export default API_CONFIG;

