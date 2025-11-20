import React, { createContext, ReactNode, useContext, useEffect, useState, useCallback } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { getSessionToken, setSessionToken as storeSessionToken } from '@/lib/convexClient';

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
  const user = useQuery(
    api.queries.users.getUserBySessionToken,
    sessionToken ? { sessionToken } : 'skip'
  );

  // Get chef profile if user has chef role
  const chef = useQuery(
    api.queries.chefs.getByUserId,
    user && user.roles?.includes('chef') && user._id
      ? { userId: user._id, sessionToken: sessionToken || undefined }
      : 'skip'
  );

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

  // Determine if we're still loading:
  // - If sessionToken is null, we're done loading (no user to fetch)
  // - If sessionToken exists, we're loading until user query resolves (user !== undefined)
  const isQueryLoading = sessionToken !== null && user === undefined;

  // Debug logging
  useEffect(() => {
    if (sessionToken) {
      console.log('ChefAuthContext state:', {
        hasSessionToken: !!sessionToken,
        user: user ? { id: user._id, roles: user.roles, email: user.email } : null,
        chef: chef ? { id: chef._id, name: chef.name } : null,
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
    const { clearSessionToken } = await import('@/lib/convexClient');
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

