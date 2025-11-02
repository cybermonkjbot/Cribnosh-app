import * as SecureStore from "expo-secure-store";

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
 * @returns Promise<AuthState> - Authentication state with token and user data
 */
export const checkAuthState = async (): Promise<AuthState> => {
  try {
    // Get stored token and user data
    const [token, userData] = await Promise.all([
      SecureStore.getItemAsync("cribnosh_token"),
      SecureStore.getItemAsync("cribnosh_user"),
    ]);

    // If no token or user data, user is not authenticated
    if (!token || !userData) {
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

    return {
      isAuthenticated: true,
      token,
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
      SecureStore.deleteItemAsync("cribnosh_token"),
      SecureStore.deleteItemAsync("cribnosh_user"),
    ]);
  } catch (error) {
    console.error("Error clearing auth data:", error);
  }
};

/**
 * Stores authentication data securely
 * @param token - JWT token
 * @param user - User data object
 */
export const storeAuthData = async (
  token: string,
  user: StoredUser
): Promise<void> => {
  try {
    await Promise.all([
      SecureStore.setItemAsync("cribnosh_token", token),
      SecureStore.setItemAsync("cribnosh_user", JSON.stringify(user)),
    ]);
  } catch (error) {
    console.error("Error storing auth data:", error);
    throw error;
  }
};

/**
 * Gets only the stored token
 * @returns Promise<string | null> - Stored token or null
 */
export const getStoredToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync("cribnosh_token");
  } catch (error) {
    console.error("Error getting stored token:", error);
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
