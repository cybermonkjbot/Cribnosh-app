import { useCallback, useState } from "react";
import { getConvexClient, getSessionToken } from "@/lib/convexClient";
import { api } from '@/convex/_generated/api';
import { useToast } from "@/lib/ToastContext";

export const useSearch = () => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * General search across dishes, chefs, kitchens
   */
  const search = useCallback(
    async (data: {
      query: string;
      location?: { latitude: number; longitude: number };
      filters?: {
        cuisine?: string;
        priceRange?: { min?: number; max?: number };
        dietary?: string[];
      };
      limit?: number;
    }) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        const result = await convex.action(api.actions.users.customerSearch, {
          sessionToken: sessionToken || undefined,
          query: data.query,
          location: data.location,
          filters: data.filters,
          limit: data.limit,
        });

        if (result.success === false) {
          throw new Error(result.error || "Failed to search");
        }

        return {
          success: true,
          data: result.results,
        };
      } catch (error: any) {
        const errorMessage =
          error?.message || error?.data?.error?.message || "Failed to search";
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
   * Search chefs (already exists in useChefs, but keeping for API compatibility)
   */
  const searchChefs = useCallback(
    async (data: {
      query: string;
      location?: { latitude: number; longitude: number };
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
          api.actions.users.customerSearchChefs,
          {
            sessionToken,
            query: data.query,
            location: data.location,
            limit: data.limit,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to search chefs");
        }

        return {
          success: true,
          data: {
            chefs: result.chefs || [],
          },
        };
      } catch (error: any) {
        const errorMessage =
          error?.message ||
          error?.data?.error?.message ||
          "Failed to search chefs";
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
   * Get search suggestions/autocomplete
   */
  const getSearchSuggestions = useCallback(
    async (data: {
      query: string;
      location?: string;
      limit?: number;
      category?: string;
    }) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        const result = await convex.action(
          api.actions.users.customerGetSearchSuggestions,
          {
            sessionToken: sessionToken || undefined,
            query: data.query,
            location: data.location,
            limit: data.limit,
            category: data.category,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to get search suggestions");
        }

        return {
          success: true,
          data: {
            suggestions: result.suggestions || [],
            metadata: result.metadata,
          },
        };
      } catch (error: any) {
        const errorMessage =
          error?.message ||
          error?.data?.error?.message ||
          "Failed to get search suggestions";
        // Don't show toast for suggestions errors as they're frequent during typing
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  /**
   * Get trending searches
   */
  const getTrendingSearches = useCallback(
    async (data?: {
      limit?: number;
      location?: string;
      cuisine?: string;
      time_range?: "hour" | "day" | "week" | "month";
      category?: string;
    }) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        const result = await convex.action(
          api.actions.users.customerGetTrendingSearches,
          {
            sessionToken: sessionToken || undefined,
            limit: data?.limit,
            location: data?.location,
            cuisine: data?.cuisine,
            time_range: data?.time_range,
            category: data?.category,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to get trending searches");
        }

        return {
          success: true,
          data: {
            trending: result.trending || [],
            metadata: result.metadata,
          },
        };
      } catch (error: any) {
        const errorMessage =
          error?.message ||
          error?.data?.error?.message ||
          "Failed to get trending searches";
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
    search,
    searchChefs,
    getSearchSuggestions,
    getTrendingSearches,
  };
};
