export interface CustomerProfile {
  user_id: string;
  name: string;
  email?: string;
  phone?: string;
  picture?: string;
  preferences?: CustomerPreferences;
  address?: CustomerAddress;
  is_verified?: boolean;
  verification_status?: string;
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
  _id?: string;
  order_id?: string;
  customer_id: string;
  kitchen_id: string;
  kitchen_name?: string;
  restaurant_name?: string;
  status:
    | "pending"
    | "confirmed"
    | "preparing"
    | "ready"
    | "on_the_way"
    | "on-the-way"
    | "delivered"
    | "cancelled";
  order_status?: string;
  items: OrderItem[];
  order_items?: Array<{
    dish_id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number; // in cents
  delivery_fee: number; // in cents
  tax: number; // in cents
  total: number; // in cents
  total_amount?: number;
  delivery_address: CustomerAddress;
  special_instructions?: string;
  created_at: string;
  updated_at: string;
  estimated_delivery_time?: string;
  estimated_prep_time_minutes?: number;
  is_group_order?: boolean;
  group_order?: {
    participants: GroupOrderParticipant[];
    total_participants: number;
  };
  group_order_details?: {
    participants: GroupOrderParticipant[];
    total_participants: number;
  };
  createdAt?: number;
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
  dietary_restrictions?: string[]; // e.g., ["vegan", "gluten-free", "vegetarian"]
  spice_level?: string; // "mild", "medium", "hot", "spicy", "extra-hot"
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
// DISH/MEAL TYPES
// ============================================================================

export interface Dish {
  id: string;
  name: string;
  description: string;
  kitchen_id: string;
  kitchen_name: string;
  kitchen_avatar?: string;
  price: number; // in cents
  image_url?: string;
  calories?: number;
  fat?: string;
  protein?: string;
  carbs?: string;
  diet_compatibility?: number; // percentage
  diet_message?: string;
  ingredients?: {
    name: string;
    quantity: string;
    is_allergen?: boolean;
    allergen_type?: string;
  }[];
  is_vegetarian?: boolean;
  is_safe_for_you?: boolean;
  prep_time?: string;
  delivery_time?: string;
  chef_name?: string;
  chef_story?: string;
  chef_tips?: string[];
  rating?: number;
  review_count?: number;
  sentiment?: "bussing" | "mid" | "notIt" | "fire" | "slaps" | "decent" | "meh" | "trash" | "elite" | "solid" | "average" | "skip";
  created_at: string;
  updated_at: string;
}

export interface SimilarDish {
  id: string;
  name: string;
  price: string;
  image_url?: string;
  sentiment?: "bussing" | "mid" | "notIt";
  is_vegetarian?: boolean;
  kitchen_name?: string;
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

// PUT /customer/profile/me
export interface UpdateCustomerProfileRequest {
  name?: string;
  email?: string;
  phone?: string;
  picture?: string;
  preferences?: Partial<CustomerPreferences>;
  address?: Partial<CustomerAddress>;
}

export interface UpdateCustomerProfileResponse {
  success: boolean;
  data: CustomerProfile;
  message: string;
}

// DELETE /customer/account
export interface DeleteAccountResponse {
  success: boolean;
  message: string;
  data?: {
    account_deleted_at: string;
    deletion_scheduled?: boolean;
  };
}

// POST /customer/account/delete-feedback
export interface DeleteAccountFeedbackRequest {
  feedback_options: number[]; // Array of selected option indices
  additional_feedback?: string;
}

// POST /customer/account/download-data
export interface DownloadAccountDataResponse {
  success: boolean;
  message: string;
  data?: {
    request_id: string;
    status: "pending" | "processing" | "ready" | "expired";
    download_url?: string;
    expires_at?: string;
    requested_at: string;
  };
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
  data: {
    orders: Order[];
    total: number;
    limit: number;
    offset: number;
  };
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

// POST /customer/orders/from-cart
export interface CreateOrderFromCartRequest {
  payment_intent_id: string;
  delivery_address?: CustomerAddress;
  special_instructions?: string;
  delivery_time?: string; // ISO date string
}

export interface CreateOrderFromCartResponse {
  success: boolean;
  data: {
    order_id: string;
    order: Order;
  };
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

// ============================================================================
// AI CHAT TYPES
// ============================================================================

export interface DishRecommendation {
  dish_id: string;
  name: string;
  price: number; // in pence/cents
  image_url: string;
  description: string;
  chef_name: string;
  chef_id: string;
  badge?: string; // "BUSSIN", "BEST FIT", "HIGH PROTEIN"
  relevance_score: number;
  dietary_tags: string[];
  rating: number;
  review_count: number;
}

export interface ChatMessageRequest {
  message: string;
  conversation_id?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  preferences?: {
    dietaryRestrictions?: string[];
    allergies?: string[];
    cuisinePreferences?: string[];
    spiceLevel?: string;
  };
}

export interface ChatMessageResponse {
  success: boolean;
  data: {
    message: string;
    recommendations?: DishRecommendation[];
    conversation_id: string;
    message_id: string;
  };
  message: string;
}

export interface AIRecommendationProduct {
  dish_id: string;
  name: string;
  price: string; // formatted as "£19"
  image: any; // React Native image source
  badge?: { text: string; type: 'hot' | 'bestfit' | 'highprotein' };
  hasFireEmoji?: boolean;
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
// GROUP ORDERS TYPES
// ============================================================================

export interface GroupOrderParticipant {
  user_id: string;
  user_name: string;
  user_initials: string;
  user_color?: string;
  avatar_url?: string;
  total_contribution: number;
  payment_status: "pending" | "paid" | "failed";
}

export interface GroupOrder {
  group_order_id: string;
  created_by: string;
  chef_id: string;
  restaurant_name: string;
  title: string;
  status: "active" | "closed" | "confirmed" | "preparing" | "ready" | "on_the_way" | "delivered" | "cancelled";
  participants: GroupOrderParticipant[];
  total_amount: number;
  discount_percentage?: number;
  discount_amount?: number;
  final_amount: number;
  share_token?: string;
  share_link?: string;
  estimated_delivery_time?: string;
  created_at: number;
}

export interface CreateGroupOrderRequest {
  chef_id: string;
  restaurant_name: string;
  title?: string;
  delivery_address?: CustomerAddress;
  delivery_time?: string;
  expires_in_hours?: number;
}

export interface CreateGroupOrderResponse {
  success: boolean;
  data: {
    group_order_id: string;
    share_token: string;
    share_link: string;
    expires_at: number;
  };
}

export interface GetGroupOrderResponse {
  success: boolean;
  data: GroupOrder;
}

export interface JoinGroupOrderRequest {
  group_order_id: string;
  share_token?: string;
  order_items: Array<{
    dish_id: string;
    name: string;
    quantity: number;
    price: number;
    special_instructions?: string;
  }>;
}

export interface JoinGroupOrderResponse {
  success: boolean;
  data: {
    participant: GroupOrderParticipant;
    group_order: {
      total_amount: number;
      discount_amount: number;
      final_amount: number;
      participant_count: number;
    };
  };
}

export interface CloseGroupOrderResponse {
  success: boolean;
  data: {
    main_order_id: string;
    order_id: string;
  };
}

// ============================================================================
// SPECIAL OFFERS TYPES
// ============================================================================

export interface SpecialOffer {
  offer_id: string;
  title: string;
  description: string;
  call_to_action_text: string;
  offer_type: "limited_time" | "seasonal" | "promotional" | "referral";
  badge_text?: string;
  discount_type: "percentage" | "fixed_amount" | "free_delivery";
  discount_value: number;
  background_image_url?: string;
  background_color?: string;
  text_color?: string;
  action_type: "navigate" | "external_link" | "group_order";
  action_target: string;
  starts_at: number;
  ends_at: number;
}

export interface GetActiveOffersParams {
  target?: "all" | "new_users" | "existing_users" | "group_orders";
}

export interface GetActiveOffersResponse {
  success: boolean;
  data: {
    offers: SpecialOffer[];
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

export interface CreateCustomOrderResponse {
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

export interface GenerateSharedOrderLinkRequest {
  order_id: string;
}

export interface GenerateSharedOrderLinkResponse {
  success: boolean;
  data: {
    shareToken: string;
    shareLink: string;
    expiresAt: string;
    orderId: string;
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

// ============================================================================
// PAYMENT TYPES
// ============================================================================

export interface PaymentMethod {
  id: string;
  type: "apple_pay" | "card" | "paypal";
  last4?: string;
  brand?: string;
  expiry_month?: number;
  expiry_year?: number;
  is_default: boolean;
  created_at: string;
}

export interface GetPaymentMethodsResponse {
  success: boolean;
  data: PaymentMethod[];
  message: string;
}

export interface AddPaymentMethodRequest {
  type: "card" | "paypal";
  token?: string; // Payment token from payment processor
  card_details?: {
    number: string;
    expiry_month: number;
    expiry_year: number;
    cvc: string;
  };
}

export interface AddPaymentMethodResponse {
  success: boolean;
  data: PaymentMethod;
  message: string;
}

export interface SetDefaultPaymentMethodResponse {
  success: boolean;
  data: PaymentMethod;
  message: string;
}

export interface CribnoshBalance {
  balance: number; // in cents/pence
  currency: string;
  is_available: boolean;
  last_updated: string;
}

export interface GetCribnoshBalanceResponse {
  success: boolean;
  data: CribnoshBalance;
  message: string;
}

export interface BalanceTransaction {
  id: string;
  type: "deposit" | "withdrawal" | "refund" | "order_payment" | "bonus";
  amount: number; // in cents/pence
  description: string;
  order_id?: string;
  created_at: string;
}

export interface GetBalanceTransactionsResponse {
  success: boolean;
  data: {
    transactions: BalanceTransaction[];
    total: number;
    page: number;
    limit: number;
  };
  message: string;
}

export interface SetupFamilyProfileRequest {
  family_name: string;
  members: {
    name: string;
    email?: string;
    phone?: string;
    relationship?: string;
  }[];
}

export interface SetupFamilyProfileResponse {
  success: boolean;
  data: {
    family_profile_id: string;
    family_name: string;
    members_count: number;
  };
  message: string;
}

// ============================================================================
// FOOD SAFETY TYPES
// ============================================================================

export interface Allergy {
  id: string;
  name: string;
  severity: "mild" | "moderate" | "severe";
  notes?: string;
}

export interface GetAllergiesResponse {
  success: boolean;
  data: Allergy[];
  message: string;
}

export interface UpdateAllergiesRequest {
  allergies: {
    name: string;
    severity: "mild" | "moderate" | "severe";
    notes?: string;
  }[];
}

export interface UpdateAllergiesResponse {
  success: boolean;
  data: Allergy[];
  message: string;
}

export interface DietaryPreference {
  type: "vegetarian" | "vegan" | "halal" | "kosher" | "gluten_free" | "keto" | "paleo";
  strictness: "preferred" | "required";
  notes?: string;
}

export interface GetDietaryPreferencesResponse {
  success: boolean;
  data: DietaryPreference[];
  message: string;
}

export interface UpdateDietaryPreferencesRequest {
  preferences: DietaryPreference[];
}

export interface UpdateDietaryPreferencesResponse {
  success: boolean;
  data: DietaryPreference[];
  message: string;
}

export interface UpdateCrossContaminationSettingRequest {
  avoid_cross_contamination: boolean;
}

export interface UpdateCrossContaminationSettingResponse {
  success: boolean;
  data: {
    avoid_cross_contamination: boolean;
  };
  message: string;
}

// ============================================================================
// DATA SHARING TYPES
// ============================================================================

export interface DataSharingPreferences {
  analytics_enabled: boolean;
  personalization_enabled: boolean;
  marketing_enabled: boolean;
  updated_at: string;
}

export interface GetDataSharingPreferencesResponse {
  success: boolean;
  data: DataSharingPreferences;
  message: string;
}

export interface UpdateDataSharingPreferencesRequest {
  analytics_enabled?: boolean;
  personalization_enabled?: boolean;
  marketing_enabled?: boolean;
}

export interface UpdateDataSharingPreferencesResponse {
  success: boolean;
  data: DataSharingPreferences;
  message: string;
}

// ============================================================================
// SUPPORT TYPES
// ============================================================================

export interface SupportCase {
  id: string;
  subject: string;
  category: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  created_at: string;
  updated_at: string;
  last_message?: string;
}

export interface GetSupportCasesResponse {
  success: boolean;
  data: {
    cases: SupportCase[];
    total: number;
  };
  message: string;
}

export interface CreateSupportCaseRequest {
  subject: string;
  category: string;
  description: string;
  order_id?: string;
  priority?: "low" | "medium" | "high";
}

export interface CreateSupportCaseResponse {
  success: boolean;
  data: SupportCase;
  message: string;
}

// ============================================================================
// DISH API RESPONSE TYPES
// ============================================================================

// GET /api/customer/dishes/{dish_id}
export interface GetDishDetailsResponse {
  success: boolean;
  data: Dish;
  message: string;
}

// GET /api/customer/dishes/{dish_id}/similar
export interface GetSimilarDishesResponse {
  success: boolean;
  data: {
    dishes: SimilarDish[];
    total: number;
  };
  message: string;
}

// ============================================================================
// PROFILE SCREEN ENDPOINTS TYPES
// ============================================================================

// GET /customer/forkprint/score
export interface ForkPrintLevel {
  level: string;
  unlocked_at: string;
}

export interface GetForkPrintScoreResponse {
  success: boolean;
  data: {
    score: number;
    status: string;
    points_to_next: number;
    next_level: string;
    current_level_icon?: string | null;
    level_history?: ForkPrintLevel[];
    updated_at: string;
  };
  message?: string;
}

// GET /customer/rewards/nosh-points
export interface NextMilestone {
  points_needed: number;
  total_points_required: number;
  reward: string;
}

export interface GetNoshPointsResponse {
  success: boolean;
  data: {
    available_points: number;
    total_points_earned?: number;
    total_points_spent?: number;
    progress_percentage: number;
    progress_to_next_coin?: number;
    next_milestone?: NextMilestone;
    currency?: string;
    last_updated: string;
  };
  message?: string;
}

// GET /customer/nutrition/calories-progress
export interface CaloriesBreakdown {
  breakfast: number;
  lunch: number;
  dinner: number;
  snacks: number;
}

export interface GetCaloriesProgressResponse {
  success: boolean;
  data: {
    date: string;
    consumed: number;
    goal: number;
    remaining: number;
    progress_percentage: number;
    goal_type?: string;
    breakdown?: CaloriesBreakdown;
    updated_at: string;
  };
  message?: string;
}

// GET /customer/stats/monthly-overview
export interface MonthlyMealsStats {
  count: number;
  period: string;
}

export interface MonthlyCaloriesStats {
  tracked: number;
  period: string;
}

export interface MonthlyStreakStats {
  current: number;
  period: string;
  best_streak?: number;
  streak_start_date?: string;
}

export interface GetMonthlyOverviewResponse {
  success: boolean;
  data: {
    month: string;
    period_label: string;
    meals: MonthlyMealsStats;
    calories: MonthlyCaloriesStats;
    streak: MonthlyStreakStats;
    updated_at: string;
  };
  message?: string;
}

// GET /customer/stats/weekly-summary
export interface DailyCalorieData {
  date: string;
  kcal: number;
}

export interface GetWeeklySummaryResponse {
  success: boolean;
  data: {
    week_start: string;
    week_end: string;
    week_meals: number[];
    avg_meals: number;
    kcal_today: number;
    kcal_yesterday: number;
    cuisines: string[];
    daily_calories?: DailyCalorieData[];
    updated_at: string;
  };
  message?: string;
}

// ============================================================================
// CHEF DETAILS & MENU TYPES
// ============================================================================

// GET /customer/chefs/{chef_id}
export interface ChefDetailsLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface ChefDetails extends Chef {
  bio?: string;
  specialties?: string[];
  delivery_radius?: number;
  location?: ChefDetailsLocation;
}

export interface GetChefDetailsResponse {
  success: boolean;
  data: ChefDetails;
  message?: string;
}

export interface GetChefDetailsParams {
  chefId: string;
  latitude?: number;
  longitude?: number;
}

// POST /customer/chefs/search-by-location
export interface SearchChefsByLocationRequest {
  latitude: number;
  longitude: number;
  radius?: number;
  limit?: number;
  page?: number;
}

export interface SearchChefsByLocationResponse {
  success: boolean;
  data: {
    chefs: Chef[];
    total: number;
    page: number;
    limit: number;
  };
  message?: string;
}

// POST /customer/chefs/search
export interface SearchChefsRequest {
  query: string;
  location: {
    latitude: number;
    longitude: number;
  };
  radius?: number;
  cuisine?: string;
  limit?: number;
}

export interface SearchChefsResponse {
  success: boolean;
  data: {
    chefs: Chef[];
    total: number;
  };
  message?: string;
}

// GET /customer/chefs/popular/{chef_id}
export interface PopularChefDetails extends Chef {
  reviews?: Review[];
  averageRating?: number;
  reviewCount?: number;
}

export interface Review {
  id: string;
  rating: number;
  comment?: string;
  customer_name?: string;
  created_at: string;
}

export interface GetPopularChefDetailsResponse {
  success: boolean;
  data: PopularChefDetails;
  message?: string;
}

// ============================================================================
// MENU TYPES
// ============================================================================

// GET /customer/menus/chef/{chef_id}/menus
export interface MenuItem {
  _id: string;
  chefId: string;
  name: string;
  description: string;
  price: number;
  cuisine: string;
  ingredients?: string[];
  dietaryInfo?: {
    vegetarian?: boolean;
    vegan?: boolean;
    glutenFree?: boolean;
    allergens?: string[];
  };
  prepTime?: number;
  servings?: number;
  image?: string;
  status?: "draft" | "active" | "inactive" | "archived";
  rating?: number;
  reviewCount?: number;
  createdAt: string;
}

export interface GetChefMenusResponse {
  success: boolean;
  data: MenuItem[];
  message?: string;
}

// GET /customer/menus/menus/{menu_id}
export interface MenuDetails extends MenuItem {
  availability?: {
    start_time?: string;
    end_time?: string;
    days_of_week?: string[];
  };
}

export interface GetMenuDetailsResponse {
  success: boolean;
  data: MenuDetails;
  message?: string;
}

// ============================================================================
// CART MANAGEMENT TYPES
// ============================================================================

// PUT /customer/cart/items/{cart_item_id}
export interface UpdateCartItemRequest {
  quantity: number;
}

export interface UpdateCartItemResponse {
  success: boolean;
  data: {
    item: CartItem;
  };
  message?: string;
}

// DELETE /customer/cart/items/{cart_item_id}
export interface RemoveCartItemResponse {
  success: boolean;
  data: {
    cart_item_id: string;
  };
  message?: string;
}

// ============================================================================
// TOP CUISINES TYPES
// ============================================================================

// GET /customer/cuisines/top
export interface TopCuisine {
  cuisine: string;
  count: number;
  popularity_score: number;
  trend_direction?: "up" | "down" | "stable";
  growth_percentage?: number;
  average_rating?: number;
  total_reviews?: number;
  top_dishes?: string[];
  chef_count?: number;
  price_range?: {
    min: number;
    max: number;
    average: number;
  };
}

export interface TopCuisinesMetadata {
  time_range: string;
  location?: string;
  total_cuisines: number;
  generated_at: string;
  data_source: string;
}

export interface GetTopCuisinesParams {
  limit?: number;
  time_range?: "day" | "week" | "month" | "year" | "all";
  location?: string;
}

export interface GetTopCuisinesResponse {
  success: boolean;
  data: {
    top_cuisines: TopCuisine[];
    metadata: TopCuisinesMetadata;
  };
  message?: string;
}
