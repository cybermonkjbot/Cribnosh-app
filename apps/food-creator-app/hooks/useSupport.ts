import { useCallback, useState } from "react";
import { getConvexClient, getSessionToken } from "@/lib/convexClient";
import { api } from '@/convex/_generated/api';
import { useToast } from "@/lib/ToastContext";

export const useSupport = () => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Get support cases
   */
  const getSupportCases = useCallback(
    async (options?: {
      page?: number;
      limit?: number;
      status?: "open" | "closed" | "resolved";
    }) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(
          api.actions.users.customerGetSupportCases,
          {
            sessionToken,
            page: options?.page,
            limit: options?.limit,
            status: options?.status,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to get support cases");
        }

        return {
          success: true,
          data: {
            cases: result.cases,
            pagination: result.pagination,
          },
        };
      } catch (error: any) {
        const errorMessage =
          error?.message ||
          error?.data?.error?.message ||
          "Failed to get support cases";
        showToast({
          type: "error",
          title: "Support Error",
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
   * Create support case
   */
  const createSupportCase = useCallback(
    async (data: {
      subject: string;
      message: string;
      category: "order" | "payment" | "account" | "technical" | "other";
      priority?: "low" | "medium" | "high";
      order_id?: string;
      attachments?: string[];
    }) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(
          api.actions.users.customerCreateSupportCase,
          {
            sessionToken,
            subject: data.subject,
            message: data.message,
            category: data.category,
            priority: data.priority,
            order_id: data.order_id,
            attachments: data.attachments,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to create support case");
        }

        showToast({
          type: "success",
          title: "Success",
          message: "Support case created successfully",
          duration: 3000,
        });

        return {
          success: true,
          data: {
            id: result.id,
            subject: result.subject,
            status: result.status,
            priority: result.priority,
            category: result.category,
            created_at: result.created_at,
            support_reference: result.support_reference,
          },
        };
      } catch (error: any) {
        const errorMessage =
          error?.message ||
          error?.data?.error?.message ||
          "Failed to create support case";
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
   * Get support chat
   */
  const getSupportChat = useCallback(
    async (caseId?: string) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(
          api.actions.users.customerGetSupportChat,
          {
            sessionToken,
            caseId,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to get support chat");
        }

        return {
          success: true,
          data: {
            chatId: result.chatId,
            supportCaseId: result.supportCaseId,
            agent: result.agent,
            messages: result.messages,
          },
        };
      } catch (error: any) {
        const errorMessage =
          error?.message ||
          error?.data?.error?.message ||
          "Failed to get support chat";
        showToast({
          type: "error",
          title: "Support Error",
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
   * Send support message
   */
  const sendSupportMessage = useCallback(
    async (content: string) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(
          api.actions.users.customerSendSupportMessage,
          {
            sessionToken,
            content,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to send message");
        }

        return {
          success: true,
          data: {
            messageId: result.messageId,
            chatId: result.chatId,
            content: result.content,
          },
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
          "Failed to send message";
        showToast({
          type: "error",
          title: "Send Failed",
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
   * Get quick replies
   */
  const getQuickReplies = useCallback(async () => {
    try {
      setIsLoading(true);
      const convex = getConvexClient();
      const sessionToken = await getSessionToken();

      if (!sessionToken) {
        throw new Error("Not authenticated");
      }

      const result = await convex.action(
        api.actions.users.customerGetQuickReplies,
        {
          sessionToken,
        }
      );

      if (result.success === false) {
        throw new Error(result.error || "Failed to get quick replies");
      }

      return {
        success: true,
        data: {
          replies: result.replies,
        },
      };
    } catch (error: any) {
      const errorMessage =
        error?.message ||
        error?.data?.error?.message ||
        "Failed to get quick replies";
      showToast({
        type: "error",
        title: "Support Error",
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
    getSupportCases,
    createSupportCase,
    getSupportChat,
    sendSupportMessage,
    getQuickReplies,
  };
};

