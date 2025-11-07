/**
 * Orders Hook
 * React Query hook for managing order operations
 */

import { useQuery } from '@tanstack/react-query';
import * as ordersAPI from '@/lib/api/orders';

// Query keys
export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (params?: { limit?: number; offset?: number; status?: string; order_type?: string }) => 
    [...orderKeys.lists(), params] as const,
  order: (orderId: string) => [...orderKeys.all, orderId] as const,
  status: (orderId: string) => [...orderKeys.all, orderId, 'status'] as const,
};

/**
 * Hook to get order details
 */
export function useOrder(orderId: string | null) {
  return useQuery({
    queryKey: orderKeys.order(orderId || ''),
    queryFn: async () => {
      if (!orderId) throw new Error('Order ID is required');
      const response = await ordersAPI.getOrder(orderId);
      return response.data;
    },
    enabled: !!orderId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get order status
 */
export function useOrderStatus(orderId: string | null) {
  return useQuery({
    queryKey: orderKeys.status(orderId || ''),
    queryFn: async () => {
      if (!orderId) throw new Error('Order ID is required');
      const response = await ordersAPI.getOrderStatus(orderId);
      return response.data?.order;
    },
    enabled: !!orderId,
    staleTime: 10 * 1000, // 10 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for real-time updates
  });
}

/**
 * Hook to get orders list
 */
export function useOrdersList(params?: {
  limit?: number;
  offset?: number;
  status?: 'ongoing' | 'past' | 'all';
  order_type?: 'individual' | 'group' | 'all';
}) {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: async () => {
      const response = await ordersAPI.getOrdersList(params);
      return response.data;
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

