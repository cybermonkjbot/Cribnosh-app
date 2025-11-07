'use client';

import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
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

// Helper to decode JWT token (client-side, no verification needed for user_id extraction)
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
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

// Helper to check if token is a JWT (has 3 parts separated by dots)
function isJWT(token: string): boolean {
  return token.split('.').length === 3;
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
      setSessionToken(token);
      
      // If it's a JWT token, extract user_id
      if (isJWT(token)) {
        const decoded = decodeJWT(token);
        if (decoded?.user_id) {
          setUserId(decoded.user_id as Id<'users'>);
          console.log('[useSession] JWT decoded, user_id:', decoded.user_id);
        } else {
          console.warn('[useSession] JWT token found but no user_id in payload:', decoded);
        }
      } else {
        console.log('[useSession] Session token found (not JWT)');
      }
    } else {
      console.log('[useSession] No token found in cookies');
    }
    setHasCheckedToken(true);
  }, []);
  
  // Fetch user data - use userId if JWT, otherwise use sessionToken
  const userDataBySessionToken = useQuery(
    api.queries.users.getUserBySessionToken, 
    sessionToken && !userId ? { sessionToken } : 'skip'
  ) as User | null;
  
  const userDataById = useQuery(
    api.queries.users.getById,
    userId ? { userId } : 'skip'
  ) as User | null;
  
  // Use userDataById if we have userId (JWT), otherwise use userDataBySessionToken
  const userData = userId ? userDataById : userDataBySessionToken;
  
  // Check if session is expired
  const isExpired = userData?.sessionExpiry 
    ? userData.sessionExpiry < Date.now()
    : false;
  
  // Only show loading if we haven't checked for token yet, or if we have a token and are waiting for user data
  const isLoading = !hasCheckedToken || (sessionToken && !userData && !isExpired);
  
  return {
    user: isExpired ? null : userData,
    isLoading,
    isAuthenticated: !!userData && !isExpired,
    sessionToken,
  };
}
