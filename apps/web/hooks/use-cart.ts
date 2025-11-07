/**
 * Cart Hook
 * React Query hook for managing cart state and operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as cartAPI from '@/lib/api/cart';

// Query keys
export const cartKeys = {
  all: ['cart'] as const,
  cart: () => [...cartKeys.all, 'items'] as const,
};

/**
 * Hook to get cart data
 */
export function useCart() {
  return useQuery({
    queryKey: cartKeys.cart(),
    queryFn: async () => {
      const response = await cartAPI.getCart();
      return response.data?.cart || { items: [] };
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to add item to cart
 */
export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ dishId, quantity }: { dishId: string; quantity: number }) => {
      return await cartAPI.addToCart(dishId, quantity);
    },
    onSuccess: () => {
      // Invalidate cart query to refetch
      queryClient.invalidateQueries({ queryKey: cartKeys.cart() });
    },
  });
}

/**
 * Hook to update cart item quantity
 */
export function useUpdateCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      cartItemId, 
      quantity 
    }: { 
      cartItemId: string; 
      quantity: number 
    }) => {
      return await cartAPI.updateCartItem(cartItemId, quantity);
    },
    onSuccess: () => {
      // Invalidate cart query to refetch
      queryClient.invalidateQueries({ queryKey: cartKeys.cart() });
    },
  });
}

/**
 * Hook to remove item from cart
 */
export function useRemoveCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cartItemId: string) => {
      return await cartAPI.removeCartItem(cartItemId);
    },
    onSuccess: () => {
      // Invalidate cart query to refetch
      queryClient.invalidateQueries({ queryKey: cartKeys.cart() });
    },
  });
}

/**
 * Hook to clear entire cart
 */
export function useClearCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return await cartAPI.clearCart();
    },
    onSuccess: () => {
      // Invalidate cart query to refetch
      queryClient.invalidateQueries({ queryKey: cartKeys.cart() });
    },
  });
}

/**
 * Hook to get cart item count
 */
export function useCartItemCount() {
  const { data: cart } = useCart();
  
  const itemCount = cart?.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
  
  return itemCount;
}

/**
 * Hook to get cart total
 */
export function useCartTotal() {
  const { data: cart } = useCart();
  
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

