/**
 * API Configuration
 * Uses environment variables with fallback to production URLs
 * In Expo development, automatically uses localhost
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

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
// Try multiple sources for the publishable key
const publishableKey = (
  process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 
  (typeof Constants !== 'undefined' && Constants.expoConfig?.extra?.stripePublishableKey) ||
  ''
).trim();

// Debug: Log configuration (only in development)
if (__DEV__) {
  console.log('🔑 Stripe Key Check:', {
    fromEnv: !!process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    fromConstants: !!(typeof Constants !== 'undefined' && Constants.expoConfig?.extra?.stripePublishableKey),
    keyLength: publishableKey.length,
    keyPrefix: publishableKey ? publishableKey.substring(0, 20) + '...' : 'MISSING',
  });
  
  if (!publishableKey) {
    console.warn('⚠️ EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set! Stripe features will not work.');
    console.warn('   Make sure:');
    console.warn('   1. .env file exists in apps/mobile/');
    console.warn('   2. EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY is set in .env');
    console.warn('   3. You have restarted the dev server with --clear flag');
  }
}

// Validate publishable key format
const isValidPublishableKey = (key: string): boolean => {
  return key.startsWith('pk_test_') || key.startsWith('pk_live_');
};

export const STRIPE_CONFIG = {
  publishableKey: isValidPublishableKey(publishableKey) ? publishableKey : '',
};

export default API_CONFIG;
