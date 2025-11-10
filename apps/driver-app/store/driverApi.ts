// store/driverApi.ts
import { API_CONFIG } from "@/constants/api";
import {
  ConfirmUploadRequest,
  ConfirmUploadResponse,
  GenerateUploadUrlRequest,
  GenerateUploadUrlResponse,
  GetDriverAdvancedEarningsResponse,
  GetDriverDocumentsResponse,
  GetDriverEarningsResponse,
  GetDriverOrderResponse,
  GetDriverOrdersResponse,
  GetDriverPayoutHistoryResponse,
  GetDriverPerformanceAnalyticsResponse,
  GetDriverProfileResponse,
  GetHelpFAQsResponse,
  GetLegalContentResponse,
  GetUserByIdResponse,
  LogoutResponse,
  PhoneLoginData,
  PhoneLoginResponse,
  SendOTPResponse,
  UpdateDriverLocationRequest,
  UpdateDriverLocationResponse,
  UpdateDriverProfileRequest,
  UpdateDriverProfileResponse,
  UpdateOrderStatusRequest,
  UpdateOrderStatusResponse,
  UploadDriverDocumentRequest,
  UploadDriverDocumentResponse,
} from "@/types/api";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import * as SecureStore from "expo-secure-store";

// ============================================================================
// BASE QUERY CONFIGURATION
// ============================================================================

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_CONFIG.baseUrlNoTrailing,
  prepareHeaders: async (headers, api) => {
    // Extract endpoint info for logging
    const endpoint = (api as any)?.endpoint || (api as any)?.type || 'unknown';
    console.log("[Driver API] prepareHeaders called for endpoint:", endpoint);
    
    try {
      const sessionToken = await SecureStore.getItemAsync("cribnosh_session_token");
      console.log("[Driver API] SessionToken exists:", !!sessionToken);
      console.log("[Driver API] SessionToken length:", sessionToken?.length || 0);
      
      if (sessionToken) {
        headers.set("X-Session-Token", sessionToken);
        console.log("[Driver API] X-Session-Token header set for endpoint:", endpoint);
      } else {
        console.log("[Driver API] No sessionToken found in SecureStore for endpoint:", endpoint);
      }
    } catch (error) {
      console.error("[Driver API] Error accessing SecureStore for endpoint:", endpoint, error);
    }
    
    headers.set("accept", "application/json");
    headers.set("content-type", "application/json");
    return headers;
  },
});

/**
 * Check if an endpoint requires authentication
 * Public endpoints that don't require auth should be listed here
 */
const requiresAuthentication = (url: string): boolean => {
  // Public endpoints that don't require authentication
  const publicEndpoints = [
    '/auth/',
    '/public/',
    '/health',
    '/ping',
  ];
  
  // Check if URL matches any public endpoint
  return !publicEndpoints.some(endpoint => url.includes(endpoint));
};

/**
 * Fast check for session token existence
 */
const checkAuthentication = async (url: string): Promise<{ hasAuth: boolean; error?: any }> => {
  if (!requiresAuthentication(url)) {
    return { hasAuth: true };
  }
  
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
    console.error("[Driver API] Error checking authentication:", error);
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
    
    // RTK Query expects { error: { status, data } } format
    return { error: authCheck.error };
  }
  
  // For FormData requests, don't set content-type (let browser set it with boundary)
  if (args.body instanceof FormData) {
    // Create a custom fetchBaseQuery that doesn't set content-type
    const customBaseQuery = fetchBaseQuery({
      baseUrl: API_CONFIG.baseUrlNoTrailing,
      prepareHeaders: async (headers) => {
        const sessionToken = await SecureStore.getItemAsync("cribnosh_session_token");
        if (sessionToken) {
          headers.set("X-Session-Token", sessionToken);
        }
        headers.set("accept", "application/json");
        // Don't set content-type for FormData - let browser set it with boundary
        return headers;
      },
    });
    const result = await customBaseQuery(args, api, extraOptions);
    
    // Handle 401 errors
    if (result.error && (result.error as any).status === 401) {
      await SecureStore.deleteItemAsync("cribnosh_session_token").catch(() => {});
      await SecureStore.deleteItemAsync("cribnosh_user").catch(() => {});
    }
    
    return result;
  }
  
  const result = await rawBaseQuery(args, api, extraOptions);
  
  // Handle 401 errors
  if (result.error && (result.error as any).status === 401) {
    await SecureStore.deleteItemAsync("cribnosh_session_token").catch(() => {});
    await SecureStore.deleteItemAsync("cribnosh_user").catch(() => {});
  }
  
  return result;
};

