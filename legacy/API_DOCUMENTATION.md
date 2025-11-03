# CribNosh API Documentation

Complete API reference for integrating with CribNosh backend services.

## Base Configuration

- **Base URL**: `https://cribnosh.com/api`
- **Alternative Base URL**: `https://cribnosh.co.uk` (for some services)
- **Authentication**: Bearer token in `Authorization` header
- **Content-Type**: `application/json`
- **Accept**: `application/json`

## Authentication

All customer endpoints require authentication via Bearer token:
```
Authorization: Bearer <token>
```

Tokens are stored securely and automatically added to requests.

---

## Customer API Endpoints

### Profile Management

#### `GET /customer/profile/me`
Get current customer profile.

**Response:**
```typescript
{
  success: boolean;
  data: {
    user_id: string;
    name: string;
    email?: string;
    phone?: string;
    picture?: string;
    preferences?: CustomerPreferences;
    address?: CustomerAddress;
    created_at: string;
    updated_at: string;
  };
}
```

#### `PUT /customer/profile/me`
Update current customer profile.

**Request Body:**
```typescript
{
  name?: string;
  email?: string;
  phone?: string;
  picture?: string;
  preferences?: Partial<CustomerPreferences>;
  address?: Partial<CustomerAddress>;
}
```

---

### Account Management

#### `DELETE /customer/account`
Delete customer account.

**Response:**
```typescript
{
  success: boolean;
  message: string;
  data?: {
    account_deleted_at: string;
    deletion_scheduled?: boolean;
  };
}
```

#### `POST /customer/account/delete-feedback`
Submit feedback when deleting account.

**Request Body:**
```typescript
{
  feedback_options: number[];
  additional_feedback?: string;
}
```

#### `POST /customer/account/download-data`
Request account data download.

**Response:**
```typescript
{
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
```

---

### Cuisines

#### `GET /customer/cuisines`
Get available cuisines.

**Query Parameters:**
- `page?: number` - Page number
- `limit?: number` - Items per page
- `sort_by?: string` - Sort field
- `sort_order?: "asc" | "desc"` - Sort direction

**Response:**
```typescript
{
  success: boolean;
  data: Cuisine[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}
```

---

### Chefs/Kitchens

#### `GET /customer/chefs/popular`
Get popular chefs.

**Query Parameters:**
- `page?: number`
- `limit?: number`
- `sort_by?: string`
- `sort_order?: "asc" | "desc"`

**Response:**
```typescript
{
  success: boolean;
  data: Chef[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}
```

#### `GET /api/customer/chefs/{chefId}`
Get chef details by ID.

**Path Parameters:**
- `chefId: string` - Chef identifier

**Response:**
```typescript
{
  success: boolean;
  data: ChefMarker;
}
```

#### `GET /api/customer/chefs/nearby`
Get nearby chefs by location.

**Query Parameters:**
- `latitude: number`
- `longitude: number`
- `radius?: number` - Default: 5 (miles)
- `limit?: number` - Default: 20
- `page?: number` - Default: 1

**Response:**
```typescript
{
  success: boolean;
  data: {
    chefs: ChefMarker[];
    pagination: any;
  };
}
```

#### `POST /api/customer/chefs/search-by-location`
Search chefs by location.

**Request Body:**
```typescript
{
  query: string;
  location: MapLocation;
  radius?: number;
  cuisine?: string;
  limit?: number;
}
```

---

### Dishes/Meals

#### `GET /api/customer/dishes/{dishId}`
Get dish details by ID.

**Path Parameters:**
- `dishId: string` - Dish identifier

**Response:**
```typescript
{
  success: boolean;
  data: {
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
    ingredients?: Array<{
      name: string;
      quantity: string;
      is_allergen?: boolean;
      allergen_type?: string;
    }>;
    is_vegetarian?: boolean;
    is_safe_for_you?: boolean;
    prep_time?: string;
    delivery_time?: string;
    chef_name?: string;
    chef_story?: string;
    chef_tips?: string[];
    rating?: number;
    review_count?: number;
    sentiment?: string;
    created_at: string;
    updated_at: string;
  };
  message: string;
}
```

#### `GET /api/customer/dishes/{dishId}/similar`
Get similar dishes.

**Path Parameters:**
- `dishId: string` - Dish identifier

**Query Parameters:**
- `limit?: number` - Number of similar dishes to return

**Response:**
```typescript
{
  success: boolean;
  data: {
    dishes: Array<{
      id: string;
      name: string;
      price: string;
      image_url?: string;
      sentiment?: "bussing" | "mid" | "notIt";
      is_vegetarian?: boolean;
      kitchen_name?: string;
    }>;
    total: number;
  };
  message: string;
}
```

---

### Cart

