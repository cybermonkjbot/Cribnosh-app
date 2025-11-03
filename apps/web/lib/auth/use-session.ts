'use client';

import { useEffect, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

type User = {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
  sessionExpiry?: number;
  // Add other user fields as needed
};

export function useSession() {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  
  // Get session token from cookies on client side
  useEffect(() => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };
    
    const token = getCookie('convex-auth-token');
    if (token) {
      setSessionToken(token);
    }
  }, []);
  
  // Fetch user data using the session token
  const userData = useQuery(
    api.queries.users.getUserBySessionToken, 
    sessionToken ? { sessionToken } : 'skip'
  ) as User | null;
  
  // Check if session is expired
  const isExpired = userData?.sessionExpiry 
    ? userData.sessionExpiry < Date.now()
    : false;
  
  return {
    user: isExpired ? null : userData,
    isLoading: !sessionToken || (sessionToken && !userData && !isExpired),
    isAuthenticated: !!userData && !isExpired,
    sessionToken,
  };
}
