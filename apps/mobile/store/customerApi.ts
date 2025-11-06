// store/customerApi.ts
import { API_CONFIG } from "@/constants/api";
import {
  AcceptFamilyInvitationRequest,
  AcceptFamilyInvitationResponse,
  AddPaymentMethodRequest,
  AddPaymentMethodResponse,
  // Request types
  AddToCartRequest,
  AddToCartResponse,
  CancelOrderRequest,
  CancelOrderResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  ChatMessageRequest,
  ChatMessageResponse,
  CheckRegionAvailabilityRequest,
  CheckRegionAvailabilityResponse,
  CheckoutRequest,
  CheckoutResponse,
  // New search types
  Chef,
  ChefSearchParams,
  ChefSearchResponse,
  CloseGroupOrderResponse,
  CreateCustomOrderRequest,
  CreateCustomOrderResponse,
  CreateEventChefRequestRequest,
  CreateEventChefRequestResponse,
  CreateGroupOrderRequest,
  CreateGroupOrderResponse,
  CreateOrderFromCartRequest,
  CreateOrderFromCartResponse,
  CreateOrderRequest,
  CreateOrderResponse,
  CreateSetupIntentResponse,
  CreateSupportCaseRequest,
  CreateSupportCaseResponse,
  DeleteAccountFeedbackRequest,
  DeleteAccountResponse,
  DeleteCustomOrderResponse,
  DisableTwoFactorRequest,
  DisableTwoFactorResponse,
  DownloadAccountDataResponse,
  EmotionsSearchRequest,
  EmotionsSearchResponse,
  GenerateSharedOrderLinkRequest,
  GenerateSharedOrderLinkResponse,
  GetActiveOffersParams,
  GetActiveOffersResponse,
  GetAllergiesResponse,
  GetBalanceTransactionsResponse,
  GetCaloriesProgressResponse,
  GetCartResponse,
  GetChefDetailsParams,
  GetChefDetailsResponse,
  GetChefMenusResponse,
  GetCribnoshBalanceResponse,
  GetCuisinesResponse,
  GetCustomOrderResponse,
  GetCustomOrdersResponse,
  // Response types
  GetCustomerProfileResponse,
  GetDataSharingPreferencesResponse,
  GetDietaryPreferencesResponse,
  GetDishDetailsResponse,
  GetFamilyOrdersResponse,
  GetFamilyProfileResponse,
  GetFamilySpendingResponse,
  GetForkPrintScoreResponse,
  GetGroupOrderResponse,
  GetLiveChatResponse,
  GetLiveCommentsResponse,
  GetLiveReactionsResponse,
  GetLiveSessionDetailsResponse,
  GetLiveStreamOrdersResponse,
  GetLiveStreamsResponse,
  GetLiveViewersResponse,
  GetMenuDetailsResponse,
  GetMonthlyOverviewResponse,
  GetNoshPointsResponse,
  GetNotificationStatsResponse,
  GetNotificationsResponse,
  GetOrderResponse,
  GetOrderStatusResponse,
  GetOrdersResponse,
  GetPaymentMethodsResponse,
  GetPopularChefDetailsResponse,
  GetPopularChefsResponse,
  GetQuickRepliesResponse,
  GetSessionsResponse,
  GetSimilarDishesResponse,
  GetSupportAgentResponse,
  GetSupportCasesResponse,
  GetSupportChatMessagesResponse,
  GetSupportChatResponse,
  GetTopCuisinesParams,
  GetTopCuisinesResponse,
  GetWeeklySummaryResponse,
  InviteFamilyMemberRequest,
  InviteFamilyMemberResponse,
  JoinGroupOrderRequest,
  JoinGroupOrderResponse,
  MarkNotificationReadResponse,
  PaginationParams,
  RateOrderRequest,
  RateOrderResponse,
  RemoveCartItemResponse,
  RemoveFamilyMemberRequest,
  RevokeSessionResponse,
  SearchChefsByLocationRequest,
  SearchChefsByLocationResponse,
  SearchChefsRequest,
  SearchChefsResponse,
  SearchRequest,
  SearchResponse,
  SearchSuggestionsParams,
  SearchSuggestionsResponse,
  SendLiveCommentRequest,
  SendLiveCommentResponse,
  SendLiveReactionRequest,
  SendLiveReactionResponse,
  SendSupportMessageRequest,
  SendSupportMessageResponse,
  SetDefaultPaymentMethodResponse,
  SetupFamilyProfileRequest,
  SetupFamilyProfileResponse,
  SetupTwoFactorResponse,
  SortParams,
  TopUpBalanceRequest,
  TopUpBalanceResponse,
  TrendingSearchParams,
  TrendingSearchResponse,
  UpdateAllergiesRequest,
  UpdateAllergiesResponse,
  UpdateCartItemRequest,
  UpdateCartItemResponse,
  UpdateCrossContaminationSettingRequest,
  UpdateCrossContaminationSettingResponse,
  UpdateCustomOrderRequest,
  UpdateCustomOrderResponse,
  UpdateCustomerProfileRequest,
  UpdateCustomerProfileResponse,
  UpdateDataSharingPreferencesRequest,
  UpdateDataSharingPreferencesResponse,
  UpdateDietaryPreferencesRequest,
  UpdateDietaryPreferencesResponse,
  UpdateMemberBudgetRequest,
  UpdateMemberPreferencesRequest,
  UpdateMemberRequest,
  UploadProfileImageResponse,
  ValidateFamilyMemberEmailRequest,
  ValidateFamilyMemberEmailResponse,
} from "@/types/customer";
import { isTokenExpired } from "@/utils/jwtUtils";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import * as SecureStore from "expo-secure-store";

// ============================================================================
// BASE QUERY CONFIGURATION
// ============================================================================

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
    headers.set("content-type", "application/json");
    return headers;
  },
});