#### `GET /customer/cart`
Get customer cart.

**Response:**
```typescript
{
  success: boolean;
  data: {
    id: string;
    customer_id: string;
    items: CartItem[];
    subtotal: number; // in cents
    delivery_fee: number; // in cents
    tax: number; // in cents
    total: number; // in cents
    created_at: string;
    updated_at: string;
  };
}
```

#### `POST /customer/cart/items`
Add item to cart.

**Request Body:**
```typescript
{
  dish_id: string;
  quantity: number;
  special_instructions?: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  data: CartItem;
  message: string;
}
```

---

### Orders

#### `GET /customer/orders`
Get customer orders.

**Query Parameters:**
- `page?: number`
- `limit?: number`
- `sort_by?: string`
- `sort_order?: "asc" | "desc"`

**Response:**
```typescript
{
  success: boolean;
  data: Order[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}
```

#### `GET /customer/orders/{orderId}`
Get specific order details.

**Path Parameters:**
- `orderId: string` - Order identifier

**Response:**
```typescript
{
  success: boolean;
  data: Order;
  message: string;
}
```

#### `GET /customer/orders/{orderId}/status`
Get order status tracking.

**Path Parameters:**
- `orderId: string` - Order identifier

**Response:**
```typescript
{
  success: boolean;
  data: {
    order_id: string;
    current_status: string;
    status_updates: Array<{
      status: string;
      timestamp: string;
      message?: string;
      location?: {
        latitude: number;
        longitude: number;
        address?: string;
      };
    }>;
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
```

#### `POST /customer/orders`
Create new order.

**Request Body:**
```typescript
{
  kitchen_id: string;
  items: Array<{
    dish_id: string;
    quantity: number;
    special_instructions?: string;
  }>;
  delivery_address: CustomerAddress;
  special_instructions?: string;
}
```

#### `POST /customer/orders/{orderId}/cancel`
Cancel order.

**Path Parameters:**
- `orderId: string` - Order identifier

**Request Body:**
```typescript
{
  reason?: string;
  refund_preference?: "full_refund" | "partial_refund" | "credit";
}
```

#### `POST /customer/orders/{orderId}/rate`
Rate order.

**Path Parameters:**
- `orderId: string` - Order identifier

**Request Body:**
```typescript
{
  rating: number; // 1-5 stars
  review?: string;
  categories?: {
    food_quality?: number;
    delivery_speed?: number;
    packaging?: number;
    customer_service?: number;
  };
}
```

---

### Search

#### `GET /customer/search`
Search with query parameters.

**Query Parameters:**
- `query: string` - Required search query
- `type?: "all" | "chefs" | "dishes" | "cuisines"`
- `page?: number`
- `limit?: number`
- `cuisine?: string[]` - Filter by cuisine (can be repeated)
- `price_min?: number` - Minimum price filter
- `price_max?: number` - Maximum price filter
- `rating_min?: number` - Minimum rating filter
- `delivery_time_max?: number` - Max delivery time in minutes
- `distance_max?: number` - Max distance in miles

**Response:**
```typescript
{
  success: boolean;
  data: SearchResult[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}
```

#### `POST /customer/search`
Search with emotions engine.

**Request Body:**
```typescript
{
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
```

**Response:**
```typescript
{
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
```

#### `GET /customer/search/chefs`
Search for chefs by name or specialties.

**Query Parameters:**
- `q: string` - Required search query
- `location?: string`
- `cuisine?: string`
- `rating_min?: number`
- `limit?: number`
- `offset?: number`

**Response:**
```typescript
{
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
```

#### `GET /customer/search/suggestions`
Get search suggestions/autocomplete.

**Query Parameters:**
- `q: string` - Required partial query
- `location?: string`
- `limit?: number`
- `category?: "all" | "dishes" | "chefs" | "cuisines" | "restaurants"`
- `user_id?: string`

**Response:**
```typescript
{
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
```

#### `GET /customer/search/trending`
Get trending search results.

**Query Parameters:**
- `location?: string`
- `cuisine?: string`
- `time_range?: "hour" | "day" | "week" | "month"`
- `limit?: number`
- `category?: "dishes" | "chefs" | "cuisines" | "restaurants"`

**Response:**
```typescript
{
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
```

---

### Payment

#### `POST /customer/checkout`
Create payment intent for checkout.

**Request Body:**
```typescript
{
  payment_method_id?: string;
  save_payment_method?: boolean;
}
```

**Response:**
```typescript
{
  success: boolean;
  data: PaymentIntent;
  message: string;
}
```

#### `GET /customer/payment-methods`
Get customer payment methods.

**Response:**
```typescript
{
  success: boolean;
  data: PaymentMethod[];
  message: string;
}
```

#### `POST /customer/payment-methods`
Add payment method.

