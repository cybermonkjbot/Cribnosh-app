import { useCallback, useState } from 'react';
import { useToast } from '@/lib/ToastContext';
import { getConvexClient, getSessionToken } from '@/lib/convexClient';
import { api } from '@/convex/_generated/api';

export const usePayments = () => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const getPaymentMethods = useCallback(
    async () => {
      try {
        setIsLoading(true);
        const sessionToken = await getSessionToken();
        if (!sessionToken) {
          showToast({
            type: 'error',
            title: 'Authentication Required',
            message: 'Please log in to view payment methods',
            duration: 3000,
          });
          return null;
        }

        const convex = getConvexClient();
        const result = await convex.action(api.actions.payments.customerGetPaymentMethods, {
          sessionToken,
        });

        if (!result.success) {
          showToast({
            type: 'error',
            title: 'Error',
            message: result.error || 'Failed to get payment methods',
            duration: 3000,
          });
          return null;
        }

        return result.paymentMethods;
      } catch (error: any) {
        const errorMessage = error?.message || 'Failed to get payment methods';
        showToast({
          type: 'error',
          title: 'Error',
          message: errorMessage,
          duration: 3000,
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  const addPaymentMethod = useCallback(
    async (data: {
      payment_method_id: string;
      type: 'card' | 'apple_pay' | 'google_pay';
      set_as_default?: boolean;
      last4?: string;
      brand?: string;
      exp_month?: number;
      exp_year?: number;
    }) => {
      try {
        setIsLoading(true);
        const sessionToken = await getSessionToken();
        if (!sessionToken) {
          showToast({
            type: 'error',
            title: 'Authentication Required',
            message: 'Please log in to add a payment method',
            duration: 3000,
          });
          return null;
        }

        const convex = getConvexClient();
        const result = await convex.action(api.actions.payments.customerAddPaymentMethod, {
          sessionToken,
          payment_method_id: data.payment_method_id,
          type: data.type,
          set_as_default: data.set_as_default,
          last4: data.last4,
          brand: data.brand,
          exp_month: data.exp_month,
          exp_year: data.exp_year,
        });

        if (!result.success) {
          showToast({
            type: 'error',
            title: 'Error',
            message: result.error || 'Failed to add payment method',
            duration: 3000,
          });
          return null;
        }

        showToast({
          type: 'success',
          title: 'Success',
          message: 'Payment method added successfully',
          duration: 3000,
        });
        return result.paymentMethod;
      } catch (error: any) {
        const errorMessage = error?.message || 'Failed to add payment method';
        showToast({
          type: 'error',
          title: 'Error',
          message: errorMessage,
          duration: 3000,
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  const setDefaultPaymentMethod = useCallback(
    async (paymentMethodId: string) => {
      try {
        setIsLoading(true);
        const sessionToken = await getSessionToken();
        if (!sessionToken) {
          showToast({
            type: 'error',
            title: 'Authentication Required',
            message: 'Please log in to update payment method',
            duration: 3000,
          });
          return false;
        }

        const convex = getConvexClient();
        const result = await convex.action(api.actions.payments.customerSetDefaultPaymentMethod, {
          sessionToken,
          payment_method_id: paymentMethodId,
        });

        if (!result.success) {
          showToast({
            type: 'error',
            title: 'Error',
            message: result.error || 'Failed to set default payment method',
            duration: 3000,
          });
          return false;
        }

        showToast({
          type: 'success',
          title: 'Success',
          message: 'Default payment method updated',
          duration: 3000,
        });
        return true;
      } catch (error: any) {
        const errorMessage = error?.message || 'Failed to set default payment method';
        showToast({
          type: 'error',
          title: 'Error',
          message: errorMessage,
          duration: 3000,
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  const createCheckout = useCallback(
    async () => {
      try {
        setIsLoading(true);
        const sessionToken = await getSessionToken();
        if (!sessionToken) {
          showToast({
            type: 'error',
            title: 'Authentication Required',
            message: 'Please log in to checkout',
            duration: 3000,
          });
          return null;
        }

        const convex = getConvexClient();
        const result = await convex.action(api.actions.payments.customerCreateCheckout, {
          sessionToken,
        });

        if (!result.success) {
          // If it's the Stripe error, show a more helpful message
          if (result.error?.includes('Next.js API endpoint')) {
            showToast({
              type: 'error',
              title: 'Checkout Unavailable',
              message: 'Checkout requires Stripe integration. Please use the web checkout.',
              duration: 4000,
            });
          } else {
            showToast({
              type: 'error',
              title: 'Error',
              message: result.error || 'Failed to create checkout',
              duration: 3000,
            });
          }
          return null;
        }

        return result.paymentIntent;
      } catch (error: any) {
        const errorMessage = error?.message || 'Failed to create checkout';
        showToast({
          type: 'error',
          title: 'Error',
          message: errorMessage,
          duration: 3000,
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  const getBalance = useCallback(
    async () => {
      try {
        setIsLoading(true);
        const sessionToken = await getSessionToken();
        if (!sessionToken) {
          showToast({
            type: 'error',
            title: 'Authentication Required',
            message: 'Please log in to view balance',
            duration: 3000,
          });
          return null;
        }

        const convex = getConvexClient();
        const result = await convex.action(api.actions.payments.customerGetBalance, {
          sessionToken,
        });

        if (!result.success) {
          showToast({
            type: 'error',
            title: 'Error',
            message: result.error || 'Failed to get balance',
            duration: 3000,
          });
          return null;
        }

        return result.balance;
      } catch (error: any) {
        const errorMessage = error?.message || 'Failed to get balance';
        showToast({
          type: 'error',
          title: 'Error',
          message: errorMessage,
          duration: 3000,
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  const getBalanceTransactions = useCallback(
    async (page?: number, limit?: number) => {
      try {
        setIsLoading(true);
        const sessionToken = await getSessionToken();
        if (!sessionToken) {
          showToast({
            type: 'error',
            title: 'Authentication Required',
            message: 'Please log in to view transactions',
            duration: 3000,
          });
          return null;
        }

        const convex = getConvexClient();
        const result = await convex.action(api.actions.payments.customerGetBalanceTransactions, {
          sessionToken,
          page,
          limit,
        });

        if (!result.success) {
          showToast({
            type: 'error',
            title: 'Error',
            message: result.error || 'Failed to get transactions',
            duration: 3000,
          });
          return null;
        }

        return result;
      } catch (error: any) {
        const errorMessage = error?.message || 'Failed to get transactions';
        showToast({
          type: 'error',
          title: 'Error',
          message: errorMessage,
          duration: 3000,
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  const topUpBalance = useCallback(
    async (amount: number, paymentMethodId?: string) => {
      try {
        setIsLoading(true);
        const sessionToken = await getSessionToken();
        if (!sessionToken) {
          showToast({
            type: 'error',
            title: 'Authentication Required',
            message: 'Please log in to top up balance',
            duration: 3000,
          });
          return null;
        }

        const convex = getConvexClient();
        const result = await convex.action(api.actions.payments.customerTopUpBalance, {
          sessionToken,
          amount,
          payment_method_id: paymentMethodId,
        });

        if (!result.success) {
          // If it's the Stripe error, show a more helpful message
          if (result.error?.includes('Next.js API endpoint')) {
            showToast({
              type: 'error',
              title: 'Top-up Unavailable',
              message: 'Top-up requires Stripe integration. Please use the web top-up.',
              duration: 4000,
            });
          } else {
            showToast({
              type: 'error',
              title: 'Error',
              message: result.error || 'Failed to top up balance',
              duration: 3000,
            });
          }
          return null;
        }

        showToast({
          type: 'success',
          title: 'Success',
          message: 'Top-up initiated successfully',
          duration: 3000,
        });
        return result.paymentIntent;
      } catch (error: any) {
        const errorMessage = error?.message || 'Failed to top up balance';
        showToast({
          type: 'error',
          title: 'Error',
          message: errorMessage,
          duration: 3000,
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  const createSetupIntent = useCallback(
    async () => {
      try {
        setIsLoading(true);
        const sessionToken = await getSessionToken();
        if (!sessionToken) {
          showToast({
            type: 'error',
            title: 'Authentication Required',
            message: 'Please log in to add a payment method',
            duration: 3000,
          });
          return null;
        }

        const convex = getConvexClient();
        const result = await convex.action(api.actions.payments.customerCreateSetupIntent, {
          sessionToken,
        });

        if (!result.success) {
          showToast({
            type: 'error',
            title: 'Error',
            message: result.error || 'Failed to create setup intent',
            duration: 3000,
          });
          return null;
        }

        return {
          success: true,
          data: {
            clientSecret: result.clientSecret,
            setupIntentId: result.setupIntentId,
          },
        };
      } catch (error: any) {
        const errorMessage = error?.message || 'Failed to create setup intent';
        showToast({
          type: 'error',
          title: 'Error',
          message: errorMessage,
          duration: 3000,
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  const removePaymentMethod = useCallback(
    async (paymentMethodId: string) => {
      try {
        setIsLoading(true);
        const sessionToken = await getSessionToken();
        if (!sessionToken) {
          showToast({
            type: 'error',
            title: 'Authentication Required',
            message: 'Please log in to remove a payment method',
            duration: 3000,
          });
          return false;
        }

        const convex = getConvexClient();
        const result = await convex.action(api.actions.payments.customerRemovePaymentMethod, {
          sessionToken,
          payment_method_id: paymentMethodId,
        });

        if (!result.success) {
          showToast({
            type: 'error',
            title: 'Error',
            message: result.error || 'Failed to remove payment method',
            duration: 3000,
          });
          return false;
        }

        showToast({
          type: 'success',
          title: 'Success',
          message: 'Payment method removed successfully',
          duration: 3000,
        });
        return true;
      } catch (error: any) {
        const errorMessage = error?.message || 'Failed to remove payment method';
        showToast({
          type: 'error',
          title: 'Error',
          message: errorMessage,
          duration: 3000,
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  return {
    getPaymentMethods,
    addPaymentMethod,
    setDefaultPaymentMethod,
    removePaymentMethod,
    createCheckout,
    getBalance,
    getBalanceTransactions,
    topUpBalance,
    createSetupIntent,
    isLoading,
  };
};

