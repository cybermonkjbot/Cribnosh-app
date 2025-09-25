import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  AuthState,
  checkAuthState,
  clearAuthData,
  getStoredUser,
  storeAuthData,
  StoredUser,
} from "../utils/authUtils";

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
}

/**
 * Hook to manage authentication state throughout the app
 * Automatically checks for stored authentication data on mount
 * Provides methods to login, logout, and refresh auth state
 */
export const useAuthState = (): UseAuthStateReturn => {
  const router = useRouter();
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
      setAuthState(authData);
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

  const login = useCallback(
    async (token: string, user: StoredUser) => {
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

        // Navigate to main app
        console.log("Login successful, navigating to /(tabs)");
        console.log("Current route before navigation:", router);
        router.replace("/");
        console.log("Navigation command sent");
      } catch (err) {
        console.error("Login error:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to login";
        setError(errorMessage);
        throw err;
      }
    },
    [router]
  );

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

      // Navigate to main app (which will show sign-in modal if not authenticated)
      router.replace("/");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to logout";
      setError(errorMessage);
      console.error("Logout error:", err);
    }
  }, [router]);

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
