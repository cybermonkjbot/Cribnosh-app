"use client";
import { StaffUser, useStaffAuth } from '@/hooks/useStaffAuth';
import { getAuthToken } from '@/lib/auth-client';
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

  // Fetch session token from cookies using auth-client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = getAuthToken();
      setSessionToken(token);
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