**Request Body:**
```typescript
{
  type: "card" | "paypal";
  token?: string;
  card_details?: {
    number: string;
    expiry_month: number;
    expiry_year: number;
    cvc: string;
  };
}
```

#### `PUT /customer/payment-methods/{paymentMethodId}/default`
Set default payment method.

**Path Parameters:**
- `paymentMethodId: string` - Payment method identifier

#### `GET /customer/balance`
Get Cribnosh balance.

**Response:**
```typescript
{
  success: boolean;
  data: {
    balance: number; // in cents/pence
    currency: string;
    is_available: boolean;
    last_updated: string;
  };
  message: string;
}
```

#### `GET /customer/balance/transactions`
Get balance transactions.

**Query Parameters:**
- `page?: number`
- `limit?: number`

---

### Food Safety

#### `GET /customer/allergies`
Get customer allergies.

**Response:**
```typescript
{
  success: boolean;
  data: Allergy[];
  message: string;
}
```

#### `PUT /customer/allergies`
Update customer allergies.

**Request Body:**
```typescript
{
  allergies: Array<{
    name: string;
    severity: "mild" | "moderate" | "severe";
    notes?: string;
  }>;
}
```

#### `GET /customer/dietary-preferences`
Get dietary preferences.

**Response:**
```typescript
{
  success: boolean;
  data: DietaryPreference[];
}
```

#### `PUT /customer/dietary-preferences`
Update dietary preferences.

**Request Body:**
```typescript
{
  preferences: DietaryPreference[];
}
```

#### `PUT /customer/food-safety/cross-contamination`
Update cross-contamination setting.

**Request Body:**
```typescript
{
  avoid_cross_contamination: boolean;
}
```

---

### Data Sharing

#### `GET /customer/data-sharing-preferences`
Get data sharing preferences.

**Response:**
```typescript
{
  success: boolean;
  data: {
    analytics_enabled: boolean;
    personalization_enabled: boolean;
    marketing_enabled: boolean;
    updated_at: string;
  };
  message: string;
}
```

#### `PUT /customer/data-sharing-preferences`
Update data sharing preferences.

**Request Body:**
```typescript
{
  analytics_enabled?: boolean;
  personalization_enabled?: boolean;
  marketing_enabled?: boolean;
}
```

---

### Support

#### `GET /customer/support-cases`
Get support cases.

**Response:**
```typescript
{
  success: boolean;
  data: {
    cases: SupportCase[];
    total: number;
  };
  message: string;
}
```

#### `POST /customer/support-cases`
Create support case.

**Request Body:**
```typescript
{
  subject: string;
  category: string;
  description: string;
  order_id?: string;
  priority?: "low" | "medium" | "high";
}
```

---

### Live Streaming

#### `GET /api/live-streaming/customer`
Get customer live streams.

**Query Parameters:**
- `page?: number`
- `limit?: number`

**Response:**
```typescript
{
  success: boolean;
  data: LiveStream[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}
```

---

### Custom Orders

#### `POST /custom_orders`
Create custom order.

**Request Body:**
```typescript
{
  requirements: string;
  serving_size: number;
  desired_delivery_time?: string;
  dietary_restrictions?: string;
  specialInstructions?: string;
  deliveryAddress?: CustomerAddress;
  budget?: number;
}
```

#### `GET /custom_orders`
Get customer custom orders.

**Query Parameters:**
- `page?: number`
- `limit?: number`

**Response:**
```typescript
{
  success: boolean;
  data: {
    orders: CustomOrder[];
    total: number;
    limit: number;
    offset: number;
  };
  message: string;
}
```

#### `GET /custom_orders/{customOrderId}`
Get specific custom order details.

**Path Parameters:**
- `customOrderId: string` - Custom order identifier

#### `PUT /custom_orders/{customOrderId}`
Update custom order.

**Path Parameters:**
- `customOrderId: string` - Custom order identifier

**Request Body:**
```typescript
{
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
```

#### `DELETE /custom_orders/{customOrderId}`
Delete custom order.

**Path Parameters:**
- `customOrderId: string` - Custom order identifier

---

## Data Types

### CustomerAddress
```typescript
{
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
```

### CustomerPreferences
```typescript
{
  dietary_restrictions?: string[];
  favorite_cuisines?: string[];
  delivery_instructions?: string;
  notification_preferences?: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}
```

### Cuisine
```typescript
{
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  restaurant_count: number;
  is_active: boolean;
  created_at: string;
}
```

### Chef
```typescript
{
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
  sentiment: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  created_at: string;
}
```

