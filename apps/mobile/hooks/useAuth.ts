// RTK Query mutations no longer needed for these endpoints - using Convex directly
// Keeping imports commented out in case we need them for other endpoints
// import {
//   usePhoneLoginMutation,
//   useSendLoginOTPMutation,
//   useAppleSignInMutation,
// } from "@/store/authApi";
import { useToast } from "@/lib/ToastContext";
import { API_CONFIG } from "@/constants/api";
import { useCallback } from "react";
import { getConvexClient, setSessionToken, clearSessionToken } from "@/lib/convexClient";
// Import from the convex package - relative path from apps/mobile/hooks to packages/convex
import { api } from "../../../packages/convex/_generated/api.js";
// Mock imports commented out - keeping for future use if needed
// import { mockPhoneLogin, mockSendOTP } from "../utils/mockAuthUtils";
// import { isMockModeEnabled } from "../utils/mockConfig";

export const useAuth = () => {
  const { showToast } = useToast();

  // RTK Query mutations no longer used - using Convex directly
  // const [sendLoginOTP] = useSendLoginOTPMutation();
  // const [phoneLogin] = usePhoneLoginMutation();
  // const [appleSignIn] = useAppleSignInMutation();

  // Send OTP function
  const handleSendOTP = useCallback(
    async (phone: string) => {
      try {
        const convex = getConvexClient();
        
        // Call Convex action directly
        const result = await convex.action(api.actions.users.customerPhoneSendOTP, {
          phone,
        });

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

        // Return in the format expected by the UI
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
      }
    },
    [showToast]
  );

  const handlePhoneLogin = useCallback(
    async (phone: string, otp: string) => {
      try {
        const convex = getConvexClient();
        
        // Call Convex action directly
        const result = await convex.action(api.actions.users.customerPhoneVerifyAndLogin, {
          phone,
          otp,
        });

        // Handle different response types
        if (result.success === false) {
          // Check if it's a 2FA requirement
          if (result.requires2FA && result.verificationToken) {
            return {
              data: {
                success: true,
                requires2FA: true,
                verificationToken: result.verificationToken,
              },
            };
          }
          
          // It's an error
          throw {
            status: 401,
            data: {
              success: false,
              error: {
                code: "401",
                message: result.error || "Phone verification failed.",
              },
            },
          };
        }

        // Success - store session token
        if (result.success && result.sessionToken) {
          await setSessionToken(result.sessionToken);
        }

        // Return in the format expected by the UI
        return {
          data: {
            success: true,
            token: result.sessionToken,
            sessionToken: result.sessionToken,
            user: result.user,
          },
        };
      } catch (error: any) {
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
              message: error?.message || "Phone login failed. Please try again.",
            },
          },
        };
      }
    },
    []
  );

  const handleAppleSignIn = useCallback(
    async (identityToken: string) => {
      try {
        const convex = getConvexClient();
        
        // Call Convex action directly
        const result = await convex.action(api.actions.users.customerAppleSignIn, {
          identityToken,
        });

        // Handle different response types
        if (result.success === false) {
          // Check if it's a 2FA requirement
          if (result.requires2FA && result.verificationToken) {
            return {
              requires2FA: true,
              verificationToken: result.verificationToken,
            };
          }
          
          // It's an error
          throw {
            status: 401,
            data: {
              success: false,
              error: {
                code: "401",
                message: result.error || "Apple sign-in failed.",
              },
            },
          };
        }

        // Success - store session token
        if (result.success && result.sessionToken) {
          await setSessionToken(result.sessionToken);
        }

        // Return in the format expected by the UI
        return {
          token: result.sessionToken,
          user: result.user,
        };
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
      }
    },
    [showToast]
  );

  const handleEmailLogin = useCallback(
    async (email: string, password: string) => {
      try {
        const convex = getConvexClient();
        
        // Call Convex action directly using HTTP client
        const result = await convex.action(api.actions.users.customerEmailLogin, {
          email,
          password,
        });

        // Handle different response types
        if (result.success === false) {
          // Check if it's a 2FA requirement
          if (result.requires2FA && result.verificationToken) {
            return {
              data: {
                success: true,
                requires2FA: true,
                verificationToken: result.verificationToken,
              },
            };
          }
          
          // It's an error
          throw {
            status: 401,
            data: {
              success: false,
              error: {
                code: "401",
                message: result.error || "Invalid credentials.",
              },
            },
          };
        }

        // Success - store session token
        if (result.success && result.sessionToken) {
          await setSessionToken(result.sessionToken);
        }

        // Return in the format expected by the UI
        return {
          data: {
            success: true,
            token: result.sessionToken,
            sessionToken: result.sessionToken,
            user: result.user,
          },
        };
      } catch (error: any) {
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
              message: error?.message || "Login failed. Please try again.",
            },
          },
        };
      }
    },
    []
  );

  const handleEmailRegister = useCallback(
    async (email: string, password: string, name: string) => {
      try {
        const convex = getConvexClient();
        
        // Call Convex action directly
        const result = await convex.action(api.actions.users.customerEmailRegister, {
          email,
          password,
          name,
        });

        if (result.success === false) {
          // Check if user already exists (409 conflict)
          const is409Error = result.error?.includes("already exists");
          
          throw {
            status: is409Error ? 409 : 400,
            data: {
              success: false,
              status: is409Error ? 409 : 400,
              error: {
                code: is409Error ? "409" : "400",
                message: result.error || "Failed to create account. Please try again.",
              },
            },
          };
        }

        // Return in the format expected by the UI
        return {
          success: true,
          data: {
            success: true,
            userId: result.userId,
          },
        };
      } catch (error: any) {
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
              message: error?.message || "Registration failed. Please try again.",
            },
          },
        };
      }
    },
    []
  );

  /**
   * Unified email sign-in or sign-up
   * This handles both sign-in (if user exists) and sign-up (if user doesn't exist)
   */
  const handleEmailSignInOrSignUp = useCallback(
    async (email: string, password: string, name?: string) => {
      try {
        const convex = getConvexClient();
        
        // Call the unified Convex action
        const result = await convex.action(api.actions.users.customerEmailSignInOrSignUp, {
          email,
          password,
          name,
        });

        // Handle different response types
        if (result.success === false) {
          // Check if it's a 2FA requirement
          if (result.requires2FA && result.verificationToken) {
            return {
              data: {
                success: true,
                requires2FA: true,
                verificationToken: result.verificationToken,
              },
            };
          }
          
          // It's an error
          throw {
            status: 401,
            data: {
              success: false,
              error: {
                code: "401",
                message: result.error || "Invalid credentials.",
              },
            },
          };
        }

        // Success - store session token
        if (result.success && result.sessionToken) {
          await setSessionToken(result.sessionToken);
        }

        // Return in the format expected by the UI
        return {
          data: {
            success: true,
            token: result.sessionToken,
            sessionToken: result.sessionToken,
            user: result.user,
          },
        };
      } catch (error: any) {
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
              message: error?.message || "Sign in failed. Please try again.",
            },
          },
        };
      }
    },
    []
  );

  /**
   * Verify 2FA code - for mobile app direct Convex communication
   */
  const handleVerify2FA = useCallback(
    async (verificationToken: string, code: string) => {
      try {
        const convex = getConvexClient();
        
        // Call Convex action directly
        const result = await convex.action(api.actions.users.customerVerify2FA, {
          verificationToken,
          code,
        });

        if (result.success === false) {
          throw {
            status: 401,
            data: {
              success: false,
              error: {
                code: "401",
                message: result.error || "2FA verification failed.",
              },
            },
          };
        }

        // Success - store session token
        if (result.success && result.sessionToken) {
          await setSessionToken(result.sessionToken);
        }

        // Return in the format expected by the UI
        return {
          data: {
            success: true,
            token: result.sessionToken,
            sessionToken: result.sessionToken,
            user: result.user,
          },
        };
      } catch (error: any) {
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
              message: error?.message || "2FA verification failed. Please try again.",
            },
          },
        };
      }
    },
    []
  );

  /**
   * Logout - for mobile app direct Convex communication
   */
  const handleLogout = useCallback(
    async () => {
      try {
        // Get session token from SecureStore
        const { getSessionToken } = await import("@/lib/convexClient");
        const sessionToken = await getSessionToken();
        
        const convex = getConvexClient();
        
        // Call Convex action to invalidate session (if token exists)
        if (sessionToken) {
          try {
            await convex.action(api.actions.users.customerLogout, {
              sessionToken,
            });
          } catch (error) {
            // Log but don't fail - client-side cleanup will handle it
            console.warn("Failed to invalidate session on server:", error);
          }
        }
        
        // Clear session token from SecureStore
        await clearSessionToken();
        
        // Return success
        return {
          success: true,
          data: {
            message: "Logged out successfully",
          },
        };
      } catch (error: any) {
        // Even if there's an error, clear local storage
        await clearSessionToken();
        
        return {
          success: true,
          data: {
            message: "Logged out successfully",
          },
        };
      }
    },
    []
  );

  return {
    handleSendOTP,
    handlePhoneLogin,
    handleAppleSignIn,
    handleEmailLogin,
    handleEmailRegister,
    handleEmailSignInOrSignUp,
    handleVerify2FA,
    handleLogout,
  };
};
