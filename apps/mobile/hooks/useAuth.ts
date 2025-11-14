import {
  usePhoneLoginMutation,
  useSendLoginOTPMutation,
  useAppleSignInMutation,
  useEmailLoginMutation,
} from "@/store/authApi";
import { useToast } from "@/lib/ToastContext";
import { useCallback } from "react";
// Mock imports commented out - keeping for future use if needed
// import { mockPhoneLogin, mockSendOTP } from "../utils/mockAuthUtils";
// import { isMockModeEnabled } from "../utils/mockConfig";

export const useAuth = () => {
  const { showToast } = useToast();

  const [sendLoginOTP] = useSendLoginOTPMutation();
  const [phoneLogin] = usePhoneLoginMutation();
  const [appleSignIn] = useAppleSignInMutation();
  const [emailLogin] = useEmailLoginMutation();

  // Send OTP function
  const handleSendOTP = useCallback(
    async (phone: string) => {
      try {
        // MOCK IMPLEMENTATION COMMENTED OUT - Using real API calls
        // if (isMockModeEnabled()) {
        //   console.log("🔧 Using mock OTP send");
        //   return await mockSendOTP(phone);
        // }

        const result = await sendLoginOTP({ phone, action: "send" }).unwrap();

        return result;
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
        throw error;
      }
    },
    [sendLoginOTP, showToast]
  );

  const handlePhoneLogin = useCallback(
    async (phone: string, otp: string) => {
      try {
        // MOCK IMPLEMENTATION COMMENTED OUT - Using real API calls
        // if (isMockModeEnabled()) {
        //   console.log("🔧 Using mock phone login");
        //   return await mockPhoneLogin(phone, otp);
        // }

        const result = await phoneLogin({
          phone,
          action: "verify",
          otp,
        }).unwrap();
        return result;
      } catch (error: any) {
        throw error;
      }
    },
    [phoneLogin]
  );

  const handleAppleSignIn = useCallback(
    async (identityToken: string) => {
      try {
        const result = await appleSignIn({ identityToken }).unwrap();

        // Check if 2FA is required
        if (result.success && result.data.success && result.data.requires2FA && result.data.verificationToken) {
          // Return 2FA requirement - caller should handle navigation
          return {
            requires2FA: true,
            verificationToken: result.data.verificationToken,
          };
        }

        // Check for both token and sessionToken for compatibility
        const authToken = result.data.token || result.data.sessionToken;
        if (result.success && result.data.success && authToken && result.data.user) {
          return {
            token: authToken,
            user: result.data.user,
          };
        } else {
          throw new Error(result.data.message || "Apple sign-in failed");
        }
      } catch (error: any) {
        const errorMessage =
          error?.data?.error?.message ||
          error?.data?.error ||
          error?.data?.message ||
          error?.message ||
          "Apple sign-in failed";
        showToast({
          type: "error",
          title: "Apple Sign-In Failed",
          message: errorMessage,
          duration: 4000,
        });
        throw error;
      }
    },
    [appleSignIn, showToast]
  );

  const handleEmailLogin = useCallback(
    async (email: string, password: string) => {
      try {
        const result = await emailLogin({ email, password }).unwrap();
        return result;
      } catch (error: any) {
        throw error;
      }
    },
    [emailLogin]
  );

  return {
    handleSendOTP,
    handlePhoneLogin,
    handleAppleSignIn,
    handleEmailLogin,
  };
};
