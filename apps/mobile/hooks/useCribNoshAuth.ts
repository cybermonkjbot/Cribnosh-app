import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "../lib/ToastContext";

type Provider = "google" | "apple" | "email" | "phone";
type Role = "customer" | "admin" | "chef";
export interface ErrorResponse {
  description: string;
  content: Record<string, any>;
}

// Types based on your API documentation
export interface CribNoshUser {
  user_id: string;
  email: string;
  name: string;
  roles: string[];
  picture: string;
  isNewUser: boolean;
  provider: Provider;
}


export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: CribNoshUser;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: Role;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface OAuthData {
  identityToken?: string;
  authorizationCode?: string;
  user?: {
    sub: string;
    email: string;
    name: string;
  };
}
export interface OauthResponse {
  success: boolean;
  message: string;
  token: string;
  user: CribNoshUser;
}

export interface OTPData {
  email: string;
  action: "send" | "verify";
  otp?: string;
}

export interface PhoneOTPData {
  phone: string;
  action: "send" | "verify";
  otp?: string;
}

// API Configuration
import { API_CONFIG } from '@/constants/api';

export const API_BASE_URL = API_CONFIG.baseUrlNoTrailing;

class CribNoshAuthAPI {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.loadToken();
  }

  private loadToken() {
    // Load token from secure storage
    // For now, using a simple approach - replace with AsyncStorage or Expo SecureStore
    if (typeof localStorage !== "undefined") {
      this.token = localStorage.getItem("cribnosh_token");
    }
  }

  private saveToken(token: string) {
    this.token = token;
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("cribnosh_token", token);
    }
  }

  private clearToken() {
    this.token = null;
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("cribnosh_token");
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    // Add authentication header if token exists
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    return response.json();
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const { password, ...registerData } = data;

    // Validate passwords match
    if (data.password !== password) {
      throw new Error("Passwords do not match");
    }

    // Validate password strength
    if (data.password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    const response = await this.request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(registerData),
    });

    if (response.success && response.token) {
      this.saveToken(response.token);
    }

    return response;
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (response.success && response.token) {
      this.saveToken(response.token);
    }

    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.request("/auth/logout", {
        method: "POST",
      });
    } finally {
      this.clearToken();
    }
  }

  async oauth(data: OAuthData): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>("/auth/oauth", {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (response.success && response.token) {
      this.saveToken(response.token);
    }

    return response;
  }

  async sendOTP(data: OTPData): Promise<{ success: boolean; message: string }> {
    return this.request("/auth/otp", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async verifyOTP(data: OTPData): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>("/auth/otp", {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (response.success && response.token) {
      this.saveToken(response.token);
    }

    return response;
  }

  async sendPhoneOTP(
    data: PhoneOTPData
  ): Promise<{ success: boolean; message: string }> {
    return this.request("/auth/phone-otp", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async verifyPhoneOTP(data: PhoneOTPData): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>("/auth/phone-otp", {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (response.success && response.token) {
      this.saveToken(response.token);
    }

    return response;
  }

  async getCurrentUser(): Promise<CribNoshUser | null> {
    if (!this.token) return null;

    try {
      const response = await this.request<{
        success: boolean;
        user: CribNoshUser;
      }>("/auth/me");
      return response.success ? response.user : null;
    } catch {
      // Token might be invalid, clear it
      this.clearToken();
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }
}

// Create API instance
const authAPI = new CribNoshAuthAPI(API_BASE_URL);

export const useCribNoshAuth = () => {
  const [authState, setAuthState] = useState({
    user: null as CribNoshUser | null,
    isLoading: true,
    isAuthenticated: false,
    error: null as string | null,
  });

  const { showToast } = useToast();

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      const user = await authAPI.getCurrentUser();

      setAuthState({
        user,
        isLoading: false,
        isAuthenticated: !!user,
        error: null,
      });
    } catch (error) {
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error:
          error instanceof Error ? error.message : "Failed to initialize auth",
      });
    }
  };

  const register = useCallback(
    async (data: RegisterData) => {
      try {
        setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

        const response = await authAPI.register(data);

        setAuthState({
          user: response.user,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });

        showToast({
          type: "success",
          title: "Welcome to CribNosh!",
          message: response.message || "Registration successful!",
          duration: 3000,
        });

        // Navigate to onboarding or main app
        router.replace("/(tabs)");

        return response.user;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Registration failed";

        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));

        showToast({
          type: "error",
          title: "Registration Failed",
          message: errorMessage,
          duration: 4000,
        });

        throw error;
      }
    },
    [showToast]
  );

  const login = useCallback(
    async (data: LoginData) => {
      try {
        setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

        const response = await authAPI.login(data);

        setAuthState({
          user: response.user,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });

        showToast({
          type: "success",
          title: "Welcome Back!",
          message: response.message || "Login successful!",
          duration: 2000,
        });

        // Navigate to main app
        router.replace("/(tabs)");

        return response.user;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Login failed";

        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));

        showToast({
          type: "error",
          title: "Login Failed",
          message: errorMessage,
          duration: 4000,
        });

        throw error;
      }
    },
    [showToast]
  );

  const oauth = useCallback(
    async (data: OAuthData) => {
      try {
        setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

        const response = await authAPI.oauth(data);

        setAuthState({
          user: response.user,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });

        showToast({
          type: "success",
          title: "Welcome to CribNosh!",
          message: response.message || "OAuth authentication successful!",
          duration: 3000,
        });

        // Navigate to onboarding or main app
        router.replace("/(tabs)");

        return response.user;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "OAuth authentication failed";

        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));

        showToast({
          type: "error",
          title: "Authentication Failed",
          message: errorMessage,
          duration: 4000,
        });

        throw error;
      }
    },
    [showToast]
  );

  const logout = useCallback(async () => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      await authAPI.logout();

      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      });

      showToast({
        type: "info",
        title: "Logged Out",
        message: "You have been logged out successfully",
        duration: 2000,
      });

      // Navigate to sign-in screen
      router.replace("/");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Logout failed";

      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      showToast({
        type: "error",
        title: "Logout Failed",
        message: errorMessage,
        duration: 4000,
      });
    }
  }, [showToast]);

  const sendOTP = useCallback(
    async (email: string) => {
      try {
        const response = await authAPI.sendOTP({ email, action: "send" });

        showToast({
          type: "success",
          title: "OTP Sent",
          message: response.message || "OTP sent to your email",
          duration: 3000,
        });

        return response;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to send OTP";

        showToast({
          type: "error",
          title: "OTP Failed",
          message: errorMessage,
          duration: 4000,
        });

        throw error;
      }
    },
    [showToast]
  );

  const verifyOTP = useCallback(
    async (email: string, otp: string) => {
      try {
        setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

        const response = await authAPI.verifyOTP({
          email,
          action: "verify",
          otp,
        });

        setAuthState({
          user: response.user,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });

        showToast({
          type: "success",
          title: "OTP Verified",
          message: response.message || "OTP verification successful!",
          duration: 3000,
        });

        // Navigate to main app
        router.replace("/(tabs)");

        return response.user;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "OTP verification failed";

        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));

        showToast({
          type: "error",
          title: "OTP Verification Failed",
          message: errorMessage,
          duration: 4000,
        });

        throw error;
      }
    },
    [showToast]
  );

  const clearError = useCallback(() => {
    setAuthState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    // State
    user: authState.user,
    isLoading: authState.isLoading,
    isAuthenticated: authState.isAuthenticated,
    error: authState.error,

    // Actions
    register,
    login,
    logout,
    oauth,
    sendOTP,
    verifyOTP,
    clearError,

    // Utilities
    hasError: !!authState.error,
  };
};
