import { useEffect, useState } from 'react';

interface UseLoadingTimeoutOptions {
  /**
   * Whether the loading state is active
   */
  isLoading: boolean;
  /**
   * Time in milliseconds before showing the "taking longer" message
   * Default: 3000ms (3 seconds)
   */
  timeout?: number;
}

/**
 * Hook that tracks loading time and returns whether to show a "taking longer than usual" message
 */
export function useLoadingTimeout({ isLoading, timeout = 3000 }: UseLoadingTimeoutOptions): boolean {
  const [showTimeoutMessage, setShowTimeoutMessage] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      // Reset when loading completes
      setShowTimeoutMessage(false);
      return;
    }

    // Set a timer to show the message after the timeout
    const timer = setTimeout(() => {
      setShowTimeoutMessage(true);
    }, timeout);

    return () => {
      clearTimeout(timer);
    };
  }, [isLoading, timeout]);

  return showTimeoutMessage;
}

