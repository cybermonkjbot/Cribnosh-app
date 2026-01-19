import { api } from '@/convex/_generated/api';
import { useToast } from '@/lib/ToastContext';
import { getConvexClient, getSessionToken } from '@/lib/convexClient';
import { useCallback, useState } from 'react';

export const usePayments = () => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const getPaymentMethods = useCallback(
    async () => {
      try {
        setIsLoading(true);
        const sessionToken = await getSessionToken();
        if (!sessionToken) {
          showToast('Please log in to view payment methods', 'error');
          return null;
        }

        const convex = getConvexClient();
        const result = await convex.action(api.actions.payments.customerGetPaymentMethods, {
          sessionToken,
        });

        if (!result.success) {
          showToast(result.error || 'Failed to get payment methods', 'error');
          return null;
        }

        return result.paymentMethods;
      } catch (error: any) {
        const errorMessage = error?.message || 'Failed to get payment methods';
        showToast(errorMessage, 'error');
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
          showToast('Please log in to add a payment method', 'error');
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
          showToast(result.error || 'Failed to add payment method', 'error');
          return null;
        }

        showToast('Payment method added successfully', 'success');
        return result.paymentMethod;
      } catch (error: any) {
        const errorMessage = error?.message || 'Failed to add payment method';
        showToast(errorMessage, 'error');
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
          showToast('Please log in to update payment method', 'error');
          return false;
        }

        const convex = getConvexClient();
        const result = await convex.action(api.actions.payments.customerSetDefaultPaymentMethod, {
          sessionToken,
          payment_method_id: paymentMethodId,
        });

        if (!result.success) {
          showToast(result.error || 'Failed to set default payment method', 'error');
          return false;
        }

        showToast('Default payment method updated', 'success');
        return true;
      } catch (error: any) {
        const errorMessage = error?.message || 'Failed to set default payment method';
        showToast(errorMessage, 'error');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  const createCheckout = useCallback(
    async (data?: {
      delivery_address?: {
        street: string;
        city: string;
        postcode: string;
        country: string;
      };
      special_instructions?: string;
      nosh_points_applied?: number;
      gameDebtId?: string;
      payment_method?: string;
    }) => {
      try {
        setIsLoading(true);
        const sessionToken = await getSessionToken();
        if (!sessionToken) {
          showToast('Please log in to checkout', 'error');
          return null;
        }

        const convex = getConvexClient();
        const result = await convex.action(api.actions.payments.customerCreateCheckout, {
          sessionToken,
          delivery_address: data?.delivery_address,
          special_instructions: data?.special_instructions,
          nosh_points_applied: data?.nosh_points_applied,
          gameDebtId: data?.gameDebtId,
          payment_method: data?.payment_method,
        });

        if (!result.success) {
          // If it's the Stripe error, show a more helpful message
          if (result.error?.includes('Next.js API endpoint')) {
            showToast('Checkout requires Stripe integration. Please use the web checkout.', 'error');
          } else {
            showToast(result.error || 'Failed to create checkout', 'error');
          }
          return null;
        }

        return result.paymentIntent;
      } catch (error: any) {
        const errorMessage = error?.message || 'Failed to create checkout';
        showToast(errorMessage, 'error');
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
          showToast('Please log in to view balance', 'error');
          return null;
        }

        const convex = getConvexClient();
        const result = await convex.action(api.actions.payments.customerGetBalance, {
          sessionToken,
        });

        if (!result.success) {
          showToast(result.error || 'Failed to get balance', 'error');
          return null;
        }

        return result.balance;
      } catch (error: any) {
        const errorMessage = error?.message || 'Failed to get balance';
        showToast(errorMessage, 'error');
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
          showToast('Please log in to view transactions', 'error');
          return null;
        }

        const convex = getConvexClient();
        const result = await convex.action(api.actions.payments.customerGetBalanceTransactions, {
          sessionToken,
          page,
          limit,
        });

        if (!result.success) {
          showToast(result.error || 'Failed to get transactions', 'error');
          return null;
        }

        return result;
      } catch (error: any) {
        const errorMessage = error?.message || 'Failed to get transactions';
        showToast(errorMessage, 'error');
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
          showToast('Please log in to top up balance', 'error');
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
            showToast('Top-up requires Stripe integration. Please use the web top-up.', 'error');
          } else {
            showToast(result.error || 'Failed to top up balance', 'error');
          }
          return null;
        }

        showToast('Top-up initiated successfully', 'success');
        return result.paymentIntent;
      } catch (error: any) {
        const errorMessage = error?.message || 'Failed to top up balance';
        showToast(errorMessage, 'error');
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
          showToast('Please log in to add a payment method', 'error');
          return null;
        }

        const convex = getConvexClient();
        const result = await convex.action(api.actions.payments.customerCreateSetupIntent, {
          sessionToken,
        });

        if (!result.success) {
          showToast(result.error || 'Failed to create setup intent', 'error');
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
        showToast(errorMessage, 'error');
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
          showToast('Please log in to remove a payment method', 'error');
          return false;
        }

        const convex = getConvexClient();
        const result = await convex.action(api.actions.payments.customerRemovePaymentMethod, {
          sessionToken,
          payment_method_id: paymentMethodId,
        });

        if (!result.success) {
          showToast(result.error || 'Failed to remove payment method', 'error');
          return false;
        }

        showToast('Payment method removed successfully', 'success');
        return true;
      } catch (error: any) {
        const errorMessage = error?.message || 'Failed to remove payment method';
        showToast(errorMessage, 'error');
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

