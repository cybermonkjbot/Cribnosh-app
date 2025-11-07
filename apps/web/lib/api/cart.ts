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
 * Get JWT token from session token
 * This helper function gets a JWT token for authenticated API requests
 */
async function getJWTToken(): Promise<string | null> {
  try {
    // Get JWT token from endpoint that converts session tokens (from cookies) to JWT tokens
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

