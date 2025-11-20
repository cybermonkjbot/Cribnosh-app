/**
 * Global authentication error handler
 * Handles 401 Unauthorized errors by redirecting to sign-in
 */

import { navigateToSignIn } from "./signInNavigationGuard";

// Toast function setter - will be set by the app initialization
let toastErrorFunction: ((title: string, message?: string, duration?: number) => void) | null = null;

/**
 * Set the toast error function (called during app initialization)
 */
export function setToastErrorFunction(fn: (title: string, message?: string, duration?: number) => void) {
  toastErrorFunction = fn;
}

/**
 * Stores the current route context for 401 redirects
 * Components can set this before making API calls that require auth
 */
let currentRouteContext: {
  path?: string;
  params?: Record<string, any>;
} | null = null;

/**
 * Set the current route context for 401 error handling
 * @param path - The current route path
 * @param params - Optional route parameters to restore after sign-in
 */
export const setRouteContext = (
  path?: string,
  params?: Record<string, any>
) => {
  currentRouteContext = { path, params };
};

/**
 * Clear the stored route context
 */
export const clearRouteContext = () => {
  currentRouteContext = null;
};

/**
 * Handle 401 Unauthorized error by redirecting to sign-in
 * @param error - The error object from the API response
 * @param options - Optional configuration
 */
export const handle401Error = (error: any, options?: {
  skipToast?: boolean;
  returnPath?: string;
  returnParams?: Record<string, any>;
}) => {
  // Determine the error status/code
  const errorStatus = error?.status || error?.data?.error?.code || error?.data?.status;
  const errorCode = error?.data?.error?.code;
  
  const is401 = errorStatus === 401 || errorStatus === "401" || 
                errorCode === 401 || errorCode === "401";
  
  if (!is401) {
    return false; // Not a 401 error
  }

  // Show toast notification
  if (!options?.skipToast && toastErrorFunction) {
    toastErrorFunction(
      "Sign In Required",
      "Please sign in to continue"
    );
  }

  // Determine return path and params
  const returnPath = options?.returnPath || currentRouteContext?.path;
  const returnParams = options?.returnParams || currentRouteContext?.params;

  // Build navigation params
  const signInParams: Record<string, string> = {};
  if (returnPath) {
    signInParams.returnPath = returnPath;
  }
  if (returnParams) {
    // Stringify and encode the params for URL
    signInParams.returnParams = encodeURIComponent(
      JSON.stringify(returnParams)
    );
  }

  // Navigate to sign-in using guard to prevent multiple triggers
  navigateToSignIn({
    returnPath: Object.keys(signInParams).length > 0 ? returnPath : undefined,
    returnParams: Object.keys(signInParams).length > 0 ? returnParams : undefined,
  });

  return true; // Error was handled
};

