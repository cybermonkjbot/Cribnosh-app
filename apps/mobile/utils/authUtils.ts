import * as SecureStore from "expo-secure-store";
import { validateSessionWithBackend } from "./sessionValidation";

export interface StoredUser {
  user_id: string;
  email: string; // Can be empty string for phone-only auth
  name: string;
  roles: string[];
  picture: string;
  isNewUser: boolean;
  provider: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: StoredUser | null;
}

/**
 * Checks if user is authenticated by verifying stored token and user data
 * Now includes proactive session validation with the backend
 * @param skipBackendValidation - If true, skips backend validation (for performance in some cases)
 * @returns Promise<AuthState> - Authentication state with token and user data
 */
export const checkAuthState = async (
  skipBackendValidation: boolean = false
): Promise<AuthState> => {
  try {
    // Get stored sessionToken and user data
    const [sessionToken, userData] = await Promise.all([
      SecureStore.getItemAsync("cribnosh_session_token"),
      SecureStore.getItemAsync("cribnosh_user"),
    ]);

    // If no sessionToken or user data, user is not authenticated
    if (!sessionToken || !userData) {
      return {
        isAuthenticated: false,
        token: null,
        user: null,
      };
    }

    // Parse user data
    const user: StoredUser = JSON.parse(userData);

    // Validate that user data has required fields (email can be empty for phone-only auth)
    if (!user.user_id || !user.name) {
      // Invalid user data, clear storage
      await clearAuthData();
      return {
        isAuthenticated: false,
        token: null,
        user: null,
      };
    }

    // Proactively validate session with backend (unless skipped for performance)
    if (!skipBackendValidation) {
      const isValid = await validateSessionWithBackend(sessionToken);
      if (!isValid) {
        // Session is invalid or expired, clear storage
        console.log("Session validation failed during checkAuthState - clearing invalid session");
        await clearAuthData();
        return {
          isAuthenticated: false,
          token: null,
          user: null,
        };
      }
    }

    return {
      isAuthenticated: true,
      token: sessionToken, // Return as token for backward compatibility
      user,
    };
  } catch (error) {
    console.error("Error checking auth state:", error);
    // On error, clear potentially corrupted data
    await clearAuthData();
    return {
      isAuthenticated: false,
      token: null,
      user: null,
    };
  }
};

/**
 * Clears all stored authentication data
 */
export const clearAuthData = async (): Promise<void> => {
  try {
    await Promise.all([
      SecureStore.deleteItemAsync("cribnosh_session_token"),
      SecureStore.deleteItemAsync("cribnosh_user"),
    ]);
  } catch (error) {
    console.error("Error clearing auth data:", error);
  }
};

/**
 * Stores authentication data securely
 * @param sessionToken - Session token (preferred) or JWT token (fallback)
 * @param user - User data object
 */
export const storeAuthData = async (
  sessionToken: string,
  user: StoredUser
): Promise<void> => {
  try {
    await Promise.all([
      SecureStore.setItemAsync("cribnosh_session_token", sessionToken),
      SecureStore.setItemAsync("cribnosh_user", JSON.stringify(user)),
    ]);
  } catch (error) {
    console.error("Error storing auth data:", error);
    throw error;
  }
};

/**
 * Gets only the stored sessionToken
 * @returns Promise<string | null> - Stored sessionToken or null
 */
export const getStoredToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync("cribnosh_session_token");
  } catch (error) {
    console.error("Error getting stored sessionToken:", error);
    return null;
  }
};

/**
 * Gets only the stored user data
 * @returns Promise<StoredUser | null> - Stored user data or null
 */
export const getStoredUser = async (): Promise<StoredUser | null> => {
  try {
    const userData = await SecureStore.getItemAsync("cribnosh_user");
    if (!userData) return null;

    const user: StoredUser = JSON.parse(userData);

    // Validate user data (email can be empty for phone-only auth)
    if (!user.user_id || !user.name) {
      return null;
    }

    return user;
  } catch (error) {
    console.error("Error getting stored user:", error);
    return null;
  }
};
