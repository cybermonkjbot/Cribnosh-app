// store/customerApi.ts
import { API_CONFIG } from '@/constants/api';
import {
  AddPaymentMethodRequest,
  AddPaymentMethodResponse,
  // Request types
  AddToCartRequest,
  AddToCartResponse,
  CancelOrderRequest,
  CancelOrderResponse,
  ChatMessageRequest,
  ChatMessageResponse,
  CheckoutRequest,
  CheckoutResponse,
  // New search types
  ChefSearchParams,
  ChefSearchResponse,
  CreateCustomOrderRequest,
  CreateCustomOrderResponse,
  CreateOrderFromCartRequest,
  CreateOrderFromCartResponse,
  CreateOrderRequest,
  CreateOrderResponse,
  CreateSupportCaseRequest,
  CreateSupportCaseResponse,
  DeleteAccountFeedbackRequest,
  DeleteAccountResponse,
  DeleteCustomOrderResponse,
  DownloadAccountDataResponse,
  EmotionsSearchRequest,
  EmotionsSearchResponse,
  GenerateSharedOrderLinkRequest,
  GenerateSharedOrderLinkResponse,
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
  GetForkPrintScoreResponse,
  GetLiveStreamsResponse,
  GetMenuDetailsResponse,
  GetMonthlyOverviewResponse,
  GetNoshPointsResponse,
  GetOrderResponse,
  GetOrderStatusResponse,
  GetOrdersResponse,
  GetPaymentMethodsResponse,
  GetPopularChefDetailsResponse,
  GetPopularChefsResponse,
  GetSimilarDishesResponse,
  GetSupportCasesResponse,
  GetTopCuisinesParams,
  GetTopCuisinesResponse,
  GetWeeklySummaryResponse,
  PaginationParams,
  RateOrderRequest,
  RateOrderResponse,
  RemoveCartItemResponse,
  SearchChefsByLocationRequest,
  SearchChefsByLocationResponse,
  SearchChefsRequest,
  SearchChefsResponse,
  SearchRequest,
  SearchResponse,
  SearchSuggestionsParams,
  SearchSuggestionsResponse,
  SetDefaultPaymentMethodResponse,
  SetupFamilyProfileRequest,
  SetupFamilyProfileResponse,
  SortParams,
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

// ============================================================================
// CUSTOMER API DEFINITION
// ============================================================================

export const customerApi = createApi({
  reducerPath: "customerApi",
  baseQuery,
  tagTypes: [
    "CustomerProfile",
    "Cuisines",
    "Chefs",
    "Cart",
    "CartItem",
    "Orders",
    "SearchResults",
    "LiveStreams",
    "PaymentIntent",
    "CustomOrders",
    "Videos",
    "KitchenFavorites",
    "KitchenMeals",
    "KitchenCategories",
    "Dishes",
  ],
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
     * Get chef details by ID
     * GET /customer/chefs/{chef_id}
     */
    getChefDetails: builder.query<
      GetChefDetailsResponse,
      GetChefDetailsParams
    >({
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
    }),

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
    getPopularChefDetails: builder.query<
      GetPopularChefDetailsResponse,
      string
    >({
      query: (chefId) => ({
        url: `/customer/chefs/popular/${chefId}`,
        method: "GET",
      }),
      providesTags: (result, error, chefId) => [
        { type: "Chefs", id: `popular/${chefId}` },
      ],
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
    getOrders: builder.query<GetOrdersResponse, PaginationParams & SortParams & { status?: "ongoing" | "past" | "all"; order_type?: "individual" | "group" | "all" }>({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.page) searchParams.append("page", params.page.toString());
        if (params.limit) searchParams.append("limit", params.limit.toString());
        if (params.sort_by) searchParams.append("sort_by", params.sort_by);
        if (params.sort_order)
          searchParams.append("sort_order", params.sort_order);
        if (params.status) searchParams.append("status", params.status);
        if (params.order_type) searchParams.append("order_type", params.order_type);

        const queryString = searchParams.toString();
        return {
          url: `/customer/orders${queryString ? `?${queryString}` : ""}`,
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
    createGroupOrder: builder.mutation<CreateGroupOrderResponse, CreateGroupOrderRequest>({
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
    joinGroupOrder: builder.mutation<JoinGroupOrderResponse, JoinGroupOrderRequest>({
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
    // SPECIAL OFFERS ENDPOINTS
    // ========================================================================

    /**
     * Get active special offers
     * GET /customer/offers/active
     */
    getActiveOffers: builder.query<GetActiveOffersResponse, GetActiveOffersParams>({
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
    sendChatMessage: builder.mutation<
      ChatMessageResponse,
      ChatMessageRequest
    >({
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
     * Setup family profile
     * POST /customer/family-profile
     * Backend endpoint needed: POST /customer/family-profile
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
    getDietaryPreferences: builder.query<
      GetDietaryPreferencesResponse,
      void
    >({
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
     * Backend endpoint needed: GET /customer/support-cases
     */
    getSupportCases: builder.query<GetSupportCasesResponse, void>({
      query: () => ({
        url: "/customer/support-cases",
        method: "GET",
      }),
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
      providesTags: (result, error, dishId) => [
        { type: "Dishes", id: dishId },
      ],
    }),

    /**
     * Get similar dishes
     * GET /customer/dishes/{dish_id}/similar
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
          url: `/customer/dishes/${dishId}/similar${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      providesTags: (result, error, { dishId }) => [
        { type: "Dishes", id: `${dishId}/similar` },
      ],
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
        if (params?.start_date) searchParams.append("start_date", params.start_date);
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
      providesTags: ["Videos"],
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
  }),
});

// ============================================================================
// EXPORTED HOOKS
// ============================================================================

// Customer Profile
export const {
  useGetCustomerProfileQuery,
  useUpdateCustomerProfileMutation,
} = customerApi;

// Account Management
export const {
  useDeleteAccountMutation,
  useSubmitDeleteAccountFeedbackMutation,
  useDownloadAccountDataMutation,
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
export const {
  useGetSupportCasesQuery,
  useCreateSupportCaseMutation,
} = customerApi;

// Cuisines
export const { useGetCuisinesQuery, useGetTopCuisinesQuery } = customerApi;

// Chefs
export const {
  useGetPopularChefsQuery,
  useGetChefDetailsQuery,
  useSearchChefsByLocationMutation,
  useSearchChefsWithQueryMutation,
  useGetPopularChefDetailsQuery,
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
  useGetOrderQuery,
  useGetOrderStatusQuery,
  useCreateOrderMutation,
  useCreateOrderFromCartMutation,
  useCancelOrderMutation,
  useRateOrderMutation,
} = customerApi;

// Group Orders
export const {
  useCreateGroupOrderMutation,
  useGetGroupOrderQuery,
  useJoinGroupOrderMutation,
  useCloseGroupOrderMutation,
} = customerApi;

// Special Offers
export const {
  useGetActiveOffersQuery,
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
export const {
  useSendChatMessageMutation,
} = customerApi;

// Payment
export const {
  useCreateCheckoutMutation,
  useGetPaymentMethodsQuery,
  useAddPaymentMethodMutation,
  useSetDefaultPaymentMethodMutation,
  useGetCribnoshBalanceQuery,
  useGetBalanceTransactionsQuery,
  useSetupFamilyProfileMutation,
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
} = customerApi;

// Live Streaming
export const { useGetLiveStreamsQuery } = customerApi;

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
} = customerApi;

// Menus
export const {
  useGetChefMenusQuery,
  useGetMenuDetailsQuery,
} = customerApi;

// Videos
export const {
  useGetKitchenFeaturedVideoQuery,
  useGetVideoByIdQuery,
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
