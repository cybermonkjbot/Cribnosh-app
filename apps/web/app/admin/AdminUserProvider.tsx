"use client";
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { Id } from "@/convex/_generated/dataModel";

export interface AdminUser {
  _id: Id<"users">;
  name: string;
  email: string;
  role: string;
  status?: string;
  avatar?: string;
  preferences?: {
    cuisine?: string[];
    dietary?: string[];
  };
}

const AdminUserContext = createContext<{ user: AdminUser | null, loading: boolean, sessionToken: string | null, refreshUser: () => Promise<void> }>({ user: null, loading: true, sessionToken: null, refreshUser: async () => {} });

export function useAdminUser() {
  return useContext(AdminUserContext);
}

export function AdminUserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [hasCheckedStorage, setHasCheckedStorage] = useState(false);

  // Authentication is session-based: the session token (convex-auth-token) is httpOnly
  // so we cannot read it from JavaScript. Instead, we rely on the API call to /api/admin/me
  // which will have access to the cookie server-side. The sessionToken will be determined
  // from the API response or passed as needed for Convex queries.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check for debug cookie in development (non-httpOnly)
      // In production, we rely on the API call to determine auth status
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return null;
      };
      
      // Try to get debug cookie in development, or check if we have a user
      const debugToken = process.env.NODE_ENV !== 'production' 
        ? getCookie('convex-auth-token-debug')
        : null;
      
      // If we have a debug token, use it; otherwise, we'll rely on the API call
      // The sessionToken will be passed to Convex queries, but since the cookie is httpOnly,
      // it will be sent automatically with requests
      setSessionToken(debugToken || null);
      console.log('[AdminUserProvider] Session token found (debug):', !!debugToken);
      setHasCheckedStorage(true);
    }
  }, []);

  // Listen for cookie changes (refresh when cookie is set) - only in development
  // In production, httpOnly cookies cannot be read from JavaScript
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
      const checkCookie = () => {
        const getCookie = (name: string) => {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop()?.split(';').shift();
          return null;
        };
        
        // Only check debug cookie in development
        const debugToken = getCookie('convex-auth-token-debug');
        setSessionToken(debugToken || null);
        if (debugToken && !user) {
          console.log('[AdminUserProvider] Debug cookie detected, refreshing user data');
          setHasCheckedStorage(true);
        }
      };

      // Check for cookie changes every 500ms for the first 10 seconds after mount
      const interval = setInterval(checkCookie, 500);
      const timeout = setTimeout(() => clearInterval(interval), 10000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [user]);

  // Force refresh when window gains focus (user might have logged in in another tab)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleFocus = () => {
        console.log('[AdminUserProvider] Window focused, checking for auth changes');
        setHasCheckedStorage(true);
      };

      window.addEventListener('focus', handleFocus);
      return () => window.removeEventListener('focus', handleFocus);
    }
  }, []);

  // Fetch user data when we've checked for session token
  useEffect(() => {
    console.log('[AdminUserProvider] hasCheckedStorage:', hasCheckedStorage);
    
    // Don't do anything until we've checked for session token
    if (!hasCheckedStorage) {
      return;
    }

    // Fetch user data from API (server validates session token and returns user data)
    async function fetchUser() {
      try {
        console.log('[AdminUserProvider] Fetching user data from /api/admin/me');
        const response = await fetch('/api/admin/me', {
          method: 'GET',
          credentials: 'include', // Include cookies (session token)
        });

        console.log('[AdminUserProvider] Response status:', response.status);
        
        if (!response.ok) {
          console.log('[AdminUserProvider] Response not ok, setting user to null');
          setUser(null);
          setLoading(false);
          return;
        }

        const data = await response.json();
        console.log('[AdminUserProvider] Response data:', data);

        if (data.data && data.data.user) {
          // Transform API user to AdminUser format
          const adminUser: AdminUser = {
            _id: data.data.user._id,
            name: data.data.user.name,
            email: data.data.user.email,
            role: data.data.user.role || 'admin',
            status: data.data.user.status,
            avatar: data.data.user.avatar,
            preferences: data.data.user.preferences,
          };

          console.log('[AdminUserProvider] Setting admin user:', adminUser);
          setUser(adminUser);
        } else {
          console.log('[AdminUserProvider] No user in response, setting user to null');
          console.log('[AdminUserProvider] Full response data:', data);
          setUser(null);
        }
      } catch (error) {
        console.error('[AdminUserProvider] Error fetching user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [hasCheckedStorage]);

  // Add a manual refresh function that can be called externally
  const refreshUser = useCallback(async () => {
    console.log('[AdminUserProvider] Manual refresh triggered');
    setLoading(true);
    setHasCheckedStorage(true);
  }, []);

  // Expose refresh function via context
  const contextValue = useMemo(() => ({
    user,
    loading,
    sessionToken,
    refreshUser
  }), [user, loading, sessionToken, refreshUser]);

  return (
    <AdminUserContext.Provider value={contextValue}>
      {children}
    </AdminUserContext.Provider>
  );
} 