// store/authApi.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import * as SecureStore from "expo-secure-store";
import { isTokenExpired } from "@/utils/jwtUtils";
import {
  PhoneLoginData,
  PhoneLoginResponse,
  SendLoginOTPResponse,
  Verify2FARequest,
  Verify2FAResponse,
} from "@/types/auth";

import { API_CONFIG } from '@/constants/api';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_CONFIG.baseUrlNoTrailing,
  prepareHeaders: async (headers) => {
    const token = await SecureStore.getItemAsync("cribnosh_token");
    if (token) {
      // Check if token is expired before adding to headers
      if (isTokenExpired(token)) {
        // Clear expired token
        await SecureStore.deleteItemAsync("cribnosh_token");
        await SecureStore.deleteItemAsync("cribnosh_user");
        // Don't add the expired token to headers
        console.log("Token expired, cleared from storage");
      } else {
        headers.set("authorization", `Bearer ${token}`);
      }
    }
    headers.set("accept", "application/json");
    return headers;
  },
});

// Custom baseQuery wrapper to handle non-JSON responses (e.g., HTML 404 pages)
const baseQuery = async (args: any, api: any, extraOptions: any) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  // Handle parsing errors (when server returns HTML instead of JSON)
  if (result.error && result.error.status === "PARSING_ERROR") {
    const originalStatus = (result.error as any).originalStatus || 404;
    const data = (result.error as any).data;

    // Check if the response is HTML
    if (typeof data === "string" && (data.trim().startsWith("<!DOCTYPE") || data.trim().startsWith("<html"))) {
      return {
        error: {
          status: originalStatus,
          data: {
            success: false,
            error: {
              code: `${originalStatus}`,
              message: originalStatus === 404
                ? "Endpoint not found. This feature may not be available yet."
                : `Server error: ${originalStatus}`,
            },
          },
        },
      };
    }
  }

  // Handle other errors and normalize the error format
  if (result.error) {
    const errorStatus = typeof result.error.status === "number" 
      ? result.error.status 
      : (result.error as any).originalStatus || 500;
    
    const errorData = result.error.data;

    // Handle 401 errors globally - redirect to sign-in
    // Note: authApi endpoints typically don't require auth, but handle it anyway for consistency
    const errorCode = (errorData as any)?.error?.code;
    if (errorStatus === 401 || errorStatus === "401" || errorCode === 401 || errorCode === "401") {
      // Clear expired/invalid tokens
      await SecureStore.deleteItemAsync("cribnosh_token");
      await SecureStore.deleteItemAsync("cribnosh_user");
      
      // Use the global 401 handler (dynamic import to avoid circular deps)
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { handle401Error } = require("@/utils/authErrorHandler");
      handle401Error(result.error);
    }

    // If error data is already in the expected format, return as is
    if (errorData && typeof errorData === "object" && "error" in errorData) {
      return result;
    }

    // Normalize error format
    const normalizedErrorData = errorData && typeof errorData === "object" 
      ? (errorData as any)
      : {};
    
    return {
      error: {
        status: errorStatus,
        data: {
          success: false,
          error: {
            code: `${errorStatus}`,
            message: 
              normalizedErrorData?.error?.message ||
              normalizedErrorData?.message ||
              (errorStatus === 401 ? "Unauthorized. Please sign in again." :
               errorStatus === 403 ? "Forbidden. You don't have permission." :
               errorStatus === 404 ? "Resource not found." :
               errorStatus === 500 ? "Internal server error. Please try again later." :
               `Request failed with status ${errorStatus}`),
          },
        },
      },
    };
  }

  return result;
};

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery,
  tagTypes: ["Auth", "User"],
  endpoints: (builder) => ({
    sendLoginOTP: builder.mutation<SendLoginOTPResponse, PhoneLoginData>({
      query: (data) => ({
        url: "/auth/phone-signin",
        method: "POST",
        body: data,
      }),
    }),
    phoneLogin: builder.mutation<PhoneLoginResponse, PhoneLoginData>({
      query: (data) => ({
        url: "/auth/phone-signin",
        method: "POST",
        body: data,
      }),
    }),
    appleSignIn: builder.mutation<
      {
        success: boolean;
        data: {
          success: boolean;
          message: string;
          token?: string;
          user?: {
            user_id: string;
            email: string;
            name: string;
            roles: string[];
            picture?: string;
            isNewUser: boolean;
            provider: string;
          };
          requires2FA?: boolean;
          verificationToken?: string;
        };
        message: string;
      },
      { identityToken: string }
    >({
      query: (data) => ({
        url: "/auth/apple-signin",
        method: "POST",
        body: data,
      }),
    }),
    verify2FA: builder.mutation<Verify2FAResponse, Verify2FARequest>({
      query: (data) => ({
        url: "/auth/verify-2fa",
        method: "POST",
        body: data,
      }),
    }),
    emailLogin: builder.mutation<PhoneLoginResponse, { email: string; password: string }>({
      query: (data) => ({
        url: "/auth/login",
        method: "POST",
        body: data,
      }),
    }),
    logout: builder.mutation<
      {
        success: boolean;
        data: {
          message: string;
        };
        message: string;
      },
      void
    >({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
    }),
  }),
});

export const {
  useSendLoginOTPMutation,
  usePhoneLoginMutation,
  useAppleSignInMutation,
  useEmailLoginMutation,
  useLogoutMutation,
} = authApi;
