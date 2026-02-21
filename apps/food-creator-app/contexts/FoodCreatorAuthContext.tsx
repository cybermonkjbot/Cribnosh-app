import { api } from '@/convex/_generated/api';
import { clearSessionToken, getSessionToken, setSessionToken as storeSessionToken } from '@/lib/convexClient';
import { useQuery } from 'convex/react';
import { ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';

interface FoodCreatorAuthContextType {
  foodCreator: any | null;
  user: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isBasicOnboardingComplete: boolean;
  isOnboardingComplete: boolean;
  sessionToken: string | null;
  login: (token: string, user: any) => Promise<void>;
  refreshFoodCreator: () => Promise<void>;
  logout: () => Promise<void>;
}

const FoodCreatorAuthContext = createContext<FoodCreatorAuthContextType | undefined>(undefined);

interface FoodCreatorAuthProviderProps {
  children: ReactNode;
}

export function FoodCreatorAuthProvider({ children }: FoodCreatorAuthProviderProps) {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load session token on mount
  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await getSessionToken();
        setSessionToken(token);
      } catch (error) {
        console.error('Error loading session token:', error);
        setSessionToken(null);
      } finally {
        setIsLoading(false);
      }
    };
    loadToken();
  }, []);

  // Get user from session token
  // Wrap in try-catch pattern by using a wrapper that handles errors
  const userQueryResult = useQuery(
    api.queries.users.getUserBySessionToken,
    sessionToken ? { sessionToken } : 'skip'
  );

  // Get user from query result
  const user = userQueryResult;

  // Get food creator profile if user has food creator role
  // Only query if user exists, has foodCreator role, and we have a valid session token
  // This prevents calling the query with invalid tokens which would cause errors
  const foodCreatorQueryResult = useQuery(
    api.queries.foodCreators.getByUserId,
    // Only call if we have a valid user with foodCreator role and session token
    // This prevents errors from requireAuth when session token is invalid
    user &&
      user !== null &&
      user.roles?.includes('chef') &&
      user._id &&
      sessionToken
      ? { userId: user._id, sessionToken: sessionToken }
      : 'skip'
  );

  const foodCreator = foodCreatorQueryResult;

  // Check if basic onboarding is complete (profile setup)
  const isBasicOnboardingComplete = useQuery(
    api.queries.foodCreators.isBasicOnboardingComplete,
    foodCreator?._id && sessionToken
      ? { foodCreatorId: foodCreator._id, sessionToken }
      : 'skip'
  ) ?? false;

  // Check if onboarding is complete (compliance course completed)
  const isOnboardingComplete = useQuery(
    api.queries.chefCourses.isOnboardingComplete,
    foodCreator?._id && sessionToken
      ? { foodCreatorId: foodCreator._id, sessionToken }
      : 'skip'
  ) ?? false;

  // Check if user is authenticated as a food creator
  // User must exist, have a session token, and have the 'chef' role
  const isAuthenticated = !!user && !!sessionToken && user.roles?.includes('chef');

  // Handle the case where user query returns null (no user found)
  // This means the session token is invalid/expired - clear it immediately
  useEffect(() => {
    if (user === null && sessionToken) {
      console.warn('FoodCreatorAuthContext: User query returned null - session token is invalid or expired, clearing it');
      // Immediately stop loading - don't wait for token clearing
      setIsLoading(false);
      // Clear the invalid session token immediately
      const clearToken = async () => {
        try {
          await clearSessionToken();
          setSessionToken(null);
        } catch (error) {
          console.error('Error clearing session token:', error);
        }
      };
      clearToken();
    }
  }, [user, sessionToken]);

  // Determine if we're still loading:
  // - If sessionToken is null, we're done loading (no user to fetch)
  // - If sessionToken exists, we're loading until user query resolves (user !== undefined)
  // - If user is null (query completed but no user), stop loading immediately
  // - The useEffect above will clear the token when user is null, which will stop loading
  const isQueryLoading = sessionToken !== null && user === undefined;

  // Safety timeout: if query loading takes too long, stop loading to prevent infinite loading
  useEffect(() => {
    if (isQueryLoading && sessionToken) {
      const timeout = setTimeout(() => {
        console.warn('FoodCreatorAuthContext: Query loading timeout - stopping loading to prevent infinite loading');
        setIsLoading(false);
      }, 10000); // 10 second timeout

      return () => clearTimeout(timeout);
    }
  }, [isQueryLoading, sessionToken]);

  // Debug logging
  useEffect(() => {
    if (sessionToken) {
      console.log('FoodCreatorAuthContext state:', {
        hasSessionToken: !!sessionToken,
        user: user ? { id: user._id, roles: user.roles, email: user.email } : (user === null ? 'null (no user found - token invalid)' : 'undefined (loading)'),
        foodCreator: foodCreator ? { id: foodCreator._id, name: foodCreator.name } : (foodCreator === null ? 'null (no food creator found)' : 'undefined (loading/skipped)'),
        isAuthenticated,
        isLoading,
        isQueryLoading,
      });
    }
  }, [sessionToken, user, foodCreator, isAuthenticated, isLoading, isQueryLoading]);

  const login = useCallback(async (token: string, userData: any) => {
    try {
      // Store session token in SecureStore
      await storeSessionToken(token);
      // Update state to trigger re-fetch
      setSessionToken(token);
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  }, []);

  const refreshFoodCreator = useCallback(async () => {
    // Force refetch by updating session token state
    const token = await getSessionToken();
    setSessionToken(token);
  }, []);

  const logout = useCallback(async () => {
    // Clear session token
    await clearSessionToken();
    setSessionToken(null);
  }, []);

  const contextValue: FoodCreatorAuthContextType = {
    foodCreator: foodCreator || null,
    user: user || null,
    isLoading: isLoading || isQueryLoading,
    isAuthenticated: !!isAuthenticated,
    isBasicOnboardingComplete: isBasicOnboardingComplete === true,
    isOnboardingComplete: isOnboardingComplete === true,
    sessionToken,
    login,
    refreshFoodCreator,
    logout,
  };

  return (
    <FoodCreatorAuthContext.Provider value={contextValue}>
      {children}
    </FoodCreatorAuthContext.Provider>
  );
}

export function useFoodCreatorAuth(): FoodCreatorAuthContextType {
  const context = useContext(FoodCreatorAuthContext);
  if (context === undefined) {
    throw new Error('useFoodCreatorAuth must be used within a FoodCreatorAuthProvider');
  }
  return context;
}

