// store/authApi.ts
import {
  PhoneLoginData,
  PhoneLoginResponse,
  SendLoginOTPResponse,
  Verify2FARequest,
  Verify2FAResponse,
} from "@/types/auth";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import * as SecureStore from "expo-secure-store";
import { getDeviceInfo } from "../utils/device";

import { API_CONFIG } from '@/constants/api';

// Network request timeout (30 seconds)
const NETWORK_TIMEOUT_MS = 30000;

// Helper function to add timeout to fetch requests
// RTK Query's fetchFn expects (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
const fetchWithTimeout = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), NETWORK_TIMEOUT_MS);
  
  // Merge abort signal with existing signal if present
  const existingSignal = init?.signal;
  if (existingSignal) {
    existingSignal.addEventListener('abort', () => controller.abort());
  }
  
  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError' && !existingSignal?.aborted) {
      throw new Error(`Request timeout: Request took longer than ${NETWORK_TIMEOUT_MS}ms`);
    }
    throw error;
  }
};

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_CONFIG.baseUrlNoTrailing,
  fetchFn: fetchWithTimeout,
  prepareHeaders: async (headers) => {
    // Get sessionToken from SecureStore
    const sessionToken = await SecureStore.getItemAsync("cribnosh_session_token");
    if (sessionToken) {
      // Send sessionToken in X-Session-Token header (preferred) or as Bearer token
      headers.set("X-Session-Token", sessionToken);
      // Alternative: headers.set("authorization", `Bearer ${sessionToken}`);
    }
    headers.set("accept", "application/json");
    return headers;
  },
});

/**
 * Check if an endpoint requires authentication
 * Auth endpoints don't require authentication (they're used to authenticate)
 * But some endpoints like logout might require authentication
 */
const requiresAuthentication = (url: string): boolean => {
  // Auth endpoints that don't require authentication
  const publicAuthEndpoints = [
    '/auth/login',
    '/auth/phone-signin',
    '/auth/apple-signin',
    '/auth/google-signin',
    '/auth/register',
    '/auth/verify-2fa',
    '/auth/send-otp',
  ];
  
  // Check if URL matches any public auth endpoint
  return !publicAuthEndpoints.some(endpoint => url.includes(endpoint));
};

/**
 * Fast check for session token existence
 * This is called BEFORE making any API call to fail fast if no token exists
 */
const checkAuthentication = async (url: string): Promise<{ hasAuth: boolean; error?: any }> => {
  // Check if endpoint requires authentication
  if (!requiresAuthentication(url)) {
    return { hasAuth: true }; // Public auth endpoint, no auth needed
  }
  
  // Fast check: Fail immediately if no token exists (no API call)
  try {
    const sessionToken = await SecureStore.getItemAsync("cribnosh_session_token");
    if (!sessionToken) {
      return {
        hasAuth: false,
        error: {
          status: 401,
          data: {
            success: false,
            error: {
              code: '401',
              message: 'Authentication required. Please sign in.',
            },
          },
        },
      };
    }
    return { hasAuth: true };
  } catch (error) {
    console.error("[Auth API] Error checking authentication:", error);
    return {
      hasAuth: false,
      error: {
        status: 401,
        data: {
          success: false,
          error: {
            code: '401',
            message: 'Authentication required. Please sign in.',
          },
        },
      },
    };
  }
};

