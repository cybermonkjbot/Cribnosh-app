/**
 * Checkout Hook
 * React Query hook for managing checkout operations
 */

import { useMutation } from '@tanstack/react-query';
import * as checkoutAPI from '@/lib/api/checkout';

/**
 * Hook to create checkout (payment intent)
 */
export function useCreateCheckout() {
  return useMutation({
    mutationFn: async () => {
      return await checkoutAPI.createCheckout();
    },
  });
}

/**
 * Hook to create order from cart after payment
 */
export function useCreateOrderFromCart() {
  return useMutation({
    mutationFn: async (request: {
      payment_intent_id: string;
      delivery_address?: {
        street?: string;
        city: string;
        country: string;
        postal_code?: string;
        state?: string;
        coordinates?: number[];
      };
      special_instructions?: string;
      delivery_time?: string;
    }) => {
      return await checkoutAPI.createOrderFromCart(request);
    },
  });
}

