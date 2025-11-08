/**
 * Cart API Client Functions
 * Functions for interacting with the cart API endpoints
 */

interface CartItem {
  _id: string;
  dish_id: string;
  quantity: number;
  price: number;
  name?: string;
  dish_name?: string;
  chef_id?: string;
  chef_name?: string;
  added_at?: number;
  total_price?: number;
}

interface Cart {
  items: CartItem[];
  delivery_fee?: number;
  [key: string]: unknown;
}

interface CartResponse {
  success: boolean;
  data: {
    cart: Cart;
  };
  message?: string;
}

interface AddToCartResponse {
  success: boolean;
  data: {
    item: CartItem;
  };
  message?: string;
}

interface UpdateCartItemResponse {
  success: boolean;
  data: {
    item: CartItem;
  };
  message?: string;
}

interface RemoveCartItemResponse {
  success: boolean;
  data: {
    success: boolean;
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
 * Get user's cart
 */
export async function getCart(): Promise<CartResponse> {
  try {
    const response = await authenticatedFetch('/api/customer/cart', {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(errorData.error || errorData.message || 'Failed to fetch cart');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching cart:', error);
    throw error;
  }
}

/**
 * Add item to cart
 */
export async function addToCart(
  dishId: string,
  quantity: number
): Promise<AddToCartResponse> {
  try {
    const response = await authenticatedFetch('/api/customer/cart/items', {
      method: 'POST',
      body: JSON.stringify({
        dish_id: dishId,
        quantity,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(errorData.error || errorData.message || 'Failed to add item to cart');
    }

    return await response.json();
  } catch (error) {
    console.error('Error adding item to cart:', error);
    throw error;
  }
}

/**
 * Update cart item quantity
 */
export async function updateCartItem(
  cartItemId: string,
  quantity: number
): Promise<UpdateCartItemResponse> {
  try {
    const response = await authenticatedFetch(
      `/api/customer/cart/items/${cartItemId}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          quantity,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(errorData.error || errorData.message || 'Failed to update cart item');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating cart item:', error);
    throw error;
  }
}

/**
 * Remove item from cart
 */
export async function removeCartItem(
  cartItemId: string
): Promise<RemoveCartItemResponse> {
  try {
    const response = await authenticatedFetch(
      `/api/customer/cart/items/${cartItemId}`,
      {
        method: 'DELETE',
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(errorData.error || errorData.message || 'Failed to remove cart item');
    }

    return await response.json();
  } catch (error) {
    console.error('Error removing cart item:', error);
    throw error;
  }
}

/**
 * Clear entire cart
 * Note: This might not be a direct API endpoint, but can be achieved by removing all items
 */
export async function clearCart(): Promise<void> {
  try {
    const cartResponse = await getCart();
    const items = cartResponse.data?.cart?.items || [];

    // Remove all items
    await Promise.all(
      items.map((item) => removeCartItem(item._id))
    );
  } catch (error) {
    console.error('Error clearing cart:', error);
    throw error;
  }
}

