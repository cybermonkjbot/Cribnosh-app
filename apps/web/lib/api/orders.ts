/**
 * Orders API Client Functions
 * Functions for interacting with the orders API endpoints
 */

interface Order {
  id: string;
  customerId: string;
  chefId: string;
  orderDate: string;
  totalAmount: number;
  orderStatus: string;
  specialInstructions?: string | null;
  estimatedPrepTimeMinutes?: number | null;
  chefNotes?: string | null;
  paymentStatus: string;
  orderItems: Array<{
    dish_id: string;
    quantity: number;
    price: number;
    name: string;
  }>;
}

interface GetOrderResponse {
  success: boolean;
  data: Order;
  message?: string;
}

interface GetOrderStatusResponse {
  success: boolean;
  data: {
    order: unknown;
  };
  message?: string;
}

/**
 * Get JWT token from session token
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
 * Get order details
 */
export async function getOrder(orderId: string): Promise<GetOrderResponse> {
  try {
    const response = await authenticatedFetch(`/api/customer/orders/${orderId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(errorData.error || errorData.message || 'Failed to fetch order');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching order:', error);
    throw error;
  }
}

/**
 * Get order status
 */
export async function getOrderStatus(orderId: string): Promise<GetOrderStatusResponse> {
  try {
    const response = await authenticatedFetch(`/api/customer/orders/${orderId}/status`, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(errorData.error || errorData.message || 'Failed to fetch order status');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching order status:', error);
    throw error;
  }
}

