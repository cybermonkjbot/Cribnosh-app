import { useCallback, useState } from "react";
import { getConvexClient, getSessionToken } from "@/lib/convexClient";
import { api } from '@/convex/_generated/api';

export const useChefs = () => {
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Get nearby chefs
   */
  const getNearbyChefs = useCallback(
    async (data: {
      latitude: number;
      longitude: number;
      radius?: number;
      limit?: number;
      page?: number;
    }) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        const result = await convex.action(
          api.actions.chefs.customerGetNearbyChefs,
          {
            sessionToken: sessionToken || undefined,
            latitude: data.latitude,
            longitude: data.longitude,
            radius: data.radius,
            limit: data.limit,
            page: data.page,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to get nearby chefs");
        }

        return {
          success: true,
          data: {
            chefs: result.chefs || [],
            pagination: result.pagination,
          },
        };
      } catch (error: any) {
        // Let components handle errors - no toast in hooks
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Get chef details
   */
  const getChefDetails = useCallback(
    async (chef_id: string, latitude?: number, longitude?: number) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        const result = await convex.action(
          api.actions.chefs.customerGetChefDetails,
          {
            sessionToken: sessionToken || undefined,
            chef_id,
            latitude,
            longitude,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to get chef details");
        }

        return {
          success: true,
          data: result,
        };
      } catch (error: any) {
        // Let components handle errors - no toast in hooks
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Get popular chefs
   */
  const getPopularChefs = useCallback(async () => {
    try {
      setIsLoading(true);
      const convex = getConvexClient();
      const sessionToken = await getSessionToken();

      const result = await convex.action(
        api.actions.chefs.customerGetPopularChefs,
        {
          sessionToken: sessionToken || undefined,
        }
      );

      if (result.success === false) {
        throw new Error(result.error || "Failed to get popular chefs");
      }

      return {
        success: true,
        data: {
          chefs: result.chefs || [],
        },
      };
      } catch (error: any) {
        // Let components handle errors - no toast in hooks
        throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get popular chef details
   */
  const getPopularChefDetails = useCallback(
    async (chef_id: string) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        const result = await convex.action(
          api.actions.users.customerGetPopularChefDetails,
          {
            sessionToken: sessionToken || undefined,
            chef_id,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to get popular chef details");
        }

        return {
          success: true,
          data: result,
        };
      } catch (error: any) {
        // Let components handle errors - no toast in hooks
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Get featured kitchens
   */
  const getFeaturedKitchens = useCallback(
    async (filters?: {
      sentiment?: string;
      is_live?: boolean;
      limit?: number;
    }) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        const result = await convex.action(
          api.actions.chefs.customerGetFeaturedKitchens,
          {
            sessionToken: sessionToken || undefined,
            sentiment: filters?.sentiment,
            is_live: filters?.is_live,
            limit: filters?.limit,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to get featured kitchens");
        }

        return {
          success: true,
          data: {
            kitchens: result.kitchens || [],
            total: result.total || 0,
            limit: result.limit || 20,
          },
        };
      } catch (error: any) {
        // Let components handle errors - no toast in hooks
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Search chefs
   */
  const searchChefs = useCallback(
    async (data: {
      query: string;
      location?: {
        latitude: number;
        longitude: number;
      };
      radius?: number;
      cuisine?: string;
      limit?: number;
    }) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        const result = await convex.action(
          api.actions.chefs.customerSearchChefs,
          {
            sessionToken: sessionToken || undefined,
            query: data.query,
            location: data.location,
            radius: data.radius,
            cuisine: data.cuisine,
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
            metadata: result.metadata,
          },
        };
      } catch (error: any) {
        // Let components handle errors - no toast in hooks
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Search chefs by location
   */
  const searchChefsByLocation = useCallback(
    async (data: {
      latitude: number;
      longitude: number;
      radius?: number;
      limit?: number;
      page?: number;
    }) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        const result = await convex.action(
          api.actions.users.customerSearchChefsByLocation,
          {
            sessionToken: sessionToken || undefined,
            latitude: data.latitude,
            longitude: data.longitude,
            radius: data.radius,
            limit: data.limit,
            page: data.page,
          }
        );

        if (result.success === false) {
          throw new Error(
            result.error || "Failed to search chefs by location"
          );
        }

        return {
          success: true,
          data: {
            chefs: result.chefs || [],
            pagination: result.pagination,
          },
        };
      } catch (error: any) {
        // Let components handle errors - no toast in hooks
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Get kitchen favorite status
   */
  const getKitchenFavoriteStatus = useCallback(
    async (kitchenId: string) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(
          api.actions.users.customerGetKitchenFavoriteStatus,
          {
            sessionToken,
            kitchenId,
          }
        );

        if (result.success === false) {
          throw new Error(
            result.error || "Failed to get favorite status"
          );
        }

        return {
          success: true,
          data: result,
        };
      } catch (error: any) {
        // Let components handle errors - no toast in hooks
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Add kitchen to favorites
   */
  const addKitchenFavorite = useCallback(
    async (kitchenId: string) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(
          api.actions.users.customerAddKitchenFavorite,
          {
            sessionToken,
            kitchenId,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to add kitchen to favorites");
        }

        // Success feedback handled by components - no toast in hooks
        return {
          success: true,
          data: result,
        };
      } catch (error: any) {
        // Let components handle errors - no toast in hooks
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Remove kitchen from favorites
   */
  const removeKitchenFavorite = useCallback(
    async (kitchenId: string) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(
          api.actions.users.customerRemoveKitchenFavorite,
          {
            sessionToken,
            kitchenId,
          }
        );

        if (result.success === false) {
          throw new Error(
            result.error || "Failed to remove kitchen from favorites"
          );
        }

        // Success feedback handled by components - no toast in hooks
        return {
          success: true,
          data: result,
        };
      } catch (error: any) {
        // Let components handle errors - no toast in hooks
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Get kitchen details
   */
  const getKitchenDetails = useCallback(
    async (kitchenId: string) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error('Please log in to view kitchen details');
        }

        const result = await convex.action(api.actions.chefs.customerGetKitchenDetails, {
          sessionToken,
          kitchenId,
        });

        if (!result.success) {
          throw new Error(result.error || 'Failed to get kitchen details');
        }

        return result.kitchen;
      } catch (error: any) {
        // Let components handle errors - no toast in hooks
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Get kitchen featured video
   */
  const getKitchenFeaturedVideo = useCallback(
    async (kitchenId: string) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error('Please log in to view featured video');
        }

        const result = await convex.action(api.actions.chefs.customerGetKitchenFeaturedVideo, {
          sessionToken,
          kitchenId,
        });

        if (!result.success) {
          throw new Error(result.error || 'Failed to get featured video');
        }

        return result.video;
      } catch (error: any) {
        // Let components handle errors - no toast in hooks
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Get kitchen categories
   */
  const getKitchenCategories = useCallback(
    async (kitchenId: string) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(
          api.actions.chefs.customerGetKitchenCategories,
          {
            sessionToken,
            kitchenId,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to get kitchen categories");
        }

        return {
          success: true,
          data: {
            categories: result.categories || [],
          },
        };
      } catch (error: any) {
        // Let components handle errors - no toast in hooks
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Get kitchen tags
   */
  const getKitchenTags = useCallback(
    async (kitchenId: string) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(api.actions.chefs.customerGetKitchenTags, {
          sessionToken,
          kitchenId,
        });

        if (result.success === false) {
          throw new Error(result.error || "Failed to get kitchen tags");
        }

        return {
          success: true,
          data: {
            tags: result.tags || [],
          },
        };
      } catch (error: any) {
        // Let components handle errors - no toast in hooks
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Get chef meals
   */
  const getChefMeals = useCallback(
    async (limit?: number, offset?: number) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(api.actions.chefs.customerGetChefMeals, {
          sessionToken,
          limit,
          offset,
        });

        if (result.success === false) {
          throw new Error(result.error || "Failed to get chef meals");
        }

        return {
          success: true,
          data: {
            meals: result.meals || [],
            total: result.total || 0,
          },
        };
      } catch (error: any) {
        // Let components handle errors - no toast in hooks
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Start live session
   */
  const startLiveSession = useCallback(
    async (data: {
      channelName: string;
      title: string;
      description: string;
      mealId: string;
      thumbnailUrl?: string;
      tags?: string[];
      location?: {
        city: string;
        coordinates: number[];
        address?: string;
        radius?: number;
      };
    }) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(api.actions.chefs.customerStartLiveSession, {
          sessionToken,
          channelName: data.channelName,
          title: data.title,
          description: data.description,
          mealId: data.mealId,
          thumbnailUrl: data.thumbnailUrl,
          tags: data.tags,
          location: data.location,
        });

        if (result.success === false) {
          throw new Error(result.error || "Failed to start live session");
        }

        // Success feedback handled by components - no toast in hooks
        return {
          success: true,
          data: result.session,
        };
      } catch (error: any) {
        // Let components handle errors - no toast in hooks
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    isLoading,
    getNearbyChefs,
    getChefDetails,
    getPopularChefs,
    getPopularChefDetails,
    getFeaturedKitchens,
    searchChefs,
    searchChefsByLocation,
    getKitchenFavoriteStatus,
    addKitchenFavorite,
    removeKitchenFavorite,
    getKitchenDetails,
    getKitchenFeaturedVideo,
    getKitchenCategories,
    getKitchenTags,
    getChefMeals,
    startLiveSession,
  };
};
