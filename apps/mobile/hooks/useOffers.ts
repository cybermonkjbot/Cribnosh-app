import { useCallback, useState } from "react";
import { getConvexClient, getSessionToken } from "@/lib/convexClient";
import { api } from '@/convex/_generated/api';
import { useToast } from "@/lib/ToastContext";

export const useOffers = () => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Get active offers
   */
  const getActiveOffers = useCallback(
    async (target?: "all" | "new_users" | "existing_users" | "group_orders") => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(
          api.actions.users.customerGetActiveOffers,
          {
            sessionToken,
            target: target || "all",
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to get active offers");
        }

        return {
          success: true,
          data: {
            offers: result.offers || [],
          },
        };
      } catch (error: any) {
        const errorMessage =
          error?.message ||
          error?.data?.error?.message ||
          "Failed to get active offers";
        showToast({
          type: "error",
          title: "Offers Error",
          message: errorMessage,
          duration: 4000,
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  /**
   * Get treats
   */
  const getTreats = useCallback(
    async (type?: "all" | "available" | "used" | "expired") => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(api.actions.users.customerGetTreats, {
          sessionToken,
          type: type || "all",
        });

        if (result.success === false) {
          throw new Error(result.error || "Failed to get treats");
        }

        return {
          success: true,
          data: {
            treats: result.treats || [],
          },
        };
      } catch (error: any) {
        const errorMessage =
          error?.message || error?.data?.error?.message || "Failed to get treats";
        showToast({
          type: "error",
          title: "Treats Error",
          message: errorMessage,
          duration: 4000,
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  /**
   * Get treat details by token
   */
  const getTreatDetails = useCallback(
    async (treat_token: string) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(
          api.actions.users.customerGetTreatDetails,
          {
            sessionToken,
            treat_token,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to get treat details");
        }

        return {
          success: true,
          data: result.treat,
        };
      } catch (error: any) {
        const errorMessage =
          error?.message ||
          error?.data?.error?.message ||
          "Failed to get treat details";
        showToast({
          type: "error",
          title: "Treats Error",
          message: errorMessage,
          duration: 4000,
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  return {
    isLoading,
    getActiveOffers,
    getTreats,
    getTreatDetails,
  };
};

