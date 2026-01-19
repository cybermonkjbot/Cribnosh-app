import { useAuthContext } from "@/contexts/AuthContext";
import { api } from '@/convex/_generated/api';
import { getConvexClient } from "@/lib/convexClient";
import { useToast } from "@/lib/ToastContext";
import { useQuery } from "convex/react";
import { useCallback, useMemo, useState } from "react";

export const useCart = () => {
  const { showToast } = useToast();
  const { token, isAuthenticated } = useAuthContext();
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Reactive cart query
  const cartQuery = useQuery(
    api.queries.carts.getEnrichedCartBySessionToken,
    token ? { sessionToken: token } : "skip"
  );

  const cart = useMemo(() => cartQuery?.cart || [], [cartQuery]);
  const isCartLoading = cartQuery === undefined;

  /**
   * Get customer cart (imperative fallback for backward compatibility)
   */
  const getCart = useCallback(async () => {
    try {
      if (!token) return { success: false, error: "Not authenticated" };

      const convex = getConvexClient();
      const result = await convex.query(api.queries.carts.getEnrichedCartBySessionToken, {
        sessionToken: token,
      });

      return {
        success: true,
        data: {
          items: result?.cart || [],
          cart: result?.cart || [],
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, [token]);

  /**
   * Add item to cart
   */
  const addToCart = useCallback(
    async (dishId: string, quantity: number) => {
      try {
        setIsActionLoading(true);
        const convex = getConvexClient();

        if (!token) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(api.actions.users.customerAddToCart, {
          sessionToken: token,
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
        const errorMessage = error?.message || "Failed to add item to cart";
        showToast({
          type: "error",
          title: "Add to Cart Failed",
          message: errorMessage,
          duration: 4000,
        });
        throw error;
      } finally {
        setIsActionLoading(false);
      }
    },
    [showToast, token]
  );

  /**
   * Update cart item quantity
   */
  const updateCartItem = useCallback(
    async (cartItemId: string, quantity: number) => {
      try {
        setIsActionLoading(true);
        const convex = getConvexClient();

        if (!token) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(
          api.actions.users.customerUpdateCartItem,
          {
            sessionToken: token,
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
        const errorMessage = error?.message || "Failed to update cart item";
        showToast({
          type: "error",
          title: "Update Failed",
          message: errorMessage,
          duration: 4000,
        });
        throw error;
      } finally {
        setIsActionLoading(false);
      }
    },
    [showToast, token]
  );

  /**
   * Remove item from cart
   */
  const removeFromCart = useCallback(
    async (cartItemId: string, suppressToast: boolean = false) => {
      try {
        setIsActionLoading(true);
        const convex = getConvexClient();

        if (!token) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(
          api.actions.users.customerRemoveFromCart,
          {
            sessionToken: token,
            cart_item_id: cartItemId,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to remove item from cart");
        }

        if (!suppressToast) {
          showToast({
            type: "success",
            title: "Removed",
            message: "Item removed from cart",
            duration: 2000,
          });
        }

        return {
          success: true,
          message: result.message,
        };
      } catch (error: any) {
        const errorMessage = error?.message || "Failed to remove item from cart";
        showToast({
          type: "error",
          title: "Remove Failed",
          message: errorMessage,
          duration: 4000,
        });
        throw error;
      } finally {
        setIsActionLoading(false);
      }
    },
    [showToast, token]
  );

  /**
   * Add entire order to cart
   */
  const addOrderToCart = useCallback(
    async (orderId: string) => {
      try {
        setIsActionLoading(true);
        const convex = getConvexClient();

        if (!token) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(api.actions.users.customerAddOrderToCart, {
          sessionToken: token,
          order_id: orderId,
        });

        if (result.success === false) {
          throw new Error(result.error || "Failed to add order to cart");
        }

        showToast({
          type: "success",
          title: "Order Added to Cart",
          message: result.message,
          duration: 3000,
        });

        return {
          success: true,
          data: {
            items: result.items,
            message: result.message,
          },
        };
      } catch (error: any) {
        const errorMessage = error?.message || "Failed to add order to cart";
        showToast({
          type: "error",
          title: "Add Order Failed",
          message: errorMessage,
          duration: 4000,
        });
        throw error;
      } finally {
        setIsActionLoading(false);
      }
    },
    [showToast, token]
  );

  return {
    cart, // Reactive cart items
    isCartLoading, // Loading state for query
    isLoading: isActionLoading || isCartLoading, // Combined loading state
    isActionLoading,
    getCart,
    addToCart,
    addOrderToCart,
    updateCartItem,
    removeFromCart,
  };
};

