/**
 * Utility functions for testing token expiration functionality
 * These should only be used in development/testing environments
 * 
 * @deprecated SessionToken expiration is validated server-side.
 * These utilities are kept for backward compatibility during migration.
 */

import * as SecureStore from "expo-secure-store";

/**
 * Creates a test JWT token that expires in the specified number of seconds
 * This is for testing purposes only
 * @deprecated Use sessionToken instead - expiration is validated server-side
 * @param expiresInSeconds - Number of seconds until expiration
 * @returns A test JWT token string
 */
export const createTestExpiredToken = (
  expiresInSeconds: number = 0
): string => {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + expiresInSeconds;

  // Create a simple JWT payload
  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  const payload = {
    sub: "test-user-id",
    exp: exp,
    iat: now,
    name: "Test User",
    email: "test@example.com",
  };

  // Encode header and payload (without signature for testing)
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));

  // Return a mock JWT (without proper signature)
  return `${encodedHeader}.${encodedPayload}.mock-signature`;
};

/**
 * Sets a test token that will expire soon for testing session expiration
 * @deprecated SessionToken expiration is validated server-side
 * @param expiresInSeconds - Number of seconds until expiration (default: 5)
 */
export const setTestExpiringToken = async (
  expiresInSeconds: number = 5
): Promise<void> => {
  const testToken = createTestExpiredToken(expiresInSeconds);
  const testUser = {
    user_id: "test-user-id",
    name: "Test User",
    email: "test@example.com",
    roles: ["customer"],
    picture: "",
    isNewUser: false,
    provider: "phone" as const,
  };

  // Use sessionToken key for consistency
  await SecureStore.setItemAsync("cribnosh_session_token", testToken);
  await SecureStore.setItemAsync("cribnosh_user", JSON.stringify(testUser));

  console.log(`Test token set to expire in ${expiresInSeconds} seconds`);
};

/**
 * Clears all test tokens and user data
 */
export const clearTestTokens = async (): Promise<void> => {
  await SecureStore.deleteItemAsync("cribnosh_session_token");
  await SecureStore.deleteItemAsync("cribnosh_user");
  console.log("Test tokens cleared");
};

