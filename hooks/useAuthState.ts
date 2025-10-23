import { useCallback, useEffect, useState } from "react";
import {
  AuthState,
  checkAuthState,
  clearAuthData,
  getStoredUser,
  storeAuthData,
  StoredUser,
} from "../utils/authUtils";
import { isTokenExpired } from "../utils/jwtUtils";

export interface UseAuthStateReturn {
  // State
  isAuthenticated: boolean;
  isLoading: boolean;
  user: StoredUser | null;
  token: string | null;
  error: string | null;

  // Actions
  login: (token: string, user: StoredUser) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuthState: () => Promise<void>;
  clearError: () => void;
  checkTokenExpiration: () => boolean;
}

/**
 * Hook to manage authentication state throughout the app
 * Automatically checks for stored authentication data on mount
 * Provides methods to login, logout, and refresh auth state
 */
export const useAuthState = (): UseAuthStateReturn => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    token: null,
    user: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const authData = await checkAuthState();

      // Check if token is expired
      if (authData.token && isTokenExpired(authData.token)) {
        console.log("Token expired during initialization, clearing auth data");
        await clearAuthData();
        setAuthState({
          isAuthenticated: false,
          token: null,
          user: null,
        });
      } else {
        setAuthState(authData);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to initialize authentication";
      setError(errorMessage);
      console.error("Auth initialization error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (token: string, user: StoredUser) => {
    try {
      console.log("Login function called with token and user:", {
        token: !!token,
        user: !!user,
      });
      setError(null);

      // Store auth data
      console.log("Storing auth data...");
      await storeAuthData(token, user);
      console.log("Auth data stored successfully");

      // Update state
      console.log("Updating auth state...");
      setAuthState({
        isAuthenticated: true,
        token,
        user,
      });
      console.log("Auth state updated successfully");
      console.log("New auth state:", {
        isAuthenticated: true,
        token: !!token,
        user: !!user,
      });

      // Small delay to ensure state update is processed
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Don't navigate here - let the app's conditional rendering handle it
      console.log("Login successful, auth state updated");
      console.log("App will automatically re-render based on auth state");
    } catch (err) {
      console.error("Login error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to login";
      setError(errorMessage);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setError(null);

      // Clear stored data
      await clearAuthData();

      // Update state
      setAuthState({
        isAuthenticated: false,
        token: null,
        user: null,
      });

      // Don't navigate here - let the app's conditional rendering handle it
      console.log("Logout successful, auth state updated");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to logout";
      setError(errorMessage);
      console.error("Logout error:", err);
    }
  }, []);

  const refreshAuthState = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const authData = await checkAuthState();
      setAuthState(authData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to refresh auth state";
      setError(errorMessage);
      console.error("Auth refresh error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const checkTokenExpiration = useCallback(() => {
    if (authState.token && isTokenExpired(authState.token)) {
      console.log("Token expired, clearing auth data");
      clearAuthData();
      setAuthState({
        isAuthenticated: false,
        token: null,
        user: null,
      });
      return true; // Token was expired
    }
    return false; // Token is still valid
  }, [authState.token]);

  return {
    // State
    isAuthenticated: authState.isAuthenticated,
    isLoading,
    user: authState.user,
    token: authState.token,
    error,

    // Actions
    login,
    logout,
    refreshAuthState,
    clearError,
    checkTokenExpiration,
  };
};

/**
 * Hook to get only user details (lighter weight)
 * Useful when you only need user info without full auth state management
 */
export const useUser = (): { user: StoredUser | null; isLoading: boolean } => {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        setIsLoading(true);
        const userData = await getStoredUser();
        setUser(userData);
      } catch (error) {
        console.error("Error loading user:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  return { user, isLoading };
};
