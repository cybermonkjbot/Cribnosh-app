import { ConvexReactClient } from "convex/react";
import * as SecureStore from 'expo-secure-store';
import { config, isDevelopment } from '../config/environment';

const convexUrl = config.convexUrl;

if (isDevelopment) {
  console.log("[Convex] URL:", convexUrl);
}

if (!convexUrl) {
  console.warn("[Convex] EXPO_PUBLIC_CONVEX_URL is not set. Convex client may not work properly.");
}

export const convex = new ConvexReactClient(convexUrl || 'https://placeholder.convex.cloud');

// Session management utilities for Convex
// Note: Session tokens are passed as parameters to queries/mutations, not via setAuth()
export const sessionManager = {
  async setSessionToken(token: string): Promise<void> {
    await SecureStore.setItemAsync('cribnosh_session_token', token);
  },
  
  async getSessionToken(): Promise<string | null> {
    return await SecureStore.getItemAsync('cribnosh_session_token');
  },
  
  async clearSession(): Promise<void> {
    await SecureStore.deleteItemAsync('cribnosh_session_token');
  },
};
