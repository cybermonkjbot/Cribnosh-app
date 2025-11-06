/**
 * Sign-in Navigation Guard
 * Prevents multiple sign-in screens from being triggered simultaneously
 */

import { router } from 'expo-router';

// Track if sign-in screen is visible
let isSignInVisible = false;
// Track if sign-in navigation is in progress
let isNavigatingToSignIn = false;
let navigationTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Check if we're currently on the sign-in route
 * This uses a workaround since expo-router doesn't expose the current route directly
 */
const isOnSignInRoute = (): boolean => {
  // Try to access router state if available
  try {
    const state = (router as any).state;
    if (state) {
      const routes = state.routes || state.history || [];
      const currentRoute = routes[routes.length - 1];
      if (currentRoute?.name === 'sign-in' || currentRoute?.pathname === '/sign-in') {
        return true;
      }
    }
  } catch {
    // If we can't access router state, we'll rely on the visibility flag
  }
  return false;
};

/**
 * Navigate to sign-in screen with guard to prevent multiple triggers
 * @param params - Optional navigation parameters
 * @returns boolean - true if navigation was triggered, false if already navigating or visible
 */
export const navigateToSignIn = (params?: {
  returnPath?: string;
  returnParams?: Record<string, any>;
  notDismissable?: boolean; // If true, sign-in screen cannot be dismissed
}): boolean => {
  console.log('navigateToSignIn called', { isSignInVisible, isNavigatingToSignIn });

  // Double-check: if we're already on the sign-in route, don't navigate
  const onRoute = isOnSignInRoute();
  if (onRoute) {
    console.log('Already on sign-in route, marking as visible');
    // Mark as visible since we're already on the route
    isSignInVisible = true;
    return false;
  }

  // If sign-in is already visible but we're not on the route, reset the flag
  // This handles the case where the modal was closed but the flag wasn't reset
  if (isSignInVisible && !onRoute) {
    console.log('Sign-in flag is set but not on route, resetting flag...');
    isSignInVisible = false;
  }

  // If already navigating, skip
  if (isNavigatingToSignIn) {
    console.log('Already navigating to sign-in, skipping...');
    return false;
  }

  // Set flag to prevent multiple navigations
  isNavigatingToSignIn = true;

  // Clear any existing timeout
  if (navigationTimeout) {
    clearTimeout(navigationTimeout);
    navigationTimeout = null;
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
  if (params?.notDismissable) {
    signInParams.notDismissable = 'true';
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

  // Mark as visible immediately to prevent duplicate navigations
  isSignInVisible = true;

  // Reset navigation flag after a delay to allow navigation to complete
  // The visibility flag will remain true until explicitly reset
  navigationTimeout = setTimeout(() => {
    isNavigatingToSignIn = false;
    navigationTimeout = null;
  }, 500); // Short delay just for navigation completion

  return true;
};

/**
 * Mark sign-in screen as visible (call when sign-in screen mounts)
 */
export const markSignInAsVisible = () => {
  isSignInVisible = true;
  // Clear any navigation timeout since we're now visible
  if (navigationTimeout) {
    clearTimeout(navigationTimeout);
    navigationTimeout = null;
  }
  isNavigatingToSignIn = false;
};

/**
 * Mark sign-in screen as hidden (call when sign-in screen unmounts or user authenticates)
 */
export const markSignInAsHidden = () => {
  isSignInVisible = false;
  isNavigatingToSignIn = false;
  if (navigationTimeout) {
    clearTimeout(navigationTimeout);
    navigationTimeout = null;
  }
};

/**
 * Reset the navigation guard (call when sign-in is dismissed or user is authenticated)
 * This is kept for backward compatibility
 */
export const resetSignInNavigationGuard = () => {
  markSignInAsHidden();
};

/**
 * Check if sign-in navigation is currently in progress
 */
export const isSignInNavigationInProgress = (): boolean => {
  return isNavigatingToSignIn || isSignInVisible;
};

/**
 * Check if sign-in screen is currently visible
 */
export const isSignInScreenVisible = (): boolean => {
  return isSignInVisible;
};

