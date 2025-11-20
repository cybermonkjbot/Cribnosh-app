import { useCallback, useState } from "react";
import { getConvexClient, getSessionToken } from "@/lib/convexClient";
import { api } from '@/convex/_generated/api';
import { useToast } from "@/lib/ToastContext";

export const useAccount = () => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Change customer password
   */
  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(
          api.actions.users.customerChangePassword,
          {
            sessionToken,
            currentPassword,
            newPassword,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to change password");
        }

        showToast({
          type: "success",
          title: "Success",
          message: result.message || "Password changed successfully",
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
          "Failed to change password";
        showToast({
          type: "error",
          title: "Password Change Failed",
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
   * Get customer active sessions
   */
  const getSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      const convex = getConvexClient();
      const sessionToken = await getSessionToken();

      if (!sessionToken) {
        throw new Error("Not authenticated");
      }

      const result = await convex.action(
        api.actions.users.customerGetSessions,
        {
          sessionToken,
        }
      );

      if (result.success === false) {
        throw new Error(result.error || "Failed to get sessions");
      }

      return {
        success: true,
        data: {
          sessions: result.sessions,
        },
      };
    } catch (error: any) {
      const errorMessage =
        error?.message ||
        error?.data?.error?.message ||
        "Failed to get sessions";
      showToast({
        type: "error",
        title: "Sessions Error",
        message: errorMessage,
        duration: 4000,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  /**
   * Revoke a customer session
   */
  const revokeSession = useCallback(
    async (sessionId: string) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(
          api.actions.users.customerRevokeSession,
          {
            sessionToken,
            sessionId,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to revoke session");
        }

        showToast({
          type: "success",
          title: "Success",
          message: result.message || "Session revoked successfully",
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
          "Failed to revoke session";
        showToast({
          type: "error",
          title: "Revoke Failed",
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
   * Setup two-factor authentication
   */
  const setup2FA = useCallback(async () => {
    try {
      setIsLoading(true);
      const convex = getConvexClient();
      const sessionToken = await getSessionToken();

      if (!sessionToken) {
        throw new Error("Not authenticated");
      }

      const result = await convex.action(api.actions.users.customerSetup2FA, {
        sessionToken,
      });

      if (result.success === false) {
        throw new Error(result.error || "Failed to setup 2FA");
      }

      return {
        success: true,
        data: {
          secret: result.secret,
          backupCodes: result.backupCodes,
          qrCode: result.qrCode,
        },
      };
    } catch (error: any) {
      const errorMessage =
        error?.message || error?.data?.error?.message || "Failed to setup 2FA";
      showToast({
        type: "error",
        title: "2FA Setup Failed",
        message: errorMessage,
        duration: 4000,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  /**
   * Disable two-factor authentication
   */
  const disable2FA = useCallback(
    async (password?: string, code?: string) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(
          api.actions.users.customerDisable2FA,
          {
            sessionToken,
            password,
            code,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to disable 2FA");
        }

        showToast({
          type: "success",
          title: "Success",
          message: result.message || "2FA disabled successfully",
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
          "Failed to disable 2FA";
        showToast({
          type: "error",
          title: "Disable 2FA Failed",
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
    changePassword,
    getSessions,
    revokeSession,
    setup2FA,
    disable2FA,
  };
};