### Dish
```typescript
{
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
  ingredients?: Array<{
    name: string;
    quantity: string;
    is_allergen?: boolean;
    allergen_type?: string;
  }>;
  is_vegetarian?: boolean;
  is_safe_for_you?: boolean;
  prep_time?: string;
  delivery_time?: string;
  chef_name?: string;
  chef_story?: string;
  chef_tips?: string[];
  rating?: number;
  review_count?: number;
  sentiment?: string;
  created_at: string;
  updated_at: string;
}
```

### CartItem
```typescript
{
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
```

### Order
```typescript
{
  id: string;
  customer_id: string;
  kitchen_id: string;
  kitchen_name: string;
  status: "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled";
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
```

### SearchResult
```typescript
{
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
```

---

## Error Response Format

All endpoints return errors in this format:

```typescript
{
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  timestamp: string;
}
```

### Common Error Codes
- `401` - Unauthorized - Invalid or missing authentication
- `403` - Forbidden - Insufficient permissions
- `404` - Not Found - Resource not found
- `400` - Bad Request - Invalid request parameters
- `500` - Internal Server Error

---

## Success Response Format

All endpoints return success in this format:

```typescript
{
  success: true;
  message: string;
  data: <ResponseType>;
}
```

---

## Implementation Notes

### Authentication Flow
1. User authenticates via `/auth/phone-signin`
2. Token stored in secure storage
3. Token automatically included in all requests
4. Token expiration checked before requests
5. Expired tokens cleared automatically

### Request Headers
All authenticated requests include:
```
Authorization: Bearer <token>
Accept: application/json
Content-Type: application/json
```

### Pagination
Most list endpoints support pagination:
- `page`: Page number (1-indexed)
- `limit`: Items per page
- Response includes `pagination` object with totals

### Filtering & Sorting
Many endpoints support:
- `sort_by`: Field to sort by
- `sort_order`: "asc" or "desc"
- Various filter parameters specific to endpoint

---

## RTK Query Hooks Available

The codebase uses Redux Toolkit Query for API calls. Available hooks:

### Profile
- `useGetCustomerProfileQuery()`
- `useUpdateCustomerProfileMutation()`

### Account
- `useDeleteAccountMutation()`
- `useSubmitDeleteAccountFeedbackMutation()`
- `useDownloadAccountDataMutation()`

### Cuisines
- `useGetCuisinesQuery(params)`

### Chefs
- `useGetPopularChefsQuery(params)`

### Dishes
- `useGetDishDetailsQuery(dishId)`
- `useGetSimilarDishesQuery({ dishId, limit })`

### Cart
- `useGetCartQuery()`
- `useAddToCartMutation()`

### Orders
- `useGetOrdersQuery(params)`
- `useGetOrderQuery(orderId)`
- `useGetOrderStatusQuery(orderId)`
- `useCreateOrderMutation()`
- `useCancelOrderMutation()`
- `useRateOrderMutation()`

### Search
- `useSearchQuery(params)`
- `useSearchWithEmotionsMutation()`
- `useSearchChefsQuery(params)`
- `useGetSearchSuggestionsQuery(params)`
- `useGetTrendingSearchQuery(params)`

### Payment
- `useCreateCheckoutMutation()`
- `useGetPaymentMethodsQuery()`
- `useAddPaymentMethodMutation()`
- `useSetDefaultPaymentMethodMutation()`
- `useGetCribnoshBalanceQuery()`
- `useGetBalanceTransactionsQuery()`
- `useSetupFamilyProfileMutation()`

### Food Safety
- `useGetAllergiesQuery()`
- `useUpdateAllergiesMutation()`
- `useGetDietaryPreferencesQuery()`
- `useUpdateDietaryPreferencesMutation()`
- `useUpdateCrossContaminationSettingMutation()`

### Data Sharing
- `useGetDataSharingPreferencesQuery()`
- `useUpdateDataSharingPreferencesMutation()`

### Support
- `useGetSupportCasesQuery()`
- `useCreateSupportCaseMutation()`

### Live Streaming
- `useGetLiveStreamsQuery(params)`

### Custom Orders
- `useCreateCustomOrderMutation()`
- `useGetCustomOrdersQuery(params)`
- `useGetCustomOrderQuery(customOrderId)`
- `useUpdateCustomOrderMutation()`
- `useDeleteCustomOrderMutation()`

---

## Notes for Integration

1. **Price Format**: All prices are in cents/pence (integer), convert to currency format for display
2. **Date Format**: ISO 8601 strings
3. **Image URLs**: May be relative or absolute URLs
4. **Optional Fields**: Many fields are optional, handle undefined/null gracefully
5. **Progressive Loading**: Use skeleton loaders while data loads
6. **Error Handling**: Always handle error states gracefully
7. **Token Management**: Tokens are automatically managed, but check expiration
8. **Pagination**: Implement infinite scroll or page navigation for list endpoints

