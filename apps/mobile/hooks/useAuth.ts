import {
  usePhoneLoginMutation,
  useSendLoginOTPMutation,
  useAppleSignInMutation,
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

        if (result.success && result.data.success && result.data.token) {
          return {
            token: result.data.token,
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

  return {
    handleSendOTP,
    handlePhoneLogin,
    handleAppleSignIn,
  };
};
