import { useCallback, useState } from "react";
import { getConvexClient, getSessionToken } from "@/lib/convexClient";
import { api } from "../../../packages/convex/_generated/api.js";
import { useToast } from "@/lib/ToastContext";

export const useProfile = () => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Get customer profile
   */
  const getCustomerProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const convex = getConvexClient();
      const sessionToken = await getSessionToken();

      if (!sessionToken) {
        throw new Error("Not authenticated");
      }

      const result = await convex.action(api.actions.users.customerGetProfile, {
        sessionToken,
      });

      if (result.success === false) {
        throw new Error(result.error || "Failed to get profile");
      }

      return {
        success: true,
        data: {
          user: result.user,
        },
      };
    } catch (error: any) {
      const errorMessage =
        error?.message || error?.data?.error?.message || "Failed to get profile";
      showToast({
        type: "error",
        title: "Profile Error",
        message: errorMessage,
        duration: 4000,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  /**
   * Update customer profile
   */
  const updateCustomerProfile = useCallback(
    async (data: {
      name?: string;
      email?: string;
      phone?: string;
      picture?: string;
      preferences?: {
        favorite_cuisines?: string[];
        dietary_restrictions?: string[];
      };
      address?: {
        street: string;
        city: string;
        state: string;
        postal_code: string;
        country: string;
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
          api.actions.users.customerUpdateProfile,
          {
            sessionToken,
            ...data,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to update profile");
        }

        showToast({
          type: "success",
          title: "Success",
          message: result.message || "Profile updated successfully",
          duration: 3000,
        });

        return {
          success: true,
          data: {
            user: result.user,
            message: result.message,
          },
        };
      } catch (error: any) {
        const errorMessage =
          error?.message ||
          error?.data?.error?.message ||
          "Failed to update profile";
        showToast({
          type: "error",
          title: "Update Error",
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
   * Upload profile image
   * This handles the two-step process: get upload URL, upload file, complete upload
   */
  const uploadProfileImage = useCallback(
    async (fileUri: string, fileType: string = "image/jpeg") => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        // Step 1: Get upload URL
        const uploadUrlResult = await convex.action(
          api.actions.users.customerGetProfileImageUploadUrl,
          {
            sessionToken,
          }
        );

        if (uploadUrlResult.success === false) {
          throw new Error(
            uploadUrlResult.error || "Failed to get upload URL"
          );
        }

        // Step 2: Read file and upload to Convex storage
        // For React Native, we need to convert the file URI to a blob
        const response = await fetch(fileUri);
        const blob = await response.blob();

        const uploadResponse = await fetch(uploadUrlResult.uploadUrl, {
          method: "POST",
          headers: {
            "Content-Type": fileType || "image/jpeg",
          },
          body: blob,
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload file to storage");
        }

        const { storageId } = await uploadResponse.json();

        // Step 3: Complete the upload (update user avatar)
        const completeResult = await convex.action(
          api.actions.users.customerCompleteProfileImageUpload,
          {
            sessionToken,
            storageId,
          }
        );

        if (completeResult.success === false) {
          throw new Error(
            completeResult.error || "Failed to complete image upload"
          );
        }

        showToast({
          type: "success",
          title: "Success",
          message: "Profile image uploaded successfully",
          duration: 3000,
        });

        return {
          success: true,
          data: completeResult,
        };
      } catch (error: any) {
        const errorMessage =
          error?.message ||
          error?.data?.error?.message ||
          "Failed to upload profile image";
        showToast({
          type: "error",
          title: "Upload Error",
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
   * Send OTP for phone/email update
   */
  const sendPhoneEmailOTP = useCallback(
    async (
      type: "phone" | "email",
      phone?: string,
      email?: string
    ) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(
          api.actions.users.customerSendPhoneEmailOTP,
          {
            sessionToken,
            type,
            phone,
            email,
          }
        );

        if (result.success === false) {
          throw {
            status: 400,
            data: {
              success: false,
              error: {
                code: "400",
                message: result.error || "Failed to send OTP",
              },
            },
          };
        }

        return {
          success: true,
          data: {
            success: true,
            message: result.message,
            ...(result.testOtp && { testOtp: result.testOtp }),
          },
        };
      } catch (error: any) {
        const errorMessage =
          error?.data?.error?.message ||
          error?.data?.error ||
          error?.data?.message ||
          error?.message ||
          "Failed to send OTP";
        showToast({
          type: "error",
          title: "OTP Failed",
          message: errorMessage,
          duration: 4000,
        });

        // If it's already formatted, re-throw
        if (error.status && error.data) {
          throw error;
        }

        // Otherwise, format it
        throw {
          status: 500,
          data: {
            success: false,
            error: {
              code: "500",
              message: errorMessage,
            },
          },
        };
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  /**
   * Verify OTP and update phone/email
   */
  const verifyPhoneEmailOTP = useCallback(
    async (
      type: "phone" | "email",
      otp: string,
      phone?: string,
      email?: string
    ) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(
          api.actions.users.customerVerifyPhoneEmailOTP,
          {
            sessionToken,
            type,
            otp,
            phone,
            email,
          }
        );

        if (result.success === false) {
          throw {
            status: 400,
            data: {
              success: false,
              error: {
                code: "400",
                message: result.error || "Failed to verify OTP",
              },
            },
          };
        }

        showToast({
          type: "success",
          title: "Success",
          message: result.message || "Phone/Email updated successfully",
          duration: 3000,
        });

        return {
          success: true,
          data: {
            success: true,
            message: result.message,
          },
        };
      } catch (error: any) {
        const errorMessage =
          error?.data?.error?.message ||
          error?.data?.error ||
          error?.data?.message ||
          error?.message ||
          "Failed to verify OTP";
        showToast({
          type: "error",
          title: "Verification Failed",
          message: errorMessage,
          duration: 4000,
        });

        // If it's already formatted, re-throw
        if (error.status && error.data) {
          throw error;
        }

        // Otherwise, format it
        throw {
          status: 500,
          data: {
            success: false,
            error: {
              code: "500",
              message: errorMessage,
            },
          },
        };
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  return {
    isLoading,
    getCustomerProfile,
    updateCustomerProfile,
    uploadProfileImage,
    sendPhoneEmailOTP,
    verifyPhoneEmailOTP,
  };
};

