import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { sessionManager } from '../lib/convex';
import {
  useGetCurrentUserQuery,
  useGetDriverProfileQuery,
  usePhoneLoginMutation,
  useSendDriverOTPMutation,
  useLogoutMutation,
} from '../store/driverApi';
import type { Driver } from '../types/driver';
import { logger } from '../utils/Logger';

interface EnhancedDriverAuthContextType {
  driver: Driver | null;
  user: any | null; // User from Cribnosh schema
  isLoading: boolean;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  sessionToken: string | null;
  isRateLimited: boolean;
  rateLimitRemainingTime: number;
  
  // Phone-based authentication methods
  sendDriverOTP: (phoneNumber: string, purpose: 'DRIVER_SIGNUP' | 'DRIVER_SIGNIN' | 'DRIVER_PHONE_VERIFICATION') => Promise<{ success: boolean; message?: string; sessionId?: string }>;
  verifyDriverOTP: (phoneNumber: string, otpCode: string, purpose: 'DRIVER_SIGNUP' | 'DRIVER_SIGNIN' | 'DRIVER_PHONE_VERIFICATION') => Promise<{ success: boolean; message?: string; driver?: Driver; sessionId?: string }>;
  registerDriver: (driverData: DriverRegisterData) => Promise<{ success: boolean; message?: string; driver?: Driver }>;
  authenticateDriver: (phoneNumber: string) => Promise<{ success: boolean; message?: string; driver?: Driver }>;
  setSessionToken: (token: string) => Promise<void>;
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
}

const EnhancedDriverAuthContext = createContext<EnhancedDriverAuthContextType | undefined>(undefined);

interface EnhancedDriverAuthProviderProps {
  children: ReactNode;
}

