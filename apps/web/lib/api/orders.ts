/**
 * Orders API Client Functions
 * Functions for interacting with the orders API endpoints
 */import { logger } from '@/lib/utils/logger';


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

interface OrderListItem {
  _id: string;
  id?: string;
  customer_id?: string;
  customerId?: string;
  chef_id?: string;
  chefId?: string;
  order_date?: string | number;
  orderDate?: string;
  total_amount?: number;
  totalAmount?: number;
  order_status?: string;
  orderStatus?: string;
  status?: string;
  payment_status?: string;
  paymentStatus?: string;
  order_items?: Array<{
    dish_id: string;
    quantity: number;
    price: number;
    name: string;
  }>;
  orderItems?: Array<{
    dish_id: string;
    quantity: number;
    price: number;
    name: string;
  }>;
  special_instructions?: string | null;
  specialInstructions?: string | null;
  createdAt?: number;
  _creationTime?: number;
}

interface GetOrdersListResponse {
  success: boolean;
  data: {
    orders: OrderListItem[];
    total: number;
    limit: number;
    offset: number;
  };
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
    logger.error('Error reading sessionToken from cookie:', error);
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
    logger.error('Error fetching order:', error);
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
    logger.error('Error fetching order status:', error);
    throw error;
  }
}

/**
 * Get orders list
 */
export async function getOrdersList(params?: {
  limit?: number;
  offset?: number;
  status?: 'ongoing' | 'past' | 'all';
  order_type?: 'individual' | 'group' | 'all';
}): Promise<GetOrdersListResponse> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.order_type) queryParams.append('order_type', params.order_type);

    const url = `/api/customer/orders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await authenticatedFetch(url, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(errorData.error || errorData.message || 'Failed to fetch orders list');
    }

    return await response.json();
  } catch (error) {
    logger.error('Error fetching orders list:', error);
    throw error;
  }
}

