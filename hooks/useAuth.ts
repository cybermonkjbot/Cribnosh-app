import {
  usePhoneLoginMutation,
  useSendLoginOTPMutation,
} from "@/app/store/authApi";
import { useToast } from "@/lib/ToastContext";
import { useCallback } from "react";
import { mockPhoneLogin, mockSendOTP } from "../utils/mockAuthUtils";
import { isMockModeEnabled } from "../utils/mockConfig";

export const useAuth = () => {
  const { showToast } = useToast();

  const [sendLoginOTP] = useSendLoginOTPMutation();
  const [phoneLogin] = usePhoneLoginMutation();

  // Send OTP function
  const handleSendOTP = useCallback(
    async (phone: string) => {
      try {
        // Use mock implementation if enabled
        if (isMockModeEnabled()) {
          console.log("🔧 Using mock OTP send");
          return await mockSendOTP(phone);
        }

        const result = await sendLoginOTP({ phone, action: "send" }).unwrap();

        return result;
      } catch (error: any) {
        showToast({
          type: "error",
          title: "OTP Failed",
          message: error.data?.error || "Failed to send OTP",
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
        // Use mock implementation if enabled
        if (isMockModeEnabled()) {
          console.log("🔧 Using mock phone login");
          return await mockPhoneLogin(phone, otp);
        }

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

  return {
    handleSendOTP,
    handlePhoneLogin,
  };
};
