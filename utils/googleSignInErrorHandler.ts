import { Alert } from 'react-native';

export interface GoogleSignInError {
  code: string;
  message: string;
  userAction: 'retry' | 'fallback' | 'none';
  isUserCancellation: boolean;
  isNetworkError: boolean;
  isConfigurationError: boolean;
}

export class GoogleSignInErrorHandler {
  /**
   * Handles Google Sign-In errors and provides user-friendly messages
   */
  static handleError(error: any): GoogleSignInError {
    console.error('Google Sign-In error details:', error);

    // Check if this is a user cancellation
    if (this.isUserCancellation(error)) {
      return {
        code: 'USER_CANCELLED',
        message: 'Sign-in was cancelled by user',
        userAction: 'none',
        isUserCancellation: true,
        isNetworkError: false,
        isConfigurationError: false
      };
    }

    // Check if this is a network error
    if (this.isNetworkError(error)) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network connection issue. Please check your internet connection and try again.',
        userAction: 'retry',
        isUserCancellation: false,
        isNetworkError: true,
        isConfigurationError: false
      };
    }

    // Check if this is a configuration error
    if (this.isConfigurationError(error)) {
      return {
        code: 'CONFIGURATION_ERROR',
        message: 'Google Sign-In is not properly configured. Please contact support.',
        userAction: 'fallback',
        isUserCancellation: false,
        isNetworkError: false,
        isConfigurationError: true
      };
    }

    // Handle specific Google OAuth error codes
    if (error.code) {
      switch (error.code) {
        case 'ERR_CANCELED':
        case 'ERR_CANCEL':
          return {
            code: error.code,
            message: 'Sign-in was cancelled',
            userAction: 'none',
            isUserCancellation: true,
            isNetworkError: false,
            isConfigurationError: false
          };

        case 'ERR_INVALID_CLIENT':
          return {
            code: error.code,
            message: 'Google Sign-In configuration error. Please contact support.',
            userAction: 'fallback',
            isUserCancellation: false,
            isNetworkError: false,
            isConfigurationError: true
          };

        case 'ERR_INVALID_REQUEST':
          return {
            code: error.code,
            message: 'Invalid sign-in request. Please try again.',
            userAction: 'retry',
            isUserCancellation: false,
            isNetworkError: false,
            isConfigurationError: false
          };

        case 'ERR_ACCESS_DENIED':
          return {
            code: error.code,
            message: 'Access denied. Please check your Google account permissions.',
            userAction: 'retry',
            isUserCancellation: false,
            isNetworkError: false,
            isConfigurationError: false
          };

        case 'ERR_UNAUTHORIZED_CLIENT':
          return {
            code: error.code,
            message: 'Google Sign-In is not authorized. Please contact support.',
            userAction: 'fallback',
            isUserCancellation: false,
            isNetworkError: false,
            isConfigurationError: true
          };

        case 'ERR_UNSUPPORTED_RESPONSE_TYPE':
          return {
            code: error.code,
            message: 'Unsupported response from Google. Please try again.',
            userAction: 'retry',
            isUserCancellation: false,
            isNetworkError: false,
            isConfigurationError: false
          };

        case 'ERR_SERVER_ERROR':
          return {
            code: error.code,
            message: 'Google service temporarily unavailable. Please try again later.',
            userAction: 'retry',
            isUserCancellation: false,
            isNetworkError: false,
            isConfigurationError: false
          };

        case 'ERR_TEMPORARILY_UNAVAILABLE':
          return {
            code: error.code,
            message: 'Google service temporarily unavailable. Please try again later.',
            userAction: 'retry',
            isUserCancellation: false,
            isNetworkError: false,
            isConfigurationError: false
          };

        case 'ERR_INSUFFICIENT_SCOPE':
          return {
            code: error.code,
            message: 'Insufficient permissions. Please try again.',
            userAction: 'retry',
            isUserCancellation: false,
            isNetworkError: false,
            isConfigurationError: false
          };

        default:
          return {
            code: error.code,
            message: 'An unexpected error occurred during Google Sign-In. Please try again.',
            userAction: 'retry',
            isUserCancellation: false,
            isNetworkError: false,
            isConfigurationError: false
          };
      }
    }

    // Handle error messages
    if (error.message) {
      const message = error.message.toLowerCase();
      
      if (message.includes('network') || message.includes('connection') || message.includes('timeout')) {
        return {
          code: 'NETWORK_ERROR',
          message: 'Network connection issue. Please check your internet connection and try again.',
          userAction: 'retry',
          isUserCancellation: false,
          isNetworkError: true,
          isConfigurationError: false
        };
      }

      if (message.includes('cancelled') || message.includes('canceled') || message.includes('user cancelled')) {
        return {
          code: 'USER_CANCELLED',
          message: 'Sign-in was cancelled by user',
          userAction: 'none',
          isUserCancellation: true,
          isNetworkError: false,
          isConfigurationError: false
        };
      }

      if (message.includes('invalid client') || message.includes('unauthorized') || message.includes('configuration')) {
        return {
          code: 'CONFIGURATION_ERROR',
          message: 'Google Sign-In is not properly configured. Please contact support.',
          userAction: 'fallback',
          isUserCancellation: false,
          isNetworkError: false,
          isConfigurationError: true
        };
      }
    }

    // Fallback for unknown errors
    return {
      code: 'ERR_UNKNOWN',
      message: 'An unexpected error occurred during Google Sign-In. Please try again.',
      userAction: 'retry',
      isUserCancellation: false,
      isNetworkError: false,
      isConfigurationError: false
    };
  }

  /**
   * Determines if an error represents user cancellation
   */
  private static isUserCancellation(error: any): boolean {
    // Check for explicit cancellation codes
    if (error.code === 'ERR_CANCELED' || error.code === 'ERR_CANCEL') {
      return true;
    }

    // Check for cancellation in messages
    if (error.message && (
      error.message.toLowerCase().includes('cancelled') ||
      error.message.toLowerCase().includes('canceled') ||
      error.message.toLowerCase().includes('user cancelled') ||
      error.message.toLowerCase().includes('user canceled')
    )) {
      return true;
    }

    return false;
  }

  /**
   * Determines if an error represents a network issue
   */
  private static isNetworkError(error: any): boolean {
    if (error.message && (
      error.message.toLowerCase().includes('network') ||
      error.message.toLowerCase().includes('connection') ||
      error.message.toLowerCase().includes('timeout') ||
      error.message.toLowerCase().includes('offline')
    )) {
      return true;
    }

    return false;
  }

  /**
   * Determines if an error represents a configuration issue
   */
  private static isConfigurationError(error: any): boolean {
    if (error.code && (
      error.code === 'ERR_INVALID_CLIENT' ||
      error.code === 'ERR_UNAUTHORIZED_CLIENT'
    )) {
      return true;
    }

    if (error.message && (
      error.message.toLowerCase().includes('invalid client') ||
      error.message.toLowerCase().includes('unauthorized') ||
      error.message.toLowerCase().includes('configuration') ||
      error.message.toLowerCase().includes('client id')
    )) {
      return true;
    }

    return false;
  }

  /**
   * Shows appropriate error message to user based on error type
   * Only shows alerts for actual errors, not user cancellations
   */
  static showErrorToUser(error: GoogleSignInError, onRetry?: () => void, onFallback?: () => void) {
    // Don't show error messages for user cancellations
    if (error.isUserCancellation) {
      console.log('Google Sign-In cancelled by user - no action needed');
      return;
    }

    const buttons: Array<{
      text: string;
      onPress?: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }> = [];

    if (error.userAction === 'retry' && onRetry) {
      buttons.push({
        text: 'Try Again',
        onPress: onRetry
      });
    }

    if (error.userAction === 'fallback' && onFallback) {
      buttons.push({
        text: 'Use Apple Sign-In Instead',
        onPress: onFallback
      });
    }

    buttons.push({
      text: 'OK',
      style: 'default'
    });

    Alert.alert(
      'Google Sign-In Error',
      error.message,
      buttons,
      { cancelable: true }
    );
  }

  /**
   * Provides troubleshooting suggestions based on error type
   */
  static getTroubleshootingTips(error: GoogleSignInError): string[] {
    // No troubleshooting tips needed for user cancellations
    if (error.isUserCancellation) {
      return ['No action needed - this was a user cancellation'];
    }

    const tips: string[] = [];

    if (error.isNetworkError) {
      tips.push('Check your internet connection');
      tips.push('Try switching between WiFi and cellular data');
      tips.push('Ensure no VPN interference');
      tips.push('Test on different networks');
    }

    if (error.isConfigurationError) {
      tips.push('Contact app support for configuration issues');
      tips.push('Check if Google Sign-In is properly set up');
      tips.push('Verify OAuth client IDs are correct');
    }

    switch (error.code) {
      case 'ERR_ACCESS_DENIED':
        tips.push('Check your Google account permissions');
        tips.push('Ensure you\'re signed into the correct Google account');
        tips.push('Try signing out and back into Google');
        break;

      case 'ERR_SERVER_ERROR':
      case 'ERR_TEMPORARILY_UNAVAILABLE':
        tips.push('Google service may be temporarily down');
        tips.push('Wait a few minutes and try again');
        tips.push('Check Google service status');
        break;

      case 'ERR_INSUFFICIENT_SCOPE':
        tips.push('Grant all requested permissions');
        tips.push('Check your Google account settings');
        break;
    }

    return tips;
  }

  /**
   * Checks if the error suggests the user should try a different sign-in method
   */
  static shouldSuggestFallback(error: GoogleSignInError): boolean {
    return error.isConfigurationError || error.userAction === 'fallback';
  }
}

/**
 * Convenience function to handle Google Sign-In errors with user feedback
 * Only shows error messages for actual errors, not user cancellations
 */
export const handleGoogleSignInError = (
  error: any,
  onRetry?: () => void,
  onFallback?: () => void
) => {
  const processedError = GoogleSignInErrorHandler.handleError(error);
  
  // Only show error messages for actual errors, not user cancellations
  if (!processedError.isUserCancellation) {
    GoogleSignInErrorHandler.showErrorToUser(processedError, onRetry, onFallback);
  }
  
  return processedError;
};
