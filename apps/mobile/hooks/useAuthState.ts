import { api } from '@/convex/_generated/api';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import { clearSessionToken, getConvexClient, resetConvexClients } from "../lib/convexClient";
import {
  AuthState,
  StoredUser,
  checkAuthState,
  clearAuthData,
  getStoredUser,
  storeAuthData,
} from "../utils/authUtils";
import { validateAndClearInvalidSession } from "../utils/sessionValidation";

export interface UseAuthStateReturn {
  // State
  isAuthenticated: boolean;
  isLoading: boolean;
  user: StoredUser | null;
  token: string | null;
  error: string | null;

  // Actions
  login: (sessionToken: string, user: StoredUser) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuthState: () => Promise<void>;
  clearError: () => void;
  checkTokenExpiration: () => boolean; // Deprecated: kept for backward compatibility
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
  const isMountedRef = useRef(true);
  const validationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const appStateSubscriptionRef = useRef<any>(null);

  // Handle app state changes (foreground/background)
  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    if (nextAppState === "active") {
      // App came to foreground, validate session if authenticated
      const currentToken = authState.token;
      if (currentToken) {
        validateAndClearInvalidSession().then((isValid) => {
          if (!isValid && isMountedRef.current) {
            // Session was invalid and cleared, update auth state
            setAuthState({
              isAuthenticated: false,
              token: null,
              user: null,
            });
          }
        });
      }
    }
  }, [authState.token]);

  // Initialize auth state on mount and set up periodic validation
  useEffect(() => {
    initializeAuth();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Set up periodic session validation and app state listener
  useEffect(() => {
    // Set up periodic session validation (every 5 minutes)
    validationIntervalRef.current = setInterval(() => {
      if (isMountedRef.current && authState.isAuthenticated) {
        validateAndClearInvalidSession().then((isValid) => {
          if (!isValid && isMountedRef.current) {
            // Session was invalid and cleared, update auth state
            setAuthState({
              isAuthenticated: false,
              token: null,
              user: null,
            });
          }
        });
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Set up app state listener to validate session on app resume
    appStateSubscriptionRef.current = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      if (validationIntervalRef.current) {
        clearInterval(validationIntervalRef.current);
      }
      if (appStateSubscriptionRef.current) {
        appStateSubscriptionRef.current.remove();
      }
    };
  }, [authState.isAuthenticated, handleAppStateChange]);

  const initializeAuth = async () => {
    try {
      if (!isMountedRef.current) return;
      setIsLoading(true);
      setError(null);

      const authData = await checkAuthState();
      if (!isMountedRef.current) return;
      // SessionToken expiration is validated server-side
      // No need to check expiration client-side
      setAuthState(authData);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to initialize authentication";
      if (isMountedRef.current) {
        setError(errorMessage);
      }
      console.error("Auth initialization error:", err);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const login = useCallback(async (sessionToken: string, user: StoredUser) => {
    try {
      if (!isMountedRef.current) return;
      console.log("Login function called with sessionToken and user:", {
        sessionToken: !!sessionToken,
        user: !!user,
      });
      setError(null);

      // Store auth data
      console.log("Storing auth data...");
      await storeAuthData(sessionToken, user);
      console.log("Auth data stored successfully");

      if (!isMountedRef.current) return;

      // Update state
      console.log("Updating auth state...");
      setAuthState({
        isAuthenticated: true,
        token: sessionToken, // Store as token for backward compatibility
        user,
      });
      console.log("Auth state updated successfully");
      console.log("New auth state:", {
        isAuthenticated: true,
        token: !!sessionToken,
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
      if (isMountedRef.current) {
        setError(errorMessage);
      }
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      if (!isMountedRef.current) return;
      setError(null);

      // Get session token and call Convex logout action
      try {
        const { getSessionToken } = await import("../lib/convexClient");
        const sessionToken = await getSessionToken();
        
        if (sessionToken) {
          const convex = getConvexClient();
          try {
            await convex.action(api.actions.users.customerLogout, {
              sessionToken,
            });
          } catch (apiError) {
            // Even if API call fails, continue with local logout
            console.warn("Logout API call failed, continuing with local logout:", apiError);
          }
        }
      } catch (apiError) {
        // Even if API call fails, continue with local logout
        console.warn("Logout API call failed, continuing with local logout:", apiError);
      }

      // Clear stored data
      await clearAuthData();
      await clearSessionToken();

      // Reset Convex client instances to clear any cached session state
      resetConvexClients();

      if (!isMountedRef.current) return;

      // Update state
      setAuthState({
        isAuthenticated: false,
        token: null,
        user: null,
      });

      // Navigate to home after logout
      console.log("Logout successful, navigating to home");
      router.replace('/(tabs)');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to logout";
      if (isMountedRef.current) {
        setError(errorMessage);
      }
      console.error("Logout error:", err);
      
      // Even if there's an error, clear local storage and reset clients
      await clearAuthData();
      await clearSessionToken();
      resetConvexClients();
      
      // Still navigate to home even on error
      if (isMountedRef.current) {
        setAuthState({
          isAuthenticated: false,
          token: null,
          user: null,
        });
        router.replace('/(tabs)');
      }
    }
  }, []);

  const refreshAuthState = useCallback(async () => {
    try {
      if (!isMountedRef.current) return;
      setIsLoading(true);
      setError(null);

      const authData = await checkAuthState();
      if (!isMountedRef.current) return;
      setAuthState(authData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to refresh auth state";
      if (isMountedRef.current) {
        setError(errorMessage);
      }
      console.error("Auth refresh error:", err);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const checkTokenExpiration = useCallback(() => {
    // SessionToken expiration is validated server-side
    // This method is kept for backward compatibility but always returns false
    // The server will return 401 if the sessionToken is expired
    return false; // SessionToken validity is checked server-side
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
