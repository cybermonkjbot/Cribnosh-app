import { useCallback, useState } from "react";
import { getConvexClient, getSessionToken } from "@/lib/convexClient";
import { api } from '@/convex/_generated/api';
import { useToast } from "@/lib/ToastContext";

export const useSides = () => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Get available sides for cart items
   */
  const getSidesForCart = useCallback(async () => {
    try {
      setIsLoading(true);
      const convex = getConvexClient();
      const sessionToken = await getSessionToken();

      if (!sessionToken) {
        throw new Error("Not authenticated");
      }

      const result = await convex.action(api.actions.users.customerGetSidesForCart, {
        sessionToken,
      });

      if (result.success === false) {
        throw new Error(result.error || "Failed to get sides");
      }

      return {
        success: true,
        data: result.sides,
      };
    } catch (error: any) {
      const errorMessage =
        error?.message ||
        error?.data?.error?.message ||
        "Failed to get sides";
      showToast({
        type: "error",
        title: "Error",
        message: errorMessage,
        duration: 4000,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  /**
   * Add side to cart item
   */
  const addSideToCartItem = useCallback(
    async (cartItemId: string, sideId: string, quantity: number) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(api.actions.users.customerAddSideToCartItem, {
          sessionToken,
          cart_item_id: cartItemId,
          side_id: sideId,
          quantity,
        });

        if (result.success === false) {
          throw new Error(result.error || "Failed to add side");
        }

        showToast({
          type: "success",
          title: "Added",
          message: "Side added to cart",
          duration: 2000,
        });

        return {
          success: true,
          message: result.message,
        };
      } catch (error: any) {
        const errorMessage =
          error?.message ||
          error?.data?.error?.message ||
          "Failed to add side";
        showToast({
          type: "error",
          title: "Error",
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
   * Update side quantity in cart item
   */
  const updateSideQuantity = useCallback(
    async (cartItemId: string, sideId: string, quantity: number) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(api.actions.users.customerUpdateSideQuantity, {
          sessionToken,
          cart_item_id: cartItemId,
          side_id: sideId,
          quantity,
        });

        if (result.success === false) {
          throw new Error(result.error || "Failed to update side quantity");
        }

        return {
          success: true,
          message: result.message,
        };
      } catch (error: any) {
        const errorMessage =
          error?.message ||
          error?.data?.error?.message ||
          "Failed to update side quantity";
        showToast({
          type: "error",
          title: "Error",
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
   * Remove side from cart item
   */
  const removeSideFromCartItem = useCallback(
    async (cartItemId: string, sideId: string) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(api.actions.users.customerRemoveSideFromCartItem, {
          sessionToken,
          cart_item_id: cartItemId,
          side_id: sideId,
        });

        if (result.success === false) {
          throw new Error(result.error || "Failed to remove side");
        }

        showToast({
          type: "success",
          title: "Removed",
          message: "Side removed from cart",
          duration: 2000,
        });

        return {
          success: true,
          message: result.message,
        };
      } catch (error: any) {
        const errorMessage =
          error?.message ||
          error?.data?.error?.message ||
          "Failed to remove side";
        showToast({
          type: "error",
          title: "Error",
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
    getSidesForCart,
    addSideToCartItem,
    updateSideQuantity,
    removeSideFromCartItem,
  };
};

