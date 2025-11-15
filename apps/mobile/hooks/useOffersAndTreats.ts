import { useCallback, useState } from "react";
import { getConvexClient, getSessionToken } from "@/lib/convexClient";
import { api } from '@/convex/_generated/api';
import { useToast } from "@/lib/ToastContext";

export const useOffersAndTreats = () => {
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
            target,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to get active offers");
        }

        return {
          success: true,
          data: {
            offers: result.offers,
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
    async (type?: "given" | "received" | "all") => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(api.actions.users.customerGetTreats, {
          sessionToken,
          type,
        });

        if (result.success === false) {
          throw new Error(result.error || "Failed to get treats");
        }

        return {
          success: true,
          data: {
            treats: result.treats,
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
   * Create treat
   */
  const createTreat = useCallback(
    async (data: {
      treated_user_id?: string;
      order_id?: string;
      expires_in_hours?: number;
      metadata?: any;
    }) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(api.actions.users.customerCreateTreat, {
          sessionToken,
          treated_user_id: data.treated_user_id,
          order_id: data.order_id,
          expires_in_hours: data.expires_in_hours,
          metadata: data.metadata,
        });

        if (result.success === false) {
          throw new Error(result.error || "Failed to create treat");
        }

        showToast({
          type: "success",
          title: "Success",
          message: "Treat created successfully",
          duration: 3000,
        });

        return {
          success: true,
          data: {
            treat_id: result.treat_id,
            treat_token: result.treat_token,
            expires_at: result.expires_at,
          },
        };
      } catch (error: any) {
        const errorMessage =
          error?.message ||
          error?.data?.error?.message ||
          "Failed to create treat";
        showToast({
          type: "error",
          title: "Create Failed",
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
   * Get treat by token
   */
  const getTreatByToken = useCallback(
    async (treat_token: string) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(
          api.actions.users.customerGetTreatByToken,
          {
            sessionToken,
            treat_token,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to get treat");
        }

        return {
          success: true,
          data: {
            treat: result.treat,
          },
        };
      } catch (error: any) {
        const errorMessage =
          error?.message || error?.data?.error?.message || "Failed to get treat";
        showToast({
          type: "error",
          title: "Treat Error",
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
   * Claim a special offer
   */
  const claimOffer = useCallback(
    async (offer_id: string) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(api.actions.specialOffers.claimOffer, {
          sessionToken,
          offer_id,
        });

        if (result.success === false) {
          throw new Error(result.error || "Failed to claim offer");
        }

        return {
          success: true,
          data: {
            claimed_offer_id: result.claimed_offer_id,
          },
        };
      } catch (error: any) {
        const errorMessage =
          error?.message ||
          error?.data?.error?.message ||
          "Failed to claim offer";
        showToast({
          type: "error",
          title: "Claim Failed",
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
    createTreat,
    getTreatByToken,
    claimOffer,
  };
};

