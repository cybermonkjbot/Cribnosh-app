import { getAuthToken } from "@/lib/auth-client";
import { useEffect, useState } from "react";

/**
 * Custom hook to get the session token from cookies
 * Session tokens are stored in the 'convex-auth-token' cookie
 * 
 * @returns The session token string or null if not found
 */
export function useSessionToken(): string | null {
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  useEffect(() => {
    // Function to get token from cookie
    const getTokenFromCookie = (): string | null => {
      return getAuthToken();
    };


    // Set initial token
    const token = getTokenFromCookie();
    setSessionToken(token);

    // Check for cookie changes periodically (every 5 seconds)
    // This helps detect auth changes while reducing unnecessary re-renders
    const interval = setInterval(() => {
      const newToken = getTokenFromCookie();
      if (newToken !== sessionToken) {
        setSessionToken(newToken);
      }
    }, 5000);

    // Listen for focus events (user might have logged in in another tab)
    const handleFocus = () => {
      const newToken = getTokenFromCookie();
      if (newToken !== sessionToken) {
        setSessionToken(newToken);
      }
    };
    window.addEventListener("focus", handleFocus);

    // Listen for storage events (cross-tab communication)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'convex-auth-token' || e.key === null) {
        const newToken = getTokenFromCookie();
        if (newToken !== sessionToken) {
          setSessionToken(newToken);
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [sessionToken]);

  return sessionToken;
}

