import { useToast } from "@/lib/ToastContext";
import { getConvexClient, getSessionToken } from "@/lib/convexClient";
import { useCallback, useState } from "react";
import { api } from '@/convex/_generated/api';

export const useConnections = () => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Get all user connections
   */
  const getConnections = useCallback(
    async () => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(
          api.actions.users.customerGetConnections,
          {
            sessionToken,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to get connections");
        }

        return {
          success: true,
          data: result.connections || [],
        };
      } catch (error: any) {
        const errorMessage =
          error?.message ||
          error?.data?.error?.message ||
          "Failed to get connections";
        showToast({
          type: "error",
          title: "Connections Error",
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
   * Create connection
   */
  const createConnection = useCallback(
    async (data: {
      connected_user_id: string;
      connection_type: 'colleague' | 'friend';
      company?: string;
    }) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(
          api.actions.users.customerCreateConnection,
          {
            sessionToken,
            connected_user_id: data.connected_user_id,
            connection_type: data.connection_type,
            company: data.company,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to create connection");
        }

        showToast({
          type: "success",
          title: "Success",
          message: "Connection created successfully",
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
          "Failed to create connection";
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

  return {
    isLoading,
    getConnections,
    createConnection,
  };
};
