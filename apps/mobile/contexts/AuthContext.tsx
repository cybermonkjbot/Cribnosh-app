import React, { createContext, ReactNode, useContext, useState } from 'react';
import { useAuthState } from '../hooks/useAuthState';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  token: string | null;
  error: string | null;
  isSessionExpired: boolean;
  login: (token: string, user: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuthState: () => Promise<void>;
  clearError: () => void;
  checkTokenExpiration: () => boolean;
  handleSessionExpired: () => void;
  clearSessionExpired: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const authState = useAuthState();
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  const handleSessionExpired = () => {
    console.log("Session expired - showing modal");
    setIsSessionExpired(true);
  };

  const clearSessionExpired = () => {
    setIsSessionExpired(false);
  };

  // Enhanced checkTokenExpiration that triggers session expired modal
  const checkTokenExpirationWithModal = () => {
    const wasExpired = authState.checkTokenExpiration();
    if (wasExpired) {
      handleSessionExpired();
    }
    return wasExpired;
  };

  const contextValue = {
    ...authState,
    isSessionExpired,
    checkTokenExpiration: checkTokenExpirationWithModal,
    handleSessionExpired,
    clearSessionExpired,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
