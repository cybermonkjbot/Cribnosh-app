/**
 * Sign-in Navigation Guard
 * Prevents multiple sign-in screens from being triggered simultaneously
 */

import { router } from 'expo-router';

// Track if sign-in navigation is in progress
let isNavigatingToSignIn = false;
let navigationTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Navigate to sign-in screen with guard to prevent multiple triggers
 * @param params - Optional navigation parameters
 * @returns boolean - true if navigation was triggered, false if already navigating
 */
export const navigateToSignIn = (params?: {
  returnPath?: string;
  returnParams?: Record<string, any>;
}): boolean => {
  // If already navigating, skip
  if (isNavigatingToSignIn) {
    return false;
  }

  // Set flag to prevent multiple navigations
  isNavigatingToSignIn = true;

  // Clear any existing timeout
  if (navigationTimeout) {
    clearTimeout(navigationTimeout);
  }

  // Build navigation params
  const signInParams: Record<string, string> = {};
  if (params?.returnPath) {
    signInParams.returnPath = params.returnPath;
  }
  if (params?.returnParams) {
    signInParams.returnParams = encodeURIComponent(
      JSON.stringify(params.returnParams)
    );
  }

  // Navigate to sign-in
  try {
    if (Object.keys(signInParams).length > 0) {
      router.push({
        pathname: "/sign-in",
        params: signInParams,
      } as any);
    } else {
      router.push("/sign-in");
    }
  } catch (navigationError) {
    console.error("Error navigating to sign-in:", navigationError);
    // Fallback: try simple navigation
    try {
      router.push("/sign-in");
    } catch (fallbackError) {
      console.error("Fallback navigation also failed:", fallbackError);
      // Reset flag on error
      isNavigatingToSignIn = false;
      return false;
    }
  }

  // Reset flag after a delay to allow navigation to complete
  // This prevents rapid successive clicks from triggering multiple navigations
  navigationTimeout = setTimeout(() => {
    isNavigatingToSignIn = false;
    navigationTimeout = null;
  }, 1000); // 1 second should be enough for navigation to start

  return true;
};

/**
 * Reset the navigation guard (call when sign-in is dismissed or user is authenticated)
 */
export const resetSignInNavigationGuard = () => {
  isNavigatingToSignIn = false;
  if (navigationTimeout) {
    clearTimeout(navigationTimeout);
    navigationTimeout = null;
  }
};

/**
 * Check if sign-in navigation is currently in progress
 */
export const isSignInNavigationInProgress = (): boolean => {
  return isNavigatingToSignIn;
};

