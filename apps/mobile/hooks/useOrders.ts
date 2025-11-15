import { useCallback, useState } from 'react';
import { useToast } from '@/lib/ToastContext';
import { getConvexClient, getSessionToken } from '@/lib/convexClient';
import { api } from '@/convex/_generated/api';

export const useOrders = () => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const getOrders = useCallback(
    async (params?: {
      page?: number;
      limit?: number;
      status?: 'ongoing' | 'past' | 'all';
      order_type?: 'individual' | 'group' | 'all';
    }) => {
      try {
        setIsLoading(true);
        const sessionToken = await getSessionToken();
        if (!sessionToken) {
          showToast('Please log in to view your orders', 'error');
          return null;
        }

        const convex = getConvexClient();
        const result = await convex.action(api.actions.orders.customerGetOrders, {
          sessionToken,
          page: params?.page,
          limit: params?.limit,
          status: params?.status || 'all',
          order_type: params?.order_type || 'all',
        });

        if (!result.success) {
          showToast(result.error || 'Failed to get orders', 'error');
          return null;
        }

        return result;
      } catch (error: any) {
        const errorMessage = error?.message || 'Failed to get orders';
        showToast(errorMessage, 'error');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  const getOrder = useCallback(
    async (orderId: string) => {
      try {
        setIsLoading(true);
        const sessionToken = await getSessionToken();
        if (!sessionToken) {
          showToast('Please log in to view order details', 'error');
          return null;
        }

        const convex = getConvexClient();
        const result = await convex.action(api.actions.orders.customerGetOrder, {
          sessionToken,
          order_id: orderId,
        });

        if (!result.success) {
          showToast(result.error || 'Failed to get order', 'error');
          return null;
        }

        return result.order;
      } catch (error: any) {
        const errorMessage = error?.message || 'Failed to get order';
        showToast(errorMessage, 'error');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  const getOrderStatus = useCallback(
    async (orderId: string) => {
      try {
        setIsLoading(true);
        const sessionToken = await getSessionToken();
        if (!sessionToken) {
          showToast('Please log in to view order status', 'error');
          return null;
        }

        const convex = getConvexClient();
        const result = await convex.action(api.actions.orders.customerGetOrderStatus, {
          sessionToken,
          order_id: orderId,
        });

        if (!result.success) {
          showToast(result.error || 'Failed to get order status', 'error');
          return null;
        }

        return result.order;
      } catch (error: any) {
        const errorMessage = error?.message || 'Failed to get order status';
        showToast(errorMessage, 'error');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  const createOrder = useCallback(
    async (data: {
      chef_id: string;
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
        setIsLoading(true);
        const sessionToken = await getSessionToken();
        if (!sessionToken) {
          showToast('Please log in to create an order', 'error');
          return null;
        }

        const convex = getConvexClient();
        const result = await convex.action(api.actions.orders.customerCreateOrder, {
          sessionToken,
          chef_id: data.chef_id,
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
        setIsLoading(false);
      }
    },
    [showToast]
  );

  const createOrderFromCart = useCallback(
    async (data: {
      payment_intent_id: string;
      delivery_address?: {
        street: string;
        city: string;
        postcode: string;
        country: string;
        coordinates?: number[];
      };
      special_instructions?: string;
      delivery_time?: string;
      nosh_points_applied?: number; // Nosh Points applied for discount
    }) => {
      try {
        setIsLoading(true);
        const sessionToken = await getSessionToken();
        if (!sessionToken) {
          const errorMsg = 'Please log in to create an order';
          showToast(errorMsg, 'error');
          throw new Error(errorMsg);
        }

        const convex = getConvexClient();
        const result = await convex.action(api.actions.orders.customerCreateOrderFromCart, {
          sessionToken,
          payment_intent_id: data.payment_intent_id,
          delivery_address: data.delivery_address,
          special_instructions: data.special_instructions,
          delivery_time: data.delivery_time,
          nosh_points_applied: data.nosh_points_applied,
        });

        if (!result.success) {
          const errorMsg = result.error || 'Failed to create order from cart';
          showToast(errorMsg, 'error');
          throw new Error(errorMsg);
        }

        showToast('Order created successfully', 'success');
        return result;
      } catch (error: any) {
        // If we threw this error ourselves, toast was already shown
        // For unexpected errors (network, etc.), show toast
        const errorMessage = error?.message || 'Failed to create order from cart';
        // Only show toast if this is an unexpected error (not one we threw)
        const isExpectedError = errorMessage === 'Please log in to create an order' ||
                                errorMessage.includes('Failed to create order from cart') ||
                                errorMessage.includes('Oops, We do not serve this region') ||
                                errorMessage.includes('Cart is empty') ||
                                errorMessage.includes('Authentication required') ||
                                errorMessage.includes('Access denied');
        
        if (!isExpectedError) {
          showToast(errorMessage, 'error');
        }
        throw error; // Re-throw so caller can handle it
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  const cancelOrder = useCallback(
    async (orderId: string, reason?: string, refundPreference?: 'full_refund' | 'partial_refund' | 'credit') => {
      try {
        setIsLoading(true);
        const sessionToken = await getSessionToken();
        if (!sessionToken) {
          showToast('Please log in to cancel an order', 'error');
          return false;
        }

        const convex = getConvexClient();
        const result = await convex.action(api.actions.orders.customerCancelOrder, {
          sessionToken,
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
        setIsLoading(false);
      }
    },
    [showToast]
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
        setIsLoading(true);
        const sessionToken = await getSessionToken();
        if (!sessionToken) {
          showToast('Please log in to rate an order', 'error');
          return null;
        }

        const convex = getConvexClient();
        const result = await convex.action(api.actions.orders.customerRateOrder, {
          sessionToken,
          order_id: data.order_id,
          rating: data.rating,
          review: data.review,
          categories: data.categories,
        });

        if (!result.success) {
          showToast(result.error || 'Failed to submit rating', 'error');
          return null;
        }

        showToast('Thank you for your rating!', 'success');
        return result;
      } catch (error: any) {
        const errorMessage = error?.message || 'Failed to submit rating';
        showToast(errorMessage, 'error');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  const getRecentDishes = useCallback(
    async (limit?: number) => {
      try {
        setIsLoading(true);
        const sessionToken = await getSessionToken();
        if (!sessionToken) {
          showToast('Please log in to view recent dishes', 'error');
          return null;
        }

        const convex = getConvexClient();
        const result = await convex.action(api.actions.orders.customerGetRecentDishes, {
          sessionToken,
          limit,
        });

        if (!result.success) {
          showToast(result.error || 'Failed to get recent dishes', 'error');
          return null;
        }

        return result;
      } catch (error: any) {
        const errorMessage = error?.message || 'Failed to get recent dishes';
        showToast(errorMessage, 'error');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  const getUsualDinnerItems = useCallback(
    async (limit?: number, timeRange?: 'week' | 'month' | 'all') => {
      try {
        setIsLoading(true);
        const sessionToken = await getSessionToken();
        if (!sessionToken) {
          showToast('Please log in to view usual dinner items', 'error');
          return null;
        }

        const convex = getConvexClient();
        const result = await convex.action(api.actions.orders.customerGetUsualDinnerItems, {
          sessionToken,
          limit,
          time_range: timeRange,
        });

        if (!result.success) {
          showToast(result.error || 'Failed to get usual dinner items', 'error');
          return null;
        }

        return result;
      } catch (error: any) {
        const errorMessage = error?.message || 'Failed to get usual dinner items';
        showToast(errorMessage, 'error');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  return {
    getOrders,
    getOrder,
    getOrderStatus,
    createOrder,
    createOrderFromCart,
    cancelOrder,
    rateOrder,
    getRecentDishes,
    getUsualDinnerItems,
    isLoading,
  };
};

