/**
 * Mock configuration for testing
 * Set MOCK_AUTH_ENABLED to true to use mock authentication
 * Set to false to use real API calls
 * 
 * NOTE: Mock phone sign-in is currently COMMENTED OUT in useAuth.ts
 * The mock implementation is preserved but not active
 */

export const MOCK_AUTH_ENABLED = false; // Changed to false - using real API calls

/**
 * Helper function to check if mock mode is enabled
 */
export const isMockModeEnabled = (): boolean => {
  return MOCK_AUTH_ENABLED;
};

/**
 * Console log helper to show mock mode status
 */
export const logMockStatus = () => {
  console.log(
    `🔧 Mock Authentication Mode: ${MOCK_AUTH_ENABLED ? "ENABLED" : "DISABLED"}`
  );
  if (MOCK_AUTH_ENABLED) {
    console.log("🔧 Using mock implementations for:");
    console.log("  - Phone OTP sending");
    console.log("  - Phone login verification");
    console.log("  - Google sign-in");
    console.log("  - Apple sign-in");
    console.log("🔧 Test phone number: +1234567890");
    console.log("🔧 Test OTP code: 123456 (any 6-digit number)");
  }
};
