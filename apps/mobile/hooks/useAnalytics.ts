import { useCallback, useState } from "react";
import { getConvexClient, getSessionToken } from "@/lib/convexClient";
import { api } from '@/convex/_generated/api';
import { useToast } from "@/lib/ToastContext";

export const useAnalytics = () => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Get weekly summary
   */
  const getWeeklySummary = useCallback(
    async (options?: { start_date?: string; end_date?: string }) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(
          api.actions.users.customerGetWeeklySummary,
          {
            sessionToken,
            start_date: options?.start_date,
            end_date: options?.end_date,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to get weekly summary");
        }

        return {
          success: true,
          data: {
            week_start: result.week_start,
            week_end: result.week_end,
            week_meals: result.week_meals,
            avg_meals: result.avg_meals,
            kcal_today: result.kcal_today,
            kcal_yesterday: result.kcal_yesterday,
            cuisines: result.cuisines,
            daily_calories: result.daily_calories,
            updated_at: result.updated_at,
          },
        };
      } catch (error: any) {
        const errorMessage =
          error?.message ||
          error?.data?.error?.message ||
          "Failed to get weekly summary";
        showToast({
          type: "error",
          title: "Analytics Error",
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
   * Get monthly overview
   */
  const getMonthlyOverview = useCallback(
    async (month?: string) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(
          api.actions.users.customerGetMonthlyOverview,
          {
            sessionToken,
            month,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to get monthly overview");
        }

        return {
          success: true,
          data: result.overview,
        };
      } catch (error: any) {
        const errorMessage =
          error?.message ||
          error?.data?.error?.message ||
          "Failed to get monthly overview";
        showToast({
          type: "error",
          title: "Analytics Error",
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
   * Get user behavior analytics
   */
  const getUserBehavior = useCallback(async () => {
    try {
      setIsLoading(true);
      const convex = getConvexClient();
      const sessionToken = await getSessionToken();

      if (!sessionToken) {
        throw new Error("Not authenticated");
      }

      const result = await convex.action(
        api.actions.users.customerGetUserBehavior,
        {
          sessionToken,
        }
      );

      if (result.success === false) {
        throw new Error(result.error || "Failed to get user behavior");
      }

      return {
        success: true,
        data: {
          totalOrders: result.totalOrders,
          daysActive: result.daysActive,
          usualDinnerItems: result.usualDinnerItems,
          colleagueConnections: result.colleagueConnections,
          playToWinHistory: result.playToWinHistory,
        },
      };
    } catch (error: any) {
      const errorMessage =
        error?.message ||
        error?.data?.error?.message ||
        "Failed to get user behavior";
      showToast({
        type: "error",
        title: "Analytics Error",
        message: errorMessage,
        duration: 4000,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  /**
   * Get nutrition progress
   */
  const getNutritionProgress = useCallback(
    async (date?: string) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(
          api.actions.users.customerGetNutritionProgress,
          {
            sessionToken,
            date,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to get nutrition progress");
        }

        return {
          success: true,
          data: {
            date: result.date,
            consumed: result.consumed,
            goal: result.goal,
            remaining: result.remaining,
            progress_percentage: result.progress_percentage,
            goal_type: result.goal_type,
            breakdown: result.breakdown,
            updated_at: result.updated_at,
          },
        };
      } catch (error: any) {
        const errorMessage =
          error?.message ||
          error?.data?.error?.message ||
          "Failed to get nutrition progress";
        showToast({
          type: "error",
          title: "Nutrition Error",
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
   * Get rewards points
   */
  const getRewardsPoints = useCallback(async () => {
    try {
      setIsLoading(true);
      const convex = getConvexClient();
      const sessionToken = await getSessionToken();

      if (!sessionToken) {
        throw new Error("Not authenticated");
      }

      const result = await convex.action(
        api.actions.users.customerGetRewardsPoints,
        {
          sessionToken,
        }
      );

      if (result.success === false) {
        throw new Error(result.error || "Failed to get rewards points");
      }

      return {
        success: true,
        data: {
          available_points: result.available_points,
          total_points_earned: result.total_points_earned,
          total_points_spent: result.total_points_spent,
          progress_percentage: result.progress_percentage,
          progress_to_next_coin: result.progress_to_next_coin,
          next_milestone: result.next_milestone,
          currency: result.currency,
          last_updated: result.last_updated,
        },
      };
    } catch (error: any) {
      const errorMessage =
        error?.message ||
        error?.data?.error?.message ||
        "Failed to get rewards points";
      showToast({
        type: "error",
        title: "Rewards Error",
        message: errorMessage,
        duration: 4000,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  return {
    isLoading,
    getWeeklySummary,
    getMonthlyOverview,
    getUserBehavior,
    getNutritionProgress,
    getRewardsPoints,
  };
};

