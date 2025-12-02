import { api } from '@/convex/_generated/api';
import { clearSessionToken, getSessionToken, setSessionToken as storeSessionToken } from '@/lib/convexClient';
import { useQuery } from 'convex/react';
import { ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';

interface ChefAuthContextType {
  chef: any | null;
  user: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isBasicOnboardingComplete: boolean;
  isOnboardingComplete: boolean;
  sessionToken: string | null;
  login: (token: string, user: any) => Promise<void>;
  refreshChef: () => Promise<void>;
  logout: () => Promise<void>;
}

const ChefAuthContext = createContext<ChefAuthContextType | undefined>(undefined);

interface ChefAuthProviderProps {
  children: ReactNode;
}

export function ChefAuthProvider({ children }: ChefAuthProviderProps) {
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

  // Get chef profile if user has chef role
  // Only query if user exists, has chef role, and we have a valid session token
  // This prevents calling the query with invalid tokens which would cause errors
  const chefQueryResult = useQuery(
    api.queries.chefs.getByUserId,
    // Only call if we have a valid user with chef role and session token
    // This prevents errors from requireAuth when session token is invalid
    user && 
    user !== null && 
    user.roles?.includes('chef') && 
    user._id && 
    sessionToken
      ? { userId: user._id, sessionToken: sessionToken }
      : 'skip'
  );

  const chef = chefQueryResult;

  // Check if basic onboarding is complete (profile setup)
  const isBasicOnboardingComplete = useQuery(
    api.queries.chefs.isBasicOnboardingComplete,
    chef?._id && sessionToken
      ? { chefId: chef._id, sessionToken }
      : 'skip'
  ) ?? false;

  // Check if onboarding is complete (compliance course completed)
  const isOnboardingComplete = useQuery(
    api.queries.chefCourses.isOnboardingComplete,
    chef?._id && sessionToken
      ? { chefId: chef._id, sessionToken }
      : 'skip'
  ) ?? false;

  // Check if user is authenticated as a chef
  // User must exist, have a session token, and have the 'chef' role
  const isAuthenticated = !!user && !!sessionToken && user.roles?.includes('chef');

  // Handle the case where user query returns null (no user found)
  // This means the session token is invalid/expired - clear it immediately
  useEffect(() => {
    if (user === null && sessionToken) {
      console.warn('ChefAuthContext: User query returned null - session token is invalid or expired, clearing it');
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
        console.warn('ChefAuthContext: Query loading timeout - stopping loading to prevent infinite loading');
        setIsLoading(false);
      }, 10000); // 10 second timeout
      
      return () => clearTimeout(timeout);
    }
  }, [isQueryLoading, sessionToken]);

  // Debug logging
  useEffect(() => {
    if (sessionToken) {
      console.log('ChefAuthContext state:', {
        hasSessionToken: !!sessionToken,
        user: user ? { id: user._id, roles: user.roles, email: user.email } : (user === null ? 'null (no user found - token invalid)' : 'undefined (loading)'),
        chef: chef ? { id: chef._id, name: chef.name } : (chef === null ? 'null (no chef found)' : 'undefined (loading/skipped)'),
        isAuthenticated,
        isLoading,
        isQueryLoading,
      });
    }
  }, [sessionToken, user, chef, isAuthenticated, isLoading, isQueryLoading]);

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

  const refreshChef = useCallback(async () => {
    // Force refetch by updating session token state
    const token = await getSessionToken();
    setSessionToken(token);
  }, []);

  const logout = useCallback(async () => {
    // Clear session token
    await clearSessionToken();
    setSessionToken(null);
  }, []);

  const contextValue: ChefAuthContextType = {
    chef: chef || null,
    user: user || null,
    isLoading: isLoading || isQueryLoading,
    isAuthenticated: !!isAuthenticated,
    isBasicOnboardingComplete: isBasicOnboardingComplete === true,
    isOnboardingComplete: isOnboardingComplete === true,
    sessionToken,
    login,
    refreshChef,
    logout,
  };

  return (
    <ChefAuthContext.Provider value={contextValue}>
      {children}
    </ChefAuthContext.Provider>
  );
}

export function useChefAuth(): ChefAuthContextType {
  const context = useContext(ChefAuthContext);
  if (context === undefined) {
    throw new Error('useChefAuth must be used within a ChefAuthProvider');
  }
  return context;
}

