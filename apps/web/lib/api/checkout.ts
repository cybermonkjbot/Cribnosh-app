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
 * Get sessionToken from cookies (client-side)
 * SessionToken is automatically sent with cookies, but this helper can be used
 * if headers need to be set explicitly
 */
function getSessionTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  try {
    const match = document.cookie.match(/(^| )convex-auth-token=([^;]+)/);
    return match ? match[2] : null;
  } catch (error) {
    console.error('Error reading sessionToken from cookie:', error);
    return null;
  }
}

/**
 * Make authenticated API request
 * SessionToken is automatically sent via cookies (credentials: 'include')
 * Headers are optional - only needed if backend requires explicit header
 */
async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // SessionToken is automatically sent via cookies
  // Optionally add header if needed (backend supports both cookie and header)
  const sessionToken = getSessionTokenFromCookie();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  // Optionally add sessionToken header (backend supports both cookie and header)
  // Cookies are automatically sent with credentials: 'include'
  if (sessionToken) {
    // Backend supports both cookie and header, so we can add header for explicit auth
    // headers['X-Session-Token'] = sessionToken;
    // OR: headers['Authorization'] = `Bearer ${sessionToken}`;
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Automatically sends cookies including sessionToken
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

