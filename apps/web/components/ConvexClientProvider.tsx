"use client";

import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { useEffect, useState } from "react";

// Initialize Convex client with error handling
let convex: ConvexReactClient;
try {
  convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
} catch (error) {
  console.error("Failed to initialize Convex client:", error);
  // Fallback initialization
  convex = new ConvexReactClient("https://your-convex-url.convex.cloud");
}

export function ConvexClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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

    // Function to set up authentication
    const setupAuth = () => {
      try {
        const token = getTokenFromCookie();
        if (token) {
          convex.setAuth(async () => token);
          setIsAuthenticated(true);
        } else {
          convex.clearAuth();
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Error setting up auth:", error);
        setIsAuthenticated(false);
      }
    };

    // Set up auth on mount with a small delay to ensure DOM is ready
    const timeoutId = setTimeout(setupAuth, 100);

    // Listen for cookie changes by checking periodically
    const interval = setInterval(setupAuth, 1000);

    // Also listen for focus events
    const handleFocus = () => setupAuth();
    window.addEventListener("focus", handleFocus);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  return <ConvexAuthProvider client={convex}>{children}</ConvexAuthProvider>;
} 