// ============================================================================
// DRIVER API DEFINITION
// ============================================================================

export const driverApi = createApi({
  reducerPath: "driverApi",
  baseQuery,
  tagTypes: [
    "DriverProfile",
    "DriverOrders",
    "DriverEarnings",
    "DriverDocuments",
    "DriverLocation",
  ] as const,
  endpoints: (builder) => ({
    // ========================================================================
    // AUTHENTICATION ENDPOINTS (Using Web API)
    // ========================================================================

    /**
     * Send OTP for phone authentication
     * POST /api/auth/phone-signin (action: 'send')
     */
    sendDriverOTP: builder.mutation<SendOTPResponse, { phoneNumber: string }>({
      query: (data) => ({
        url: "/auth/phone-signin",
        method: "POST",
        body: {
          phone: data.phoneNumber,
          action: 'send',
        },
      }),
    }),

    /**
     * Verify OTP and login driver
     * POST /api/auth/phone-signin (action: 'verify')
     */
    phoneLogin: builder.mutation<PhoneLoginResponse, PhoneLoginData>({
      query: (data) => ({
        url: "/auth/phone-signin",
        method: "POST",
        body: {
          phone: data.phoneNumber,
          action: 'verify',
          otp: data.otp,
        },
      }),
      transformResponse: async (response: any) => {
        if (response?.data?.sessionToken) {
          await SecureStore.setItemAsync("cribnosh_session_token", response.data.sessionToken);
        }
        return response;
      },
    }),

    /**
     * Email/password login
     * POST /api/auth/login
     */
    emailLogin: builder.mutation<PhoneLoginResponse, { email: string; password: string }>({
      query: (data) => ({
        url: "/auth/login",
        method: "POST",
        body: data,
      }),
      transformResponse: async (response: any) => {
        if (response?.data?.sessionToken) {
          await SecureStore.setItemAsync("cribnosh_session_token", response.data.sessionToken);
        }
        return response;
      },
    }),

    /**
     * Get current user profile
     * GET /api/auth/me
     */
    getCurrentUser: builder.query<any, void>({
      query: () => ({
        url: "/auth/me",
        method: "GET",
      }),
      providesTags: ["DriverProfile"],
    }),

    // ========================================================================
    // DRIVER PROFILE ENDPOINTS
    // ========================================================================

    /**
     * Get current driver profile
     * GET /api/driver/profile/me
     */
    getDriverProfile: builder.query<GetDriverProfileResponse, void>({
      query: () => ({
        url: "/driver/profile/me",
        method: "GET",
      }),
      providesTags: ["DriverProfile"],
    }),

    /**
     * Update current driver profile
     * PUT /api/driver/profile/me
     */
    updateDriverProfile: builder.mutation<
      UpdateDriverProfileResponse,
      UpdateDriverProfileRequest
    >({
      query: (data) => ({
        url: "/driver/profile/me",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["DriverProfile"],
    }),

    /**
     * Get drivers (using web endpoint)
     * GET /api/delivery/drivers
     */
    getDrivers: builder.query<any, { status?: string; availability?: string; limit?: number; offset?: number }>({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.status) searchParams.append("status", params.status);
        if (params.availability) searchParams.append("availability", params.availability);
        if (params.limit) searchParams.append("limit", params.limit.toString());
        if (params.offset) searchParams.append("offset", params.offset.toString());

        const queryString = searchParams.toString();
        return {
          url: `/delivery/drivers${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["DriverProfile"],
    }),

    // ========================================================================
    // ORDERS ENDPOINTS
    // ========================================================================

    /**
     * Get driver orders
     * GET /api/driver/orders
     */
    getDriverOrders: builder.query<
      GetDriverOrdersResponse,
      { limit?: number; offset?: number; status?: string }
    >({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.limit) searchParams.append("limit", params.limit.toString());
        if (params.offset) searchParams.append("offset", params.offset.toString());
        if (params.status) searchParams.append("status", params.status);

        const queryString = searchParams.toString();
        return {
          url: `/driver/orders${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["DriverOrders"],
    }),

    /**
     * Get available orders (orders assigned to driver with status=assigned)
     * GET /api/driver/orders?status=assigned
     */
    getAvailableOrders: builder.query<GetDriverOrdersResponse, { limit?: number; offset?: number }>({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        searchParams.append("status", "assigned");
        if (params.limit) searchParams.append("limit", params.limit.toString());
        if (params.offset) searchParams.append("offset", params.offset.toString());

        const queryString = searchParams.toString();
        return {
          url: `/driver/orders?${queryString}`,
          method: "GET",
        };
      },
      providesTags: ["DriverOrders"],
    }),

    /**
     * Get driver order by ID
     * GET /api/driver/orders/{id}
     */
    getDriverOrder: builder.query<GetDriverOrderResponse, string>({
      query: (orderId) => ({
        url: `/driver/orders/${orderId}`,
        method: "GET",
      }),
      providesTags: (result, error, orderId) => [{ type: "DriverOrders", id: orderId }],
    }),

    /**
     * Get order by ID (using web endpoint)
     * GET /api/orders/{id}
     */
    getOrder: builder.query<any, string>({
      query: (orderId) => ({
        url: `/orders/${orderId}`,
        method: "GET",
      }),
      providesTags: (result, error, orderId) => [{ type: "DriverOrders", id: orderId }],
    }),

    /**
     * Update order status
     * POST /api/orders/{order_id}/status (using web endpoint)
     */
    updateOrderStatus: builder.mutation<
      UpdateOrderStatusResponse,
      UpdateOrderStatusRequest
    >({
      query: (data) => ({
        url: `/orders/${data.orderId}/status`,
        method: "POST",
        body: {
          status: data.status,
          location: data.location,
        },
      }),
      invalidatesTags: ["DriverOrders"],
    }),

    /**
     * Accept order
     * POST /api/driver/orders/{id}/accept
     */
    acceptOrder: builder.mutation<any, string>({
      query: (orderId) => ({
        url: `/driver/orders/${orderId}/accept`,
        method: "POST",
      }),
      invalidatesTags: ["DriverOrders"],
    }),

    /**
     * Decline order
     * POST /api/driver/orders/{id}/decline
     */
    declineOrder: builder.mutation<any, string>({
      query: (orderId) => ({
        url: `/driver/orders/${orderId}/decline`,
        method: "POST",
      }),
      invalidatesTags: ["DriverOrders"],
    }),

    // ========================================================================
    // LOCATION ENDPOINTS (Using Web API)
    // ========================================================================

    /**
     * Update driver location and availability
     * POST /api/delivery/drivers (using web endpoint)
     */
    updateDriverLocation: builder.mutation<
      UpdateDriverLocationResponse,
      UpdateDriverLocationRequest
    >({
      query: (data) => ({
        url: "/delivery/drivers",
        method: "POST",
        body: {
          driverId: data.driverId,
          location: data.location,
          availability: data.availability,
          metadata: data.metadata,
        },
      }),
      invalidatesTags: ["DriverLocation", "DriverProfile"],
    }),

    // ========================================================================
    // EARNINGS ENDPOINTS
    // ========================================================================

    /**
     * Get driver earnings
     * GET /api/driver/earnings
     */
    getDriverEarnings: builder.query<
      GetDriverEarningsResponse,
      { startDate?: number; endDate?: number }
    >({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.startDate) searchParams.append("startDate", params.startDate.toString());
        if (params.endDate) searchParams.append("endDate", params.endDate.toString());

        const queryString = searchParams.toString();
        return {
          url: `/driver/earnings${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["DriverEarnings"],
    }),

    /**
     * Request payout
     * POST /api/driver/payouts/request
     */
    requestPayout: builder.mutation<
      { success: boolean; message: string; payoutId?: string },
      { amount: number; bankDetails: { accountNumber: string; bankName: string; accountName: string } }
    >({
      query: (data) => ({
        url: "/driver/payouts/request",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["DriverEarnings"],
    }),

    // ========================================================================
    // DOCUMENTS ENDPOINTS
    // ========================================================================

    /**
     * Get driver documents
     * GET /driver/documents
     */
    getDriverDocuments: builder.query<GetDriverDocumentsResponse, void>({
      query: () => ({
        url: "/driver/documents",
        method: "GET",
      }),
      providesTags: ["DriverDocuments"],
    }),

    /**
     * Upload driver document
     * POST /driver/documents
     */
    uploadDriverDocument: builder.mutation<
      UploadDriverDocumentResponse,
      UploadDriverDocumentRequest
    >({
      query: (data) => {
        const formData = new FormData();
        formData.append("type", data.type);
        formData.append("file", data.file as any);
        
        return {
          url: "/driver/documents",
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["DriverDocuments", "DriverProfile"],
    }),

    // ========================================================================
    // DRIVER REGISTRATION ENDPOINTS
    // ========================================================================

    /**
     * Get vehicle types
     * GET /api/driver/vehicles/types
     */
    getVehicleTypes: builder.query<{ id: string; name: string }[], void>({
      query: () => ({
        url: "/driver/vehicles/types",
        method: "GET",
      }),
    }),

    /**
     * Get vehicle models by type
     * GET /api/driver/vehicles/models?vehicleType={type}
     */
    getVehicleModels: builder.query<{ id: string; name: string }[], string>({
      query: (vehicleType) => ({
        url: `/driver/vehicles/models?vehicleType=${encodeURIComponent(vehicleType)}`,
        method: "GET",
      }),
    }),

    /**
     * Get vehicle years
     * GET /api/driver/vehicles/years
     */
    getVehicleYears: builder.query<{ id: string; name: string }[], void>({
      query: () => ({
        url: "/driver/vehicles/years",
        method: "GET",
      }),
    }),

    /**
     * Get banks
     * GET /api/driver/banks
     */
    getBanks: builder.query<{ code: string; name: string }[], void>({
      query: () => ({
        url: "/driver/banks",
        method: "GET",
      }),
    }),

    /**
     * Verify bank account
     * POST /api/driver/banks/verify
     * Note: Stripe doesn't provide account name verification for UK accounts without user interaction
     * This endpoint validates the account format only - account name must be entered manually
     */
    verifyBankAccount: builder.mutation<
      { success: boolean; verified: boolean; message?: string; error?: string },
      { accountNumber: string; bankCode: string }
    >({
      query: (data) => ({
        url: "/driver/banks/verify",
        method: "POST",
        body: data,
      }),
    }),

    /**
     * Register driver
     * POST /api/driver/register
     */
    registerDriver: builder.mutation<
      { success: boolean; driverId: string; userId?: string },
      {
        sessionToken?: string;
        firstName: string;
        lastName: string;
        email: string;
        phoneNumber: string;
        vehicleType: string;
        vehicleModel: string;
        vehicleYear: string;
        licensePlate: string;
        driversLicense: string;
        driversLicenseFileId?: string;
        vehicleRegistration: string;
        vehicleRegistrationFileId?: string;
        insurance: string;
        insuranceFileId?: string;
        bankName: string;
        bankCode: string;
        accountNumber: string;
        accountName: string;
        workType?: 'independent' | 'supplier';
        supplierId?: string;
      }
    >({
      query: (data) => ({
        url: "/driver/register",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["DriverProfile"],
    }),

    // ========================================================================
    // USER & CUSTOMER ENDPOINTS
    // ========================================================================

    /**
     * Get user by ID
     * GET /api/users/{id}
     */
    getUserById: builder.query<GetUserByIdResponse, string>({
      query: (userId) => ({
        url: `/users/${userId}`,
        method: "GET",
      }),
    }),

    // ========================================================================
    // PERFORMANCE & ANALYTICS ENDPOINTS
    // ========================================================================

    /**
     * Get driver performance analytics
     * GET /api/driver/performance/analytics?metricType={type}&period={period}
     */
    getDriverPerformanceAnalytics: builder.query<
      GetDriverPerformanceAnalyticsResponse,
      { metricType?: 'efficiency' | 'safety' | 'customer'; period?: '7d' | '30d' | '90d' }
    >({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.metricType) searchParams.append("metricType", params.metricType);
        if (params.period) searchParams.append("period", params.period);

        const queryString = searchParams.toString();
        return {
          url: `/driver/performance/analytics${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
    }),

    /**
     * Get advanced driver earnings
     * GET /api/driver/earnings/advanced?period={period}
     */
    getDriverAdvancedEarnings: builder.query<
      GetDriverAdvancedEarningsResponse,
      { period?: '7d' | '30d' | '90d' | 'all' }
    >({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.period) searchParams.append("period", params.period);

        const queryString = searchParams.toString();
        return {
          url: `/driver/earnings/advanced${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
    }),

    /**
     * Get driver payout history
     * GET /api/driver/payouts/history?limit={limit}&offset={offset}&status={status}
     */
    getDriverPayoutHistory: builder.query<
      GetDriverPayoutHistoryResponse,
      { limit?: number; offset?: number; status?: string }
    >({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.limit) searchParams.append("limit", params.limit.toString());
        if (params.offset) searchParams.append("offset", params.offset.toString());
        if (params.status) searchParams.append("status", params.status);

        const queryString = searchParams.toString();
        return {
          url: `/driver/payouts/history${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
    }),

    // ========================================================================
    // FILE UPLOAD ENDPOINTS
    // ========================================================================

    /**
     * Generate upload URL
     * POST /api/files/upload-url
     */
    generateUploadUrl: builder.mutation<
      GenerateUploadUrlResponse,
      GenerateUploadUrlRequest
    >({
      query: (data) => ({
        url: "/files/upload-url",
        method: "POST",
        body: data,
      }),
    }),

    /**
     * Confirm file upload
     * POST /api/files/confirm-upload
     */
    confirmUpload: builder.mutation<
      ConfirmUploadResponse,
      ConfirmUploadRequest
    >({
      query: (data) => ({
        url: "/files/confirm-upload",
        method: "POST",
        body: data,
      }),
    }),

    // ========================================================================
    // LEGAL CONTENT & HELP ENDPOINTS
    // ========================================================================

    /**
     * Get community guidelines
     * GET /api/legal/community-guidelines
     */
    getCommunityGuidelines: builder.query<GetLegalContentResponse, void>({
      query: () => ({
        url: "/legal/community-guidelines",
        method: "GET",
      }),
    }),

    /**
     * Get privacy policy
     * GET /api/legal/privacy-policy
     */
    getPrivacyPolicy: builder.query<GetLegalContentResponse, void>({
      query: () => ({
        url: "/legal/privacy-policy",
        method: "GET",
      }),
    }),

    /**
     * Get refund policy
     * GET /api/legal/refund-policy
     */
    getRefundPolicy: builder.query<GetLegalContentResponse, void>({
      query: () => ({
        url: "/legal/refund-policy",
        method: "GET",
      }),
    }),

    /**
     * Get terms of service
     * GET /api/legal/terms-of-service
     */
    getTermsOfService: builder.query<GetLegalContentResponse, void>({
      query: () => ({
        url: "/legal/terms-of-service",
        method: "GET",
      }),
    }),

    /**
     * Get help FAQs
     * GET /api/help/faqs
     */
    getHelpFAQs: builder.query<GetHelpFAQsResponse, void>({
      query: () => ({
        url: "/help/faqs",
        method: "GET",
      }),
    }),

    // ========================================================================
    // AUTHENTICATION ENDPOINTS
    // ========================================================================

    /**
     * Logout user
     * POST /api/auth/logout
     */
    logout: builder.mutation<LogoutResponse, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      invalidatesTags: ["DriverProfile"],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useSendDriverOTPMutation,
  usePhoneLoginMutation,
  useEmailLoginMutation,
  useGetCurrentUserQuery,
  useGetDriverProfileQuery,
  useUpdateDriverProfileMutation,
  useGetDriversQuery,
  useGetDriverOrdersQuery,
  useGetAvailableOrdersQuery,
  useGetDriverOrderQuery,
  useGetOrderQuery,
  useUpdateOrderStatusMutation,
  useAcceptOrderMutation,
  useDeclineOrderMutation,
  useUpdateDriverLocationMutation,
  useGetDriverEarningsQuery,
  useRequestPayoutMutation,
  useGetDriverDocumentsQuery,
  useUploadDriverDocumentMutation,
  useGetVehicleTypesQuery,
  useGetVehicleModelsQuery,
  useGetVehicleYearsQuery,
  useGetBanksQuery,
  useVerifyBankAccountMutation,
  useRegisterDriverMutation,
  useGetUserByIdQuery,
  useGetDriverPerformanceAnalyticsQuery,
  useGetDriverAdvancedEarningsQuery,
  useGetDriverPayoutHistoryQuery,
  useGenerateUploadUrlMutation,
  useConfirmUploadMutation,
  useGetCommunityGuidelinesQuery,
  useGetPrivacyPolicyQuery,
  useGetRefundPolicyQuery,
  useGetTermsOfServiceQuery,
  useGetHelpFAQsQuery,
  useLogoutMutation,
} = driverApi;

