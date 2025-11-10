/**
 * Stripe Client Setup
 * Client-side Stripe initialization for payment processing
 */

import { loadStripe, Stripe } from '@stripe/stripe-js';
import { logger } from '@/lib/utils/logger';

let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Get Stripe instance
 * This will be initialized with the publishable key from environment variables
 */
export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    
    if (!publishableKey) {
      logger.warn('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set');
      stripePromise = Promise.resolve(null);
    } else {
      stripePromise = loadStripe(publishableKey);
    }
  }
  
  return stripePromise;
}

