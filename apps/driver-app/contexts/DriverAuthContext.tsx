/**
 * @deprecated This DriverAuthContext is deprecated. Use EnhancedDriverAuthContext instead.
 * This file is kept for backward compatibility but should not be used in new code.
 * EnhancedDriverAuthContext provides better validation, error handling, and security features.
 * 
 * IMPORTANT: This context uses old Convex queries that may not exist in Cribnosh.
 * Please migrate to EnhancedDriverAuthContext which uses RTK Query and web API endpoints.
 */

import { api } from '../lib/convexApi';
import type { Id } from '../../packages/convex/_generated/dataModel';
import type { Driver } from '../types/driver';
import { logger } from '../utils/Logger';
import { useMutation, useQuery } from 'convex/react';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { sessionManager } from '../lib/convex';

// Type definitions for backward compatibility
interface DriverUser {
  _id: Id<"users">;
  email: string;
  name?: string;
  phone?: string;
  roles: string[];
}

const errorHandler = (error: Error, context?: string) => {
  logger.error(`Error in ${context || 'unknown context'}: ${error.message}`, error);
};

interface DriverAuthContextType {
  driver: Driver | null;
  user: DriverUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  // Phone-based authentication methods
  sendDriverOTP: (phoneNumber: string, purpose: 'DRIVER_SIGNUP' | 'DRIVER_SIGNIN' | 'DRIVER_PHONE_VERIFICATION') => Promise<{ success: boolean; message?: string; sessionId?: Id<"otpSessions"> }>;
  verifyDriverOTP: (phoneNumber: string, otpCode: string, purpose: 'DRIVER_SIGNUP' | 'DRIVER_SIGNIN' | 'DRIVER_PHONE_VERIFICATION') => Promise<{ success: boolean; message?: string; driver?: Driver; sessionId?: Id<"otpSessions"> }>;
  registerDriver: (driverData: DriverRegisterData) => Promise<{ success: boolean; message?: string; driver?: Driver }>;
  authenticateDriver: (phoneNumber: string) => Promise<{ success: boolean; message?: string; driver?: Driver }>;
  logout: () => void;
}

interface DriverRegisterData {
  phoneNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  vehicleType: string;
  vehicleModel: string;
  vehicleYear: string;
  licensePlate: string;
  driversLicense: string;
  vehicleRegistration: string;
  insurance: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  supplierId?: Id<"suppliers">; // Made optional as suppliers may not exist in Cribnosh
}

const DriverAuthContext = createContext<DriverAuthContextType | undefined>(undefined);

interface DriverAuthProviderProps {
  children: ReactNode;
}

