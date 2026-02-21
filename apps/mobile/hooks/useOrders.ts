import { useAuthContext } from '@/contexts/AuthContext';
import { api } from '@/convex/_generated/api';
import { useToast } from '@/lib/ToastContext';
import { getConvexClient } from '@/lib/convexClient';
import { useQuery } from 'convex/react';
import { useCallback, useMemo, useState } from 'react';

export const useOrders = (params?: {
  status?: 'ongoing' | 'past' | 'all';
  order_type?: 'individual' | 'group' | 'all';
  limit?: number;
  page?: number;
}) => {
  const { showToast } = useToast();
  const { token, isAuthenticated } = useAuthContext();
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Reactive orders query
  const ordersQuery = useQuery(
    api.queries.orders.getEnrichedOrdersBySessionToken,
    token ? {
      sessionToken: token,
      status: params?.status || 'all',
      order_type: params?.order_type || 'all',
      limit: params?.limit || 20,
      page: params?.page || 1,
    } : "skip"
  );

  const orders = useMemo(() => ordersQuery?.orders || [], [ordersQuery]);
  const totalOrders = ordersQuery?.total || 0;
  const isOrdersLoading = ordersQuery === undefined;

  const getOrders = useCallback(
    async (overrideParams?: typeof params) => {
      try {
        if (!token) return { success: false, error: 'Not authenticated' };

        const convex = getConvexClient();
        const result = await convex.query(api.queries.orders.getEnrichedOrdersBySessionToken, {
          sessionToken: token,
          status: overrideParams?.status || params?.status || 'all',
          order_type: overrideParams?.order_type || params?.order_type || 'all',
          limit: overrideParams?.limit || params?.limit || 20,
          page: overrideParams?.page || params?.page || 1,
        });

        return result;
      } catch (error: any) {
        const errorMessage = error?.message || 'Failed to get orders';
        showToast(errorMessage, 'error');
        return null;
      }
    },
    [token, params, showToast]
  );

  const getOrder = useCallback(
    async (orderId: string) => {
      try {
        if (!token) return null;
        const convex = getConvexClient();
        const result = await convex.query(api.queries.orders.getEnrichedOrderBySessionToken, {
          sessionToken: token,
          order_id: orderId,
        });
        return result;
      } catch (error: any) {
        const errorMessage = error?.message || 'Failed to get order';
        showToast(errorMessage, 'error');
        return null;
      }
    },
    [token, showToast]
  );

  const getOrderStatus = useCallback(
    async (orderId: string) => {
      return getOrder(orderId);
    },
    [getOrder]
  );

  const createOrder = useCallback(
    async (data: {
      foodCreatorId: string;
      order_items: Array<{ dish_id: string; quantity: number }>;
      special_instructions?: string;
      delivery_time?: string;
      delivery_address?: {
        street: string;
        city: string;
        postcode: string;
        country: string;
        coordinates?: number[];
      };
      payment_method?: string;
    }) => {
      try {
        setIsActionLoading(true);
        if (!token) {
          showToast('Please log in to create an order', 'error');
          return null;
        }

        const convex = getConvexClient();
        const result = await convex.action(api.actions.orders.customerCreateOrder, {
          sessionToken: token,
          foodCreatorId: data.foodCreatorId,
          order_items: data.order_items,
          special_instructions: data.special_instructions,
          delivery_time: data.delivery_time,
          delivery_address: data.delivery_address,
          payment_method: data.payment_method,
        });

        if (!result.success) {
          showToast(result.error || 'Failed to create order', 'error');
          return null;
        }

        showToast('Order created successfully', 'success');
        return result.order;
      } catch (error: any) {
        const errorMessage = error?.message || 'Failed to create order';
        showToast(errorMessage, 'error');
        return null;
      } finally {
        setIsActionLoading(false);
      }
    },
    [showToast, token]
  );

  const createOrderFromCart = useCallback(
    async (data: {
      payment_intent_id?: string;
      delivery_address?: {
        street: string;
        city: string;
        postcode: string;
        country: string;
        coordinates?: number[];
      };
      special_instructions?: string;
      delivery_time?: string;
      nosh_points_applied?: number;
      payment_method?: string;
      gameDebtId?: string;
    }) => {
      try {
        setIsActionLoading(true);
        if (!token) {
          const errorMsg = 'Please log in to create an order';
          showToast(errorMsg, 'error');
          throw new Error(errorMsg);
        }

        const convex = getConvexClient();
        const result = await convex.action(api.actions.orders.customerCreateOrderFromCart, {
          sessionToken: token,
          payment_intent_id: data.payment_intent_id,
          delivery_address: data.delivery_address,
          special_instructions: data.special_instructions,
          delivery_time: data.delivery_time,
          nosh_points_applied: data.nosh_points_applied,
          payment_method: data.payment_method,
          gameDebtId: data.gameDebtId,
        });

        if (!result.success) {
          const errorMsg = result.error || 'Failed to create order from cart';
          showToast(errorMsg, 'error');
          throw new Error(errorMsg);
        }

        showToast('Order created successfully', 'success');
        return result;
      } catch (error: any) {
        const errorMessage = error?.message || 'Failed to create order from cart';
        const isExpectedError = errorMessage === 'Please log in to create an order' ||
          errorMessage.includes('Failed to create order from cart') ||
          errorMessage.includes('Oops, We do not serve this region') ||
          errorMessage.includes('Cart is empty') ||
          errorMessage.includes('Authentication required') ||
          errorMessage.includes('Access denied');

        if (!isExpectedError) {
          showToast(errorMessage, 'error');
        }
        throw error;
      } finally {
        setIsActionLoading(false);
      }
    },
    [showToast, token]
  );

  const cancelOrder = useCallback(
    async (orderId: string, reason?: string, refundPreference?: 'full_refund' | 'partial_refund' | 'credit') => {
      try {
        setIsActionLoading(true);
        if (!token) {
          showToast('Please log in to cancel an order', 'error');
          return false;
        }

        const convex = getConvexClient();
        const result = await convex.action(api.actions.orders.customerCancelOrder, {
          sessionToken: token,
          order_id: orderId,
          reason,
          refund_preference: refundPreference,
        });

        if (!result.success) {
          showToast(result.error || 'Failed to cancel order', 'error');
          return false;
        }

        showToast('Order cancelled successfully', 'success');
        return true;
      } catch (error: any) {
        const errorMessage = error?.message || 'Failed to cancel order';
        showToast(errorMessage, 'error');
        return false;
      } finally {
        setIsActionLoading(false);
      }
    },
    [showToast, token]
  );

  const rateOrder = useCallback(
    async (data: {
      order_id: string;
      rating: number;
      review?: string;
      categories?: {
        food_quality?: number;
        delivery_speed?: number;
        packaging?: number;
        customer_service?: number;
      };
    }) => {
      try {
        setIsActionLoading(true);
        if (!token) {
          showToast('Please log in to rate an order', 'error');
          return null;
        }

        const convex = getConvexClient();
        const result = await convex.action(api.actions.orders.customerRateOrder, {
          sessionToken: token,
          order_id: data.order_id,
          rating: data.rating,
          review: data.review,
          categories: data.categories,
        });

        if (!result.success) {
          showToast(result.error || 'Failed to submit rating', 'error');
          return null;
        }

        showToast('Thank you for your rating! You earned 15 NOSH Points', 'success');
        return result;
      } catch (error: any) {
        const errorMessage = error?.message || 'Failed to submit rating';
        showToast(errorMessage, 'error');
        return null;
      } finally {
        setIsActionLoading(false);
      }
    },
    [showToast, token]
  );

  const getRecentDishes = useCallback(
    async (limit?: number) => {
      try {
        if (!token) return null;
        const convex = getConvexClient();
        const result = await convex.action(api.actions.orders.customerGetRecentDishes, {
          sessionToken: token,
          limit,
        });
        return result;
      } catch (error: any) {
        return null;
      }
    },
    [token]
  );

  const getUsualDinnerItems = useCallback(
    async (limit?: number, timeRange?: 'week' | 'month' | 'all') => {
      try {
        if (!token) return null;
        const convex = getConvexClient();
        const result = await convex.action(api.actions.orders.customerGetUsualDinnerItems, {
          sessionToken: token,
          limit,
          time_range: timeRange,
        });
        return result;
      } catch (error: any) {
        return null;
      }
    },
    [token]
  );

  return {
    orders,
    totalOrders,
    isOrdersLoading,
    getOrders,
    getOrder,
    getOrderStatus,
    createOrder,
    createOrderFromCart,
    cancelOrder,
    rateOrder,
    getRecentDishes,
    getUsualDinnerItems,
    isLoading: isActionLoading || isOrdersLoading,
    isActionLoading,
  };
};

