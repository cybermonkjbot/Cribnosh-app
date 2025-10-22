// app/store/customerApi.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import * as SecureStore from "expo-secure-store";
import { isTokenExpired } from "../../utils/jwtUtils";
import {
  // Request types
  AddToCartRequest,
  AddToCartResponse,
  CancelOrderRequest,
  CancelOrderResponse,
  CheckoutRequest,
  CheckoutResponse,
  // New search types
  ChefSearchParams,
  ChefSearchResponse,
  CreateOrderRequest,
  CreateOrderResponse,
  DeleteCustomOrderResponse,
  EmotionsSearchRequest,
  EmotionsSearchResponse,
  GetCartResponse,
  GetCuisinesResponse,
  // Response types
  GetCustomerProfileResponse,
  GetCustomOrderResponse,
  GetCustomOrdersResponse,
  GetLiveStreamsResponse,
  GetOrderResponse,
  GetOrdersResponse,
  GetOrderStatusResponse,
  GetPopularChefsResponse,
  PaginationParams,
  RateOrderRequest,
  RateOrderResponse,
  SearchRequest,
  SearchResponse,
  SearchSuggestionsParams,
  SearchSuggestionsResponse,
  SortParams,
  TrendingSearchParams,
  TrendingSearchResponse,
  UpdateCustomOrderRequest,
  UpdateCustomOrderResponse,
} from "../types/customer";

// ============================================================================
// BASE QUERY CONFIGURATION
// ============================================================================

const baseQuery = fetchBaseQuery({
  baseUrl: "https://cribnosh.com/api",
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

    // ========================================================================
    // ORDER ENDPOINTS
    // ========================================================================

    /**
     * Get customer orders
     * GET /customer/orders
     */
    getOrders: builder.query<GetOrdersResponse, PaginationParams & SortParams>({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.page) searchParams.append("page", params.page.toString());
        if (params.limit) searchParams.append("limit", params.limit.toString());
        if (params.sort_by) searchParams.append("sort_by", params.sort_by);
        if (params.sort_order)
          searchParams.append("sort_order", params.sort_order);

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
    // CUSTOM ORDERS ENDPOINTS
    // ========================================================================

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
  }),
});

// ============================================================================
// EXPORTED HOOKS
// ============================================================================

// Customer Profile
export const { useGetCustomerProfileQuery } = customerApi;

// Cuisines
export const { useGetCuisinesQuery } = customerApi;

// Chefs
export const { useGetPopularChefsQuery } = customerApi;

// Cart
export const { useGetCartQuery, useAddToCartMutation } = customerApi;

// Orders
export const {
  useGetOrdersQuery,
  useGetOrderQuery,
  useGetOrderStatusQuery,
  useCreateOrderMutation,
  useCancelOrderMutation,
  useRateOrderMutation,
} = customerApi;

// Search
export const {
  useSearchQuery,
  useSearchWithEmotionsMutation,
  useSearchChefsQuery,
  useGetSearchSuggestionsQuery,
  useGetTrendingSearchQuery,
} = customerApi;

// Payment
export const { useCreateCheckoutMutation } = customerApi;

// Live Streaming
export const { useGetLiveStreamsQuery } = customerApi;

// Custom Orders
export const {
  useGetCustomOrdersQuery,
  useGetCustomOrderQuery,
  useUpdateCustomOrderMutation,
  useDeleteCustomOrderMutation,
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
