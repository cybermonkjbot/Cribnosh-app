'use client';

import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { logger } from '@/lib/utils/logger';
import { useQuery } from 'convex/react';
import { useEffect, useState } from 'react';

type User = {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  sessionExpiry?: number;
  // Add other user fields as needed
};

// Helper to check if token is a JWT (has 3 parts separated by dots)
// Used for backward compatibility during migration
function isJWT(token: string): boolean {
  return token.split('.').length === 3;
}

// Helper to decode JWT token (client-side, no verification needed for user_id extraction)
// @deprecated SessionToken doesn't need decoding - kept for backward compatibility
function decodeJWT(token: string): { user_id?: string; roles?: string[] } | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    logger.error('Failed to decode JWT:', error);
    return null;
  }
}

export function useSession() {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [hasCheckedToken, setHasCheckedToken] = useState(false);
  const [userId, setUserId] = useState<Id<'users'> | null>(null);

  // Get session token from cookies on client side
  useEffect(() => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) {
        const cookieValue = parts.pop()?.split(';').shift();
        // JWT tokens are URL-safe, no decoding needed
        return cookieValue || null;
      }
      return null;
    };

    const token = getCookie('convex-auth-token');
    if (token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSessionToken(token);

      // SessionToken doesn't need decoding - it's validated server-side
      // JWT fallback: If it's a JWT token (backward compatibility), extract user_id
      if (isJWT(token)) {
        const decoded = decodeJWT(token);
        if (decoded?.user_id) {
          setUserId(decoded.user_id as Id<'users'>);
          logger.log('[useSession] JWT token detected (legacy), user_id:', decoded.user_id);
        }
      } else {
        logger.log('[useSession] Session token found');
      }
    } else {
      logger.log('[useSession] No token found in cookies');
    }
    setHasCheckedToken(true);
  }, []);

  // Fetch user data - prefer sessionToken query (faster), fallback to userId if JWT
  const userDataBySessionToken = useQuery(
    api.queries.users.getUserBySessionToken,
    sessionToken && !userId ? { sessionToken } : 'skip'
  ) as User | null;

  const userDataById = useQuery(
    api.queries.users.getById,
    userId && !userDataBySessionToken ? { userId, sessionToken: sessionToken || undefined } : 'skip'
  ) as User | null;

  // Prefer sessionToken-based query, fallback to userId-based query (JWT legacy)
  const userData = userDataBySessionToken || userDataById;

  // Check if session is expired
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (userData?.sessionExpiry) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsExpired(userData.sessionExpiry < Date.now());
    }
  }, [userData?.sessionExpiry]);

  // Only show loading if we haven't checked for token yet, or if we have a token and are waiting for user data
  const isLoading = !hasCheckedToken || (sessionToken && !userData && !isExpired);

  return {
    user: isExpired ? null : userData,
    isLoading,
    isAuthenticated: !!userData && !isExpired,
    sessionToken,
  };
}
