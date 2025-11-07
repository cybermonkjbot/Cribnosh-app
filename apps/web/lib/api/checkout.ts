/**
 * Checkout API Client Functions
 * Functions for interacting with the checkout API endpoints
 */

interface PaymentIntent {
  client_secret: string;
  amount: number;
  currency: string;
  id: string;
}

interface CreateCheckoutResponse {
  success: boolean;
  data: {
    paymentIntent: PaymentIntent;
  };
  message?: string;
}

interface DeliveryAddress {
  street?: string;
  city: string;
  country: string;
  postal_code?: string;
  state?: string;
  coordinates?: number[];
}

interface CreateOrderFromCartRequest {
  payment_intent_id: string;
  delivery_address?: DeliveryAddress;
  special_instructions?: string;
  delivery_time?: string;
}

interface CreateOrderFromCartResponse {
  success: boolean;
  data: {
    order_id: string;
    order?: unknown;
  };
  message?: string;
}

interface APIError {
  success: false;
  error: string;
  message?: string;
}

/**
 * Get JWT token from session token
 * This helper function gets a JWT token for authenticated API requests
 */
async function getJWTToken(): Promise<string | null> {
  try {
    const response = await fetch('/api/auth/token/get-jwt', {
      method: 'GET',
      credentials: 'include',
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data?.token) {
        return data.data.token;
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting JWT token:', error);
    return null;
  }
}

/**
 * Make authenticated API request
 */
async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getJWTToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });
}

/**
 * Create payment intent for checkout
 */
export async function createCheckout(): Promise<CreateCheckoutResponse> {
  try {
    const response = await authenticatedFetch('/api/customer/checkout', {
      method: 'POST',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(errorData.error || errorData.message || 'Failed to create checkout');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating checkout:', error);
    throw error;
  }
}

/**
 * Create order from cart after payment
 */
export async function createOrderFromCart(
  request: CreateOrderFromCartRequest
): Promise<CreateOrderFromCartResponse> {
  try {
    const response = await authenticatedFetch('/api/customer/orders/from-cart', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(errorData.error || errorData.message || 'Failed to create order');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating order from cart:', error);
    throw error;
  }
}

