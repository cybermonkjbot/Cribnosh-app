import { useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from '@/convex/_generated/api';
import { getSessionToken } from "@/lib/convexClient";

/**
 * Reactive hook to get cart item count
 * Uses Convex's reactive useQuery for real-time updates
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
  const cartCount = useQuery(
    api.queries.orders.getCartItemCountBySessionToken,
    sessionToken ? { sessionToken } : "skip"
  );

  // Return 0 if no token, loading, or error
  return cartCount ?? 0;
}

