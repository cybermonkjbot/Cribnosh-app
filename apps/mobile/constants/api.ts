/**
 * API Configuration
 * Uses environment variables with fallback to production URLs
 * In Expo development, automatically uses localhost
 */

import { Platform } from 'react-native';

// Determine the API base URL
function getApiBaseUrl(): string {
  // Check if explicitly set via environment variable
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
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
  return 'https://cribnosh.com/api';
}

const API_BASE_URL = getApiBaseUrl();

export const API_CONFIG = {
  baseUrl: API_BASE_URL,
  // Ensure baseUrl doesn't have trailing slash
  get baseUrlNoTrailing(): string {
    return this.baseUrl.replace(/\/$/, '');
  },
};

// Stripe Configuration
export const STRIPE_CONFIG = {
  publishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
};

export default API_CONFIG;
