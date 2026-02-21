import { api } from '@/convex/_generated/api';
import { useToast } from "@/lib/ToastContext";
import { getConvexClient, getSessionToken } from "@/lib/convexClient";
import { useCallback, useState } from "react";

export const useGroupOrders = () => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Create group order
   */
  const createGroupOrder = useCallback(
    async (data: {
      foodCreatorId: string;
      restaurant_name: string;
      initial_budget: number;
      title?: string;
      delivery_address?: {
        street: string;
        city: string;
        postcode: string;
        country: string;
      };
      delivery_time?: string;
      expires_in_hours?: number;
    }) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(
          api.actions.users.customerCreateGroupOrder,
          {
            sessionToken,
            foodCreatorId: data.foodCreatorId,
            restaurant_name: data.restaurant_name,
            initial_budget: data.initial_budget,
            title: data.title,
            delivery_address: data.delivery_address,
            delivery_time: data.delivery_time,
            expires_in_hours: data.expires_in_hours,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to create group order");
        }

        showToast({
          type: "success",
          title: "Success",
          message: "Group order created successfully",
          duration: 3000,
        });

        return {
          success: true,
          data: {
            group_order_id: result.group_order_id,
            share_token: result.share_token,
            share_link: result.share_link,
            expires_at: result.expires_at,
          },
        };
      } catch (error: any) {
        const errorMessage =
          error?.message ||
          error?.data?.error?.message ||
          "Failed to create group order";
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

  /**
   * Get group order details
   */
  const getGroupOrder = useCallback(
    async (group_order_id: string) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(
          api.actions.users.customerGetGroupOrder,
          {
            sessionToken,
            group_order_id,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to get group order");
        }

        return {
          success: true,
          data: result,
        };
      } catch (error: any) {
        const errorMessage =
          error?.message ||
          error?.data?.error?.message ||
          "Failed to get group order";
        showToast({
          type: "error",
          title: "Group Order Error",
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
   * Join group order
   */
  const joinGroupOrder = useCallback(
    async (data: {
      group_order_id?: string;
      share_token?: string;
      order_items?: {
        dish_id: string;
        name: string;
        quantity: number;
        price: number;
        special_instructions?: string;
      }[];
      initial_budget_contribution?: number;
    }) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(
          api.actions.users.customerJoinGroupOrder,
          {
            sessionToken,
            group_order_id: data.group_order_id,
            share_token: data.share_token,
            order_items: data.order_items,
            initial_budget_contribution: data.initial_budget_contribution,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to join group order");
        }

        showToast({
          type: "success",
          title: "Success",
          message: "Successfully joined group order",
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
          "Failed to join group order";
        showToast({
          type: "error",
          title: "Join Failed",
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
   * Close group order
   */
  const closeGroupOrder = useCallback(
    async (group_order_id: string) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(
          api.actions.users.customerCloseGroupOrder,
          {
            sessionToken,
            group_order_id,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to close group order");
        }

        showToast({
          type: "success",
          title: "Success",
          message: "Group order closed successfully",
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
          "Failed to close group order";
        showToast({
          type: "error",
          title: "Close Failed",
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
   * Start selection phase
   */
  const startSelectionPhase = useCallback(
    async (group_order_id: string) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(
          api.actions.users.customerStartSelectionPhase,
          {
            sessionToken,
            group_order_id,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to start selection phase");
        }

        showToast({
          type: "success",
          title: "Success",
          message: "Selection phase started successfully",
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
          "Failed to start selection phase";
        showToast({
          type: "error",
          title: "Start Failed",
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
   * Get participant selections
   */
  const getParticipantSelections = useCallback(
    async (group_order_id: string, participant_user_id?: string) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(
          api.actions.users.customerGetParticipantSelections,
          {
            sessionToken,
            group_order_id,
            participant_user_id,
          }
        );

        if (result.success === false) {
          throw new Error(
            result.error || "Failed to get participant selections"
          );
        }

        return {
          success: true,
          data: {
            selections: result.selections || [],
          },
        };
      } catch (error: any) {
        const errorMessage =
          error?.message ||
          error?.data?.error?.message ||
          "Failed to get participant selections";
        showToast({
          type: "error",
          title: "Selections Error",
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
   * Update participant selections
   */
  const updateParticipantSelections = useCallback(
    async (data: {
      group_order_id: string;
      order_items: {
        dish_id: string;
        name: string;
        quantity: number;
        price: number;
        special_instructions?: string;
      }[];
    }) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(
          api.actions.users.customerUpdateParticipantSelections,
          {
            sessionToken,
            group_order_id: data.group_order_id,
            order_items: data.order_items,
          }
        );

        if (result.success === false) {
          throw new Error(
            result.error || "Failed to update participant selections"
          );
        }

        showToast({
          type: "success",
          title: "Success",
          message: "Selections updated successfully",
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
          "Failed to update participant selections";
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
   * Mark selections as ready
   */
  const markSelectionsReady = useCallback(
    async (group_order_id: string) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(
          api.actions.users.customerMarkSelectionsReady,
          {
            sessionToken,
            group_order_id,
          }
        );

        if (result.success === false) {
          throw new Error(
            result.error || "Failed to mark selections as ready"
          );
        }

        showToast({
          type: "success",
          title: "Success",
          message: "Selections marked as ready successfully",
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
          "Failed to mark selections as ready";
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
   * Get budget details
   */
  const getBudgetDetails = useCallback(
    async (group_order_id: string) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(
          api.actions.users.customerGetBudgetDetails,
          {
            sessionToken,
            group_order_id,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to get budget details");
        }

        return {
          success: true,
          data: result,
        };
      } catch (error: any) {
        const errorMessage =
          error?.message ||
          error?.data?.error?.message ||
          "Failed to get budget details";
        showToast({
          type: "error",
          title: "Budget Error",
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
   * Chip in to budget
   */
  const chipInToBudget = useCallback(
    async (group_order_id: string, amount: number) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(
          api.actions.users.customerChipInToBudget,
          {
            sessionToken,
            group_order_id,
            amount,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to chip in to budget");
        }

        showToast({
          type: "success",
          title: "Success",
          message: "Budget contribution added successfully",
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
          "Failed to chip in to budget";
        showToast({
          type: "error",
          title: "Contribution Failed",
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
   * Get group order status
   */
  const getGroupOrderStatus = useCallback(
    async (group_order_id: string) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(
          api.actions.users.customerGetGroupOrderStatus,
          {
            sessionToken,
            group_order_id,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to get group order status");
        }

        return {
          success: true,
          data: result,
        };
      } catch (error: any) {
        const errorMessage =
          error?.message ||
          error?.data?.error?.message ||
          "Failed to get group order status";
        showToast({
          type: "error",
          title: "Status Error",
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
    createGroupOrder,
    getGroupOrder,
    joinGroupOrder,
    closeGroupOrder,
    startSelectionPhase,
    getParticipantSelections,
    updateParticipantSelections,
    markSelectionsReady,
    getBudgetDetails,
    chipInToBudget,
    getGroupOrderStatus,
  };
};

