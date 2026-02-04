import { api } from '@/convex/_generated/api';
import { useSession } from '@/lib/auth/use-session';
import { useAction } from 'convex/react';

/**
 * Hook to create checkout (payment intent)
 */
export function useCreateCheckout() {
  const { sessionToken } = useSession();
  const createCheckout = useAction(api.actions.payments.customerCreateCheckout);

  return {
    mutateAsync: async () => {
      if (!sessionToken) throw new Error('Authentication required');
      const result = await createCheckout({
        sessionToken,
      });
      if (!result.success) {
        throw new Error(result.error || 'Failed to create checkout');
      }
      return result;
    },
  };
}

/**
 * Hook to create order from cart after payment
 */
export function useCreateOrderFromCart() {
  const { sessionToken } = useSession();
  const createOrder = useAction(api.actions.orders.customerCreateOrderFromCart);

  return {
    mutateAsync: async (request: {
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
      if (!sessionToken) throw new Error('Authentication required');

      const result = await createOrder({
        sessionToken,
        payment_intent_id: request.payment_intent_id,
        delivery_address: request.delivery_address ? {
          street: request.delivery_address.street || '',
          city: request.delivery_address.city,
          postcode: request.delivery_address.postal_code || '',
          country: request.delivery_address.country,
        } : undefined,
        special_instructions: request.special_instructions,
        delivery_time: request.delivery_time,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to create order');
      }
      return result;
    },
  };
}

