export interface CustomerProfile {
  user_id: string;
  name: string;
  email?: string;
  phone?: string;
  picture?: string;
  preferences?: CustomerPreferences;
  address?: CustomerAddress;
  created_at: string;
  updated_at: string;
}

export interface CustomerPreferences {
  dietary_restrictions?: string[];
  favorite_cuisines?: string[];
  delivery_instructions?: string;
  notification_preferences?: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

export interface CustomerAddress {
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

// ============================================================================
// CUISINE TYPES
// ============================================================================

export interface Cuisine {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  restaurant_count: number;
  is_active: boolean;
  created_at: string;
}

// ============================================================================
// CHEF/KITCHEN TYPES
// ============================================================================

export interface Chef {
  id: string;
  name: string;
  kitchen_name: string;
  cuisine: string;
  rating: number;
  review_count: number;
  delivery_time: string;
  distance: string;
  image_url?: string;
  is_live?: boolean;
  live_viewers?: number;
  sentiment:
    | "bussing"
    | "mid"
    | "notIt"
    | "fire"
    | "slaps"
    | "decent"
    | "meh"
    | "trash"
    | "elite"
    | "solid"
    | "average"
    | "skip";
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  created_at: string;
}

// ============================================================================
// CART TYPES
// ============================================================================

export interface CartItem {
  id: string;
  dish_id: string;
  dish_name: string;
  kitchen_id: string;
  kitchen_name: string;
  price: number; // in cents
  quantity: number;
  image_url?: string;
  special_instructions?: string;
  added_at: string;
}

export interface Cart {
  id: string;
  customer_id: string;
  items: CartItem[];
  subtotal: number; // in cents
  delivery_fee: number; // in cents
  tax: number; // in cents
  total: number; // in cents
  created_at: string;
  updated_at: string;
}

// ============================================================================
// ORDER TYPES
// ============================================================================

export interface Order {
  id: string;
  customer_id: string;
  kitchen_id: string;
  kitchen_name: string;
  status:
    | "pending"
    | "confirmed"
    | "preparing"
    | "ready"
    | "delivered"
    | "cancelled";
  items: OrderItem[];
  subtotal: number; // in cents
  delivery_fee: number; // in cents
  tax: number; // in cents
  total: number; // in cents
  delivery_address: CustomerAddress;
  special_instructions?: string;
  created_at: string;
  updated_at: string;
  estimated_delivery_time?: string;
}

export interface OrderItem {
  id: string;
  dish_id: string;
  dish_name: string;
  price: number; // in cents
  quantity: number;
  special_instructions?: string;
}

// ============================================================================
// SEARCH TYPES
// ============================================================================

export interface SearchQuery {
  query: string;
  type?: "all" | "chefs" | "dishes" | "cuisines";
  filters?: SearchFilters;
  page?: number;
  limit?: number;
}

export interface SearchFilters {
  cuisine?: string[];
  price_range?: {
    min: number;
    max: number;
  };
  rating_min?: number;
  delivery_time_max?: number; // in minutes
  distance_max?: number; // in miles
}

export interface SearchResult {
  id: string;
  type: "chef" | "dish" | "cuisine";
  title: string;
  description?: string;
  image_url?: string;
  rating?: number;
  price?: number;
  delivery_time?: string;
  distance?: string;
  sentiment?: string;
  relevance_score: number;
}

// ============================================================================
// EMOTIONS ENGINE TYPES
// ============================================================================

export interface EmotionsSearchRequest {
  query: string;
  customer_context?: {
    mood?: string;
    time_of_day?: string;
    weather?: string;
    previous_orders?: string[];
    dietary_preferences?: string[];
  };
  filters?: SearchFilters;
  page?: number;
  limit?: number;
}

// ============================================================================
// PAYMENT TYPES
// ============================================================================

export interface PaymentIntent {
  id: string;
  amount: number; // in cents
  currency: string;
  status:
    | "requires_payment_method"
    | "requires_confirmation"
    | "requires_action"
    | "processing"
    | "succeeded"
    | "canceled";
  client_secret: string;
  created_at: string;
}

// ============================================================================
// LIVE STREAMING TYPES
// ============================================================================

export interface LiveStream {
  id: string;
  chef_id: string;
  chef_name: string;
  kitchen_name: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  viewer_count: number;
  is_live: boolean;
  started_at: string;
  ended_at?: string;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

// GET /customer/profile/me
export interface GetCustomerProfileResponse {
  success: boolean;
  data: CustomerProfile;
}

// GET /customer/cuisines
export interface GetCuisinesResponse {
  success: boolean;
  data: Cuisine[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// GET /customer/chefs/popular
export interface GetPopularChefsResponse {
  success: boolean;
  data: Chef[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// GET /customer/cart
export interface GetCartResponse {
  success: boolean;
  data: Cart;
}

// POST /customer/cart/items
export interface AddToCartRequest {
  dish_id: string;
  quantity: number;
  special_instructions?: string;
}

export interface AddToCartResponse {
  success: boolean;
  data: CartItem;
  message: string;
}

// GET /customer/orders
export interface GetOrdersResponse {
  success: boolean;
  data: Order[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// GET /customer/orders/{order_id}
export interface GetOrderResponse {
  success: boolean;
  data: Order;
  message: string;
}

// GET /customer/orders/{order_id}/status
export interface OrderStatusUpdate {
  status: string;
  timestamp: string;
  message?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

export interface GetOrderStatusResponse {
  success: boolean;
  data: {
    order_id: string;
    current_status: string;
    status_updates: OrderStatusUpdate[];
    estimated_delivery_time?: string;
    delivery_person?: {
      name: string;
      phone: string;
      vehicle_type?: string;
      vehicle_number?: string;
    };
  };
  message: string;
}

// POST /customer/orders
export interface CreateOrderRequest {
  kitchen_id: string;
  items: {
    dish_id: string;
    quantity: number;
    special_instructions?: string;
  }[];
  delivery_address: CustomerAddress;
  special_instructions?: string;
}

export interface CreateOrderResponse {
  success: boolean;
  data: Order;
  message: string;
}

// POST /customer/orders/{order_id}/cancel
export interface CancelOrderRequest {
  reason?: string;
  refund_preference?: "full_refund" | "partial_refund" | "credit";
}

export interface CancelOrderResponse {
  success: boolean;
  data: {
    order_id: string;
    cancellation_status: "cancelled" | "pending_refund" | "refunded";
    refund_amount?: number;
    refund_method?: string;
    cancelled_at: string;
  };
  message: string;
}

// POST /customer/orders/{order_id}/rate
export interface RateOrderRequest {
  rating: number; // 1-5 stars
  review?: string;
  categories?: {
    food_quality?: number;
    delivery_speed?: number;
    packaging?: number;
    customer_service?: number;
  };
}

export interface RateOrderResponse {
  success: boolean;
  data: {
    order_id: string;
    rating: number;
    review?: string;
    rated_at: string;
  };
  message: string;
}

// POST /customer/search
export interface SearchRequest {
  query: string;
  type?: "all" | "chefs" | "dishes" | "cuisines";
  filters?: SearchFilters;
  page?: number;
  limit?: number;
}

export interface SearchResponse {
  success: boolean;
  data: SearchResult[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// POST /customer/search (Emotions Engine)
export interface EmotionsSearchResponse {
  success: boolean;
  data: SearchResult[];
  emotions_context?: {
    detected_mood: string;
    confidence: number;
    suggested_queries: string[];
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// POST /customer/checkout
export interface CheckoutRequest {
  payment_method_id?: string;
  save_payment_method?: boolean;
}

export interface CheckoutResponse {
  success: boolean;
  data: PaymentIntent;
  message: string;
}

// GET /api/live-streaming/customer
export interface GetLiveStreamsResponse {
  success: boolean;
  data: LiveStream[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  timestamp: string;
}

// ============================================================================
// CUSTOM ORDERS TYPES
// ============================================================================

export interface CustomOrder {
  _id: string;
  userId: string;
  chefId?: string;
  requirements: string;
  serving_size: number;
  desired_delivery_time?: string;
  custom_order_id: string;
  order_id?: string;
  status:
    | "pending"
    | "processing"
    | "completed"
    | "cancelled"
    | "accepted"
    | "preparing"
    | "ready"
    | "delivered";
  dietary_restrictions?: string;
  estimatedPrice?: number;
  deliveryDate?: string;
  deliveryAddress?: CustomerAddress;
  specialInstructions?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateCustomOrderRequest {
  requirements: string;
  serving_size: number;
  desired_delivery_time?: string;
  dietary_restrictions?: string;
  specialInstructions?: string;
  deliveryAddress?: CustomerAddress;
  budget?: number;
}

export interface UpdateCustomOrderRequest {
  details: {
    cuisine?: string;
    dietary_restrictions?: string[];
    servings?: number;
    budget?: number;
    special_requests?: string;
    delivery_preferences?: {
      preferred_time?: string;
      contact_method?: string;
    };
  };
}

// ============================================================================
// CUSTOM ORDERS API RESPONSE TYPES
// ============================================================================

export interface GetCustomOrdersResponse {
  success: boolean;
  data: {
    orders: CustomOrder[];
    total: number;
    limit: number;
    offset: number;
  };
  message: string;
}

export interface GetCustomOrderResponse {
  success: boolean;
  data: CustomOrder;
  message: string;
}

export interface UpdateCustomOrderResponse {
  success: boolean;
  data: {
    success: boolean;
    orderId: string;
    updatedAt: string;
  };
  message: string;
}

export interface DeleteCustomOrderResponse {
  success: boolean;
  data: {
    success: boolean;
    orderId: string;
    deletedAt: string;
  };
  message: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type ApiResponse<T> = T | ApiError;

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SortParams {
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

// ========================================================================
// SEARCH ENDPOINTS - MISSING INTEGRATIONS
// ========================================================================

// GET /customer/search/chefs
export interface ChefSearchParams {
  q: string; // Required search query
  location?: string;
  cuisine?: string;
  rating_min?: number;
  limit?: number;
  offset?: number;
}

export interface SearchChef {
  _id: string;
  name: string;
  bio?: string;
  specialties: string[];
  location?: string;
  rating?: number;
  review_count?: number;
  image?: string;
  experience_years?: number;
  is_verified: boolean;
  is_available: boolean;
  price_range?: string;
  languages?: string[];
  certifications?: string[];
  cuisines: string[];
  created_at: string;
}

export interface ChefSearchResponse {
  success: boolean;
  data: {
    chefs: SearchChef[];
    metadata: {
      query: string;
      total_results: number;
      limit: number;
      offset: number;
      has_more: boolean;
      search_time_ms: number;
    };
  };
  message: string;
}

// GET /customer/search/suggestions
export interface SearchSuggestionsParams {
  q: string; // Required partial query
  location?: string;
  limit?: number;
  category?: "all" | "dishes" | "chefs" | "cuisines" | "restaurants";
  user_id?: string;
}

export interface SearchSuggestion {
  text: string;
  type: "dish" | "chef" | "cuisine" | "restaurant" | "ingredient";
  confidence: number;
  popularity_score: number;
  category?: string;
  image_url?: string;
  chef_name?: string;
  price_range?: string;
  rating?: number;
  is_trending: boolean;
  search_count?: number;
}

export interface SearchSuggestionsResponse {
  success: boolean;
  data: {
    suggestions: SearchSuggestion[];
    metadata: {
      query: string;
      total_suggestions: number;
      personalized: boolean;
      generated_at: string;
      cache_duration: number;
    };
  };
  message: string;
}

// GET /customer/search/trending
export interface TrendingSearchParams {
  location?: string;
  cuisine?: string;
  time_range?: "hour" | "day" | "week" | "month";
  limit?: number;
  category?: "dishes" | "chefs" | "cuisines" | "restaurants";
}

export interface TrendingItem {
  id: string;
  name: string;
  type: "dish" | "chef" | "cuisine" | "restaurant";
  popularity_score: number;
  trend_direction: "up" | "down" | "stable";
  search_count: number;
  image_url?: string;
  chef_name?: string;
  cuisine?: string;
  price_range?: string;
  rating?: number;
  review_count?: number;
}

export interface TrendingSearchResponse {
  success: boolean;
  data: {
    trending: TrendingItem[];
    metadata: {
      time_range: string;
      location?: string;
      total_items: number;
      generated_at: string;
    };
  };
  message: string;
}