export function EnhancedDriverAuthProvider({ children }: EnhancedDriverAuthProviderProps) {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState<number[]>([]);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitRemainingTime, setRateLimitRemainingTime] = useState(0);

  // Rate limiting logic
  const checkRateLimit = () => {
    const now = Date.now();
    const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
    const MAX_ATTEMPTS = 5;
    
    // Clean old attempts
    const recentAttempts = loginAttempts.filter(attempt => now - attempt < RATE_LIMIT_WINDOW);
    setLoginAttempts(recentAttempts);
    
    if (recentAttempts.length >= MAX_ATTEMPTS) {
      const oldestAttempt = Math.min(...recentAttempts);
      const remainingTime = RATE_LIMIT_WINDOW - (now - oldestAttempt);
      setIsRateLimited(true);
      setRateLimitRemainingTime(Math.ceil(remainingTime / 1000));
      return false;
    }
    
    setIsRateLimited(false);
    setRateLimitRemainingTime(0);
    return true;
  };

  const recordLoginAttempt = () => {
    const now = Date.now();
    setLoginAttempts(prev => [...prev, now]);
  };

  // Update rate limit timer
  useEffect(() => {
    if (isRateLimited && rateLimitRemainingTime > 0) {
      const timer = setTimeout(() => {
        setRateLimitRemainingTime(prev => {
          if (prev <= 1) {
            setIsRateLimited(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isRateLimited, rateLimitRemainingTime]);

  // RTK Query mutations for auth
  const [sendDriverOTPAPI] = useSendDriverOTPMutation();
  const [phoneLoginAPI] = usePhoneLoginMutation();
  const [logoutMutation] = useLogoutMutation();
  
  // Get current user using RTK Query API endpoint
  const { data: currentUserData, isLoading: isLoadingUser, error: userError } = useGetCurrentUserQuery(
    undefined,
    { skip: !sessionToken }
  );
  
  // Extract user from API response
  const currentUser = currentUserData?.data?.user || currentUserData?.data || null;
  
  // Check if user has DRIVER role (using roles array)
  const hasDriverRole = currentUser && (
    (currentUser.roles && currentUser.roles.includes('driver')) ||
    (currentUser.roles && currentUser.roles.includes('DRIVER'))
  );
  
  // Get driver profile using RTK Query API endpoint
  const { data: driverProfileData, isLoading: isLoadingDriverProfile, error: driverError } = useGetDriverProfileQuery(
    undefined,
    { skip: !hasDriverRole || !sessionToken }
  );
  
  // Extract driver from API response
  const driverProfile = driverProfileData?.data?.driver || null;

  // Load session token on app start
  useEffect(() => {
    const loadSessionToken = async () => {
      try {
        const storedToken = await sessionManager.getSessionToken();
        if (storedToken) {
          setSessionToken(storedToken);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        logger.error('Error loading session token:', error);
        await sessionManager.clearSession();
        setIsLoading(false);
      }
    };
    
    loadSessionToken();
  }, []);

  // Update user when currentUserData changes
  useEffect(() => {
    if (!sessionToken) {
      // No session token, clear everything
      setUser(null);
      setDriver(null);
      setIsLoading(false);
      return;
    }

    // If query has finished (not loading) and we have an error or no user
    if (!isLoadingUser) {
      if (userError || !currentUser) {
        // Invalid session or no user found
        if (sessionToken) {
          logger.info('Session validation failed - no user found or error, clearing session');
          setSessionToken(null);
          sessionManager.clearSession();
        }
        setUser(null);
        setDriver(null);
        setIsLoading(false);
        return;
      }

      // Check if user has DRIVER role using roles array
      const hasDriverRole = currentUser && (
        (currentUser.roles && currentUser.roles.includes('driver')) ||
        (currentUser.roles && currentUser.roles.includes('DRIVER'))
      );

      logger.info('Current user check:', {
        hasUser: !!currentUser,
        hasDriverRole,
        roles: currentUser?.roles,
      });

      if (hasDriverRole) {
        logger.info('User has DRIVER role, setting user');
        setUser(currentUser);
        // Driver profile will be loaded via useGetDriverProfileQuery
      } else {
        // User exists but doesn't have DRIVER role - clear session
        logger.info('Session validation failed - user does not have DRIVER role, clearing session');
        logger.info('User roles:', currentUser.roles);
        setSessionToken(null);
        sessionManager.clearSession();
        setUser(null);
        setDriver(null);
        setIsLoading(false);
      }
    }
  }, [currentUser, isLoadingUser, userError, sessionToken]);

  // Update driver when driverProfileData changes
  useEffect(() => {
    if (!hasDriverRole || !sessionToken) {
      // No driver role or no session, clear driver
      setDriver(null);
      if (!hasDriverRole) {
        setIsLoading(false);
      }
      return;
    }

    // If query has finished (not loading)
    if (!isLoadingDriverProfile) {
      if (driverError || !driverProfile) {
        // Driver profile not found or error
        logger.warn('Driver profile not found for user or error occurred');
        setDriver(null);
        setIsLoading(false); // Even if driver not found, we're done loading
        return;
      }

      if (driverProfile) {
        logger.info('Driver profile loaded:', driverProfile._id);
        setDriver(driverProfile as unknown as Driver);
        setIsLoading(false); // Now we have both user and driver, auth is complete
      }
    }
  }, [driverProfile, isLoadingDriverProfile, driverError, hasDriverRole, sessionToken]);

  // Phone-based authentication methods with enhanced validation
  const sendDriverOTP = async (phoneNumber: string, purpose: 'DRIVER_SIGNUP' | 'DRIVER_SIGNIN' | 'DRIVER_PHONE_VERIFICATION') => {
    try {
      // Validate phone number format
      if (!phoneNumber || phoneNumber.length < 10) {
        return { success: false, message: 'Please enter a valid phone number' };
      }

      const result = await sendDriverOTPAPI({ phoneNumber }).unwrap();
      return {
        success: result.success,
        message: result.message,
        sessionId: result.data?.sessionId || undefined,
      };
    } catch (error: any) {
      logger.error('Send driver OTP error', error);
      return { 
        success: false, 
        message: error?.data?.message || 'Failed to send OTP. Please try again.' 
      };
    }
  };

  const verifyDriverOTP = async (phoneNumber: string, otpCode: string, purpose: 'DRIVER_SIGNUP' | 'DRIVER_SIGNIN' | 'DRIVER_PHONE_VERIFICATION'): Promise<{ success: boolean; message?: string; driver?: Driver; sessionId?: string }> => {
    try {
      const result = await phoneLoginAPI({ phoneNumber, otp: otpCode }).unwrap();
      if (result.success && result.data?.sessionToken) {
        // Store session token for persistent authentication
        await sessionManager.setSessionToken(result.data.sessionToken);
        setSessionToken(result.data.sessionToken);
        
        // Driver and user will be loaded via queries after session token is set
        return {
          success: true,
          message: result.message,
          driver: result.data?.driver as unknown as Driver | undefined,
          sessionId: (result.data as any)?.sessionId || undefined,
        };
      } else {
        return { success: false, message: result.message || 'Failed to verify OTP' };
      }
    } catch (error: any) {
      logger.error('Verify driver OTP error', error);
      return { 
        success: false, 
        message: error?.data?.message || 'Failed to verify OTP. Please try again.' 
      };
    }
  };

  const registerDriver = async (driverData: DriverRegisterData) => {
    try {
      // Validate input data
      const validationResult = validateDriverRegistrationData(driverData);
      if (!validationResult.isValid) {
        return { success: false, message: validationResult.error };
      }

      // TODO: Implement driver registration using API or Convex mutation
      // For now, return error as registration endpoint may not exist
      logger.warn('Driver registration not yet implemented');
      return { 
        success: false, 
        message: 'Driver registration is not yet available. Please contact support.' 
      };
    } catch (error: any) {
      logger.error('Driver registration error', error);
      return { success: false, message: 'Failed to register driver. Please try again.' };
    }
  };

  // Validate driver registration data
  const validateDriverRegistrationData = (data: DriverRegisterData) => {
    if (!data.firstName?.trim()) {
      return { isValid: false, error: 'First name is required' };
    }
    if (!data.lastName?.trim()) {
      return { isValid: false, error: 'Last name is required' };
    }
    if (!data.phoneNumber?.trim()) {
      return { isValid: false, error: 'Phone number is required' };
    }
    if (!data.email?.trim()) {
      return { isValid: false, error: 'Email is required' };
    }
    if (!data.vehicleType?.trim()) {
      return { isValid: false, error: 'Vehicle type is required' };
    }
    if (!data.vehicleModel?.trim()) {
      return { isValid: false, error: 'Vehicle model is required' };
    }
    if (!data.vehicleYear?.trim()) {
      return { isValid: false, error: 'Vehicle year is required' };
    }
    if (!data.licensePlate?.trim()) {
      return { isValid: false, error: 'License plate is required' };
    }
    if (!data.driversLicense?.trim()) {
      return { isValid: false, error: 'Driver\'s license is required' };
    }
    if (!data.vehicleRegistration?.trim()) {
      return { isValid: false, error: 'Vehicle registration is required' };
    }
    if (!data.insurance?.trim()) {
      return { isValid: false, error: 'Insurance certificate is required' };
    }
    if (!data.bankName?.trim()) {
      return { isValid: false, error: 'Bank name is required' };
    }
    if (!data.accountNumber?.trim()) {
      return { isValid: false, error: 'Account number is required' };
    }
    if (!data.accountName?.trim()) {
      return { isValid: false, error: 'Account name is required' };
    }

    return { isValid: true };
  };

  const authenticateDriver = async (phoneNumber: string): Promise<{ success: boolean; message?: string; driver?: Driver }> => {
    try {
      // Use phone login API
      const result = await phoneLoginAPI({ phoneNumber }).unwrap();
      if (result.success && result.data?.sessionToken) {
        await sessionManager.setSessionToken(result.data.sessionToken);
        setSessionToken(result.data.sessionToken);
        
        // Driver and user will be loaded via queries after session token is set
        return {
          success: true,
          message: result.message,
          driver: result.data?.driver as unknown as Driver | undefined,
        };
      } else {
        return { success: false, message: result.message || 'Failed to authenticate' };
      }
    } catch (error: any) {
      logger.error('Driver authentication error', error);
      return { 
        success: false, 
        message: error?.data?.message || 'Failed to authenticate driver. Please try again.' 
      };
    }
  };

  const setSessionTokenAndReload = async (token: string) => {
    try {
      await sessionManager.setSessionToken(token);
      setSessionToken(token);
      // This will trigger the useGetCurrentUserQuery and useGetDriverProfileQuery to run
      // RTK Query will automatically refetch when skip condition changes
    } catch (error) {
      logger.error('Error setting session token:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      logger.info('Logging out driver');
      
      // Call logout API endpoint if session token exists
      if (sessionToken) {
        try {
          await logoutMutation().unwrap();
        } catch (error: any) {
          // Log error but continue with local logout even if API call fails
          logger.error('Logout API error (continuing with local logout):', error);
        }
      }
    } catch (error: any) {
      logger.error('Logout error', error);
    } finally {
      // Clear local state and session token
      setDriver(null);
      setUser(null);
      setSessionToken(null);
      await sessionManager.clearSession();
    }
  };

  // Update isLoading based on query states
  useEffect(() => {
    if (!sessionToken) {
      setIsLoading(false);
      return;
    }

    // If we're loading user or driver profile, set loading to true
    if (isLoadingUser || (hasDriverRole && isLoadingDriverProfile)) {
      setIsLoading(true);
    } else {
      // Both queries have finished, set loading to false
      setIsLoading(false);
    }
  }, [sessionToken, isLoadingUser, isLoadingDriverProfile, hasDriverRole]);

  // User is authenticated if they have DRIVER role (even if driver profile doesn't exist yet)
  // This allows users who signed up via email to complete driver registration
  const isAuthenticated = !!user && (
    (user.roles && user.roles.includes('driver')) ||
    (user.roles && user.roles.includes('DRIVER'))
  );

  const value: EnhancedDriverAuthContextType = {
    driver,
    user,
    isLoading,
    isAuthenticated,
    isAuthenticating,
    sessionToken,
    isRateLimited,
    rateLimitRemainingTime,
    sendDriverOTP,
    verifyDriverOTP,
    registerDriver,
    authenticateDriver,
    setSessionToken: setSessionTokenAndReload,
    logout,
  };

  return (
    <EnhancedDriverAuthContext.Provider value={value}>
      {children}
    </EnhancedDriverAuthContext.Provider>
  );
}

export function useDriverAuth() {
  const context = useContext(EnhancedDriverAuthContext);
  if (context === undefined) {
    throw new Error('useDriverAuth must be used within an EnhancedDriverAuthProvider');
  }
  return context;
}