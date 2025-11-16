import { api } from '@/convex/_generated/api';
import { getSessionToken } from "@/lib/convexClient";
import { useQuery } from "convex/react";
import { useEffect, useState } from "react";

/**
 * Reactive hook to get cart item count
 * Uses Convex's reactive useQuery for real-time updates
 * Gracefully handles authentication errors by returning 0
 * 
 * Note: If the query fails due to authentication, Convex will log the error
 * but the hook will return 0, preventing the app from crashing.
 */
export function useCartCount(): number {
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Load session token
  useEffect(() => {
    const loadToken = async () => {
      const token = await getSessionToken();
      setSessionToken(token);
    };
    loadToken();
  }, []);

  // Use reactive query to get cart count
  // Convex's useQuery handles errors internally and returns undefined on failure
  // This prevents the app from crashing when authentication is required
  const queryArgs = sessionToken ? { sessionToken } : "skip";
  // @ts-ignore - Type instantiation is excessively deep (Convex type inference issue)
  const cartCount = useQuery(
    api.queries.orders.getCartItemCountBySessionToken,
    queryArgs
  ) as number | undefined;

  // Return 0 if no token, loading, error, or undefined result
  // This gracefully handles authentication errors by treating them as 0 count
  // Unauthenticated users should see 0 items in their cart
  return cartCount ?? 0;
}

