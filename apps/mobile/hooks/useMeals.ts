import { api } from '@/convex/_generated/api';
import { useToast } from "@/lib/ToastContext";
import { getConvexClient, getSessionToken } from "@/lib/convexClient";
import { useCallback, useState } from "react";

export const useMeals = () => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Get dish details
   */
  const getDishDetails = useCallback(
    async (dish_id: string) => {
      try { 
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        const result = await convex.action(
          api.actions.users.customerGetDishDetails,
          {
            sessionToken: sessionToken || undefined,
            dish_id,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to get dish details");
        }

        return {
          success: true,
          data: result.dish,
        };
      } catch (error: any) {
        // Handle network errors with deduplication
        const { isNetworkError, handleConvexError } = require("@/utils/networkErrorHandler");
        if (isNetworkError(error)) {
          handleConvexError(error);
          throw error;
        }

        const errorMessage =
          error?.message ||
          error?.data?.error?.message ||
          "Failed to get dish details";
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
   * Get dish favorite status
   */
  const getDishFavoriteStatus = useCallback(
    async (dish_id: string) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(
          api.actions.users.customerGetDishFavoriteStatus,
          {
            sessionToken,
            dish_id,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to get favorite status");
        }

        return {
          success: true,
          data: result,
        };
      } catch (error: any) {
        const errorMessage =
          error?.message ||
          error?.data?.error?.message ||
          "Failed to get favorite status";
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
   * Add dish to favorites
   */
  const addDishFavorite = useCallback(
    async (dish_id: string) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(
          api.actions.users.customerAddDishFavorite,
          {
            sessionToken,
            dish_id,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to add dish to favorites");
        }

        showToast({
          type: "success",
          title: "Success",
          message: "Dish added to favorites",
          duration: 3000,
        });

        return {
          success: true,
          data: result,
        };
      } catch (error: any) {
        const errorMessage =
          error?.message ||
          error?.data?.error?.message ||
          "Failed to add dish to favorites";
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
   * Remove dish from favorites
   */
  const removeDishFavorite = useCallback(
    async (dish_id: string) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(
          api.actions.users.customerRemoveDishFavorite,
          {
            sessionToken,
            dish_id,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to remove dish from favorites");
        }

        showToast({
          type: "success",
          title: "Success",
          message: "Dish removed from favorites",
          duration: 3000,
        });

        return {
          success: true,
          data: result,
        };
      } catch (error: any) {
        const errorMessage =
          error?.message ||
          error?.data?.error?.message ||
          "Failed to remove dish from favorites";
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
   * Toggle dish favorite
   */
  const toggleDishFavorite = useCallback(
    async (dish_id: string) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(
          api.actions.users.customerToggleDishFavorite,
          {
            sessionToken,
            dish_id,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to toggle favorite");
        }

        showToast({
          type: "success",
          title: "Success",
          message: result.is_favorite
            ? "Dish added to favorites"
            : "Dish removed from favorites",
          duration: 3000,
        });

        return {
          success: true,
          data: result,
        };
      } catch (error: any) {
        const errorMessage =
          error?.message ||
          error?.data?.error?.message ||
          "Failed to toggle favorite";
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
   * Get recommended meals
   */
  const getRecommendedMeals = useCallback(
    async (limit?: number, location?: { latitude: number; longitude: number } | null) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(
          api.actions.users.customerGetRecommendedMeals,
          {
            sessionToken,
            limit,
            latitude: location?.latitude,
            longitude: location?.longitude,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to get recommended meals");
        }

        return {
          success: true,
          data: {
            meals: result.meals || [],
          },
        };
      } catch (error: any) {
        const errorMessage =
          error?.message ||
          error?.data?.error?.message ||
          "Failed to get recommended meals";
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
   * Get random meals
   */
  const getRandomMeals = useCallback(
    async (limit?: number, location?: { latitude: number; longitude: number } | null) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        const result = await convex.action(
          api.actions.users.customerGetRandomMeals,
          {
            sessionToken: sessionToken || undefined,
            limit,
            latitude: location?.latitude,
            longitude: location?.longitude,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to get random meals");
        }

        return {
          success: true,
          data: {
            meals: result.meals || [],
            count: result.count || 0,
            limit: result.limit || limit || 20,
          },
        };
      } catch (error: any) {
        const errorMessage =
          error?.message ||
          error?.data?.error?.message ||
          "Failed to get random meals";
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
   * Get similar meals
   */
  const getSimilarMeals = useCallback(
    async (meal_id: string, limit?: number) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        const result = await convex.action(
          api.actions.users.customerGetSimilarMeals,
          {
            sessionToken: sessionToken || undefined,
            meal_id,
            limit,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to get similar meals");
        }

        return {
          success: true,
          data: {
            dishes: result.dishes || [],
            total: result.total || 0,
          },
        };
      } catch (error: any) {
        const errorMessage =
          error?.message ||
          error?.data?.error?.message ||
          "Failed to get similar meals";
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
   * Get kitchen meals
   */
  const getKitchenMeals = useCallback(
    async (data: {
      kitchen_id: string;
      limit?: number;
      offset?: number;
      category?: string;
      dietary?: string[];
    }) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(
          api.actions.users.customerGetKitchenMeals,
          {
            sessionToken,
            kitchen_id: data.kitchen_id,
            limit: data.limit,
            offset: data.offset,
            category: data.category,
            dietary: data.dietary,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to get kitchen meals");
        }

        return {
          success: true,
          data: {
            meals: result.meals || [],
          },
        };
      } catch (error: any) {
        const errorMessage =
          error?.message ||
          error?.data?.error?.message ||
          "Failed to get kitchen meals";
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
   * Get popular kitchen meals
   */
  const getPopularKitchenMeals = useCallback(
    async (kitchen_id: string, limit?: number) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(
          api.actions.users.customerGetPopularKitchenMeals,
          {
            sessionToken,
            kitchen_id,
            limit,
          }
        );

        if (result.success === false) {
          throw new Error(
            result.error || "Failed to get popular kitchen meals"
          );
        }

        return {
          success: true,
          data: {
            meals: result.meals || [],
          },
        };
      } catch (error: any) {
        const errorMessage =
          error?.message ||
          error?.data?.error?.message ||
          "Failed to get popular kitchen meals";
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
   * Search meals in kitchen
   */
  const searchKitchenMeals = useCallback(
    async (data: {
      kitchen_id: string;
      query: string;
      category?: string;
      dietary?: string[];
      limit?: number;
    }) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(
          api.actions.users.customerSearchKitchenMeals,
          {
            sessionToken,
            kitchen_id: data.kitchen_id,
            query: data.query,
            category: data.category,
            dietary: data.dietary,
            limit: data.limit,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to search kitchen meals");
        }

        return {
          success: true,
          data: {
            meals: result.meals || [],
          },
        };
      } catch (error: any) {
        const errorMessage =
          error?.message ||
          error?.data?.error?.message ||
          "Failed to search kitchen meals";
        showToast({
          type: "error",
          title: "Search Error",
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
   * Get takeaway items
   */
  const getTakeawayItems = useCallback(
    async (limit?: number, page?: number, location?: { latitude: number; longitude: number } | null) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(api.actions.users.customerGetTakeawayItems, {
          sessionToken,
          limit,
          page,
          latitude: location?.latitude,
          longitude: location?.longitude,
        });

        if (result.success === false) {
          throw new Error(result.error || "Failed to get takeaway items");
        }

        return {
          success: true,
          data: result.items || [],
          total: result.total || 0,
        };
      } catch (error: any) {
        const errorMessage =
          error?.message ||
          error?.data?.error?.message ||
          "Failed to get takeaway items";
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
   * Get top kebabs
   */
  const getTopKebabs = useCallback(
    async (limit?: number, page?: number) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(api.actions.users.customerGetTopKebabs, {
          sessionToken,
          limit,
          page,
        });

        if (result.success === false) {
          throw new Error(result.error || "Failed to get top kebabs");
        }

        return {
          success: true,
          data: result.items || [],
          total: result.total || 0,
        };
      } catch (error: any) {
        const errorMessage =
          error?.message ||
          error?.data?.error?.message ||
          "Failed to get top kebabs";
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
   * Get too fresh to waste items
   */
  const getTooFreshItems = useCallback(
    async (limit?: number, page?: number, location?: { latitude: number; longitude: number } | null) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(api.actions.users.customerGetTooFreshItems, {
          sessionToken,
          limit,
          page,
          latitude: location?.latitude,
          longitude: location?.longitude,
        });

        if (result.success === false) {
          throw new Error(result.error || "Failed to get too fresh items");
        }

        return {
          success: true,
          data: result.items || [],
          total: result.total || 0,
        };
      } catch (error: any) {
        const errorMessage =
          error?.message ||
          error?.data?.error?.message ||
          "Failed to get too fresh items";
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
    getDishDetails,
    getDishFavoriteStatus,
    addDishFavorite,
    removeDishFavorite,
    toggleDishFavorite,
    getRecommendedMeals,
    getRandomMeals,
    getSimilarMeals,
    getKitchenMeals,
    getPopularKitchenMeals,
    searchKitchenMeals,
    getTakeawayItems,
    getTopKebabs,
    getTooFreshItems,
  };
};
