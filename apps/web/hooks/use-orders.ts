import { api } from '@/convex/_generated/api';
import { useSession } from '@/lib/auth/use-session';
import { useQuery } from 'convex/react';

// Query keys (keep for compatibility if needed for manual cache invalidation, though Convex is reactive)
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
  const { sessionToken } = useSession();

  const order = useQuery(
    api.queries.orders.getById,
    orderId
      ? { order_id: orderId, sessionToken: sessionToken || undefined }
      : 'skip'
  );

  return {
    data: order,
    isLoading: orderId !== null && order === undefined,
    error: null,
  };
}

/**
 * Hook to get order status
 */
export function useOrderStatus(orderId: string | null) {
  const { sessionToken } = useSession();

  const order = useQuery(
    api.queries.orders.getById,
    orderId
      ? { order_id: orderId, sessionToken: sessionToken || undefined }
      : 'skip'
  );

  return {
    data: order,
    isLoading: orderId !== null && order === undefined,
    error: null,
  };
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
  const { user, sessionToken } = useSession();

  const orders = useQuery(
    api.queries.orders.listByCustomer,
    user?._id ? {
      customer_id: user._id,
      status: params?.status,
      order_type: params?.order_type,
      limit: params?.limit,
      offset: params?.offset,
      sessionToken: sessionToken || undefined,
    } : 'skip'
  );

  return {
    data: orders,
    isLoading: user === undefined || (!!user && orders === undefined),
    error: null,
  };
}

