import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useSession } from '@/lib/auth/use-session';
import { useMutation, useQuery } from 'convex/react';

// Query keys (keep for compatibility if needed, though useQuery handles this)
export const cartKeys = {
  all: ['cart'] as const,
  cart: () => [...cartKeys.all, 'items'] as const,
};

/**
 * Hook to get cart data
 */
export function useCart() {
  const { user, sessionToken } = useSession();

  const cart = useQuery(
    api.queries.orders.getUserCart,
    user?._id ? { userId: user._id as Id<'users'>, sessionToken: sessionToken || undefined } : 'skip'
  );

  return {
    data: cart ? { cart } : undefined,
    isLoading: user === undefined || (!!user && cart === undefined),
    error: null, // Convex handles errors via try/catch in components or global handlers
  };
}

/**
 * Hook to add item to cart
 */
export function useAddToCart() {
  const { user } = useSession();
  const addToCartMutation = useMutation(api.mutations.orders.addToCart);

  return {
    mutateAsync: async ({ dishId, quantity }: { dishId: string; quantity: number }) => {
      if (!user?._id) throw new Error('User not authenticated');
      return await addToCartMutation({
        userId: user._id as Id<'users'>,
        dishId: dishId as Id<'meals'>,
        quantity,
      });
    },
  };
}

/**
 * Hook to update cart item quantity
 */
export function useUpdateCartItem() {
  const { user } = useSession();
  const updateCartItemMutation = useMutation(api.mutations.orders.updateCartItem);

  return {
    mutateAsync: async ({
      cartItemId,
      quantity
    }: {
      cartItemId: string;
      quantity: number
    }) => {
      if (!user?._id) throw new Error('User not authenticated');
      return await updateCartItemMutation({
        userId: user._id as Id<'users'>,
        itemId: cartItemId,
        quantity,
      });
    },
  };
}

/**
 * Hook to remove item from cart
 */
export function useRemoveCartItem() {
  const { user } = useSession();
  const removeFromCartMutation = useMutation(api.mutations.orders.removeFromCart);

  return {
    mutateAsync: async (cartItemId: string) => {
      if (!user?._id) throw new Error('User not authenticated');
      return await removeFromCartMutation({
        userId: user._id as Id<'users'>,
        itemId: cartItemId,
      });
    },
  };
}

/**
 * Hook to clear entire cart
 */
export function useClearCart() {
  const { user } = useSession();
  const clearCartMutation = useMutation(api.mutations.orders.clearCart);

  return {
    mutateAsync: async () => {
      if (!user?._id) throw new Error('User not authenticated');
      return await clearCartMutation({
        userId: user._id as Id<'users'>,
      });
    },
  };
}

/**
 * Hook to get cart item count
 */
export function useCartItemCount() {
  const { data: cartData } = useCart();
  const cart = cartData?.cart;

  const itemCount = cart?.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;

  return itemCount;
}

/**
 * Hook to get cart total
 */
export function useCartTotal() {
  const { data: cartData } = useCart();
  const cart = cartData?.cart;

  const subtotal = cart?.items?.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
    0
  ) || 0;

  const deliveryFee = (cart?.delivery_fee || 900) / 100; // Default £9 in pence, convert to pounds
  const total = subtotal + deliveryFee;

  return {
    subtotal,
    deliveryFee,
    total,
  };
}

