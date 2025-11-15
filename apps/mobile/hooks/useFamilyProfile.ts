import { useCallback, useState } from "react";
import { getConvexClient, getSessionToken } from "@/lib/convexClient";
import { api } from '@/convex/_generated/api';
import { useToast } from "@/lib/ToastContext";

export const useFamilyProfile = () => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Get family profile
   */
  const getFamilyProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const convex = getConvexClient();
      const sessionToken = await getSessionToken();

      if (!sessionToken) {
        throw new Error("Not authenticated");
      }

      const result = await convex.action(
        api.actions.users.customerGetFamilyProfile,
        {
          sessionToken,
        }
      );

      if (result.success === false) {
        throw new Error(result.error || "Failed to get family profile");
      }

      return {
        success: true,
        data: {
          family_profile_id: result.family_profile_id,
          parent_user_id: result.parent_user_id,
          member_user_ids: result.member_user_ids,
          family_members: result.family_members,
          settings: result.settings,
          created_at: result.created_at,
          updated_at: result.updated_at,
        },
      };
    } catch (error: any) {
      const errorMessage =
        error?.message ||
        error?.data?.error?.message ||
        "Failed to get family profile";
      showToast({
        type: "error",
        title: "Family Profile Error",
        message: errorMessage,
        duration: 4000,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  /**
   * Setup family profile
   */
  const setupFamilyProfile = useCallback(
    async (data: {
      family_members?: Array<{
        name: string;
        email: string;
        phone?: string;
        relationship: string;
        budget_settings?: {
          daily_limit?: number;
          weekly_limit?: number;
          monthly_limit?: number;
          currency?: string;
        };
      }>;
      settings?: {
        shared_payment_methods: boolean;
        shared_orders: boolean;
        allow_child_ordering: boolean;
        require_approval_for_orders: boolean;
        spending_notifications: boolean;
      };
    }) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(
          api.actions.users.customerSetupFamilyProfile,
          {
            sessionToken,
            family_members: data.family_members,
            settings: data.settings,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to setup family profile");
        }

        showToast({
          type: "success",
          title: "Success",
          message: "Family profile setup successfully",
          duration: 3000,
        });

        return {
          success: true,
          data: {
            family_profile_id: result.family_profile_id,
            parent_user_id: result.parent_user_id,
            member_user_ids: result.member_user_ids,
            family_members: result.family_members,
            settings: result.settings,
            created_at: result.created_at,
          },
        };
      } catch (error: any) {
        const errorMessage =
          error?.message ||
          error?.data?.error?.message ||
          "Failed to setup family profile";
        showToast({
          type: "error",
          title: "Setup Failed",
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
   * Get family members
   */
  const getFamilyMembers = useCallback(async () => {
    try {
      setIsLoading(true);
      const convex = getConvexClient();
      const sessionToken = await getSessionToken();

      if (!sessionToken) {
        throw new Error("Not authenticated");
      }

      const result = await convex.action(
        api.actions.users.customerGetFamilyMembers,
        {
          sessionToken,
        }
      );

      if (result.success === false) {
        throw new Error(result.error || "Failed to get family members");
      }

      return {
        success: true,
        data: {
          members: result.members,
        },
      };
    } catch (error: any) {
      const errorMessage =
        error?.message ||
        error?.data?.error?.message ||
        "Failed to get family members";
      showToast({
        type: "error",
        title: "Family Profile Error",
        message: errorMessage,
        duration: 4000,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  /**
   * Invite family member
   */
  const inviteFamilyMember = useCallback(
    async (data: {
      member: {
        name: string;
        email: string;
        phone?: string;
        relationship: string;
        budget_settings?: {
          daily_limit?: number;
          weekly_limit?: number;
          monthly_limit?: number;
          currency?: string;
        };
      };
      family_profile_id?: string;
    }) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(
          api.actions.users.customerInviteFamilyMember,
          {
            sessionToken,
            member: data.member,
            family_profile_id: data.family_profile_id,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to invite family member");
        }

        showToast({
          type: "success",
          title: "Success",
          message: "Invitation sent successfully",
          duration: 3000,
        });

        return {
          success: true,
          data: {
            member_id: result.member_id,
            invitation_token: result.invitation_token,
          },
        };
      } catch (error: any) {
        const errorMessage =
          error?.message ||
          error?.data?.error?.message ||
          "Failed to invite family member";
        showToast({
          type: "error",
          title: "Invite Failed",
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
   * Accept family invite
   */
  const acceptFamilyInvite = useCallback(
    async (invitation_token: string) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(
          api.actions.users.customerAcceptFamilyInvite,
          {
            sessionToken,
            invitation_token,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to accept invitation");
        }

        showToast({
          type: "success",
          title: "Success",
          message: "Invitation accepted successfully",
          duration: 3000,
        });

        return {
          success: true,
          data: {
            family_profile_id: result.family_profile_id,
            member_id: result.member_id,
          },
        };
      } catch (error: any) {
        const errorMessage =
          error?.message ||
          error?.data?.error?.message ||
          "Failed to accept invitation";
        showToast({
          type: "error",
          title: "Accept Failed",
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
   * Get family orders
   */
  const getFamilyOrders = useCallback(
    async (options?: { member_user_id?: string; limit?: number }) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(
          api.actions.users.customerGetFamilyOrders,
          {
            sessionToken,
            member_user_id: options?.member_user_id,
            limit: options?.limit,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to get family orders");
        }

        return {
          success: true,
          data: {
            orders: result.orders,
          },
        };
      } catch (error: any) {
        const errorMessage =
          error?.message ||
          error?.data?.error?.message ||
          "Failed to get family orders";
        showToast({
          type: "error",
          title: "Family Profile Error",
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
   * Get family spending
   */
  const getFamilySpending = useCallback(async () => {
    try {
      setIsLoading(true);
      const convex = getConvexClient();
      const sessionToken = await getSessionToken();

      if (!sessionToken) {
        throw new Error("Not authenticated");
      }

      const result = await convex.action(
        api.actions.users.customerGetFamilySpending,
        {
          sessionToken,
        }
      );

      if (result.success === false) {
        throw new Error(result.error || "Failed to get family spending");
      }

      return {
        success: true,
        data: {
          members: result.members,
          total_spending: result.total_spending,
          currency: result.currency,
        },
      };
    } catch (error: any) {
      const errorMessage =
        error?.message ||
        error?.data?.error?.message ||
        "Failed to get family spending";
      showToast({
        type: "error",
        title: "Family Profile Error",
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
    getFamilyProfile,
    setupFamilyProfile,
    getFamilyMembers,
    inviteFamilyMember,
    acceptFamilyInvite,
    getFamilyOrders,
    getFamilySpending,
  };
};

