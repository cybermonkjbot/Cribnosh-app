// utils/networkErrorHandler.ts

/**
 * Network error handler that prevents duplicate error toasts
 * Only shows one "Unstable network detected" message at a time
 */

// Track if a network error toast is currently showing
let isNetworkErrorToastShowing = false;
let networkErrorToastId: string | null = null;
let lastNetworkErrorTime = 0;

// Cooldown period: don't show another network error toast within 3 seconds
const NETWORK_ERROR_COOLDOWN_MS = 3000;

// Toast function setter - will be set by the app initialization
let toastErrorFunction: ((title: string, message?: string, duration?: number) => void) | null = null;

/**
 * Set the toast error function (called during app initialization)
 */
export function setToastErrorFunction(fn: (title: string, message?: string, duration?: number) => void) {
  toastErrorFunction = fn;
}

/**
 * Check if an error is a network error
 */
export function isNetworkError(error: any): boolean {
  if (!error) return false;

  const errorMessage = (
    error?.message ||
    error?.data?.error?.message ||
    error?.data?.message ||
    String(error)
  ).toLowerCase();

  const networkErrorIndicators = [
    'network request failed',
    'networkerror',
    'network error',
    'fetch failed',
    'fetch error',
    'failed to fetch',
    'networkerror when attempting to fetch',
    'connection',
    'timeout',
    'offline',
    'no internet',
    'internet connection',
    'unable to connect',
    'connection refused',
    'connection reset',
    'econnrefused',
    'enotfound',
    'etimedout',
  ];

  return networkErrorIndicators.some((indicator) =>
    errorMessage.includes(indicator)
  );
}

/**
 * Show network error toast (deduplicated)
 * Only shows one toast at a time, with cooldown period
 */
export function showNetworkErrorToast(): void {
  const now = Date.now();

  // If a toast is already showing, don't show another
  if (isNetworkErrorToastShowing) {
    return;
  }

  // If we just showed a network error recently, don't show another
  if (now - lastNetworkErrorTime < NETWORK_ERROR_COOLDOWN_MS) {
    return;
  }

  // Mark that we're showing a network error toast
  isNetworkErrorToastShowing = true;
  lastNetworkErrorTime = now;

  // Show the toast if toast function is available
  if (toastErrorFunction) {
    toastErrorFunction("Unstable network detected", undefined, 4000);
  } else {
    // Fallback to console if toast function not set
    console.warn("Unstable network detected");
  }

  // Clear the flag after the toast duration
  setTimeout(() => {
    isNetworkErrorToastShowing = false;
    networkErrorToastId = null;
  }, 4000);
}

/**
 * Handle errors from Convex actions/queries
 * Automatically detects network errors and shows deduplicated toast
 * Re-throws the error so calling code can handle it
 */
export function handleConvexError(error: any): any {
  if (isNetworkError(error)) {
    showNetworkErrorToast();
  }
  return error;
}

/**
 * Wrapper for Convex actions that handles network errors
 */
export async function convexActionWithErrorHandling<T>(
  action: () => Promise<T>
): Promise<T> {
  try {
    return await action();
  } catch (error: any) {
    handleConvexError(error);
    throw error;
  }
}

