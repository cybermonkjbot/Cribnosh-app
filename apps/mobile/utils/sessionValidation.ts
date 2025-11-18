/**
 * Session validation utilities
 * Proactively validates sessions to clear invalid/expired sessions from secure storage
 */

import { getConvexClient, getSessionToken } from "@/lib/convexClient";
import { api } from "@/convex/_generated/api";
import { clearAuthData } from "./authUtils";
import { isNetworkError } from "./networkErrorHandler";

/**
 * Validates a session token with the backend
 * @param sessionToken - The session token to validate
 * @returns Promise<boolean> - true if session is valid, false otherwise
 */
export const validateSessionWithBackend = async (
  sessionToken: string
): Promise<boolean> => {
  try {
    if (!sessionToken) {
      return false;
    }

    const convex = getConvexClient();
    
    // Query backend to check if session is valid
    // This will return null if session is expired, invalid, or user is suspended/inactive
    const user = await convex.query(api.queries.users.getUserBySessionToken, {
      sessionToken,
    });

    // If user is null, session is invalid/expired
    return user !== null;
  } catch (error) {
    // If it's a network error, assume session is still valid (we just can't verify it)
    if (isNetworkError(error)) {
      return true;
    }
    // For other errors, assume session is invalid to be safe
    return false;
  }
};

/**
 * Validates the current stored session and clears it if invalid
 * @returns Promise<boolean> - true if session is valid, false if cleared
 */
export const validateAndClearInvalidSession = async (): Promise<boolean> => {
  try {
    const sessionToken = await getSessionToken();
    
    if (!sessionToken) {
      // No session token, nothing to validate
      return false;
    }

    const isValid = await validateSessionWithBackend(sessionToken);
    
    if (!isValid) {
      // Session is invalid or expired, clear it
      // Note: validateSessionWithBackend returns true on network errors, so this only runs on actual validation failures
      console.log("Session validation failed - clearing invalid session");
      await clearAuthData();
      return false;
    }

    return true;
  } catch (error) {
    // If it's a network error, don't clear the session (assume it's still valid)
    if (isNetworkError(error)) {
      return true;
    }
    // For other errors, clear session to be safe
    await clearAuthData().catch(() => {});
    return false;
  }
};

/**
 * Validates session before making API calls
 * This is a fast check that can be called before each API request
 * @returns Promise<boolean> - true if session exists and should be valid, false if cleared
 */
export const validateSessionBeforeApiCall = async (): Promise<boolean> => {
  try {
    const sessionToken = await getSessionToken();
    
    if (!sessionToken) {
      return false;
    }

    // For performance, we do a lightweight validation
    // Full validation happens on the backend, but we can do a quick check here
    // In most cases, we'll let the backend handle validation and clear on 401
    // But we can add a cache or timestamp check here if needed
    
    return true;
  } catch (error) {
    // Silently handle errors
    return false;
  }
};

