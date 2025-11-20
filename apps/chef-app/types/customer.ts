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
    | "on_the_way"
    | "on-the-way"
    | "cancelled"
    | "completed";
  order_status?: string;
  items: OrderItem[];
  order_items?: {
    dish_id: string;
    name: string;
    quantity: number;
    price: number;
  }[];
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
  sentiment?:
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

// POST /customer/profile/update-phone-email
export interface UpdatePhoneEmailRequest {
  type: 'phone' | 'email';
  action: 'send' | 'verify';
  phone?: string;
  email?: string;
  otp?: string;
}

export interface UpdatePhoneEmailResponse {
  success: boolean;
  data: {
    success: boolean;
    message: string;
    testOtp?: string;
  };
}

// DELETE /customer/account
export interface DeleteAccountResponse {
  success: boolean;
  message: string;
  data?: {
    deletion_requested_at: string;
    deletion_will_complete_at: string;
  };
}

// PUT /customer/account/password
export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

// GET /customer/account/sessions
export interface CustomerSession {
  session_id: string;
  device: string;
  location: string;
  created_at: string;
  expires_at: string;
  is_current: boolean;
}

export interface GetSessionsResponse {
  success: boolean;
  data: {
    sessions: CustomerSession[];
  };
}

// DELETE /customer/account/sessions/:session_id
export interface RevokeSessionResponse {
  success: boolean;
  message: string;
}

// POST /images/customer/profile
export interface UploadProfileImageResponse {
  success: boolean;
  data: {
    profile_image_url: string;
    profile_image: string;
  };
  message: string;
}

// POST /customer/account/two-factor/setup
export interface SetupTwoFactorResponse {
  success: boolean;
  data: {
    secret: string;
    backupCodes: string[];
    qrCode: string;
  };
  message: string;
}

// DELETE /customer/account/two-factor
export interface DisableTwoFactorRequest {
  password?: string; // Optional password verification
}

