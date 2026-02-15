/**
 * API Configuration
 * Uses environment variables with fallback to production URLs
 * In Expo development, automatically uses localhost
 */

import Constants from 'expo-constants';
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
  return 'https://cribnosh.co.uk/api';
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
// TODO: REMOVE HARDCODED TEST KEY - This is a temporary fallback for testing
const envKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
const constantsKey = typeof Constants !== 'undefined' && Constants.expoConfig?.extra?.stripePublishableKey?.trim();
const FALLBACK_TEST_KEY = 'pk_test_51QTHZNGAiAa3ySTV7uMSXj9skUWaiDHpeoBgCHilmzSmcY3CN7NjbpMeF49tjISaAHnJiwzTQeFdDSr9oAyyuxO900GS4YbEIT'; // TEMPORARY TEST KEY - REMOVE BEFORE PRODUCTION

// Validate publishable key format
const isValidPublishableKey = (key: string): boolean => {
  return key.startsWith('pk_test_') || key.startsWith('pk_live_');
};

// Use env key if it's non-empty, otherwise try constants, otherwise use fallback
const publishableKey = (envKey && envKey.length > 0)
  ? envKey
  : (constantsKey && constantsKey.length > 0)
    ? constantsKey
    : FALLBACK_TEST_KEY;

// Debug: Log configuration (only in development)
if (__DEV__) {
  const usingEnv = !!(envKey && envKey.length > 0);
  const usingConstants = !!(constantsKey && constantsKey.length > 0);
  const usingFallback = !usingEnv && !usingConstants;

  console.log('🔑 Stripe Key Check:', {
    fromEnv: usingEnv,
    fromConstants: usingConstants,
    usingFallback,
    keyLength: publishableKey.length,
    keyPrefix: publishableKey ? publishableKey.substring(0, 20) + '...' : 'MISSING',
    isValid: isValidPublishableKey(publishableKey),
  });

  if (!publishableKey || publishableKey.length === 0) {
    console.warn('⚠️ Stripe publishable key is missing! Stripe features will not work.');
    console.warn('   Make sure:');
    console.warn('   1. .env file exists in apps/mobile/');
    console.warn('   2. EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY is set in .env (non-empty)');
    console.warn('   3. You have restarted the dev server with --clear flag');
  } else if (usingFallback) {
    console.warn('⚠️ Using hardcoded fallback Stripe key. Set EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY in .env for production.');
  }
}

export const STRIPE_CONFIG = {
  publishableKey: isValidPublishableKey(publishableKey) ? publishableKey : '',
};

export default API_CONFIG;
