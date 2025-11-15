import { useCallback, useState } from 'react';
import { getConvexClient, getSessionToken } from '@/lib/convexClient';
import { api } from '@/convex/_generated/api';
import { useToast } from '@/lib/ToastContext';

export const useCuisines = () => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Get cuisines list
   */
  const getCuisines = useCallback(
    async (page?: number, limit?: number) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          showToast('Please log in to view cuisines', 'error');
          return { success: false, data: [] };
        }

        const result = await convex.action(api.actions.users.customerGetCuisines, {
          sessionToken,
          page,
          limit,
        });

        if (!result.success) {
          showToast(result.error || 'Failed to get cuisines', 'error');
          return { success: false, data: [] };
        }

        return {
          success: true,
          data: result.cuisines || [],
        };
      } catch (error: any) {
        const errorMessage = error?.message || 'Failed to get cuisines';
        showToast(errorMessage, 'error');
        return { success: false, data: [] };
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  return {
    isLoading,
    getCuisines,
  };
};