export interface DisableTwoFactorResponse {
  success: boolean;
  message: string;
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
  badge?: { text: string; type: "hot" | "bestfit" | "highprotein" };
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

// GET /live-streaming/customer
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

// GET /live-streaming/sessions/{sessionId}
export interface LiveSessionDetails {
  session: {
    id: string;
    _id: string;
    session_id: string;
    chef_id: string;
    title: string;
    description?: string;
    status: string;
    viewer_count: number;
    current_viewers: number;
    is_live: boolean;
    started_at: string;
    ended_at?: string;
    thumbnail_url?: string;
    tags?: string[];
  };
  chef: {
    _id: string;
    name: string;
    bio: string;
    profile_image?: string;
    kitchen_name: string;
    specialties?: string[];
    rating: number;
  } | null;
  meal: {
    _id: string;
    id: string;
    name: string;
    description: string;
    price: number;
    images: string[];
    ingredients: string[];
    cuisine: string[];
    dietary?: string[];
    average_rating: number;
    review_count: number;
    calories?: number;
    fat?: string;
    protein?: string;
    carbs?: string;
    prep_time?: string;
    cooking_time?: string;
  } | null;
}

export interface GetLiveSessionDetailsResponse {
  success: boolean;
  data: LiveSessionDetails;
  message?: string;
}

// Live Streaming Comments
export interface SendLiveCommentRequest {
  sessionId: string;
  content: string;
  commentType: "general" | "question" | "reaction" | "tip" | "moderation";
  metadata?: Record<string, string>;
}

export interface LiveComment {
  id: string;
  content: string;
  commentType: "general" | "question" | "reaction" | "tip" | "moderation";
  sentBy: string;
  sentByRole: string;
  userDisplayName: string;
  sentAt: string;
  metadata?: Record<string, any>;
}

export interface GetLiveCommentsResponse {
  success: boolean;
  data: {
    success: boolean;
    sessionId: string;
    comments: LiveComment[];
    totalComments: number;
    limit: number;
    offset: number;
  };
}

export interface SendLiveCommentResponse {
  success: boolean;
  data: {
    success: boolean;
    sessionId: string;
    comment: LiveComment | null;
    message: string;
  };
}

// Live Streaming Reactions
export interface SendLiveReactionRequest {
  sessionId: string;
  reactionType:
    | "like"
    | "love"
    | "laugh"
    | "wow"
    | "sad"
    | "angry"
    | "fire"
    | "clap"
    | "heart"
    | "star";
  intensity?: "light" | "medium" | "strong";
  metadata?: Record<string, string>;
}

export interface LiveReaction {
  id: string;
  reactionType:
    | "like"
    | "love"
    | "laugh"
    | "wow"
    | "sad"
    | "angry"
    | "fire"
    | "clap"
    | "heart"
    | "star";
  intensity: "light" | "medium" | "strong";
  sentBy: string;
  sentByRole: string;
  userDisplayName?: string;
  sentAt: string;
  metadata?: Record<string, any>;
}

export interface GetLiveReactionsResponse {
  success: boolean;
  data: {
    success: boolean;
    sessionId: string;
    reactions: LiveReaction[];
    totalReactions: number;
    limit: number;
    offset: number;
    hasMore?: boolean;
    reactionSummary?: Record<string, number>;
  };
}

export interface SendLiveReactionResponse {
  success: boolean;
  data: {
    success: boolean;
    sessionId: string;
    reaction: LiveReaction | null;
    message: string;
  };
}

// Live Streaming Viewers
export interface LiveViewer {
  viewerId: string;
  userId?: string;
  displayName: string;
  isAnonymous: boolean;
  joinedAt: string;
  lastActivity: string;
  watchTime: number;
  location?: {
    country?: string;
    city?: string;
    timezone?: string;
  };
  deviceInfo?: {
    platform?: string;
    browser?: string;
    os?: string;
  };
  interactions?: {
    commentsSent: number;
    reactionsSent: number;
    ordersPlaced: number;
    tipsGiven: number;
  };
}

export interface GetLiveViewersResponse {
  success: boolean;
  data: {
    message: string;
    data: LiveViewer[];
    summary: {
      totalViewers: number;
      authenticatedViewers: number;
      anonymousViewers: number;
      averageWatchTime: number;
      peakViewers: number;
      peakTime: string;
    };
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
}

// Live Streaming Chat
export interface LiveChatMessage {
  messageId: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: string;
  isModerator: boolean;
  reactions?: {
    emoji: string;
    count: number;
  }[];
}

export interface GetLiveChatResponse {
  success: boolean;
  data: {
    message: string;
    data: LiveChatMessage[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
}

// Live Streaming Orders
export interface LiveStreamOrder {
  orderId: string;
  sessionId: string;
  chefId: string;
  chefName: string;
  customerId: string;
  customerName: string;
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  status:
    | "pending"
    | "confirmed"
    | "preparing"
    | "ready"
    | "delivered"
    | "cancelled";
  placedAt: string;
  estimatedPrepTime?: number;
  deliveryAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  notes?: string;
}

export interface GetLiveStreamOrdersResponse {
  success: boolean;
  data: {
    message: string;
    data: LiveStreamOrder[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
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
  budget_contribution: number; // Amount chipped into budget bucket
  order_items: {
    dish_id: string;
    name: string;
    quantity: number;
    price: number;
    special_instructions?: string;
  }[];
  selection_status: "not_ready" | "ready";
  selection_ready_at?: number;
  total_contribution: number; // Sum of order items (what they selected to eat)
  payment_status: "pending" | "paid" | "failed";
}

export interface GroupOrder {
  group_order_id: string;
  created_by: string;
  chef_id: string;
  restaurant_name: string;
  title: string;
  status:
    | "active"
    | "closed"
    | "confirmed"
    | "preparing"
    | "ready"
    | "on_the_way"
    | "delivered"
    | "cancelled";
  // Budget tracking
  initial_budget: number;
  total_budget: number;
  budget_contributions: {
    user_id: string;
    amount: number;
    contributed_at: number;
  }[];
  // Selection phase
  selection_phase: "budgeting" | "selecting" | "ready";
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
  initial_budget: number; // Required initial budget
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
  order_items: {
    dish_id: string;
    name: string;
    quantity: number;
    price: number;
    special_instructions?: string;
  }[];
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
  payment_method_id: string; // Payment method ID from payment processor (e.g., Stripe)
  type: "card" | "apple_pay" | "google_pay";
  set_as_default?: boolean; // Optional, defaults to false
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

export interface CreateSetupIntentResponse {
  success: boolean;
  data: {
    clientSecret: string;
  };
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

export interface TopUpBalanceRequest {
  amount: number; // in pence
  payment_method_id?: string; // optional Stripe payment method ID
}

export interface TopUpBalanceResponse {
  success: boolean;
  data: {
    clientSecret: string;
    paymentIntentId: string;
  };
  message: string;
}

export interface SetupFamilyProfileRequest {
  family_members?: {
    name: string;
    email: string;
    phone?: string;
    relationship: string;
    budget_settings?: {
      daily_limit?: number;
      weekly_limit?: number;
      monthly_limit?: number;
      currency?: string;
    };
  }[];
  settings?: {
    shared_payment_methods: boolean;
    shared_orders: boolean;
    allow_child_ordering: boolean;
    require_approval_for_orders: boolean;
    spending_notifications: boolean;
  };
}

export interface FamilyMember {
  id: string;
  user_id?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  relationship: string;
  status: "pending_invitation" | "accepted" | "declined" | "removed";
  invited_at?: string | null;
  accepted_at?: string | null;
  budget_settings?: {
    daily_limit?: number;
    weekly_limit?: number;
    monthly_limit?: number;
    currency?: string;
  } | null;
}

export interface FamilyProfileSettings {
  shared_payment_methods: boolean;
  shared_orders: boolean;
  allow_child_ordering: boolean;
  require_approval_for_orders: boolean;
  spending_notifications: boolean;
}

export interface SetupFamilyProfileResponse {
  success: boolean;
  data: {
    family_profile_id: string;
    parent_user_id: string;
    member_user_ids: string[];
    family_members: FamilyMember[];
    settings: FamilyProfileSettings;
    created_at: string;
  };
  message: string;
}

export interface GetFamilyProfileResponse {
  success: boolean;
  data: {
    family_profile_id: string;
    parent_user_id: string;
    member_user_ids: string[];
    family_members: FamilyMember[];
    settings: FamilyProfileSettings;
    created_at: string;
    updated_at?: string | null;
  } | null;
  message: string;
}

export interface InviteFamilyMemberRequest {
  member: {
    name: string;
    email: string;
    phone?: string;
    relationship: string;
    budget_settings?: {
      daily_limit?: number;
      weekly_limit?: number;
      monthly_limit?: number;
      currency?: string;
    };
  };
  family_profile_id?: string;
}

export interface InviteFamilyMemberResponse {
  success: boolean;
  data: {
    member_id: string;
    invitation_token: string;
  };
  message: string;
}

export interface ValidateFamilyMemberEmailRequest {
  email: string;
}

export interface ValidateFamilyMemberEmailResponse {
  success: boolean;
  data: {
    exists: boolean;
    userId?: string;
  };
  message: string;
}

export interface AcceptFamilyInvitationRequest {
  invitation_token: string;
}

export interface AcceptFamilyInvitationResponse {
  success: boolean;
  data: {
    family_profile_id: string;
    member_id: string;
  };
  message: string;
}

export interface UpdateMemberBudgetRequest {
  member_id: string;
  budget_settings: {
    daily_limit?: number;
    weekly_limit?: number;
    monthly_limit?: number;
    currency?: string;
  };
  family_profile_id?: string;
}

export interface UpdateMemberPreferencesRequest {
  member_id: string;
  preferences?: {
    allergy_ids?: string[];
    dietary_preference_id?: string;
    parent_controlled?: boolean;
    allergies?: Array<{
      name: string;
      type: 'allergy' | 'intolerance';
      severity: 'mild' | 'moderate' | 'severe';
    }>;
    dietary_preferences?: {
      preferences: string[];
      religious_requirements: string[];
      health_driven: string[];
    };
  };
  family_profile_id?: string;
}

export interface UpdateMemberRequest {
  member_id: string;
  budget_settings?: {
    daily_limit?: number;
    weekly_limit?: number;
    monthly_limit?: number;
    currency?: string;
  };
  preferences?: {
    allergy_ids?: string[];
    dietary_preference_id?: string;
    parent_controlled?: boolean;
  };
  family_profile_id?: string;
}

export interface RemoveFamilyMemberRequest {
  member_id: string;
  family_profile_id?: string;
}

export interface GetFamilyOrdersResponse {
  success: boolean;
  data: any[];
  message: string;
}

export interface GetFamilySpendingResponse {
  success: boolean;
  data: {
    members: {
      member_id: string;
      user_id: string;
      name: string;
      daily_spent: number;
      daily_limit: number;
      weekly_spent: number;
      weekly_limit: number;
      monthly_spent: number;
      monthly_limit: number;
      currency: string;
    }[];
    total_spending: number;
    currency: string;
  };
  message: string;
}

// ============================================================================
// FOOD SAFETY TYPES
// ============================================================================

export interface Allergy {
  id: string;
  name: string;
  type: "allergy" | "intolerance";
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
    type: "allergy" | "intolerance";
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
  type:
    | "vegetarian"
    | "vegan"
    | "halal"
    | "kosher"
    | "gluten_free"
    | "keto"
    | "paleo";
  strictness: "preferred" | "required";
  notes?: string;
}

export interface GetDietaryPreferencesResponse {
  success: boolean;
  data: {
    preferences: string[];
    religious_requirements: string[];
    health_driven: string[];
    updated_at: string;
  };
  message: string;
}

export interface UpdateDietaryPreferencesRequest {
  preferences: string[];
  religious_requirements: string[];
  health_driven: string[];
}

export interface UpdateDietaryPreferencesResponse {
  success: boolean;
  data: {
    preferences: string[];
    religious_requirements: string[];
    health_driven: string[];
    updated_at: string;
  };
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
// EVENT CHEF REQUEST API TYPES
// ============================================================================

export interface CreateEventChefRequestRequest {
  event_date: string;
  number_of_guests: number;
  event_type: string;
  event_location: string;
  phone_number: string;
  email: string;
  dietary_requirements?: string;
  additional_notes?: string;
}

export interface CreateEventChefRequestResponse {
  success: boolean;
  data: {
    success: boolean;
    request_id: string;
  };
  message: string;
}

// ============================================================================
// NOTIFICATIONS API TYPES
// ============================================================================

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  priority: string;
  category: string;
  actionUrl?: string;
  metadata?: any;
}

export interface GetNotificationsResponse {
  success: boolean;
  data: {
    notifications: Notification[];
    total: number;
  };
  message: string;
}

export interface GetNotificationStatsResponse {
  success: boolean;
  data: {
    total: number;
    unread: number;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
    byCategory: Record<string, number>;
    recentCount: number;
  };
  message: string;
}

export interface MarkNotificationReadResponse {
  success: boolean;
  data: {
    success: boolean;
  };
  message: string;
}

// ============================================================================
// SUPPORT CHAT API TYPES
// ============================================================================

export interface SupportAgent {
  id: string;
  name: string;
  avatar?: string;
  isOnline: boolean;
  activeCases?: number;
}

export interface SupportMessage {
  _id: string;
  chatId: string;
  senderId: string;
  content: string;
  createdAt: number;
  isRead?: boolean;
  fileUrl?: string;
  fileType?: string;
  fileName?: string;
  fileSize?: number;
  metadata?: Record<string, any>;
}

export interface SupportChat {
  chatId: string;
  supportCaseId: string;
  agent: SupportAgent | null;
  messages: SupportMessage[];
}

export interface GetSupportChatResponse {
  success: boolean;
  data: SupportChat;
  message?: string;
}

export interface GetSupportChatMessagesResponse {
  success: boolean;
  data: {
    messages: SupportMessage[];
    total: number;
    limit: number;
    offset: number;
  };
  message?: string;
}

export interface SendSupportMessageRequest {
  content: string;
}

export interface SendSupportMessageResponse {
  success: boolean;
  data: {
    messageId: string;
    chatId: string;
    content: string;
  };
  message?: string;
}

export interface GetSupportAgentResponse {
  success: boolean;
  data: {
    agent: SupportAgent | null;
    message?: string;
  };
}

export interface QuickReply {
  text: string;
  category: "order" | "payment" | "account" | "technical" | "general";
}

export interface GetQuickRepliesResponse {
  success: boolean;
  data: {
    replies: QuickReply[];
  };
  message?: string;
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

// ============================================================================
// NOSH HEAVEN VIDEO TYPES
// ============================================================================

export interface VideoCreator {
  _id: string;
  name: string;
  avatar?: string;
  roles?: string[];
}

export interface VideoPost {
  _id: string;
  _creationTime: number;
  creatorId: string;
  kitchenId?: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration: number;
  fileSize: number;
  resolution: {
    width: number;
    height: number;
  };
  tags: string[];
  cuisine?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  status: "draft" | "published" | "archived" | "flagged" | "removed";
  visibility: "public" | "followers" | "private";
  isLive?: boolean;
  liveSessionId?: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewsCount: number;
  publishedAt?: number;
  createdAt: number;
  updatedAt: number;
  creator: VideoCreator;
  isLiked: boolean;
}

export interface VideoComment {
  _id: string;
  videoId: string;
  userId: string;
  user: VideoCreator;
  content: string;
  parentCommentId?: string;
  likesCount: number;
  repliesCount: number;
  createdAt: number;
  updatedAt: number;
  isLiked: boolean;
}

export interface VideoFeedResponse {
  success: boolean;
  data: {
    videos: VideoPost[];
    nextCursor?: string;
  };
  message?: string;
}

export interface CreateVideoRequest {
  title: string;
  description?: string;
  videoStorageId: string;
  thumbnailStorageId?: string;
  kitchenId?: string;
  duration: number;
  fileSize: number;
  resolution: {
    width: number;
    height: number;
  };
  tags: string[];
  cuisine?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  visibility?: "public" | "followers" | "private";
  isLive?: boolean;
  liveSessionId?: string;
}

export interface CreateVideoResponse {
  success: boolean;
  data: {
    videoId: string;
  };
  message?: string;
}

export interface UpdateVideoRequest {
  videoId: string;
  title?: string;
  description?: string;
  tags?: string[];
  cuisine?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  visibility?: "public" | "followers" | "private";
}

export interface VideoInteractionResponse {
  success: boolean;
  message?: string;
}

export interface VideoViewRequest {
  videoId: string;
  watchDuration: number;
  completionRate: number;
  deviceInfo?: {
    type?: string;
    os?: string;
    browser?: string;
  };
}

export interface VideoCommentsResponse {
  success: boolean;
  data: {
    comments: VideoComment[];
    nextCursor?: string;
  };
  message?: string;
}

export interface AddVideoCommentRequest {
  videoId: string;
  content: string;
  parentCommentId?: string;
}

export interface VideoUploadUrlResponse {
  success: boolean;
  data: {
    uploadUrl: string;
    key: string;
    publicUrl: string;
  };
  message?: string;
}

export interface GetVideoByIdResponse {
  success: boolean;
  data: VideoPost;
  message?: string;
}

export interface GetTrendingVideosResponse {
  success: boolean;
  data: VideoPost[];
  message?: string;
}

export interface SearchVideosResponse {
  success: boolean;
  data: {
    videos: VideoPost[];
    nextCursor?: string;
  };
  message?: string;
}

export interface GetUserVideosResponse {
  success: boolean;
  data: {
    videos: VideoPost[];
    nextCursor?: string;
  };
  message?: string;
}

export interface VideoCollection {
  _id: string;
  name: string;
  description?: string;
  videoIds: string[];
  coverImageUrl?: string;
  isPublic: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface GetVideoCollectionsResponse {
  success: boolean;
  data: {
    collections: VideoCollection[];
    nextCursor?: string;
  };
  message?: string;
}

// ========================================================================
// REGIONAL AVAILABILITY TYPES
// ========================================================================

export interface CheckRegionAvailabilityRequest {
  city?: string;
  country?: string;
  address?: {
    city?: string;
    country?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
}

export interface CheckRegionAvailabilityResponse {
  success: boolean;
  data: {
    isSupported: boolean;
  };
  message?: string;
}
