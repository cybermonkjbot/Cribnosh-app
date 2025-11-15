import { useCallback, useState } from "react";
import { getConvexClient, getSessionToken } from "@/lib/convexClient";
import { api } from '@/convex/_generated/api';
import { useToast } from "@/lib/ToastContext";

export const useCart = () => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Get customer cart
   */
  const getCart = useCallback(async () => {
    try {
      setIsLoading(true);
      const convex = getConvexClient();
      const sessionToken = await getSessionToken();

      if (!sessionToken) {
        throw new Error("Not authenticated");
      }

      const result = await convex.action(api.actions.users.customerGetCart, {
        sessionToken,
      });

      if (result.success === false) {
        throw new Error(result.error || "Failed to get cart");
      }

      // Transform to match expected format: { data: { items: [...] } }
      return {
        success: true,
        data: {
          items: result.cart || [],
          cart: result.cart || [], // Also include cart for backward compatibility
        },
      };
    } catch (error: any) {
      const errorMessage =
        error?.message ||
        error?.data?.error?.message ||
        "Failed to get cart";
      showToast({
        type: "error",
        title: "Cart Error",
        message: errorMessage,
        duration: 4000,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  /**
   * Add item to cart
   */
  const addToCart = useCallback(
    async (dishId: string, quantity: number) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(api.actions.users.customerAddToCart, {
          sessionToken,
          dish_id: dishId,
          quantity,
        });

        if (result.success === false) {
          throw new Error(result.error || "Failed to add item to cart");
        }

        showToast({
          type: "success",
          title: "Added to Cart",
          message: `${result.item.name} added to cart`,
          duration: 2000,
        });

        return {
          success: true,
          data: {
            item: result.item,
          },
        };
      } catch (error: any) {
        const errorMessage =
          error?.message ||
          error?.data?.error?.message ||
          "Failed to add item to cart";
        showToast({
          type: "error",
          title: "Add to Cart Failed",
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
   * Update cart item quantity
   */
  const updateCartItem = useCallback(
    async (cartItemId: string, quantity: number) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(
          api.actions.users.customerUpdateCartItem,
          {
            sessionToken,
            cart_item_id: cartItemId,
            quantity,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to update cart item");
        }

        return {
          success: true,
          data: {
            item: result.item,
          },
        };
      } catch (error: any) {
        const errorMessage =
          error?.message ||
          error?.data?.error?.message ||
          "Failed to update cart item";
        showToast({
          type: "error",
          title: "Update Failed",
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
   * Remove item from cart
   */
  const removeFromCart = useCallback(
    async (cartItemId: string) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(
          api.actions.users.customerRemoveFromCart,
          {
            sessionToken,
            cart_item_id: cartItemId,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to remove item from cart");
        }

        showToast({
          type: "success",
          title: "Removed",
          message: "Item removed from cart",
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
          "Failed to remove item from cart";
        showToast({
          type: "error",
          title: "Remove Failed",
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
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
  };
};