// Custom baseQuery wrapper to handle non-JSON responses (e.g., HTML 404 pages)
const baseQuery = async (args: any, api: any, extraOptions: any) => {
  // Fast authentication check BEFORE making API call
  const url = typeof args === 'string' ? args : args?.url || '';
  const authCheck = await checkAuthentication(url);
  
  if (!authCheck.hasAuth) {
    // Return error immediately without making API call
    // Clear expired/invalid sessionToken
    await SecureStore.deleteItemAsync("cribnosh_session_token").catch(() => {});
    await SecureStore.deleteItemAsync("cribnosh_user").catch(() => {});
    
    // Handle 401 error (dynamic import to avoid circular deps)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { handle401Error } = require("@/utils/authErrorHandler");
    handle401Error(authCheck.error);
    
    // RTK Query expects { error: { status, data } } format
    return { error: authCheck.error };
  }
  
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
    // BUT skip redirect for authentication endpoints (login, phone-signin, apple-signin)
    // because 401 errors from these endpoints are expected (invalid credentials)
    // and should be displayed in the login form, not trigger a redirect
    const errorCode = (errorData as any)?.error?.code;
    const is401 = errorStatus === 401 || errorStatus === "401" || errorCode === 401 || errorCode === "401";
    
    if (is401) {
      // Clear expired/invalid sessionToken
      await SecureStore.deleteItemAsync("cribnosh_session_token");
      await SecureStore.deleteItemAsync("cribnosh_user");
      
      // Check if this is an authentication endpoint (login, phone-signin, apple-signin)
      // These endpoints should NOT trigger redirect - let the error be handled by the login form
      const url = typeof args === 'string' ? args : args?.url || '';
      const isAuthEndpoint = url.includes('/auth/login') || 
                            url.includes('/auth/phone-signin') || 
                            url.includes('/auth/apple-signin');
      
      // Only redirect if NOT an authentication endpoint
      if (!isAuthEndpoint) {
        // Use the global 401 handler (dynamic import to avoid circular deps)
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { handle401Error } = require("@/utils/authErrorHandler");
        handle401Error(result.error);
      }
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
      query: async (data) => {
        const deviceInfo = await getDeviceInfo();
        return {
          url: "/auth/phone-signin",
          method: "POST",
          body: { ...data, ...deviceInfo },
        };
      },
    }),
    phoneLogin: builder.mutation<PhoneLoginResponse, PhoneLoginData>({
      query: async (data) => {
        const deviceInfo = await getDeviceInfo();
        return {
          url: "/auth/phone-signin",
          method: "POST",
          body: { ...data, ...deviceInfo },
        };
      },
      transformResponse: async (response: any) => {
        // Store sessionToken if present in response
        if (response?.data?.sessionToken) {
          await SecureStore.setItemAsync("cribnosh_session_token", response.data.sessionToken);
        }
        return response;
      },
    }),
    appleSignIn: builder.mutation<
      {
        success: boolean;
        data: {
          success: boolean;
          message: string;
          token?: string;
          sessionToken?: string;
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
      query: async (data) => {
        const deviceInfo = await getDeviceInfo();
        return {
          url: "/auth/apple-signin",
          method: "POST",
          body: { ...data, ...deviceInfo },
        };
      },
      transformResponse: async (response: any) => {
        // Store sessionToken if present in response
        if (response?.data?.sessionToken) {
          await SecureStore.setItemAsync("cribnosh_session_token", response.data.sessionToken);
        }
        return response;
      },
    }),
    verify2FA: builder.mutation<Verify2FAResponse, Verify2FARequest>({
      query: async (data) => {
        const deviceInfo = await getDeviceInfo();
        return {
          url: "/auth/verify-2fa",
          method: "POST",
          body: { ...data, ...deviceInfo },
        };
      },
      transformResponse: async (response: any) => {
        // Store sessionToken if present in response (after 2FA verification)
        if (response?.data?.sessionToken) {
          await SecureStore.setItemAsync("cribnosh_session_token", response.data.sessionToken);
        }
        return response;
      },
    }),
    emailLogin: builder.mutation<PhoneLoginResponse, { email: string; password: string }>({
      query: async (data) => {
        const deviceInfo = await getDeviceInfo();
        return {
          url: "/auth/login",
          method: "POST",
          body: { ...data, ...deviceInfo },
        };
      },
      transformResponse: async (response: any) => {
        // Store sessionToken if present in response
        if (response?.data?.sessionToken) {
          await SecureStore.setItemAsync("cribnosh_session_token", response.data.sessionToken);
        }
        return response;
      },
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
      transformResponse: async () => {
        // Clear sessionToken on logout
        await SecureStore.deleteItemAsync("cribnosh_session_token");
        await SecureStore.deleteItemAsync("cribnosh_user");
        return { success: true, data: { message: "Logged out successfully" }, message: "Logged out" };
      },
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
