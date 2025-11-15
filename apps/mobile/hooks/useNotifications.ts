import { useCallback, useState } from "react";
import { getConvexClient, getSessionToken } from "@/lib/convexClient";
import { api } from '@/convex/_generated/api';
import { useToast } from "@/lib/ToastContext";

export const useNotifications = () => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Get notifications
   */
  const getNotifications = useCallback(
    async (options?: { limit?: number; unreadOnly?: boolean }) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(
          api.actions.users.customerGetNotifications,
          {
            sessionToken,
            limit: options?.limit,
            unreadOnly: options?.unreadOnly,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to get notifications");
        }

        return {
          success: true,
          data: {
            notifications: result.notifications || [],
            total: result.total || 0,
          },
        };
      } catch (error: any) {
        const errorMessage =
          error?.message ||
          error?.data?.error?.message ||
          "Failed to get notifications";
        showToast({
          type: "error",
          title: "Notifications Error",
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
   * Get notification stats
   */
  const getNotificationStats = useCallback(async () => {
    try {
      setIsLoading(true);
      const convex = getConvexClient();
      const sessionToken = await getSessionToken();

      if (!sessionToken) {
        throw new Error("Not authenticated");
      }

      const result = await convex.action(
        api.actions.users.customerGetNotificationStats,
        {
          sessionToken,
        }
      );

      if (result.success === false) {
        throw new Error(result.error || "Failed to get notification stats");
      }

      return {
        success: true,
        data: {
          total: result.total || 0,
          unread: result.unread || 0,
          byType: result.byType || {},
          byPriority: result.byPriority || {},
          byCategory: result.byCategory || {},
          recentCount: result.recentCount || 0,
        },
      };
    } catch (error: any) {
      const errorMessage =
        error?.message ||
        error?.data?.error?.message ||
        "Failed to get notification stats";
      showToast({
        type: "error",
        title: "Stats Error",
        message: errorMessage,
        duration: 4000,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  /**
   * Mark notification as read
   */
  const markNotificationRead = useCallback(
    async (notification_id: string) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(
          api.actions.users.customerMarkNotificationRead,
          {
            sessionToken,
            notification_id,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to mark notification as read");
        }

        return {
          success: true,
          message: result.message,
        };
      } catch (error: any) {
        const errorMessage =
          error?.message ||
          error?.data?.error?.message ||
          "Failed to mark notification as read";
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
   * Mark all notifications as read
   */
  const markAllNotificationsRead = useCallback(async () => {
    try {
      setIsLoading(true);
      const convex = getConvexClient();
      const sessionToken = await getSessionToken();

      if (!sessionToken) {
        throw new Error("Not authenticated");
      }

      const result = await convex.action(
        api.actions.users.customerMarkAllNotificationsRead,
        {
          sessionToken,
        }
      );

      if (result.success === false) {
        throw new Error(
          result.error || "Failed to mark all notifications as read"
        );
      }

      showToast({
        type: "success",
        title: "Success",
        message: result.message || "All notifications marked as read",
        duration: 3000,
      });

      return {
        success: true,
        message: result.message,
      };
    } catch (error: any) {
      const errorMessage =
        error?.message ||
        error?.data?.error?.message ||
        "Failed to mark all notifications as read";
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
  }, [showToast]);

  return {
    isLoading,
    getNotifications,
    getNotificationStats,
    markNotificationRead,
    markAllNotificationsRead,
  };
};

