"use client";

import { ConvexReactClient, ConvexProvider } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { useEffect, useState, useMemo } from "react";

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
  }, [convex]);

  // Use ConvexProvider for basic hooks (useQuery, useMutation, useAction)
  // Wrap with ConvexAuthProvider for authentication features
  return (
    <ConvexProvider client={convex}>
      <ConvexAuthProvider client={convex}>
        {children}
      </ConvexAuthProvider>
    </ConvexProvider>
  );
} 