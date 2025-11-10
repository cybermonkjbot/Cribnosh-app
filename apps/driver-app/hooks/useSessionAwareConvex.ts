import { useAction, useMutation, useQuery } from 'convex/react';
import { useDriverAuth } from '../contexts/EnhancedDriverAuthContext';
import { sessionManager } from '../lib/convex';
import { useEffect, useState } from 'react';

/**
 * Session-aware useQuery hook for driver app
 * Automatically includes session token when needed
 */
export function useSessionAwareQuery<T>(
  queryFunction: any,
  args: any = {},
  options?: { skip?: boolean }
) {
  const { isAuthenticated } = useDriverAuth();
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  useEffect(() => {
    const loadSession = async () => {
      if (isAuthenticated) {
        const token = await sessionManager.getSessionToken();
        setSessionToken(token);
      }
    };
    loadSession();
  }, [isAuthenticated]);

  const shouldSkip = options?.skip || !isAuthenticated || !sessionToken;

  if (shouldSkip) {
    return useQuery(queryFunction, "skip");
  }

  const sessionAwareArgs = {
    ...args,
    sessionToken,
  };

  return useQuery(queryFunction, sessionAwareArgs);
}

/**
 * Session-aware useMutation hook for driver app
 * Automatically includes session token when needed
 */
export function useSessionAwareMutation<T>(
  mutationFunction: any
) {
  const { isAuthenticated } = useDriverAuth();
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const mutation = useMutation(mutationFunction);

  useEffect(() => {
    const loadSession = async () => {
      if (isAuthenticated) {
        const token = await sessionManager.getSessionToken();
        setSessionToken(token);
      }
    };
    loadSession();
  }, [isAuthenticated]);

  return (args: T) => {
    if (!isAuthenticated || !sessionToken) {
      throw new Error('Authentication required for this mutation');
    }
    
    const sessionAwareArgs = {
      ...(args as Record<string, any>),
      sessionToken,
    };
    
    return mutation(sessionAwareArgs);
  };
}

/**
 * Session-aware useAction hook for driver app
 * Automatically includes session token when needed
 */
export function useSessionAwareAction<T>(
  actionFunction: any
) {
  const { isAuthenticated } = useDriverAuth();
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const action = useAction(actionFunction);

  useEffect(() => {
    const loadSession = async () => {
      if (isAuthenticated) {
        const token = await sessionManager.getSessionToken();
        setSessionToken(token);
      }
    };
    loadSession();
  }, [isAuthenticated]);

  return (args: T) => {
    if (!isAuthenticated || !sessionToken) {
      throw new Error('Authentication required for this action');
    }
    
    const sessionAwareArgs = {
      ...(args as Record<string, any>),
      sessionToken,
    };
    
    return action(sessionAwareArgs);
  };
}

/**
 * Hook for queries that definitely need session tokens
 * Throws an error if no session token is available
 */
export function useAuthenticatedQuery<T>(
  queryFunction: any,
  args: any = {}
) {
  const { isAuthenticated } = useDriverAuth();
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  useEffect(() => {
    const loadSession = async () => {
      if (isAuthenticated) {
        const token = await sessionManager.getSessionToken();
        setSessionToken(token);
      }
    };
    loadSession();
  }, [isAuthenticated]);

  if (!isAuthenticated || !sessionToken) {
    throw new Error('Authentication required for this query');
  }

  const sessionAwareArgs = {
    ...args,
    sessionToken,
  };

  return useQuery(queryFunction, sessionAwareArgs);
}
