"use client";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { getAuthToken } from "@/lib/auth-client";
import { useQuery } from "convex/react";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

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

const AdminUserContext = createContext<{ user: AdminUser | null, loading: boolean, sessionToken: string | null, refreshUser: () => Promise<void> }>({ user: null, loading: true, sessionToken: null, refreshUser: async () => { } });

export function useAdminUser() {
  return useContext(AdminUserContext);
}

export function AdminUserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [hasCheckedStorage, setHasCheckedStorage] = useState(false);

  // Authentication is session-based: the session token (convex-auth-token) is readable
  // in production so we can read it from JavaScript for Convex queries.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = getAuthToken();
      setSessionToken(token);
      console.log('[AdminUserProvider] Session token found:', !!token);
      setHasCheckedStorage(true);
    }
  }, []);


  // Listen for cookie changes (refresh when cookie is set)
  // Works in both dev and production since cookie is now readable
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkCookie = () => {
        const getCookie = (name: string) => {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop()?.split(';').shift();
          return null;
        };

        // Check for session token cookie (works in both dev and production)
        const token = getCookie('convex-auth-token') ||
          (process.env.NODE_ENV !== 'production' ? getCookie('convex-auth-token-debug') : null);
        setSessionToken(token || null);
        if (token && !user) {
          console.log('[AdminUserProvider] Cookie detected, refreshing user data');
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

  // Fetch user data via direct Convex query
  const userDataResult = useQuery(
    api.queries.users.getUserBySessionToken,
    sessionToken && hasCheckedStorage ? { sessionToken } : 'skip'
  );

  useEffect(() => {
    if (!hasCheckedStorage) return;

    if (userDataResult !== undefined) {
      if (userDataResult) {
        // Transform user to AdminUser format
        const adminUser: AdminUser = {
          _id: userDataResult._id,
          name: userDataResult.name,
          email: userDataResult.email,
          role: userDataResult.roles?.includes('admin') ? 'admin' : userDataResult.roles?.[0] || 'admin',
          status: userDataResult.status,
          avatar: userDataResult.avatar,
          preferences: userDataResult.preferences,
        };
        setUser(adminUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    }
  }, [userDataResult, hasCheckedStorage]);

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