// Custom baseQuery wrapper to handle non-JSON responses (e.g., HTML 404 pages)
const baseQuery = async (args: any, api: any, extraOptions: any) => {
  // For FormData requests, don't set content-type (let browser set it with boundary)
  if (args.body instanceof FormData) {
    // Create a custom fetchBaseQuery that doesn't set content-type
    const customBaseQuery = fetchBaseQuery({
      baseUrl: API_CONFIG.baseUrlNoTrailing,
      prepareHeaders: async (headers) => {
        const token = await SecureStore.getItemAsync("cribnosh_token");
        if (token) {
          if (isTokenExpired(token)) {
            await SecureStore.deleteItemAsync("cribnosh_token");
            await SecureStore.deleteItemAsync("cribnosh_user");
          } else {
            headers.set("authorization", `Bearer ${token}`);
          }
        }
        headers.set("accept", "application/json");
        // Don't set content-type for FormData - let browser set it with boundary
        return headers;
      },
    });
    const result = await customBaseQuery(args, api, extraOptions);

    // Process result through error handling
    if (result.error) {
      const errorStatus =
        typeof result.error.status === "number"
          ? result.error.status
          : (result.error as any).originalStatus || 500;

      const errorData = result.error.data;

      if (errorStatus === 401 || errorStatus === "401") {
        await SecureStore.deleteItemAsync("cribnosh_token");
        await SecureStore.deleteItemAsync("cribnosh_user");
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { handle401Error } = require("@/utils/authErrorHandler");
        handle401Error(result.error);
      }

      if (errorData && typeof errorData === "object" && "error" in errorData) {
        return result;
      }

      const normalizedErrorData =
        errorData && typeof errorData === "object" ? (errorData as any) : {};

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
                (errorStatus === 401
                  ? "Unauthorized. Please sign in again."
                  : errorStatus === 403
                    ? "Forbidden. You don't have permission."
                    : errorStatus === 404
                      ? "Resource not found."
                      : errorStatus === 500
                        ? "Internal server error. Please try again later."
                        : `Request failed with status ${errorStatus}`),
            },
          },
        },
      };
    }

    return result;
  }

  const result = await rawBaseQuery(args, api, extraOptions);

  // Handle parsing errors (when server returns HTML instead of JSON)
  if (result.error && result.error.status === "PARSING_ERROR") {
    const originalStatus = (result.error as any).originalStatus || 404;
    const data = (result.error as any).data;

    // Check if the response is HTML
    if (
      typeof data === "string" &&
      (data.trim().startsWith("<!DOCTYPE") || data.trim().startsWith("<html"))
    ) {
      return {
        error: {
          status: originalStatus,
          data: {
            success: false,
            error: {
              code: `${originalStatus}`,
              message:
                originalStatus === 404
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
    const errorStatus =
      typeof result.error.status === "number"
        ? result.error.status
        : (result.error as any).originalStatus || 500;

    const errorData = result.error.data;

    // Handle 401 errors globally - redirect to sign-in
    const errorCode = (errorData as any)?.error?.code;
    if (
      errorStatus === 401 ||
      errorStatus === "401" ||
      errorCode === 401 ||
      errorCode === "401"
    ) {
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
    const normalizedErrorData =
      errorData && typeof errorData === "object" ? (errorData as any) : {};

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
              (errorStatus === 401
                ? "Unauthorized. Please sign in again."
                : errorStatus === 403
                  ? "Forbidden. You don't have permission."
                  : errorStatus === 404
                    ? "Resource not found."
                    : errorStatus === 500
                      ? "Internal server error. Please try again later."
                      : `Request failed with status ${errorStatus}`),
          },
        },
      },
    };
  }

  return result;
};

// ============================================================================
// CUSTOMER API DEFINITION
// ============================================================================

export const customerApi = createApi({
  reducerPath: "customerApi",
  baseQuery,
  tagTypes: [
    "VideoCollections",
    "VideoComments",
    "UserFollows",
    "CustomerProfile",
    "Cuisines",
    "Chefs",
    "Cart",
    "CartItem",
    "Orders",
    "GroupOrders",
    "Connections",
    "Treats",
    "Offers",
    "SearchResults",
    "LiveStreams",
    "PaymentIntent",
    "CustomOrders",
    "Videos",
    "KitchenFavorites",
    "KitchenMeals",
    "KitchenCategories",
    "KitchenTags",
    "Dishes",
    "SupportChat",
  ] as const,
  endpoints: (builder) => ({
    // ========================================================================
    // CUSTOMER PROFILE ENDPOINTS
    // ========================================================================

    /**
     * Get current customer profile
     * GET /customer/profile/me
     */
    getCustomerProfile: builder.query<GetCustomerProfileResponse, void>({
      query: () => ({
        url: "/customer/profile/me",
        method: "GET",
      }),
      providesTags: ["CustomerProfile"],
    }),

    /**
     * Update current customer profile
     * PUT /customer/profile/me
     * Backend endpoint needed: PUT /customer/profile/me
     */
    updateCustomerProfile: builder.mutation<
      UpdateCustomerProfileResponse,
      UpdateCustomerProfileRequest
    >({
      query: (data) => ({
        url: "/customer/profile/me",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["CustomerProfile"],
    }),

    /**
     * Upload customer profile image
     * POST /images/customer/profile
     * Backend endpoint: POST /images/customer/profile
     */
    uploadProfileImage: builder.mutation<UploadProfileImageResponse, FormData>({
      query: (formData) => ({
        url: "/images/customer/profile",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["CustomerProfile"],
    }),

    // ========================================================================
    // ACCOUNT MANAGEMENT ENDPOINTS
    // ========================================================================

    /**
     * Delete customer account
     * DELETE /customer/account
     * Backend endpoint needed: DELETE /customer/account
     */
    deleteAccount: builder.mutation<DeleteAccountResponse, void>({
      query: () => ({
        url: "/customer/account",
        method: "DELETE",
      }),
      invalidatesTags: ["CustomerProfile"],
    }),

    /**
     * Submit delete account feedback
     * POST /customer/account/delete-feedback
     * Backend endpoint needed: POST /customer/account/delete-feedback
     */
    submitDeleteAccountFeedback: builder.mutation<
      { success: boolean; message: string },
      DeleteAccountFeedbackRequest
    >({
      query: (data) => ({
        url: "/customer/account/delete-feedback",
        method: "POST",
        body: data,
      }),
    }),

    /**
     * Download account data
     * POST /customer/account/download-data
     * Backend endpoint needed: POST /customer/account/download-data
     */
    downloadAccountData: builder.mutation<DownloadAccountDataResponse, void>({
      query: () => ({
        url: "/customer/account/download-data",
        method: "POST",
      }),
    }),

    /**
     * Change customer password
     * PUT /customer/account/password
     * Backend endpoint: PUT /customer/account/password
     */
    changePassword: builder.mutation<
      ChangePasswordResponse,
      ChangePasswordRequest
    >({
      query: (data) => ({
        url: "/customer/account/password",
        method: "PUT",
        body: data,
      }),
    }),

    /**
     * Get customer active sessions
     * GET /customer/account/sessions
     * Backend endpoint: GET /customer/account/sessions
     */
    getSessions: builder.query<GetSessionsResponse, void>({
      query: () => ({
        url: "/customer/account/sessions",
        method: "GET",
      }),
    }),

    /**
     * Revoke customer session
     * DELETE /customer/account/sessions/:session_id
     * Backend endpoint: DELETE /customer/account/sessions/:session_id
     */
    revokeSession: builder.mutation<RevokeSessionResponse, string>({
      query: (sessionId) => ({
        url: `/customer/account/sessions/${sessionId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["CustomerProfile"],
    }),

    /**
     * Setup Two-Factor Authentication
     * POST /customer/account/two-factor/setup
     * Backend endpoint: POST /customer/account/two-factor/setup
     */
    setupTwoFactor: builder.mutation<SetupTwoFactorResponse, void>({
      query: () => ({
        url: "/customer/account/two-factor/setup",
        method: "POST",
      }),
      invalidatesTags: ["CustomerProfile"],
    }),

    /**
     * Disable Two-Factor Authentication
     * DELETE /customer/account/two-factor
     * Backend endpoint: DELETE /customer/account/two-factor
     */
    disableTwoFactor: builder.mutation<
      DisableTwoFactorResponse,
      DisableTwoFactorRequest
    >({
      query: (data) => ({
        url: "/customer/account/two-factor",
        method: "DELETE",
        body: data,
      }),
      invalidatesTags: ["CustomerProfile"],
    }),

    // ========================================================================
    // CUISINE ENDPOINTS
    // ========================================================================

    /**
     * Get available cuisines
     * GET /customer/cuisines
     */
    getCuisines: builder.query<
      GetCuisinesResponse,
      PaginationParams & SortParams
    >({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.page) searchParams.append("page", params.page.toString());
        if (params.limit) searchParams.append("limit", params.limit.toString());
        if (params.sort_by) searchParams.append("sort_by", params.sort_by);
        if (params.sort_order)
          searchParams.append("sort_order", params.sort_order);

        const queryString = searchParams.toString();
        return {
          url: `/customer/cuisines${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["Cuisines"],
    }),

    /**
     * Get cuisine categories with kitchen counts
     * GET /customer/cuisines/categories
     */
    getCuisineCategories: builder.query<
      {
        success: boolean;
        data: {
          categories: {
            id: string;
            name: string;
            kitchen_count: number;
            image_url: string | null;
            is_active: boolean;
          }[];
          total: number;
        };
      },
      void
    >({
      query: () => ({
        url: "/customer/cuisines/categories",
        method: "GET",
      }),
      providesTags: ["Cuisines"],
    }),

    /**
     * Get top/popular cuisines
     * GET /customer/cuisines/top
     */
    getTopCuisines: builder.query<
      GetTopCuisinesResponse,
      GetTopCuisinesParams | void
    >({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params?.limit)
          searchParams.append("limit", params.limit.toString());
        if (params?.time_range)
          searchParams.append("time_range", params.time_range);
        if (params?.location) searchParams.append("location", params.location);

        const queryString = searchParams.toString();
        return {
          url: `/customer/cuisines/top${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["Cuisines"],
    }),

    // ========================================================================
    // CHEF/KITCHEN ENDPOINTS
    // ========================================================================

    /**
     * Get popular chefs
     * GET /customer/chefs/popular
     */
    getPopularChefs: builder.query<
      GetPopularChefsResponse,
      PaginationParams & SortParams
    >({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.page) searchParams.append("page", params.page.toString());
        if (params.limit) searchParams.append("limit", params.limit.toString());
        if (params.sort_by) searchParams.append("sort_by", params.sort_by);
        if (params.sort_order)
          searchParams.append("sort_order", params.sort_order);

        const queryString = searchParams.toString();
        return {
          url: `/customer/chefs/popular${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["Chefs"],
    }),

    /**
     * Get featured kitchens with filtering
     * GET /customer/chefs/featured
     */
    getFeaturedKitchens: builder.query<
      {
        success: boolean;
        data: { kitchens: any[]; total: number; limit: number };
      },
      { sentiment?: string; is_live?: boolean; limit?: number }
    >({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.sentiment)
          searchParams.append("sentiment", params.sentiment);
        if (params.is_live !== undefined)
          searchParams.append("is_live", params.is_live.toString());
        if (params.limit) searchParams.append("limit", params.limit.toString());
        const queryString = searchParams.toString();
        return {
          url: `/customer/chefs/featured${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["Chefs"],
    }),

    /**
     * Get chef details by ID
     * GET /customer/chefs/{chef_id}
     */
    getChefDetails: builder.query<GetChefDetailsResponse, GetChefDetailsParams>(
      {
        query: (params) => {
          const searchParams = new URLSearchParams();
          if (params.latitude)
            searchParams.append("latitude", params.latitude.toString());
          if (params.longitude)
            searchParams.append("longitude", params.longitude.toString());

          const queryString = searchParams.toString();
          return {
            url: `/customer/chefs/${params.chefId}${queryString ? `?${queryString}` : ""}`,
            method: "GET",
          };
        },
        providesTags: (result, error, params) => [
          { type: "Chefs", id: params.chefId },
        ],
      }
    ),

    /**
     * Search chefs by location
     * POST /customer/chefs/search-by-location
     */
    searchChefsByLocation: builder.mutation<
      SearchChefsByLocationResponse,
      SearchChefsByLocationRequest
    >({
      query: (data) => ({
        url: "/customer/chefs/search-by-location",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Chefs"],
    }),

    /**
     * Search chefs with query and location
     * POST /customer/chefs/search
     */
    searchChefsWithQuery: builder.mutation<
      SearchChefsResponse,
      SearchChefsRequest
    >({
      query: (data) => ({
        url: "/customer/chefs/search",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Chefs"],
    }),

    /**
     * Get popular chef details with reviews
     * GET /customer/chefs/popular/{chef_id}
     */
    getPopularChefDetails: builder.query<GetPopularChefDetailsResponse, string>(
      {
        query: (chefId) => ({
          url: `/customer/chefs/popular/${chefId}`,
          method: "GET",
        }),
        providesTags: (result, error, chefId) => [
          { type: "Chefs", id: `popular/${chefId}` },
        ],
      }
    ),

    /**
     * Get nearby chefs by location
     * GET /customer/chefs/nearby
     */
    getNearbyChefs: builder.query<
      {
        success: boolean;
        data: {
          chefs: Chef[];
          pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
          };
        };
      },
      {
        latitude: number;
        longitude: number;
        radius?: number;
        limit?: number;
        page?: number;
      }
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        searchParams.append("latitude", params.latitude.toString());
        searchParams.append("longitude", params.longitude.toString());
        if (params.radius)
          searchParams.append("radius", params.radius.toString());
        if (params.limit) searchParams.append("limit", params.limit.toString());
        if (params.page) searchParams.append("page", params.page.toString());

        return {
          url: `/customer/chefs/nearby?${searchParams.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["Chefs"],
    }),

    // ========================================================================
    // CART ENDPOINTS
    // ========================================================================

    /**
     * Get customer cart
     * GET /customer/cart
     */
    getCart: builder.query<GetCartResponse, void>({
      query: () => ({
        url: "/customer/cart",
        method: "GET",
      }),
      providesTags: ["Cart"],
    }),

    /**
     * Add item to cart
     * POST /customer/cart/items
     */
    addToCart: builder.mutation<AddToCartResponse, AddToCartRequest>({
      query: (data) => ({
        url: "/customer/cart/items",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Cart", "CartItem"],
    }),

    /**
     * Update cart item quantity
     * PUT /customer/cart/items/{cart_item_id}
     */
    updateCartItem: builder.mutation<
      UpdateCartItemResponse,
      { cartItemId: string; data: UpdateCartItemRequest }
    >({
      query: ({ cartItemId, data }) => ({
        url: `/customer/cart/items/${cartItemId}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Cart", "CartItem"],
    }),

    /**
     * Remove cart item
     * DELETE /customer/cart/items/{cart_item_id}
     */
    removeCartItem: builder.mutation<RemoveCartItemResponse, string>({
      query: (cartItemId) => ({
        url: `/customer/cart/items/${cartItemId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Cart", "CartItem"],
    }),

    // ========================================================================
    // ORDER ENDPOINTS
    // ========================================================================

    /**
     * Get customer orders
     * GET /customer/orders
     */
    getOrders: builder.query<
      GetOrdersResponse,
      PaginationParams &
        SortParams & {
          status?: "ongoing" | "past" | "all";
          order_type?: "individual" | "group" | "all";
        }
    >({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.page) searchParams.append("page", params.page.toString());
        if (params.limit) searchParams.append("limit", params.limit.toString());
        if (params.sort_by) searchParams.append("sort_by", params.sort_by);
        if (params.sort_order)
          searchParams.append("sort_order", params.sort_order);
        if (params.status) searchParams.append("status", params.status);
        if (params.order_type)
          searchParams.append("order_type", params.order_type);

        const queryString = searchParams.toString();
        return {
          url: `/customer/orders${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["Orders"],
    }),

    /**
     * Get recent dishes for order again
     * GET /customer/orders/recent-dishes
     */
    getRecentDishes: builder.query<
      {
        success: boolean;
        data: { dishes: any[]; total: number; limit: number };
      },
      { limit?: number }
    >({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.limit) searchParams.append("limit", params.limit.toString());
        const queryString = searchParams.toString();
        return {
          url: `/customer/orders/recent-dishes${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["Orders"],
    }),

    /**
     * Create new order
     * POST /customer/orders
     */
    createOrder: builder.mutation<CreateOrderResponse, CreateOrderRequest>({
      query: (data) => ({
        url: "/customer/orders",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Orders", "Cart"],
    }),

    /**
     * Create order from cart after payment
     * POST /customer/orders/from-cart
     */
    createOrderFromCart: builder.mutation<
      CreateOrderFromCartResponse,
      CreateOrderFromCartRequest
    >({
      query: (data) => ({
        url: "/customer/orders/from-cart",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Orders", "Cart"],
    }),

    /**
     * Get specific order details
     * GET /customer/orders/{order_id}
     */
    getOrder: builder.query<GetOrderResponse, string>({
      query: (orderId) => ({
        url: `/customer/orders/${orderId}`,
        method: "GET",
      }),
      providesTags: ["Orders"],
    }),

    /**
     * Get order status tracking
     * GET /customer/orders/{order_id}/status
     */
    getOrderStatus: builder.query<GetOrderStatusResponse, string>({
      query: (orderId) => ({
        url: `/customer/orders/${orderId}/status`,
        method: "GET",
      }),
      providesTags: ["Orders"],
    }),

    /**
     * Cancel order
     * POST /customer/orders/{order_id}/cancel
     */
    cancelOrder: builder.mutation<
      CancelOrderResponse,
      { orderId: string; data: CancelOrderRequest }
    >({
      query: ({ orderId, data }) => ({
        url: `/customer/orders/${orderId}/cancel`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Orders"],
    }),

    /**
     * Rate order
     * POST /customer/orders/{order_id}/rate
     */
    rateOrder: builder.mutation<
      RateOrderResponse,
      { orderId: string; data: RateOrderRequest }
    >({
      query: ({ orderId, data }) => ({
        url: `/customer/orders/${orderId}/rate`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Orders"],
    }),

    // ========================================================================
    // GROUP ORDERS ENDPOINTS
    // ========================================================================

    /**
     * Create group order
     * POST /customer/group-orders
     */
    createGroupOrder: builder.mutation<
      CreateGroupOrderResponse,
      CreateGroupOrderRequest
    >({
      query: (data) => ({
        url: "/customer/group-orders",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Orders", "GroupOrders"],
    }),

    /**
     * Get group order details
     * GET /customer/group-orders/{group_order_id}
     */
    getGroupOrder: builder.query<GetGroupOrderResponse, string>({
      query: (groupOrderId) => ({
        url: `/customer/group-orders/${groupOrderId}`,
        method: "GET",
      }),
      providesTags: ["GroupOrders"],
    }),

    /**
     * Join group order
     * POST /customer/group-orders/{group_order_id}/join
     */
    joinGroupOrder: builder.mutation<
      JoinGroupOrderResponse,
      JoinGroupOrderRequest
    >({
      query: ({ group_order_id, ...data }) => ({
        url: `/customer/group-orders/${group_order_id}/join`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Orders", "GroupOrders"],
    }),

    /**
     * Close group order
     * POST /customer/group-orders/{group_order_id}/close
     */
    closeGroupOrder: builder.mutation<CloseGroupOrderResponse, string>({
      query: (groupOrderId) => ({
        url: `/customer/group-orders/${groupOrderId}/close`,
        method: "POST",
      }),
      invalidatesTags: ["Orders", "GroupOrders"],
    }),

    // ========================================================================
    // CONNECTIONS ENDPOINTS
    // ========================================================================

    /**
     * Get all user connections
     * GET /customer/connections
     */
    getUserConnections: builder.query<
      {
        success: boolean;
        data: {
          user_id: string;
          user_name: string;
          connection_type: string;
          source: string;
          metadata?: any;
        }[];
      },
      void
    >({
      query: () => ({
        url: "/customer/connections",
        method: "GET",
      }),
      providesTags: ["Connections"],
    }),

    /**
     * Create manual connection
     * POST /customer/connections
     */
    createConnection: builder.mutation<
      { success: boolean; data: { success: boolean } },
      {
        connected_user_id: string;
        connection_type: "colleague" | "friend";
        company?: string;
      }
    >({
      query: (data) => ({
        url: "/customer/connections",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Connections"],
    }),

    /**
     * Remove connection
     * DELETE /customer/connections/{connection_id}
     */
    removeConnection: builder.mutation<
      { success: boolean; data: { success: boolean } },
      string
    >({
      query: (connectionId) => ({
        url: `/customer/connections/${connectionId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Connections"],
    }),

    // ========================================================================
    // TREATS ENDPOINTS
    // ========================================================================

    /**
     * Get user's treats
     * GET /customer/treats
     */
    getTreats: builder.query<
      {
        success: boolean;
        data: any[];
      },
      { type?: "given" | "received" | "all" }
    >({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.type) searchParams.append("type", params.type);
        return {
          url: `/customer/treats${searchParams.toString() ? `?${searchParams}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["Treats"],
    }),

    /**
     * Create treat
     * POST /customer/treats
     */
    createTreat: builder.mutation<
      {
        success: boolean;
        data: {
          treat_id: string;
          treat_token: string;
          expires_at: number;
        };
      },
      {
        treated_user_id?: string;
        order_id?: string;
        expires_in_hours?: number;
        metadata?: any;
      }
    >({
      query: (data) => ({
        url: "/customer/treats",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Treats", "Connections"],
    }),

    /**
     * Get treat by token
     * GET /customer/treats/{treat_token}
     */
    getTreatByToken: builder.query<
      {
        success: boolean;
        data: any;
      },
      string
    >({
      query: (treatToken) => ({
        url: `/customer/treats/${treatToken}`,
        method: "GET",
      }),
      providesTags: ["Treats"],
    }),

    // ========================================================================
    // GROUP ORDER BUDGET & SELECTIONS ENDPOINTS
    // ========================================================================

    /**
     * Chip into budget
     * POST /customer/group-orders/{group_order_id}/budget/chip-in
     */
    chipInToBudget: builder.mutation<
      {
        success: boolean;
        data: {
          success: boolean;
          budget_contribution: number;
          total_budget: number;
        };
      },
      { group_order_id: string; amount: number }
    >({
      query: ({ group_order_id, amount }) => ({
        url: `/customer/group-orders/${group_order_id}/budget/chip-in`,
        method: "POST",
        body: { amount },
      }),
      invalidatesTags: ["GroupOrders"],
    }),

    /**
     * Get budget details
     * GET /customer/group-orders/{group_order_id}/budget
     */
    getBudgetDetails: builder.query<
      {
        success: boolean;
        data: {
          initial_budget: number;
          total_budget: number;
          contributions: {
            user_id: string;
            user_name: string;
            user_initials: string;
            user_color?: string;
            amount: number;
            contributed_at: number;
          }[];
          participants_summary: {
            user_id: string;
            user_name: string;
            budget_contribution: number;
          }[];
        };
      },
      string
    >({
      query: (groupOrderId) => ({
        url: `/customer/group-orders/${groupOrderId}/budget`,
        method: "GET",
      }),
      providesTags: ["GroupOrders"],
    }),

    /**
     * Update participant selections
     * POST /customer/group-orders/{group_order_id}/selections
     */
    updateParticipantSelections: builder.mutation<
      {
        success: boolean;
        data: {
          success: boolean;
          total_contribution: number;
          total_amount: number;
          final_amount: number;
        };
      },
      {
        group_order_id: string;
        order_items: {
          dish_id: string;
          name: string;
          quantity: number;
          price: number;
          special_instructions?: string;
        }[];
      }
    >({
      query: ({ group_order_id, order_items }) => ({
        url: `/customer/group-orders/${group_order_id}/selections`,
        method: "POST",
        body: { order_items },
      }),
      invalidatesTags: ["GroupOrders"],
    }),

    /**
     * Get participant selections
     * GET /customer/group-orders/{group_order_id}/selections
     */
    getParticipantSelections: builder.query<
      {
        success: boolean;
        data: {
          user_id: string;
          user_name: string;
          user_initials: string;
          user_color?: string;
          order_items: {
            dish_id: string;
            name: string;
            quantity: number;
            price: number;
            special_instructions?: string;
          }[];
          total_contribution: number;
          selection_status: "not_ready" | "ready";
          selection_ready_at?: number;
        }[];
      },
      { group_order_id: string; user_id?: string }
    >({
      query: ({ group_order_id, user_id }) => {
        const params = user_id ? `?user_id=${user_id}` : "";
        return {
          url: `/customer/group-orders/${group_order_id}/selections${params}`,
          method: "GET",
        };
      },
      providesTags: ["GroupOrders"],
    }),

    /**
     * Mark selections as ready
     * POST /customer/group-orders/{group_order_id}/ready
     */
    markSelectionsReady: builder.mutation<
      {
        success: boolean;
        data: {
          success: boolean;
          all_ready: boolean;
          selection_phase: string;
        };
      },
      string
    >({
      query: (groupOrderId) => ({
        url: `/customer/group-orders/${groupOrderId}/ready`,
        method: "POST",
      }),
      invalidatesTags: ["GroupOrders"],
    }),

    /**
     * Get group order status
     * GET /customer/group-orders/{group_order_id}/status
     */
    getGroupOrderStatus: builder.query<
      {
        success: boolean;
        data: {
          selection_phase: "budgeting" | "selecting" | "ready";
          status: string;
          budget: {
            initial_budget: number;
            total_budget: number;
            contributions_count: number;
          };
          selections: {
            total_participants: number;
            ready_count: number;
            not_ready_count: number;
            all_ready: boolean;
          };
          order: {
            total_amount: number;
            discount_amount?: number;
            final_amount: number;
          };
        };
      },
      string
    >({
      query: (groupOrderId) => ({
        url: `/customer/group-orders/${groupOrderId}/status`,
        method: "GET",
      }),
      providesTags: ["GroupOrders"],
    }),

    /**
     * Start selection phase
     * POST /customer/group-orders/{group_order_id}/start-selection
     */
    startSelectionPhase: builder.mutation<
      {
        success: boolean;
        data: {
          success: boolean;
          selection_phase: string;
        };
      },
      string
    >({
      query: (groupOrderId) => ({
        url: `/customer/group-orders/${groupOrderId}/start-selection`,
        method: "POST",
      }),
      invalidatesTags: ["GroupOrders"],
    }),

    // ========================================================================
    // SPECIAL OFFERS ENDPOINTS
    // ========================================================================

    /**
     * Get active special offers
     * GET /customer/offers/active
     */
    getActiveOffers: builder.query<
      GetActiveOffersResponse,
      GetActiveOffersParams
    >({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.target) searchParams.append("target", params.target);
        return {
          url: `/customer/offers/active${searchParams.toString() ? `?${searchParams}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["Offers"],
    }),

    // ========================================================================
    // MEALS ENDPOINTS
    // ========================================================================

    /**
     * Get popular meals (global)
     * GET /reviews/popular-picks
     */
    getPopularMeals: builder.query<
      {
        success: boolean;
        data: {
          popular: {
            mealId: string;
            meal: any;
            avgRating: number;
            reviewCount: number;
            chef: any;
          }[];
        };
      },
      { limit?: number; userId?: string }
    >({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.limit) searchParams.append("limit", params.limit.toString());
        if (params.userId) searchParams.append("userId", params.userId);
        const queryString = searchParams.toString();
        return {
          url: `/reviews/popular-picks${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["SearchResults"],
    }),

    /**
     * Get takeaway items
     * Uses search with category filter for takeaway items
     */
    getTakeawayItems: builder.query<
      SearchResponse,
      { limit?: number; page?: number }
    >({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        searchParams.append("q", "");
        searchParams.append("type", "dishes");
        searchParams.append("category", "takeaway");
        if (params.limit) searchParams.append("limit", params.limit.toString());
        if (params.page) searchParams.append("page", params.page.toString());

        return {
          url: `/customer/search?${searchParams.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["SearchResults"],
    }),

    /**
     * Get too fresh to waste items
     * Uses search with sustainability tag filter
     */
    getTooFreshItems: builder.query<
      SearchResponse,
      { limit?: number; page?: number }
    >({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        searchParams.append("q", "");
        searchParams.append("type", "dishes");
        searchParams.append("tag", "too-fresh");
        if (params.limit) searchParams.append("limit", params.limit.toString());
        if (params.page) searchParams.append("page", params.page.toString());

        return {
          url: `/customer/search?${searchParams.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["SearchResults"],
    }),

    /**
     * Get top kebabs
     * Uses search with kebab query and cuisine filter
     */
    getTopKebabs: builder.query<
      SearchResponse,
      { limit?: number; page?: number }
    >({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        searchParams.append("q", "kebab");
        searchParams.append("type", "dishes");
        searchParams.append("cuisine", "middle eastern");
        if (params.limit) searchParams.append("limit", params.limit.toString());
        if (params.page) searchParams.append("page", params.page.toString());

        return {
          url: `/customer/search?${searchParams.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["SearchResults"],
    }),

    // ========================================================================
    // SEARCH ENDPOINTS
    // ========================================================================

    /**
     * Search with query parameters
     * GET /customer/search
     */
    search: builder.query<SearchResponse, SearchRequest>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        searchParams.append("query", params.query);
        if (params.type) searchParams.append("type", params.type);
        if (params.page) searchParams.append("page", params.page.toString());
        if (params.limit) searchParams.append("limit", params.limit.toString());

        // Add filters
        if (params.filters) {
          if (params.filters.cuisine) {
            params.filters.cuisine.forEach((c) =>
              searchParams.append("cuisine", c)
            );
          }
          if (params.filters.price_range) {
            searchParams.append(
              "price_min",
              params.filters.price_range.min.toString()
            );
            searchParams.append(
              "price_max",
              params.filters.price_range.max.toString()
            );
          }
          if (params.filters.rating_min) {
            searchParams.append(
              "rating_min",
              params.filters.rating_min.toString()
            );
          }
          if (params.filters.delivery_time_max) {
            searchParams.append(
              "delivery_time_max",
              params.filters.delivery_time_max.toString()
            );
          }
          if (params.filters.distance_max) {
            searchParams.append(
              "distance_max",
              params.filters.distance_max.toString()
            );
          }
          if (params.filters.dietary_restrictions) {
            params.filters.dietary_restrictions.forEach((d) =>
              searchParams.append("dietary", d)
            );
          }
          if (params.filters.spice_level) {
            searchParams.append("spice_level", params.filters.spice_level);
          }
        }

        return {
          url: `/customer/search?${searchParams.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["SearchResults"],
    }),

    /**
     * Search with emotions engine
     * POST /customer/search
     */
    searchWithEmotions: builder.mutation<
      EmotionsSearchResponse,
      EmotionsSearchRequest
    >({
      query: (data) => ({
        url: "/customer/search",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["SearchResults"],
    }),

    /**
     * Send AI chat message
     * POST /chat/ai/messages
     */
    sendChatMessage: builder.mutation<ChatMessageResponse, ChatMessageRequest>({
      query: (data) => ({
        url: "/chat/ai/messages",
        method: "POST",
        body: data,
      }),
    }),

    /**
     * Search for chefs by name or specialties
     * GET /customer/search/chefs
     */
    searchChefs: builder.query<ChefSearchResponse, ChefSearchParams>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        searchParams.append("q", params.q);
        if (params.location) searchParams.append("location", params.location);
        if (params.cuisine) searchParams.append("cuisine", params.cuisine);
        if (params.rating_min)
          searchParams.append("rating_min", params.rating_min.toString());
        if (params.limit) searchParams.append("limit", params.limit.toString());
        if (params.offset)
          searchParams.append("offset", params.offset.toString());

        return {
          url: `/customer/search/chefs?${searchParams.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["SearchResults"],
    }),

    /**
     * Get search suggestions/autocomplete
     * GET /customer/search/suggestions
     */
    getSearchSuggestions: builder.query<
      SearchSuggestionsResponse,
      SearchSuggestionsParams
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        searchParams.append("q", params.q);
        if (params.location) searchParams.append("location", params.location);
        if (params.limit) searchParams.append("limit", params.limit.toString());
        if (params.category) searchParams.append("category", params.category);
        if (params.user_id) searchParams.append("user_id", params.user_id);

        return {
          url: `/customer/search/suggestions?${searchParams.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["SearchResults"],
    }),

    /**
     * Get trending search results
     * GET /customer/search/trending
     */
    getTrendingSearch: builder.query<
      TrendingSearchResponse,
      TrendingSearchParams
    >({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.location) searchParams.append("location", params.location);
        if (params.cuisine) searchParams.append("cuisine", params.cuisine);
        if (params.time_range)
          searchParams.append("time_range", params.time_range);
        if (params.limit) searchParams.append("limit", params.limit.toString());
        if (params.category) searchParams.append("category", params.category);

        const queryString = searchParams.toString();
        return {
          url: `/customer/search/trending${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["SearchResults"],
    }),

    // ========================================================================
    // PAYMENT ENDPOINTS
    // ========================================================================

    /**
     * Create payment intent for checkout
     * POST /customer/checkout
     */
    createCheckout: builder.mutation<CheckoutResponse, CheckoutRequest>({
      query: (data) => ({
        url: "/customer/checkout",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["PaymentIntent", "Cart"],
    }),

    /**
     * Get customer payment methods
     * GET /customer/payment-methods
     * Backend endpoint needed: GET /customer/payment-methods
     */
    getPaymentMethods: builder.query<GetPaymentMethodsResponse, void>({
      query: () => ({
        url: "/customer/payment-methods",
        method: "GET",
      }),
      providesTags: ["PaymentIntent"],
    }),

    /**
     * Create setup intent for adding payment method
     * POST /api/payments/add-card
     * Backend endpoint: POST /api/payments/add-card
     */
    createSetupIntent: builder.mutation<CreateSetupIntentResponse, void>({
      query: () => ({
        url: "/payments/add-card",
        method: "POST",
      }),
    }),

    /**
     * Add payment method
     * POST /customer/payment-methods
     * Backend endpoint needed: POST /customer/payment-methods
     */
    addPaymentMethod: builder.mutation<
      AddPaymentMethodResponse,
      AddPaymentMethodRequest
    >({
      query: (data) => ({
        url: "/customer/payment-methods",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["PaymentIntent"],
    }),

    /**
     * Set default payment method
     * PUT /customer/payment-methods/{id}/default
     * Backend endpoint needed: PUT /customer/payment-methods/{id}/default
     */
    setDefaultPaymentMethod: builder.mutation<
      SetDefaultPaymentMethodResponse,
      string
    >({
      query: (paymentMethodId) => ({
        url: `/customer/payment-methods/${paymentMethodId}/default`,
        method: "PUT",
      }),
      invalidatesTags: ["PaymentIntent"],
    }),

    /**
     * Get Cribnosh balance
     * GET /customer/balance
     * Backend endpoint needed: GET /customer/balance
     */
    getCribnoshBalance: builder.query<GetCribnoshBalanceResponse, void>({
      query: () => ({
        url: "/customer/balance",
        method: "GET",
      }),
      providesTags: ["PaymentIntent"],
    }),

    /**
     * Get balance transactions
     * GET /customer/balance/transactions
     * Backend endpoint needed: GET /customer/balance/transactions
     */
    getBalanceTransactions: builder.query<
      GetBalanceTransactionsResponse,
      PaginationParams
    >({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.page) searchParams.append("page", params.page.toString());
        if (params.limit) searchParams.append("limit", params.limit.toString());

        const queryString = searchParams.toString();
        return {
          url: `/customer/balance/transactions${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["PaymentIntent"],
    }),

    /**
     * Top up Cribnosh balance
     * POST /customer/balance/top-up
     */
    topUpBalance: builder.mutation<TopUpBalanceResponse, TopUpBalanceRequest>({
      query: (data) => ({
        url: "/customer/balance/top-up",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["PaymentIntent"],
    }),

    /**
     * Get family profile
     * GET /customer/family-profile
     */
    getFamilyProfile: builder.query<GetFamilyProfileResponse, void>({
      query: () => ({
        url: "/customer/family-profile",
        method: "GET",
      }),
      providesTags: ["CustomerProfile"],
    }),

    /**
     * Setup family profile
     * POST /customer/family-profile
     */
    setupFamilyProfile: builder.mutation<
      SetupFamilyProfileResponse,
      SetupFamilyProfileRequest
    >({
      query: (data) => ({
        url: "/customer/family-profile",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["CustomerProfile"],
    }),

    /**
     * Invite family member
     * POST /customer/family-profile/invite
     */
    inviteFamilyMember: builder.mutation<
      InviteFamilyMemberResponse,
      InviteFamilyMemberRequest
    >({
      query: (data) => ({
        url: "/customer/family-profile/invite",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["CustomerProfile"],
    }),

    /**
     * Validate family member email
     * POST /customer/family-profile/validate-member
     */
    validateFamilyMemberEmail: builder.mutation<
      ValidateFamilyMemberEmailResponse,
      ValidateFamilyMemberEmailRequest
    >({
      query: (data) => ({
        url: "/customer/family-profile/validate-member",
        method: "POST",
        body: data,
      }),
    }),

    /**
     * Accept family invitation
     * POST /customer/family-profile/accept
     */
    acceptFamilyInvitation: builder.mutation<
      AcceptFamilyInvitationResponse,
      AcceptFamilyInvitationRequest
    >({
      query: (data) => ({
        url: "/customer/family-profile/accept",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["CustomerProfile"],
    }),

    /**
     * Update member budget
     * PUT /customer/family-profile/members/:memberId
     */
    updateMemberBudget: builder.mutation<
      { success: boolean; message: string },
      UpdateMemberBudgetRequest
    >({
      query: (data) => ({
        url: `/customer/family-profile/members/${data.member_id}`,
        method: "PUT",
        body: {
          budget_settings: data.budget_settings,
        },
      }),
      invalidatesTags: ["CustomerProfile"],
    }),

    /**
     * Update member preferences
     * PUT /customer/family-profile/members/:memberId
     */
    updateMemberPreferences: builder.mutation<
      { success: boolean; message: string },
      UpdateMemberPreferencesRequest
    >({
      query: (data) => ({
        url: `/customer/family-profile/members/${data.member_id}`,
        method: "PUT",
        body: {
          preferences: data.preferences,
        },
      }),
      invalidatesTags: ["CustomerProfile"],
    }),

    /**
     * Update member (budget and/or preferences)
     * PUT /customer/family-profile/members/:memberId
     */
    updateMember: builder.mutation<
      { success: boolean; message: string },
      UpdateMemberRequest
    >({
      query: (data) => ({
        url: `/customer/family-profile/members/${data.member_id}`,
        method: "PUT",
        body: {
          budget_settings: data.budget_settings,
          preferences: data.preferences,
        },
      }),
      invalidatesTags: ["CustomerProfile"],
    }),

    /**
     * Remove family member
     * DELETE /customer/family-profile/members/:memberId
     */
    removeFamilyMember: builder.mutation<
      { success: boolean; message: string },
      RemoveFamilyMemberRequest
    >({
      query: (data) => ({
        url: `/customer/family-profile/members/${data.member_id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["CustomerProfile"],
    }),

    /**
     * Get family orders
     * GET /customer/family-profile/orders
     */
    getFamilyOrders: builder.query<
      GetFamilyOrdersResponse,
      { member_user_id?: string; limit?: number }
    >({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.member_user_id) {
          searchParams.append("member_user_id", params.member_user_id);
        }
        if (params.limit) {
          searchParams.append("limit", params.limit.toString());
        }
        const queryString = searchParams.toString();
        return {
          url: `/customer/family-profile/orders${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["Orders"],
    }),

    /**
     * Get family spending
     * GET /customer/family-profile/spending
     */
    getFamilySpending: builder.query<GetFamilySpendingResponse, void>({
      query: () => ({
        url: "/customer/family-profile/spending",
        method: "GET",
      }),
      providesTags: ["CustomerProfile"],
    }),

    // ========================================================================
    // FOOD SAFETY ENDPOINTS
    // ========================================================================

    /**
     * Get customer allergies
     * GET /customer/allergies
     * Backend endpoint needed: GET /customer/allergies
     */
    getAllergies: builder.query<GetAllergiesResponse, void>({
      query: () => ({
        url: "/customer/allergies",
        method: "GET",
      }),
      providesTags: ["CustomerProfile"],
    }),

    /**
     * Update customer allergies
     * PUT /customer/allergies
     * Backend endpoint needed: PUT /customer/allergies
     */
    updateAllergies: builder.mutation<
      UpdateAllergiesResponse,
      UpdateAllergiesRequest
    >({
      query: (data) => ({
        url: "/customer/allergies",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["CustomerProfile"],
    }),

    /**
     * Get dietary preferences
     * GET /customer/dietary-preferences
     * Backend endpoint needed: GET /customer/dietary-preferences
     */
    getDietaryPreferences: builder.query<GetDietaryPreferencesResponse, void>({
      query: () => ({
        url: "/customer/dietary-preferences",
        method: "GET",
      }),
      providesTags: ["CustomerProfile"],
    }),

    /**
     * Update dietary preferences
     * PUT /customer/dietary-preferences
     * Backend endpoint needed: PUT /customer/dietary-preferences
     */
    updateDietaryPreferences: builder.mutation<
      UpdateDietaryPreferencesResponse,
      UpdateDietaryPreferencesRequest
    >({
      query: (data) => ({
        url: "/customer/dietary-preferences",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["CustomerProfile"],
    }),

    /**
     * Update cross-contamination setting
     * PUT /customer/food-safety/cross-contamination
     * Backend endpoint needed: PUT /customer/food-safety/cross-contamination
     */
    updateCrossContaminationSetting: builder.mutation<
      UpdateCrossContaminationSettingResponse,
      UpdateCrossContaminationSettingRequest
    >({
      query: (data) => ({
        url: "/customer/food-safety/cross-contamination",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["CustomerProfile"],
    }),

    // ========================================================================
    // DATA SHARING ENDPOINTS
    // ========================================================================

    /**
     * Get data sharing preferences
     * GET /customer/data-sharing-preferences
     * Backend endpoint needed: GET /customer/data-sharing-preferences
     */
    getDataSharingPreferences: builder.query<
      GetDataSharingPreferencesResponse,
      void
    >({
      query: () => ({
        url: "/customer/data-sharing-preferences",
        method: "GET",
      }),
      providesTags: ["CustomerProfile"],
    }),

    /**
     * Update data sharing preferences
     * PUT /customer/data-sharing-preferences
     * Backend endpoint needed: PUT /customer/data-sharing-preferences
     */
    updateDataSharingPreferences: builder.mutation<
      UpdateDataSharingPreferencesResponse,
      UpdateDataSharingPreferencesRequest
    >({
      query: (data) => ({
        url: "/customer/data-sharing-preferences",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["CustomerProfile"],
    }),

    // ========================================================================
    // SUPPORT ENDPOINTS
    // ========================================================================

    /**
     * Get support cases
     * GET /customer/support-cases
     */
    getSupportCases: builder.query<
      GetSupportCasesResponse,
      { page?: number; limit?: number; status?: "open" | "closed" | "resolved" }
    >({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.page) searchParams.append("page", params.page.toString());
        if (params.limit) searchParams.append("limit", params.limit.toString());
        if (params.status) searchParams.append("status", params.status);
        const queryString = searchParams.toString();
        return {
          url: `/customer/support-cases${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["CustomerProfile"],
    }),

    /**
     * Create support case
     * POST /customer/support-cases
     * Backend endpoint needed: POST /customer/support-cases
     */
    createSupportCase: builder.mutation<
      CreateSupportCaseResponse,
      CreateSupportCaseRequest
    >({
      query: (data) => ({
        url: "/customer/support-cases",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["CustomerProfile"],
    }),

    /**
     * Submit event chef request
     * POST /customer/event-chef-request
     * Backend endpoint: POST /customer/event-chef-request
     */
    createEventChefRequest: builder.mutation<
      CreateEventChefRequestResponse,
      CreateEventChefRequestRequest
    >({
      query: (data) => ({
        url: "/customer/event-chef-request",
        method: "POST",
        body: data,
      }),
    }),

    // ========================================================================
    // NOTIFICATIONS ENDPOINTS
    // ========================================================================

    /**
     * Get user notifications
     * GET /customer/notifications
     * Backend endpoint: GET /customer/notifications
     */
    getNotifications: builder.query<
      GetNotificationsResponse,
      { limit?: number; unreadOnly?: boolean } | void
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.limit) {
          searchParams.append("limit", params.limit.toString());
        }
        if (params?.unreadOnly) {
          searchParams.append("unreadOnly", "true");
        }
        const queryString = searchParams.toString();
        return {
          url: `/customer/notifications${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["CustomerProfile"],
    }),

    /**
     * Get notification stats (unread count, etc.)
     * GET /customer/notifications/stats
     * Backend endpoint: GET /customer/notifications/stats
     */
    getNotificationStats: builder.query<GetNotificationStatsResponse, void>({
      query: () => ({
        url: "/customer/notifications/stats",
        method: "GET",
      }),
      providesTags: ["CustomerProfile"],
    }),

    /**
     * Mark notification as read
     * POST /customer/notifications/[id]/read
     * Backend endpoint: POST /customer/notifications/[id]/read
     */
    markNotificationRead: builder.mutation<
      MarkNotificationReadResponse,
      { notificationId: string }
    >({
      query: ({ notificationId }) => ({
        url: `/customer/notifications/${notificationId}/read`,
        method: "POST",
      }),
      invalidatesTags: ["CustomerProfile"],
    }),

    /**
     * Mark all notifications as read
     * POST /customer/notifications/read-all
     * Backend endpoint: POST /customer/notifications/read-all
     */
    markAllNotificationsRead: builder.mutation<
      MarkNotificationReadResponse,
      void
    >({
      query: () => ({
        url: "/customer/notifications/read-all",
        method: "POST",
      }),
      invalidatesTags: ["CustomerProfile"],
    }),

    // ========================================================================
    // SUPPORT CHAT ENDPOINTS
    // ========================================================================

    /**
     * Get or create active support chat
     * GET /customer/support-chat
     */
    getSupportChat: builder.query<
      GetSupportChatResponse,
      { caseId?: string } | void
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params && params.caseId) {
          searchParams.append("caseId", params.caseId);
        }
        const queryString = searchParams.toString();
        return {
          url: `/customer/support-chat${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["SupportChat"],
    }),

    /**
     * Get support chat messages
     * GET /customer/support-chat/messages
     */
    getSupportChatMessages: builder.query<
      GetSupportChatMessagesResponse,
      { limit?: number; offset?: number }
    >({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.limit) searchParams.append("limit", params.limit.toString());
        if (params.offset)
          searchParams.append("offset", params.offset.toString());
        const queryString = searchParams.toString();
        return {
          url: `/customer/support-chat/messages${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["SupportChat"],
    }),

    /**
     * Send message in support chat
     * POST /customer/support-chat/messages
     */
    sendSupportMessage: builder.mutation<
      SendSupportMessageResponse,
      SendSupportMessageRequest
    >({
      query: (data) => ({
        url: "/customer/support-chat/messages",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["SupportChat"],
    }),

    /**
     * Get assigned support agent info
     * GET /customer/support-chat/agent
     */
    getSupportAgent: builder.query<GetSupportAgentResponse, void>({
      query: () => ({
        url: "/customer/support-chat/agent",
        method: "GET",
      }),
      providesTags: ["SupportChat"],
    }),

    /**
     * Get quick reply suggestions
     * GET /customer/support-chat/quick-replies
     */
    getQuickReplies: builder.query<GetQuickRepliesResponse, void>({
      query: () => ({
        url: "/customer/support-chat/quick-replies",
        method: "GET",
      }),
      providesTags: ["SupportChat"],
    }),

    // ========================================================================
    // LIVE STREAMING ENDPOINTS
    // ========================================================================

    /**
     * Get customer live streaming data
     * GET /api/live-streaming/customer
     */
    getLiveStreams: builder.query<GetLiveStreamsResponse, PaginationParams>({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.page) searchParams.append("page", params.page.toString());
        if (params.limit) searchParams.append("limit", params.limit.toString());

        const queryString = searchParams.toString();
        return {
          url: `/api/live-streaming/customer${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["LiveStreams"],
    }),

    /**
     * Get live session details with meal
     * GET /api/live-streaming/sessions/{sessionId}
     */
    getLiveSession: builder.query<GetLiveSessionDetailsResponse, string>({
      query: (sessionId) => ({
        url: `/api/live-streaming/sessions/${sessionId}`,
        method: "GET",
      }),
      providesTags: (result, error, sessionId) => [
        { type: "LiveStreams", id: sessionId },
      ],
    }),

    /**
     * Get live stream comments
     * GET /live-streaming/comments
     */
    getLiveComments: builder.query<
      GetLiveCommentsResponse,
      {
        sessionId: string;
        limit?: number;
        offset?: number;
        commentType?: string;
      }
    >({
      query: ({ sessionId, limit, offset, commentType }) => {
        const params = new URLSearchParams();
        params.append("sessionId", sessionId);
        if (limit) params.append("limit", limit.toString());
        if (offset) params.append("offset", offset.toString());
        if (commentType) params.append("commentType", commentType);
        return {
          url: `/live-streaming/comments?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: (result, error, { sessionId }) => [
        { type: "LiveStreams", id: `${sessionId}/comments` },
      ],
    }),

    /**
     * Send live stream comment
     * POST /live-streaming/comments
     */
    sendLiveComment: builder.mutation<
      SendLiveCommentResponse,
      SendLiveCommentRequest
    >({
      query: (data) => ({
        url: "/live-streaming/comments",
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { sessionId }) => [
        { type: "LiveStreams", id: `${sessionId}/comments` },
        { type: "LiveStreams", id: sessionId },
      ],
    }),

    /**
     * Get live stream reactions
     * GET /live-streaming/reactions
     */
    getLiveReactions: builder.query<
      GetLiveReactionsResponse,
      {
        sessionId: string;
        limit?: number;
        offset?: number;
        reactionType?: string;
      }
    >({
      query: ({ sessionId, limit, offset, reactionType }) => {
        const params = new URLSearchParams();
        params.append("sessionId", sessionId);
        if (limit) params.append("limit", limit.toString());
        if (offset) params.append("offset", offset.toString());
        if (reactionType) params.append("reactionType", reactionType);
        return {
          url: `/live-streaming/reactions?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: (result, error, { sessionId }) => [
        { type: "LiveStreams", id: `${sessionId}/reactions` },
      ],
    }),

    /**
     * Send live stream reaction
     * POST /live-streaming/reactions
     */
    sendLiveReaction: builder.mutation<
      SendLiveReactionResponse,
      SendLiveReactionRequest
    >({
      query: (data) => ({
        url: "/live-streaming/reactions",
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { sessionId }) => [
        { type: "LiveStreams", id: `${sessionId}/reactions` },
        { type: "LiveStreams", id: sessionId },
      ],
    }),

    /**
     * Get live stream viewers
     * GET /live-streaming/viewers
     */
    getLiveViewers: builder.query<
      GetLiveViewersResponse,
      {
        sessionId?: string;
        limit?: number;
        offset?: number;
        includeAnonymous?: boolean;
      }
    >({
      query: ({ sessionId, limit, offset, includeAnonymous }) => {
        const params = new URLSearchParams();
        if (sessionId) params.append("sessionId", sessionId);
        if (limit) params.append("limit", limit.toString());
        if (offset) params.append("offset", offset.toString());
        if (includeAnonymous !== undefined)
          params.append("includeAnonymous", includeAnonymous.toString());
        return {
          url: `/live-streaming/viewers${params.toString() ? `?${params.toString()}` : ""}`,
          method: "GET",
        };
      },
      providesTags: (result, error, { sessionId }) => [
        {
          type: "LiveStreams",
          id: sessionId ? `${sessionId}/viewers` : "viewers",
        },
      ],
    }),

    /**
     * Get live stream chat messages
     * GET /live-streaming/chat
     */
    getLiveChat: builder.query<
      GetLiveChatResponse,
      { sessionId: string; limit?: number; offset?: number }
    >({
      query: ({ sessionId, limit, offset }) => {
        const params = new URLSearchParams();
        params.append("sessionId", sessionId);
        if (limit) params.append("limit", limit.toString());
        if (offset) params.append("offset", offset.toString());
        return {
          url: `/live-streaming/chat?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: (result, error, { sessionId }) => [
        { type: "LiveStreams", id: `${sessionId}/chat` },
      ],
    }),

    /**
     * Get live stream orders
     * GET /live-streaming/orders
     */
    getLiveStreamOrders: builder.query<
      GetLiveStreamOrdersResponse,
      {
        sessionId?: string;
        chefId?: string;
        status?: string;
        limit?: number;
        offset?: number;
      }
    >({
      query: ({ sessionId, chefId, status, limit, offset }) => {
        const params = new URLSearchParams();
        if (sessionId) params.append("sessionId", sessionId);
        if (chefId) params.append("chefId", chefId);
        if (status) params.append("status", status);
        if (limit) params.append("limit", limit.toString());
        if (offset) params.append("offset", offset.toString());
        return {
          url: `/live-streaming/orders${params.toString() ? `?${params.toString()}` : ""}`,
          method: "GET",
        };
      },
      providesTags: (result, error, { sessionId }) => [
        {
          type: "LiveStreams",
          id: sessionId ? `${sessionId}/orders` : "orders",
        },
        "Orders",
      ],
    }),

    // ========================================================================
    // DISH ENDPOINTS
    // ========================================================================

    /**
     * Get dish details by ID
     * GET /customer/dishes/{dish_id}
     */
    getDishDetails: builder.query<GetDishDetailsResponse, string>({
      query: (dishId) => ({
        url: `/customer/dishes/${dishId}`,
        method: "GET",
      }),
      providesTags: (result, error, dishId) => [{ type: "Dishes", id: dishId }],
    }),

    /**
     * Get similar dishes
     * GET /customer/meals/similar/{meal_id}
     * Note: Uses new meals API endpoint that respects user preferences
     */
    getSimilarDishes: builder.query<
      GetSimilarDishesResponse,
      { dishId: string; limit?: number }
    >({
      query: ({ dishId, limit }) => {
        const params = new URLSearchParams();
        if (limit) params.append("limit", limit.toString());
        const queryString = params.toString();
        return {
          url: `/customer/meals/similar/${dishId}${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      providesTags: (result, error, { dishId }) => [
        { type: "Dishes", id: `${dishId}/similar` },
      ],
    }),

    /**
     * Get personalized meal recommendations
     * GET /customer/meals/recommended
     */
    getRecommendedMeals: builder.query<
      {
        success: boolean;
        data: {
          recommendations: any[];
          count: number;
          limit: number;
        };
      },
      { limit?: number }
    >({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.limit) searchParams.append("limit", params.limit.toString());
        const queryString = searchParams.toString();
        return {
          url: `/customer/meals/recommended${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["SearchResults"],
    }),

    // ========================================================================
    // MENU ENDPOINTS
    // ========================================================================

    /**
     * Get chef menu items
     * GET /customer/menus/chef/{chef_id}/menus
     */
    getChefMenus: builder.query<GetChefMenusResponse, string>({
      query: (chefId) => ({
        url: `/customer/menus/chef/${chefId}/menus`,
        method: "GET",
      }),
      providesTags: (result, error, chefId) => [
        { type: "Dishes", id: `chef/${chefId}/menus` },
      ],
    }),

    /**
     * Get menu details
     * GET /customer/menus/menus/{menu_id}
     */
    getMenuDetails: builder.query<GetMenuDetailsResponse, string>({
      query: (menuId) => ({
        url: `/customer/menus/menus/${menuId}`,
        method: "GET",
      }),
      providesTags: (result, error, menuId) => [
        { type: "Dishes", id: `menu/${menuId}` },
      ],
    }),

    // ========================================================================
    // CUSTOM ORDERS ENDPOINTS
    // ========================================================================

    /**
     * Create custom order
     * POST /custom_orders
     */
    createCustomOrder: builder.mutation<
      CreateCustomOrderResponse,
      CreateCustomOrderRequest
    >({
      query: (data) => ({
        url: "/custom_orders",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["CustomOrders"],
    }),

    /**
     * Get customer custom orders
     * GET /custom_orders
     */
    getCustomOrders: builder.query<GetCustomOrdersResponse, PaginationParams>({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.page) searchParams.append("page", params.page.toString());
        if (params.limit) searchParams.append("limit", params.limit.toString());

        const queryString = searchParams.toString();
        return {
          url: `/custom_orders${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["CustomOrders"],
    }),

    /**
     * Get specific custom order details
     * GET /custom_orders/{custom_order_id}
     */
    getCustomOrder: builder.query<GetCustomOrderResponse, string>({
      query: (customOrderId) => ({
        url: `/custom_orders/${customOrderId}`,
        method: "GET",
      }),
      providesTags: ["CustomOrders"],
    }),

    /**
     * Update custom order
     * PUT /custom_orders/{custom_order_id}
     */
    updateCustomOrder: builder.mutation<
      UpdateCustomOrderResponse,
      { customOrderId: string; data: UpdateCustomOrderRequest }
    >({
      query: ({ customOrderId, data }) => ({
        url: `/custom_orders/${customOrderId}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["CustomOrders"],
    }),

    /**
     * Delete custom order
     * DELETE /custom_orders/{custom_order_id}
     */
    deleteCustomOrder: builder.mutation<DeleteCustomOrderResponse, string>({
      query: (customOrderId) => ({
        url: `/custom_orders/${customOrderId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["CustomOrders"],
    }),

    /**
     * Generate shareable link for custom order
     * POST /customer/custom-orders/{order_id}/share
     */
    generateSharedOrderLink: builder.mutation<
      GenerateSharedOrderLinkResponse,
      GenerateSharedOrderLinkRequest
    >({
      query: (data) => ({
        url: `/customer/custom-orders/${data.order_id}/share`,
        method: "POST",
      }),
    }),

    // ========================================================================
    // PROFILE SCREEN ENDPOINTS
    // ========================================================================

    /**
     * Get ForkPrint score
     * GET /customer/forkprint/score
     */
    getForkPrintScore: builder.query<GetForkPrintScoreResponse, void>({
      query: () => ({
        url: "/customer/forkprint/score",
        method: "GET",
      }),
      providesTags: ["CustomerProfile"],
    }),

    /**
     * Get Nosh Points
     * GET /customer/rewards/nosh-points
     */
    getNoshPoints: builder.query<GetNoshPointsResponse, void>({
      query: () => ({
        url: "/customer/rewards/nosh-points",
        method: "GET",
      }),
      providesTags: ["CustomerProfile"],
    }),

    /**
     * Get calories progress
     * GET /customer/nutrition/calories-progress
     */
    getCaloriesProgress: builder.query<
      GetCaloriesProgressResponse,
      { date?: string } | void
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.date) searchParams.append("date", params.date);
        const queryString = searchParams.toString();
        return {
          url: `/customer/nutrition/calories-progress${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["CustomerProfile"],
    }),

    /**
     * Get monthly overview
     * GET /customer/stats/monthly-overview
     */
    getMonthlyOverview: builder.query<
      GetMonthlyOverviewResponse,
      { month?: string } | void
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.month) searchParams.append("month", params.month);
        const queryString = searchParams.toString();
        return {
          url: `/customer/stats/monthly-overview${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["CustomerProfile"],
    }),

    /**
     * Get weekly summary
     * GET /customer/stats/weekly-summary
     */
    getWeeklySummary: builder.query<
      GetWeeklySummaryResponse,
      { start_date?: string; end_date?: string } | void
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.start_date)
          searchParams.append("start_date", params.start_date);
        if (params?.end_date) searchParams.append("end_date", params.end_date);
        const queryString = searchParams.toString();
        return {
          url: `/customer/stats/weekly-summary${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["CustomerProfile"],
    }),

    /**
     * Get featured video for a kitchen
     * GET /api/nosh-heaven/kitchens/{kitchenId}/featured-video
     */
    getKitchenFeaturedVideo: builder.query<any, { kitchenId: string }>({
      query: ({ kitchenId }) => ({
        url: `/api/nosh-heaven/kitchens/${kitchenId}/featured-video`,
        method: "GET",
      }),
      providesTags: ["Videos"],
    }),

    /**
     * Get video by ID
     * GET /api/nosh-heaven/videos/{videoId}
     */
    getVideoById: builder.query<any, { videoId: string }>({
      query: ({ videoId }) => ({
        url: `/api/nosh-heaven/videos/${videoId}`,
        method: "GET",
      }),
      providesTags: (result, error, { videoId }) => [
        { type: "Videos", id: videoId },
      ],
    }),

    /**
     * Get video feed (paginated)
     * GET /api/nosh-heaven/videos
     */
    getVideoFeed: builder.query<
      { videos: any[]; nextCursor?: string },
      { limit?: number; cursor?: string }
    >({
      query: ({ limit, cursor }) => {
        const params = new URLSearchParams();
        if (limit) params.append("limit", limit.toString());
        if (cursor) params.append("cursor", cursor);
        return {
          url: `/api/nosh-heaven/videos${params.toString() ? `?${params.toString()}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["Videos"],
    }),

    /**
     * Get trending videos
     * GET /api/nosh-heaven/trending
     */
    getTrendingVideos: builder.query<
      any[],
      { limit?: number; timeRange?: "24h" | "7d" | "30d" | "all" }
    >({
      query: ({ limit, timeRange }) => {
        const params = new URLSearchParams();
        if (limit) params.append("limit", limit.toString());
        if (timeRange) params.append("timeRange", timeRange);
        return {
          url: `/api/nosh-heaven/trending${params.toString() ? `?${params.toString()}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["Videos"],
    }),

    /**
     * Search videos
     * GET /api/nosh-heaven/search/videos
     */
    searchVideos: builder.query<
      { videos: any[]; nextCursor?: string },
      {
        q: string;
        cuisine?: string;
        difficulty?: "beginner" | "intermediate" | "advanced";
        tags?: string[];
        limit?: number;
        cursor?: string;
      }
    >({
      query: ({ q, cuisine, difficulty, tags, limit, cursor }) => {
        const params = new URLSearchParams();
        params.append("q", q);
        if (cuisine) params.append("cuisine", cuisine);
        if (difficulty) params.append("difficulty", difficulty);
        if (tags && tags.length > 0) {
          tags.forEach((tag) => params.append("tags", tag));
        }
        if (limit) params.append("limit", limit.toString());
        if (cursor) params.append("cursor", cursor);
        return {
          url: `/api/nosh-heaven/search/videos?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["Videos"],
    }),

    /**
     * Get user's videos
     * GET /api/nosh-heaven/users/{userId}/videos
     */
    getUserVideos: builder.query<
      { videos: any[]; nextCursor?: string },
      { userId: string; limit?: number; cursor?: string }
    >({
      query: ({ userId, limit, cursor }) => {
        const params = new URLSearchParams();
        if (limit) params.append("limit", limit.toString());
        if (cursor) params.append("cursor", cursor);
        return {
          url: `/api/nosh-heaven/users/${userId}/videos${params.toString() ? `?${params.toString()}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["Videos"],
    }),

    /**
     * Get video collections
     * GET /api/nosh-heaven/collections
     */
    getVideoCollections: builder.query<
      { collections: any[]; nextCursor?: string },
      { limit?: number; cursor?: string; publicOnly?: boolean }
    >({
      query: ({ limit, cursor, publicOnly }) => {
        const params = new URLSearchParams();
        if (limit) params.append("limit", limit.toString());
        if (cursor) params.append("cursor", cursor);
        if (publicOnly !== undefined)
          params.append("publicOnly", publicOnly.toString());
        return {
          url: `/api/nosh-heaven/collections${params.toString() ? `?${params.toString()}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["VideoCollections"],
    }),

    /**
     * Like a video
     * POST /api/nosh-heaven/videos/{videoId}/like
     */
    likeVideo: builder.mutation<void, { videoId: string }>({
      query: ({ videoId }) => ({
        url: `/api/nosh-heaven/videos/${videoId}/like`,
        method: "POST",
      }),
      invalidatesTags: (result, error, { videoId }) => [
        { type: "Videos", id: videoId },
        "Videos",
      ],
    }),

    /**
     * Unlike a video
     * DELETE /api/nosh-heaven/videos/{videoId}/like
     */
    unlikeVideo: builder.mutation<void, { videoId: string }>({
      query: ({ videoId }) => ({
        url: `/api/nosh-heaven/videos/${videoId}/like`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { videoId }) => [
        { type: "Videos", id: videoId },
        "Videos",
      ],
    }),

    /**
     * Share a video
     * POST /api/nosh-heaven/videos/{videoId}/share
     */
    shareVideo: builder.mutation<
      void,
      {
        videoId: string;
        platform?:
          | "internal"
          | "facebook"
          | "twitter"
          | "instagram"
          | "whatsapp"
          | "other";
      }
    >({
      query: ({ videoId, platform }) => ({
        url: `/api/nosh-heaven/videos/${videoId}/share`,
        method: "POST",
        body: platform ? { platform } : undefined,
      }),
      invalidatesTags: (result, error, { videoId }) => [
        { type: "Videos", id: videoId },
      ],
    }),

    /**
     * Report a video
     * POST /api/nosh-heaven/videos/{videoId}/report
     */
    reportVideo: builder.mutation<
      void,
      {
        videoId: string;
        reason:
          | "inappropriate_content"
          | "spam"
          | "harassment"
          | "violence"
          | "copyright"
          | "other";
        description?: string;
        timestamp?: number;
      }
    >({
      query: ({ videoId, reason, description, timestamp }) => ({
        url: `/api/nosh-heaven/videos/${videoId}/report`,
        method: "POST",
        body: { reason, description, timestamp },
      }),
      invalidatesTags: (result, error, { videoId }) => [
        { type: "Videos", id: videoId },
      ],
    }),

    /**
     * Record video view
     * POST /api/nosh-heaven/videos/{videoId}/view
     */
    recordVideoView: builder.mutation<
      void,
      {
        videoId: string;
        watchDuration: number;
        completionRate: number;
        deviceInfo?: { type?: string; os?: string; browser?: string };
      }
    >({
      query: ({ videoId, watchDuration, completionRate, deviceInfo }) => ({
        url: `/api/nosh-heaven/videos/${videoId}/view`,
        method: "POST",
        body: { watchDuration, completionRate, deviceInfo },
      }),
    }),

    /**
     * Get video comments
     * GET /api/nosh-heaven/videos/{videoId}/comments
     */
    getVideoComments: builder.query<
      { comments: any[]; nextCursor?: string },
      { videoId: string; limit?: number; cursor?: string }
    >({
      query: ({ videoId, limit, cursor }) => {
        const params = new URLSearchParams();
        if (limit) params.append("limit", limit.toString());
        if (cursor) params.append("cursor", cursor);
        return {
          url: `/api/nosh-heaven/videos/${videoId}/comments${params.toString() ? `?${params.toString()}` : ""}`,
          method: "GET",
        };
      },
      providesTags: (result, error, { videoId }) => [
        { type: "VideoComments", id: videoId },
      ],
    }),

    /**
     * Add comment to video
     * POST /api/nosh-heaven/videos/{videoId}/comments
     */
    addVideoComment: builder.mutation<
      any,
      { videoId: string; content: string; parentCommentId?: string }
    >({
      query: ({ videoId, content, parentCommentId }) => ({
        url: `/api/nosh-heaven/videos/${videoId}/comments`,
        method: "POST",
        body: { content, parentCommentId },
      }),
      invalidatesTags: (result, error, { videoId }) => [
        { type: "VideoComments", id: videoId },
        { type: "Videos", id: videoId },
      ],
    }),

    /**
     * Edit video comment
     * PUT /api/nosh-heaven/videos/{videoId}/comments/{commentId}
     */
    editVideoComment: builder.mutation<
      void,
      { videoId: string; commentId: string; content: string }
    >({
      query: ({ videoId, commentId, content }) => ({
        url: `/api/nosh-heaven/videos/${videoId}/comments/${commentId}`,
        method: "PUT",
        body: { content },
      }),
      invalidatesTags: (result, error, { videoId }) => [
        { type: "VideoComments", id: videoId },
      ],
    }),

    /**
     * Delete video comment
     * DELETE /api/nosh-heaven/videos/{videoId}/comments/{commentId}
     */
    deleteVideoComment: builder.mutation<
      void,
      { videoId: string; commentId: string }
    >({
      query: ({ videoId, commentId }) => ({
        url: `/api/nosh-heaven/videos/${videoId}/comments/${commentId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { videoId }) => [
        { type: "VideoComments", id: videoId },
        { type: "Videos", id: videoId },
      ],
    }),

    /**
     * Create video post
     * POST /api/nosh-heaven/videos
     */
    createVideoPost: builder.mutation<
      { videoId: string },
      {
        title: string;
        description?: string;
        videoStorageId: string;
        thumbnailStorageId?: string;
        kitchenId?: string;
        duration: number;
        fileSize: number;
        resolution: { width: number; height: number };
        tags: string[];
        cuisine?: string;
        difficulty?: "beginner" | "intermediate" | "advanced";
        visibility?: "public" | "followers" | "private";
        isLive?: boolean;
        liveSessionId?: string;
      }
    >({
      query: (body) => ({
        url: "/api/nosh-heaven/videos",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Videos"],
    }),

    /**
     * Update video post
     * PUT /api/nosh-heaven/videos/{videoId}
     */
    updateVideoPost: builder.mutation<
      void,
      {
        videoId: string;
        title?: string;
        description?: string;
        tags?: string[];
        cuisine?: string;
        difficulty?: "beginner" | "intermediate" | "advanced";
        visibility?: "public" | "followers" | "private";
      }
    >({
      query: ({ videoId, ...body }) => ({
        url: `/api/nosh-heaven/videos/${videoId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { videoId }) => [
        { type: "Videos", id: videoId },
        "Videos",
      ],
    }),

    /**
     * Delete video post
     * DELETE /api/nosh-heaven/videos/{videoId}
     */
    deleteVideoPost: builder.mutation<void, { videoId: string }>({
      query: ({ videoId }) => ({
        url: `/api/nosh-heaven/videos/${videoId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { videoId }) => [
        { type: "Videos", id: videoId },
        "Videos",
      ],
    }),

    /**
     * Get video upload URL
     * POST /api/nosh-heaven/videos/upload-url
     */
    getVideoUploadUrl: builder.mutation<
      { uploadUrl: string; key: string; publicUrl: string },
      { fileName: string; fileSize: number; contentType: string }
    >({
      query: (body) => ({
        url: "/api/nosh-heaven/videos/upload-url",
        method: "POST",
        body,
      }),
    }),

    /**
     * Get Convex video upload URL
     * POST /api/nosh-heaven/videos/convex-upload-url
     */
    getConvexVideoUploadUrl: builder.mutation<
      { uploadUrl: string },
      Record<string, never>
    >({
      query: () => ({
        url: "/api/nosh-heaven/videos/convex-upload-url",
        method: "POST",
      }),
    }),

    /**
     * Get thumbnail upload URL
     * POST /api/nosh-heaven/videos/thumbnail-upload-url
     */
    getThumbnailUploadUrl: builder.mutation<
      { uploadUrl: string; key: string; publicUrl: string },
      {
        videoId: string;
        fileName: string;
        fileSize: number;
        contentType: string;
      }
    >({
      query: (body) => ({
        url: "/api/nosh-heaven/videos/thumbnail-upload-url",
        method: "POST",
        body,
      }),
    }),

    /**
     * Follow user
     * POST /api/nosh-heaven/users/{userId}/follow
     */
    followUser: builder.mutation<void, { userId: string }>({
      query: ({ userId }) => ({
        url: `/api/nosh-heaven/users/${userId}/follow`,
        method: "POST",
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: "UserFollows", id: userId },
      ],
    }),

    /**
     * Unfollow user
     * DELETE /api/nosh-heaven/users/{userId}/follow
     */
    unfollowUser: builder.mutation<void, { userId: string }>({
      query: ({ userId }) => ({
        url: `/api/nosh-heaven/users/${userId}/follow`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: "UserFollows", id: userId },
      ],
    }),

    /**
     * Check if kitchen is favorited
     * GET /api/customer/kitchens/{kitchenId}/favorite
     */
    getKitchenFavoriteStatus: builder.query<
      { isFavorited: boolean; favoriteId?: string; chefId?: string },
      { kitchenId: string }
    >({
      query: ({ kitchenId }) => ({
        url: `/api/customer/kitchens/${kitchenId}/favorite`,
        method: "GET",
      }),
      providesTags: (result, error, { kitchenId }) => [
        { type: "KitchenFavorites", id: kitchenId },
      ],
    }),

    /**
     * Add kitchen to favorites
     * POST /api/customer/kitchens/{kitchenId}/favorite
     */
    addKitchenFavorite: builder.mutation<void, { kitchenId: string }>({
      query: ({ kitchenId }) => ({
        url: `/api/customer/kitchens/${kitchenId}/favorite`,
        method: "POST",
      }),
      invalidatesTags: (result, error, { kitchenId }) => [
        { type: "KitchenFavorites", id: kitchenId },
      ],
    }),

    /**
     * Remove kitchen from favorites
     * DELETE /api/customer/kitchens/{kitchenId}/favorite
     */
    removeKitchenFavorite: builder.mutation<void, { kitchenId: string }>({
      query: ({ kitchenId }) => ({
        url: `/api/customer/kitchens/${kitchenId}/favorite`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { kitchenId }) => [
        { type: "KitchenFavorites", id: kitchenId },
      ],
    }),

    /**
     * Get meals for a kitchen
     * GET /api/customer/kitchens/{kitchenId}/meals
     */
    getKitchenMeals: builder.query<
      { meals: any[] },
      {
        kitchenId: string;
        limit?: number;
        offset?: number;
        category?: string;
        dietary?: string[];
      }
    >({
      query: ({ kitchenId, limit, offset, category, dietary }) => {
        const params = new URLSearchParams();
        if (limit) params.append("limit", limit.toString());
        if (offset) params.append("offset", offset.toString());
        if (category) params.append("category", category);
        if (dietary && dietary.length > 0) {
          dietary.forEach((d) => params.append("dietary", d));
        }
        return {
          url: `/api/customer/kitchens/${kitchenId}/meals${params.toString() ? `?${params.toString()}` : ""}`,
          method: "GET",
        };
      },
      providesTags: (result, error, { kitchenId }) => [
        { type: "KitchenMeals", id: kitchenId },
      ],
    }),

    /**
     * Search meals within a kitchen
     * GET /api/customer/kitchens/{kitchenId}/meals/search
     */
    searchKitchenMeals: builder.query<
      { meals: any[]; query: string },
      {
        kitchenId: string;
        q: string;
        category?: string;
        dietary?: string[];
        limit?: number;
      }
    >({
      query: ({ kitchenId, q, category, dietary, limit }) => {
        const params = new URLSearchParams({ q });
        if (category) params.append("category", category);
        if (dietary && dietary.length > 0) {
          dietary.forEach((d) => params.append("dietary", d));
        }
        if (limit) params.append("limit", limit.toString());
        return {
          url: `/api/customer/kitchens/${kitchenId}/meals/search?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: (result, error, { kitchenId }) => [
        { type: "KitchenMeals", id: kitchenId },
      ],
    }),

    /**
     * Get popular meals for a kitchen
     * GET /api/customer/kitchens/{kitchenId}/meals/popular
     */
    getKitchenPopularMeals: builder.query<
      { meals: any[] },
      { kitchenId: string; limit?: number }
    >({
      query: ({ kitchenId, limit }) => {
        const params = new URLSearchParams();
        if (limit) params.append("limit", limit.toString());
        return {
          url: `/api/customer/kitchens/${kitchenId}/meals/popular${params.toString() ? `?${params.toString()}` : ""}`,
          method: "GET",
        };
      },
      providesTags: (result, error, { kitchenId }) => [
        { type: "KitchenMeals", id: kitchenId },
      ],
    }),

    /**
     * Get meal categories for a kitchen
     * GET /api/customer/kitchens/{kitchenId}/categories
     */
    getKitchenCategories: builder.query<
      { categories: { category: string; count: number }[] },
      { kitchenId: string }
    >({
      query: ({ kitchenId }) => ({
        url: `/api/customer/kitchens/${kitchenId}/categories`,
        method: "GET",
      }),
      providesTags: (result, error, { kitchenId }) => [
        { type: "KitchenCategories", id: kitchenId },
      ],
    }),

    /**
     * Get kitchen details by ID
     * GET /api/customer/kitchens/{kitchenId}
     */
    getKitchenDetails: builder.query<
      {
        kitchenId: string;
        chefId: string;
        chefName: string;
        kitchenName: string;
        address: string;
        certified: boolean;
      },
      { kitchenId: string }
    >({
      query: ({ kitchenId }) => ({
        url: `/api/customer/kitchens/${kitchenId}`,
        method: "GET",
      }),
      providesTags: (result, error, { kitchenId }) => [
        { type: "KitchenMeals", id: kitchenId },
      ],
    }),

    /**
     * Get kitchen tags (dietary tags from kitchen meals)
     * GET /api/customer/kitchens/{kitchenId}/tags
     */
    getKitchenTags: builder.query<
      { tag: string; count: number }[],
      { kitchenId: string }
    >({
      query: ({ kitchenId }) => ({
        url: `/api/customer/kitchens/${kitchenId}/tags`,
        method: "GET",
      }),
      providesTags: (result, error, { kitchenId }) => [
        { type: "KitchenTags", id: kitchenId },
      ],
    }),

    /**
     * Get user behavior analytics
     * GET /customer/analytics/user-behavior
     */
    getUserBehavior: builder.query<
      {
        success: boolean;
        data: {
          totalOrders: number;
          daysActive: number;
          usualDinnerItems: {
            dish_id: string;
            dish_name: string;
            order_count: number;
            last_ordered_at: number;
            kitchen_name: string;
            image_url?: string;
          }[];
          colleagueConnections: number;
          playToWinHistory: {
            gamesPlayed: number;
            gamesWon: number;
            lastPlayed?: number;
          };
        };
      },
      void
    >({
      query: () => ({
        url: "/customer/analytics/user-behavior",
        method: "GET",
      }),
      providesTags: ["CustomerProfile"],
    }),

    /**
     * Get usual dinner items
     * GET /customer/orders/usual-dinner-items
     */
    getUsualDinnerItems: builder.query<
      {
        success: boolean;
        data: {
          items: {
            dish_id: string;
            name: string;
            price: number;
            image_url?: string;
            kitchen_name: string;
            kitchen_id: string;
            order_count: number;
            last_ordered_at: number;
            avg_rating?: number;
          }[];
          total: number;
        };
      },
      { limit?: number; time_range?: "week" | "month" | "all" }
    >({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.limit) searchParams.append("limit", params.limit.toString());
        if (params.time_range)
          searchParams.append("time_range", params.time_range);
        const queryString = searchParams.toString();
        return {
          url: `/customer/orders/usual-dinner-items${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["Orders"],
    }),

    /**
     * Get colleague connections
     * GET /customer/social/colleagues
     */
    getColleagueConnections: builder.query<
      {
        success: boolean;
        data: {
          colleagueCount: number;
          colleagues: {
            user_id: string;
            user_name: string;
            user_initials: string;
            user_avatar?: string;
            is_available: boolean;
          }[];
          total: number;
        };
      },
      void
    >({
      query: () => ({
        url: "/customer/social/colleagues",
        method: "GET",
      }),
      providesTags: ["CustomerProfile"],
    }),

    /**
     * Get Play to Win game history
     * GET /customer/games/play-to-win/history
     */
    getPlayToWinHistory: builder.query<
      {
        success: boolean;
        data: {
          gamesPlayed: number;
          gamesWon: number;
          lastPlayed?: number;
          recentGames: {
            game_id: string;
            group_order_id: string;
            played_at: number;
            won: boolean;
            participants: number;
            total_amount: number;
          }[];
        };
      },
      void
    >({
      query: () => ({
        url: "/customer/games/play-to-win/history",
        method: "GET",
      }),
      providesTags: ["Orders"],
    }),

    /**
     * Get regional availability configuration
     * GET /customer/regional-availability/config
     */
    getRegionalAvailabilityConfig: builder.query<
      {
        success: boolean;
        data: {
          enabled: boolean;
          supportedRegions: string[];
          supportedCities: string[];
          supportedCountries: string[];
        };
      },
      void
    >({
      query: () => ({
        url: "/customer/regional-availability/config",
        method: "GET",
      }),
      providesTags: ["CustomerProfile"],
    }),

    /**
     * Check region availability
     * POST /customer/regional-availability/check
     */
    checkRegionAvailability: builder.mutation<
      CheckRegionAvailabilityResponse,
      CheckRegionAvailabilityRequest
    >({
      query: (data) => ({
        url: "/customer/regional-availability/check",
        method: "POST",
        body: data,
      }),
    }),

    /**
     * Get chef meals
     * GET /api/chef/meals
     */
    getChefMeals: builder.query<
      {
        meals: {
          _id: string;
          name: string;
          description?: string;
          price?: number;
          image?: string;
          cuisine?: string;
          ingredients?: string[];
          dietaryInfo?: {
            vegetarian?: boolean;
            vegan?: boolean;
            glutenFree?: boolean;
          };
          allergens?: string[];
          prepTime?: number;
          servings?: number;
          status?: string;
          rating?: number;
          reviewCount?: number;
          createdAt?: string;
          updatedAt?: string;
        }[];
      },
      { limit?: number; offset?: number }
    >({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.limit) searchParams.append("limit", params.limit.toString());
        if (params.offset)
          searchParams.append("offset", params.offset.toString());
        const queryString = searchParams.toString();
        return {
          url: `/api/chef/meals${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
    }),

    /**
     * Start live session
     * POST /api/functions/startLiveSession
     */
    startLiveSession: builder.mutation<
      { sessionId: string; channelName: string; status: string },
      { title: string; description: string; mealId: string; tags?: string[] }
    >({
      query: (data) => ({
        url: "/api/functions/startLiveSession",
        method: "POST",
        body: data,
      }),
    }),
  }),
});

// ============================================================================
// EXPORTED HOOKS
// ============================================================================

// Customer Profile
export const {
  useGetCustomerProfileQuery,
  useUpdateCustomerProfileMutation,
  useUploadProfileImageMutation,
  useSetupTwoFactorMutation,
  useDisableTwoFactorMutation,
} = customerApi;

// Account Management
export const {
  useDeleteAccountMutation,
  useSubmitDeleteAccountFeedbackMutation,
  useDownloadAccountDataMutation,
  useChangePasswordMutation,
  useGetSessionsQuery,
  useRevokeSessionMutation,
} = customerApi;

// Food Safety
export const {
  useGetAllergiesQuery,
  useUpdateAllergiesMutation,
  useGetDietaryPreferencesQuery,
  useUpdateDietaryPreferencesMutation,
  useUpdateCrossContaminationSettingMutation,
} = customerApi;

// Data Sharing
export const {
  useGetDataSharingPreferencesQuery,
  useUpdateDataSharingPreferencesMutation,
} = customerApi;

// Support
export const { useGetSupportCasesQuery, useCreateSupportCaseMutation } =
  customerApi;

// Event Chef Requests
export const { useCreateEventChefRequestMutation } = customerApi;

// Notifications
export const {
  useGetNotificationsQuery,
  useGetNotificationStatsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = customerApi;

// Cuisines
export const {
  useGetCuisinesQuery,
  useGetTopCuisinesQuery,
  useGetCuisineCategoriesQuery,
} = customerApi;

// Chefs
export const {
  useGetPopularChefsQuery,
  useGetChefDetailsQuery,
  useSearchChefsByLocationMutation,
  useSearchChefsWithQueryMutation,
  useGetPopularChefDetailsQuery,
  useGetNearbyChefsQuery,
  useGetFeaturedKitchensQuery,
} = customerApi;

// Cart
export const {
  useGetCartQuery,
  useAddToCartMutation,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
} = customerApi;

// Orders
export const {
  useGetOrdersQuery,
  useGetRecentDishesQuery,
  useGetUsualDinnerItemsQuery,
  useGetOrderQuery,
  useGetOrderStatusQuery,
  useCreateOrderMutation,
  useCreateOrderFromCartMutation,
  useCancelOrderMutation,
  useRateOrderMutation,
} = customerApi;

// Analytics & User Behavior
export const {
  useGetUserBehaviorQuery,
  useGetColleagueConnectionsQuery,
  useGetPlayToWinHistoryQuery,
} = customerApi;

// Regional Availability
export const {
  useGetRegionalAvailabilityConfigQuery,
  useCheckRegionAvailabilityMutation,
} = customerApi;

// Group Orders
export const {
  useCreateGroupOrderMutation,
  useGetGroupOrderQuery,
  useJoinGroupOrderMutation,
  useCloseGroupOrderMutation,
  useChipInToBudgetMutation,
  useGetBudgetDetailsQuery,
  useGetParticipantSelectionsQuery,
  useUpdateParticipantSelectionsMutation,
  useMarkSelectionsReadyMutation,
  useGetGroupOrderStatusQuery,
  useStartSelectionPhaseMutation,
} = customerApi;

// Connections
export const {
  useGetUserConnectionsQuery,
  useCreateConnectionMutation,
  useRemoveConnectionMutation,
} = customerApi;

// Special Offers
export const { useGetActiveOffersQuery } = customerApi;

// Meals
export const {
  useGetPopularMealsQuery,
  useGetTakeawayItemsQuery,
  useGetTooFreshItemsQuery,
  useGetTopKebabsQuery,
} = customerApi;

// Search
export const {
  useSearchQuery,
  useSearchWithEmotionsMutation,
  useSearchChefsQuery,
  useGetSearchSuggestionsQuery,
  useGetTrendingSearchQuery,
} = customerApi;

// AI Chat
export const { useSendChatMessageMutation } = customerApi;

// Payment
export const {
  useCreateCheckoutMutation,
  useGetPaymentMethodsQuery,
  useAddPaymentMethodMutation,
  useCreateSetupIntentMutation,
  useSetDefaultPaymentMethodMutation,
  useGetCribnoshBalanceQuery,
  useGetBalanceTransactionsQuery,
  useTopUpBalanceMutation,
  useGetFamilyProfileQuery,
  useSetupFamilyProfileMutation,
  useInviteFamilyMemberMutation,
  useValidateFamilyMemberEmailMutation,
  useAcceptFamilyInvitationMutation,
  useUpdateMemberBudgetMutation,
  useUpdateMemberPreferencesMutation,
  useUpdateMemberMutation,
  useRemoveFamilyMemberMutation,
  useGetFamilyOrdersQuery,
  useGetFamilySpendingQuery,
} = customerApi;

// Kitchen Favorites
export const {
  useGetKitchenFavoriteStatusQuery,
  useAddKitchenFavoriteMutation,
  useRemoveKitchenFavoriteMutation,
} = customerApi;

// Kitchen Meals
export const {
  useGetKitchenMealsQuery,
  useSearchKitchenMealsQuery,
  useGetKitchenPopularMealsQuery,
  useGetKitchenCategoriesQuery,
  useGetKitchenDetailsQuery,
  useGetKitchenTagsQuery,
} = customerApi;

// Live Streaming
export const {
  useGetLiveStreamsQuery,
  useGetLiveSessionQuery,
  useGetLiveCommentsQuery,
  useSendLiveCommentMutation,
  useGetLiveReactionsQuery,
  useSendLiveReactionMutation,
  useGetLiveViewersQuery,
  useGetLiveChatQuery,
  useGetLiveStreamOrdersQuery,
} = customerApi;

export const { useGetChefMealsQuery, useStartLiveSessionMutation } =
  customerApi;

export const {
  useGetSupportChatQuery,
  useGetSupportChatMessagesQuery,
  useSendSupportMessageMutation,
  useGetSupportAgentQuery,
  useGetQuickRepliesQuery,
} = customerApi;

// Profile Screen Endpoints
export const {
  useGetForkPrintScoreQuery,
  useGetNoshPointsQuery,
  useGetCaloriesProgressQuery,
  useGetMonthlyOverviewQuery,
  useGetWeeklySummaryQuery,
} = customerApi;

// Custom Orders
export const {
  useCreateCustomOrderMutation,
  useGetCustomOrdersQuery,
  useGetCustomOrderQuery,
  useUpdateCustomOrderMutation,
  useDeleteCustomOrderMutation,
  useGenerateSharedOrderLinkMutation,
} = customerApi;

// Dishes
export const {
  useGetDishDetailsQuery,
  useGetSimilarDishesQuery,
  useGetRecommendedMealsQuery,
} = customerApi;

// Menus
export const { useGetChefMenusQuery, useGetMenuDetailsQuery } = customerApi;

// Videos
export const {
  useGetKitchenFeaturedVideoQuery,
  useGetVideoByIdQuery,
  useGetVideoFeedQuery,
  useGetTrendingVideosQuery,
  useSearchVideosQuery,
  useGetUserVideosQuery,
  useGetVideoCollectionsQuery,
  useLikeVideoMutation,
  useUnlikeVideoMutation,
  useShareVideoMutation,
  useReportVideoMutation,
  useRecordVideoViewMutation,
  useGetVideoCommentsQuery,
  useAddVideoCommentMutation,
  useEditVideoCommentMutation,
  useDeleteVideoCommentMutation,
  useCreateVideoPostMutation,
  useUpdateVideoPostMutation,
  useDeleteVideoPostMutation,
  useGetVideoUploadUrlMutation,
  useGetConvexVideoUploadUrlMutation,
  useGetThumbnailUploadUrlMutation,
  useFollowUserMutation,
  useUnfollowUserMutation,
} = customerApi;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Helper function to build search parameters
 */
export const buildSearchParams = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach((item) => searchParams.append(key, item.toString()));
      } else {
        searchParams.append(key, value.toString());
      }
    }
  });

  return searchParams.toString();
};

/**
 * Helper function to handle API errors consistently
 */
export const handleApiError = (error: any): string => {
  if (error?.data?.error?.message) {
    return error.data.error.message;
  }
  if (error?.message) {
    return error.message;
  }
  return "An unexpected error occurred";
};
