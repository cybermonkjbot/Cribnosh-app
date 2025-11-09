"use client";

import { StaffUser, useStaffAuth } from '@/hooks/useStaffAuth';
import { ReactNode, createContext, useContext, useEffect, useState } from 'react';

interface StaffAuthContextValue {
  staff: StaffUser | null;
  loading: boolean;
  sessionToken: string | null;
}

const StaffAuthContext = createContext<StaffAuthContextValue | undefined>(undefined);

export function StaffAuthProvider({ children }: { children: ReactNode }) {
  const { staff, loading } = useStaffAuth();
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Fetch session token securely from API (handles httpOnly cookies)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Try to read from cookie first (if not httpOnly)
      const match = document.cookie.match(/(^| )convex-auth-token=([^;]+)/);
      if (match && match[2]) {
        setSessionToken(match[2]);
      } else {
        // Fallback to API endpoint for httpOnly cookies
        fetch('/api/auth/token', { credentials: 'include' })
          .then(r => r.json())
          .then(d => setSessionToken(d.data?.sessionToken ?? d.sessionToken ?? null))
          .catch(() => setSessionToken(null));
      }
    }
  }, []);

  return (
    <StaffAuthContext.Provider value={{ staff, loading, sessionToken }}>
      {children}
    </StaffAuthContext.Provider>
  );
}

export function useStaffAuthContext() {
  const context = useContext(StaffAuthContext);
  if (context === undefined) {
    throw new Error('useStaffAuthContext must be used within a StaffAuthProvider');
  }
  return context;
}

