import { api } from '@/convex/_generated/api';
import { getConvexClient, getSessionToken } from "@/lib/convexClient";
import { useCallback, useState } from "react";

export const useFoodCreators = () => {
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Get nearby food creators
   */
  const getNearbyFoodCreators = useCallback(
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
          api.actions.foodCreators.customerGetNearbyFoodCreators,
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
          throw new Error(result.error || "Failed to get nearby food creators");
        }

        return {
          success: true,
          data: {
            foodCreators: result.foodCreators || [],
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
   * Get food creator details
   */
  const getFoodCreatorDetails = useCallback(
    async (foodCreatorId: string, latitude?: number, longitude?: number) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        const result = await convex.action(
          api.actions.foodCreators.customerGetFoodCreatorDetails,
          {
            sessionToken: sessionToken || undefined,
            foodCreatorId,
            latitude,
            longitude,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to get food creator details");
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
   * Get popular food creators
   */
  const getPopularFoodCreators = useCallback(async () => {
    try {
      setIsLoading(true);
      const convex = getConvexClient();
      const sessionToken = await getSessionToken();

      const result = await convex.action(
        api.actions.foodCreators.customerGetPopularFoodCreators,
        {
          sessionToken: sessionToken || undefined,
        }
      );

      if (result.success === false) {
        throw new Error(result.error || "Failed to get popular food creators");
      }

      return {
        success: true,
        data: {
          foodCreators: result.foodCreators || [],
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
   * Get popular food creator details
   */
  const getPopularFoodCreatorDetails = useCallback(
    async (foodCreatorId: string) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        const result = await convex.action(
          api.actions.foodCreators.customerGetPopularFoodCreatorDetails,
          {
            sessionToken: sessionToken || undefined,
            foodCreatorId,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to get popular food creator details");
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
   * Get featured foodCreators
   */
  const getFeaturedFoodCreators = useCallback(
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
          api.actions.foodCreators.customerGetFeaturedFoodCreators,
          {
            sessionToken: sessionToken || undefined,
            limit: filters?.limit,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to get featured foodCreators");
        }

        return {
          success: true,
          data: {
            foodCreators: result.foodCreators || [],
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
   * Search food creators
   */
  const searchFoodCreators = useCallback(
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
          api.actions.foodCreators.customerSearchFoodCreators,
          {
            sessionToken: sessionToken || undefined,
            q: data.query,
            latitude: data.location?.latitude,
            longitude: data.location?.longitude,
            radius: data.radius,
            limit: data.limit,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to search food creators");
        }

        return {
          success: true,
          data: {
            foodCreators: result.foodCreators || [],
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
   * Search food creators by location
   */
  const searchFoodCreatorsByLocation = useCallback(
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
          api.actions.foodCreators.customerSearchFoodCreatorsByLocation,
          {
            sessionToken: sessionToken || undefined,
            latitude: data.latitude,
            longitude: data.longitude,
            radius: data.radius,
            limit: data.limit,
          }
        );

        if (result.success === false) {
          throw new Error(
            result.error || "Failed to search food creators by location"
          );
        }

        return {
          success: true,
          data: {
            foodCreators: result.foodCreators || [],
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
   * Get foodCreator favorite status
   */
  const getFoodCreatorFavoriteStatus = useCallback(
    async (foodCreatorId: string) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(
          api.actions.foodCreators.customerGetFoodCreatorFavoriteStatus,
          {
            sessionToken,
            foodCreatorId,
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
   * Add foodCreator to favorites
   */
  const addFoodCreatorFavorite = useCallback(
    async (foodCreatorId: string) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(
          api.actions.foodCreators.customerAddFoodCreatorFavorite,
          {
            sessionToken,
            foodCreatorId,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to add foodCreator to favorites");
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
   * Remove foodCreator from favorites
   */
  const removeFoodCreatorFavorite = useCallback(
    async (foodCreatorId: string) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(
          api.actions.foodCreators.customerRemoveFoodCreatorFavorite,
          {
            sessionToken,
            foodCreatorId,
          }
        );

        if (result.success === false) {
          throw new Error(
            result.error || "Failed to remove foodCreator from favorites"
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
   * Get foodCreator details
   */
  const getFoodCreatorDetails = useCallback(
    async (foodCreatorId: string) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error('Please log in to view foodCreator details');
        }

        const result = await convex.action(api.actions.foodCreators.customerGetFoodCreatorDetails, {
          sessionToken,
          foodCreatorId,
        });

        if (!result.success) {
          throw new Error(result.error || 'Failed to get foodCreator details');
        }

        return result.foodCreator;
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
   * Get foodCreator featured video
   */
  const getFoodCreatorFeaturedVideo = useCallback(
    async (foodCreatorId: string) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error('Please log in to view featured video');
        }

        const result = await convex.action(api.actions.foodCreators.customerGetFoodCreatorFeaturedVideo, {
          sessionToken,
          foodCreatorId,
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
   * Get foodCreator categories
   */
  const getFoodCreatorCategories = useCallback(
    async (foodCreatorId: string) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(
          api.actions.foodCreators.customerGetFoodCreatorCategories,
          {
            sessionToken,
            foodCreatorId,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to get foodCreator categories");
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
   * Get foodCreator tags
   */
  const getFoodCreatorTags = useCallback(
    async (foodCreatorId: string) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(api.actions.foodCreators.customerGetFoodCreatorTags, {
          sessionToken,
          foodCreatorId,
        });

        if (result.success === false) {
          throw new Error(result.error || "Failed to get foodCreator tags");
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
   * Get food creator meals
   */
  const getFoodCreatorMeals = useCallback(
    async (limit?: number, offset?: number) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(api.actions.foodCreators.customerGetFoodCreatorMeals, {
          sessionToken,
          limit,
          offset,
        });

        if (result.success === false) {
          throw new Error(result.error || "Failed to get food creator meals");
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

        const result = await convex.action(api.actions.foodCreators.customerStartLiveSession, {
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
    getNearbyFoodCreators,
    getFoodCreatorDetails,
    getPopularFoodCreators,
    getPopularFoodCreatorDetails,
    getFeaturedFoodCreators,
    searchFoodCreators,
    searchFoodCreatorsByLocation,
    getFoodCreatorFavoriteStatus,
    addFoodCreatorFavorite,
    removeFoodCreatorFavorite,
    getFoodCreatorDetails,
    getFoodCreatorFeaturedVideo,
    getFoodCreatorCategories,
    getFoodCreatorTags,
    getFoodCreatorMeals,
    startLiveSession,
  };
};
