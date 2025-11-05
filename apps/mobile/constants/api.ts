/**
 * API Configuration
 * Uses environment variables with fallback to production URLs
 */

const API_BASE_URL = 
  process.env.EXPO_PUBLIC_API_BASE_URL || 
  'https://cribnosh.com/api';

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
