import * as AppleAuthentication from 'expo-apple-authentication';
import { Alert } from 'react-native';

export interface AppleSignInError {
  code: string;
  message: string;
  userAction: 'retry' | 'fallback' | 'none';
  isUserCancellation: boolean;
}

export class AppleSignInErrorHandler {
  /**
   * Handles Apple Sign-In errors and provides user-friendly messages
   */
  static handleError(error: any): AppleSignInError {
    console.error('Apple Sign-In error details:', error);

    // Check if this is a user cancellation (most common case)
    if (this.isUserCancellation(error)) {
      return {
        code: 'USER_CANCELLED',
        message: 'Sign-in was cancelled by user',
        userAction: 'none',
        isUserCancellation: true
      };
    }

    // Handle specific Apple Authentication error codes
    if (error.code) {
      switch (error.code) {
        case 'ERR_CANCELED':
          return {
            code: error.code,
            message: 'Sign-in was cancelled',
            userAction: 'none',
            isUserCancellation: true
          };

        case 'ERR_INVALID_RESPONSE':
          return {
            code: error.code,
            message: 'Invalid response from Apple. Please try again.',
            userAction: 'retry',
            isUserCancellation: false
          };

        case 'ERR_NOT_AVAILABLE':
          return {
            code: error.code,
            message: 'Apple Sign-In is not available on this device.',
            userAction: 'fallback',
            isUserCancellation: false
          };

        case 'ERR_REQUEST_EXPIRED':
          return {
            code: error.code,
            message: 'Sign-in request expired. Please try again.',
            userAction: 'retry',
            isUserCancellation: false
          };

        case 'ERR_REQUEST_NOT_HANDLED':
          return {
            code: error.code,
            message: 'Sign-in request could not be handled. Please try again.',
            userAction: 'retry',
            isUserCancellation: false
          };

        case 'ERR_REQUEST_NOT_INTERACTIVE':
          return {
            code: error.code,
            message: 'Sign-in request requires user interaction. Please try again.',
            userAction: 'retry',
            isUserCancellation: false
          };

        case 'ERR_UNKNOWN':
        default:
          // This is the "authorization attempt failed for an unknown reason" error
          // Often indicates user cancellation, but could be other issues
          return {
            code: error.code || 'ERR_UNKNOWN',
            message: 'Sign-in was cancelled or failed unexpectedly.',
            userAction: 'none',
            isUserCancellation: true
          };
      }
    }

    // Handle generic errors
    if (error.message) {
      if (error.message.includes('authorization attempt failed')) {
        // This specific error message usually means user cancellation
        return {
          code: 'ERR_AUTHORIZATION_FAILED',
          message: 'Sign-in was cancelled or failed unexpectedly.',
          userAction: 'none',
          isUserCancellation: true
        };
      }

      if (error.message.includes('not available')) {
        return {
          code: 'ERR_NOT_AVAILABLE',
          message: 'Apple Sign-In is not available on this device or platform.',
          userAction: 'fallback',
          isUserCancellation: false
        };
      }
    }

    // Fallback for unknown errors - assume user cancellation to be safe
    return {
      code: 'ERR_UNKNOWN',
      message: 'Sign-in was cancelled or failed unexpectedly.',
      userAction: 'none',
      isUserCancellation: true
    };
  }

  /**
   * Determines if an error represents user cancellation
   */
  private static isUserCancellation(error: any): boolean {
    // Check for explicit cancellation codes
    if (error.code === 'ERR_CANCELED') {
      return true;
    }

    // Check for the specific "authorization attempt failed" message
    // This commonly indicates user cancellation
    if (error.message && error.message.includes('authorization attempt failed')) {
      return true;
    }

    // Check for other cancellation indicators
    if (error.message && (
      error.message.includes('cancelled') ||
      error.message.includes('canceled') ||
      error.message.includes('user cancelled') ||
      error.message.includes('user canceled')
    )) {
      return true;
    }

    return false;
  }

  /**
   * Shows appropriate error message to user based on error type
   * Only shows alerts for actual errors, not user cancellations
   */
  static showErrorToUser(error: AppleSignInError, onRetry?: () => void, onFallback?: () => void) {
    // Don't show error messages for user cancellations
    if (error.isUserCancellation) {
      console.log('Apple Sign-In cancelled by user - no action needed');
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
        text: 'Use Alternative',
        onPress: onFallback
      });
    }

    buttons.push({
      text: 'OK',
      style: 'default'
    });

    Alert.alert(
      'Sign-In Error',
      error.message,
      buttons,
      { cancelable: true }
    );
  }

  /**
   * Checks if Apple Sign-In is available on the current device
   */
  static async isAvailable(): Promise<boolean> {
    try {
      return await AppleAuthentication.isAvailableAsync();
    } catch (error) {
      console.error('Error checking Apple Sign-In availability:', error);
      return false;
    }
  }

  /**
   * Gets the current Apple Sign-In credential state
   */
  static async getCredentialState(userId: string): Promise<AppleAuthentication.AppleAuthenticationCredentialState> {
    try {
      return await AppleAuthentication.getCredentialStateAsync(userId);
    } catch (error) {
      console.error('Error getting credential state:', error);
      return AppleAuthentication.AppleAuthenticationCredentialState.REVOKED;
    }
  }

  /**
   * Provides troubleshooting suggestions based on error type
   */
  static getTroubleshootingTips(error: AppleSignInError): string[] {
    // No troubleshooting tips needed for user cancellations
    if (error.isUserCancellation) {
      return ['No action needed - this was a user cancellation'];
    }

    const tips: string[] = [];

    switch (error.code) {
      case 'ERR_UNKNOWN':
      case 'ERR_AUTHORIZATION_FAILED':
        tips.push('Check your internet connection');
        tips.push('Ensure you have a stable network connection');
        tips.push('Try signing out of Apple ID and signing back in');
        tips.push('Restart your device and try again');
        break;

      case 'ERR_NOT_AVAILABLE':
        tips.push('Apple Sign-In is only available on iOS 13+ and macOS 10.15+');
        tips.push('Ensure you\'re signed into your Apple ID in Settings');
        tips.push('Check if Sign In with Apple is enabled in your Apple ID settings');
        break;

      case 'ERR_REQUEST_EXPIRED':
        tips.push('Try signing in again');
        tips.push('Ensure you complete the sign-in process quickly');
        break;

      case 'ERR_INVALID_RESPONSE':
        tips.push('Try signing in again');
        tips.push('Check if your Apple ID is properly configured');
        break;
    }

    return tips;
  }
}

/**
 * Convenience function to handle Apple Sign-In errors with user feedback
 * Only shows error messages for actual errors, not user cancellations
 */
export const handleAppleSignInError = (
  error: any,
  onRetry?: () => void,
  onFallback?: () => void
) => {
  const processedError = AppleSignInErrorHandler.handleError(error);
  
  // Only show error messages for actual errors, not user cancellations
  if (!processedError.isUserCancellation) {
    AppleSignInErrorHandler.showErrorToUser(processedError, onRetry, onFallback);
  }
  
  return processedError;
};
