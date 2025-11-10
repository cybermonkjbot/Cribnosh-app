"use client";

import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { useEffect, useMemo, useRef, useState } from "react";

// Singleton pattern for Convex client
let convexClientInstance: ConvexReactClient | null = null;

function getConvexClient(): ConvexReactClient {
  if (convexClientInstance) {
    return convexClientInstance;
  }

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  
  if (!convexUrl) {
    console.error("NEXT_PUBLIC_CONVEX_URL is not set. Please check your environment variables.");
    // Use dev URL as fallback
    const fallbackUrl = "https://wandering-finch-293.convex.cloud";
    console.warn(`Using fallback Convex URL: ${fallbackUrl}`);
    convexClientInstance = new ConvexReactClient(fallbackUrl);
    return convexClientInstance;
  }

  try {
    convexClientInstance = new ConvexReactClient(convexUrl);
    return convexClientInstance;
  } catch (error) {
    console.error("Failed to initialize Convex client:", error);
    // Fallback initialization
    const fallbackUrl = "https://wandering-finch-293.convex.cloud";
    console.warn(`Using fallback Convex URL: ${fallbackUrl}`);
    convexClientInstance = new ConvexReactClient(fallbackUrl);
    return convexClientInstance;
  }
}

export function ConvexClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const lastTokenRef = useRef<string | null>(null);
  
  // Initialize Convex client using useMemo to ensure it's only created once
  const convex = useMemo(() => {
    return getConvexClient();
  }, []);

  useEffect(() => {
    // Function to get token from cookie
    const getTokenFromCookie = () => {
      if (typeof window === "undefined") return null;
      try {
        const match = document.cookie.match(/(^| )convex-auth-token=([^;]+)/);
        return match ? match[2] : null;
      } catch (error) {
        console.error("Error reading cookie:", error);
        return null;
      }
    };

    // Function to check authentication status - session tokens are passed as parameters to queries
    // We no longer use setAuth() since it expects JWT, not session tokens
    const setupAuth = () => {
      try {
        const token = getTokenFromCookie();
        
        // Only update if token actually changed
        if (token !== lastTokenRef.current) {
          lastTokenRef.current = token;
          // Session tokens should be passed as parameters to queries/mutations, not via setAuth()
          // setAuth() expects JWT tokens, but we're using session tokens
          setIsAuthenticated(!!token);
        }
      } catch (error) {
        console.error("Error setting up auth:", error);
        setIsAuthenticated(false);
      }
    };

    // Set up auth on mount with a small delay to ensure DOM is ready
    const timeoutId = setTimeout(setupAuth, 100);

    // Check for cookie changes less frequently (every 5 seconds instead of 1 second)
    // This reduces unnecessary re-renders while still detecting auth changes
    const interval = setInterval(setupAuth, 5000);

    // Also listen for focus events (user might have logged in in another tab)
    const handleFocus = () => setupAuth();
    window.addEventListener("focus", handleFocus);

    // Listen for storage events (cross-tab communication)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'convex-auth-token' || e.key === null) {
        setupAuth();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [convex]);

  // Use ConvexProvider for basic hooks (useQuery, useMutation, useAction)
  // Wrap with ConvexAuthProvider for authentication features
  return (
    <ConvexProvider client={convex as any}>
      <ConvexAuthProvider client={convex as any}>
        {children}
      </ConvexAuthProvider>
    </ConvexProvider>
  );
} 