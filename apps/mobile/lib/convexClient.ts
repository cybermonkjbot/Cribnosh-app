import { ConvexHttpClient } from "convex/browser";
import { ConvexReactClient } from "convex/react";
import * as SecureStore from "expo-secure-store";

// Singleton pattern for Convex HTTP client (for actions)
let convexHttpClientInstance: ConvexHttpClient | null = null;

// Singleton pattern for Convex React client (for reactive queries)
let convexReactClientInstance: ConvexReactClient | null = null;

/**
 * Get or create the Convex HTTP client instance for actions
 * Uses EXPO_PUBLIC_CONVEX_URL from environment variables
 * Note: For React Native, we use ConvexHttpClient for actions since we're calling them directly
 */
export function getConvexClient(): ConvexHttpClient {
  if (convexHttpClientInstance) {
    return convexHttpClientInstance;
  }

  const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
  
  if (!convexUrl) {
    console.error("EXPO_PUBLIC_CONVEX_URL is not set. Please check your environment variables.");
    // Use production URL as fallback (update this with your actual Convex URL)
    const fallbackUrl = "https://wandering-finch-293.convex.cloud";
    console.warn(`Using fallback Convex URL: ${fallbackUrl}`);
    convexHttpClientInstance = new ConvexHttpClient(fallbackUrl);
    return convexHttpClientInstance;
  }

  try {
    convexHttpClientInstance = new ConvexHttpClient(convexUrl);
    return convexHttpClientInstance;
  } catch (error) {
    console.error("Failed to initialize Convex client:", error);
    // Fallback initialization
    const fallbackUrl = "https://wandering-finch-293.convex.cloud";
    console.warn(`Using fallback Convex URL: ${fallbackUrl}`);
    convexHttpClientInstance = new ConvexHttpClient(fallbackUrl);
    return convexHttpClientInstance;
  }
}

/**
 * Get session token from SecureStore
 */
export async function getSessionToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync("cribnosh_session_token");
  } catch (error) {
    console.error("Error getting session token:", error);
    return null;
  }
}

/**
 * Set session token in SecureStore
 */
export async function setSessionToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync("cribnosh_session_token", token);
  } catch (error) {
    console.error("Error setting session token:", error);
    throw error;
  }
}

/**
 * Clear session token from SecureStore
 */
export async function clearSessionToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync("cribnosh_session_token");
  } catch (error) {
    console.error("Error clearing session token:", error);
  }
}

/**
 * Get or create the Convex React client instance for reactive queries
 * Uses EXPO_PUBLIC_CONVEX_URL from environment variables
 */
export function getConvexReactClient(): ConvexReactClient {
  if (convexReactClientInstance) {
    return convexReactClientInstance;
  }

  const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
  
  if (!convexUrl) {
    console.error("EXPO_PUBLIC_CONVEX_URL is not set. Please check your environment variables.");
    // Use production URL as fallback (update this with your actual Convex URL)
    const fallbackUrl = "https://wandering-finch-293.convex.cloud";
    console.warn(`Using fallback Convex URL: ${fallbackUrl}`);
    convexReactClientInstance = new ConvexReactClient(fallbackUrl);
    return convexReactClientInstance;
  }

  try {
    convexReactClientInstance = new ConvexReactClient(convexUrl);
    return convexReactClientInstance;
  } catch (error) {
    console.error("Failed to initialize Convex React client:", error);
    // Fallback initialization
    const fallbackUrl = "https://wandering-finch-293.convex.cloud";
    console.warn(`Using fallback Convex URL: ${fallbackUrl}`);
    convexReactClientInstance = new ConvexReactClient(fallbackUrl);
    return convexReactClientInstance;
  }
}