export function DriverAuthProvider({ children }: DriverAuthProviderProps) {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [user, setUser] = useState<DriverUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // TODO: Replace with Cribnosh Convex queries/mutations
  // These queries may not exist in Cribnosh - using placeholder queries
  // Check if driver is authenticated using session token
  // const currentUser = useQuery(api.queries.users.getUserBySessionToken, sessionToken ? { sessionToken } : "skip");
  const currentUser = null; // Placeholder - replace with actual query
  
  // Queries - TODO: Replace with Cribnosh queries
  // const getDriverByUserId = useQuery(api.queries.delivery.getDrivers, ...);
  const getDriverByUserId = null; // Placeholder - replace with actual query
  
  // Mutations - TODO: Replace with Cribnosh mutations or RTK Query hooks
  // Note: These mutations may not exist in Cribnosh
  // Use EnhancedDriverAuthContext which uses RTK Query hooks instead
  const sendDriverOTPMutation = null; // Placeholder
  const verifyDriverOTPMutation = null; // Placeholder
  const registerDriverMutation = null; // Placeholder
  const authenticateDriverMutation = null; // Placeholder
  const logoutMutation = null; // Placeholder

  // Load session token on app start
  useEffect(() => {
    const loadSessionToken = async () => {
      try {
        // Try to get session token from secure storage
        const storedToken = await sessionManager.getSessionToken();
        if (storedToken) {
          setSessionToken(storedToken);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        logger.error('Error loading session token:', error);
        // Clear any corrupted session data
        await sessionManager.clearSession();
        setIsLoading(false);
      }
    };
    
    loadSessionToken();
  }, []);

  useEffect(() => {
    // TODO: Replace with actual Cribnosh user query
    // if (currentUser !== undefined) {
    //   if (currentUser && (currentUser.roles.includes('driver') || currentUser.roles.includes('DRIVER'))) {
    //     setUser(currentUser);
    //     fetchDriverProfile(currentUser._id);
    //   } else {
    //     setUser(null);
    //     setDriver(null);
    //   }
    //   setIsLoading(false);
    // }
    setIsLoading(false); // Placeholder
  }, [currentUser]);

  // Fetch driver profile
  const fetchDriverProfile = async (userId: Id<"users">) => {
    try {
      // TODO: Replace with Cribnosh query
      // const driverProfile = await getDriverByUserId({ userId });
      // if (driverProfile) {
      //   setDriver(driverProfile);
      // }
      logger.warn('fetchDriverProfile not implemented - use EnhancedDriverAuthContext');
    } catch (error) {
      errorHandler(error as Error, 'Error fetching driver profile');
    }
  };

  // Phone-based authentication methods
  // TODO: These methods are not implemented - use EnhancedDriverAuthContext instead
  const sendDriverOTP = async (phoneNumber: string, purpose: 'DRIVER_SIGNUP' | 'DRIVER_SIGNIN' | 'DRIVER_PHONE_VERIFICATION') => {
    logger.warn('sendDriverOTP not implemented in deprecated DriverAuthContext - use EnhancedDriverAuthContext');
    return { success: false, message: 'This method is deprecated. Please use EnhancedDriverAuthContext.' };
  };

  const verifyDriverOTP = async (phoneNumber: string, otpCode: string, purpose: 'DRIVER_SIGNUP' | 'DRIVER_SIGNIN' | 'DRIVER_PHONE_VERIFICATION') => {
    logger.warn('verifyDriverOTP not implemented in deprecated DriverAuthContext - use EnhancedDriverAuthContext');
    return { success: false, message: 'This method is deprecated. Please use EnhancedDriverAuthContext.' };
  };

  const registerDriver = async (driverData: DriverRegisterData) => {
    logger.warn('registerDriver not implemented in deprecated DriverAuthContext - use EnhancedDriverAuthContext');
    return { success: false, message: 'This method is deprecated. Please use EnhancedDriverAuthContext.' };
  };

  const authenticateDriver = async (phoneNumber: string) => {
    logger.warn('authenticateDriver not implemented in deprecated DriverAuthContext - use EnhancedDriverAuthContext');
    return { success: false, message: 'This method is deprecated. Please use EnhancedDriverAuthContext.' };
  };

  const logout = async () => {
    try {
      // Clear local state and session token
      setDriver(null);
      setUser(null);
      setSessionToken(null);
      await sessionManager.clearSession();
      logger.warn('logout called on deprecated DriverAuthContext - use EnhancedDriverAuthContext');
    } catch (error) {
      errorHandler(error as Error, 'Logout error');
    }
  };

  const value: DriverAuthContextType = {
    driver,
    user,
    isLoading,
    isAuthenticated: !!driver && !!user,
    sendDriverOTP,
    verifyDriverOTP,
    registerDriver,
    authenticateDriver,
    logout,
  };

  return (
    <DriverAuthContext.Provider value={value}>
      {children}
    </DriverAuthContext.Provider>
  );
}

export function useDriverAuth() {
  const context = useContext(DriverAuthContext);
  if (context === undefined) {
    throw new Error('useDriverAuth must be used within a DriverAuthProvider');
  }
  return context;
}
