/**
 * API Configuration
 * Uses environment variables with fallback to production URLs
 */

// Hardcoded fallback to Cribnosh API
const FALLBACK_API_URL = 'https://cribnosh.com/api';

// Get API URL from environment or use fallback
const envApiUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

// Validate env URL - if it points to old FuelFinder API, use fallback instead
const isValidApiUrl = envApiUrl && 
  !envApiUrl.includes('fuelfinder') && 
  !envApiUrl.includes('fuel-finder');

const API_BASE_URL = (envApiUrl && isValidApiUrl) ? envApiUrl : FALLBACK_API_URL;

// Log which URL is being used (only in development)
if (__DEV__) {
  console.log('[API Config] Using API URL:', API_BASE_URL);
  if (envApiUrl && isValidApiUrl && envApiUrl !== FALLBACK_API_URL) {
    console.log('[API Config] Using environment variable:', envApiUrl);
  } else if (envApiUrl && !isValidApiUrl) {
    console.warn('[API Config] Invalid env URL detected:', envApiUrl, '- Using fallback:', FALLBACK_API_URL);
  } else {
    console.log('[API Config] Using hardcoded fallback:', FALLBACK_API_URL);
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

