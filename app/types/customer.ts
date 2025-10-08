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
