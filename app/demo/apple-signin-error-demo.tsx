import { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppleSignInErrorHandler, handleAppleSignInError } from '../../utils/appleSignInErrorHandler';

export default function AppleSignInErrorDemo() {
  const [lastError, setLastError] = useState<any>(null);
  const [lastProcessedError, setLastProcessedError] = useState<any>(null);

  const testErrorHandling = (errorType: string) => {
    let testError: any;

    switch (errorType) {
      case 'authorization_failed':
        testError = new Error('The authorization attempt failed for an unknown reason');
        break;
      case 'not_available':
        testError = { code: 'ERR_NOT_AVAILABLE', message: 'Apple Sign-In is not available on this device.' };
        break;
      case 'canceled':
        testError = { code: 'ERR_CANCELED', message: 'User canceled the sign-in process.' };
        break;
      case 'expired':
        testError = { code: 'ERR_REQUEST_EXPIRED', message: 'The sign-in request has expired.' };
        break;
      case 'invalid_response':
        testError = { code: 'ERR_INVALID_RESPONSE', message: 'Invalid response received from Apple.' };
        break;
      default:
        testError = { code: 'ERR_UNKNOWN', message: 'An unknown error occurred.' };
    }

    setLastError(testError);

    // Test the error handling
    const processedError = handleAppleSignInError(
      testError,
      () => {
        Alert.alert('Retry', 'Retry function called!');
      },
      () => {
        Alert.alert('Fallback', 'Fallback to Google Sign-In called!');
      }
    );

    setLastProcessedError(processedError);
  };

  const testErrorAnalysis = () => {
    if (!lastProcessedError) {
      Alert.alert('No Error', 'Please test an error first');
      return;
    }

    const tips = AppleSignInErrorHandler.getTroubleshootingTips(lastProcessedError);

    Alert.alert(
      'Error Analysis',
      `Code: ${lastProcessedError.code}\n\nMessage: ${lastProcessedError.message}\n\nUser Action: ${lastProcessedError.userAction}\n\nIs User Cancellation: ${lastProcessedError.isUserCancellation ? 'Yes' : 'No'}\n\nTroubleshooting Tips:\n${tips.map(tip => `• ${tip}`).join('\n')}`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Apple Sign-In Error Handling Demo</Text>
      <Text style={styles.subtitle}>Test different error scenarios and see how they&apos;re handled</Text>
      <Text style={styles.note}>
        💡 User cancellations (like &quot;authorization failed&quot;) are now handled gracefully without error messages
      </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.errorButton, styles.cancellationButton]}
          onPress={() => testErrorHandling('authorization_failed')}
        >
          <Text style={styles.buttonText}>Test &quot;Authorization Failed&quot;</Text>
          <Text style={styles.buttonSubtext}>Usually means user cancelled</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.errorButton, styles.cancellationButton]}
          onPress={() => testErrorHandling('canceled')}
        >
          <Text style={styles.buttonText}>Test &quot;Canceled&quot;</Text>
          <Text style={styles.buttonSubtext}>Explicit user cancellation</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.errorButton}
          onPress={() => testErrorHandling('not_available')}
        >
          <Text style={styles.buttonText}>Test &quot;Not Available&quot;</Text>
          <Text style={styles.buttonSubtext}>Shows error message</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.errorButton}
          onPress={() => testErrorHandling('expired')}
        >
          <Text style={styles.buttonText}>Test &quot;Expired&quot;</Text>
          <Text style={styles.buttonSubtext}>Shows error message</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.errorButton}
          onPress={() => testErrorHandling('invalid_response')}
        >
          <Text style={styles.buttonText}>Test &quot;Invalid Response&quot;</Text>
          <Text style={styles.buttonSubtext}>Shows error message</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.errorButton, styles.cancellationButton]}
          onPress={() => testErrorHandling('unknown')}
        >
          <Text style={styles.buttonText}>Test &quot;Unknown Error&quot;</Text>
          <Text style={styles.buttonSubtext}>Treated as cancellation</Text>
        </TouchableOpacity>
      </View>

      {lastProcessedError && (
        <View style={styles.errorInfo}>
          <Text style={styles.errorTitle}>Last Tested Error:</Text>
          <Text style={styles.errorText}>
            {lastError.code ? `Code: ${lastError.code}` : 'No code'}
          </Text>
          <Text style={styles.errorText}>
            Message: {lastError.message}
          </Text>
          
          <View style={styles.processedErrorInfo}>
            <Text style={styles.processedErrorTitle}>Processed Result:</Text>
            <Text style={styles.errorText}>
              Processed Code: {lastProcessedError.code}
            </Text>
            <Text style={styles.errorText}>
              Is Cancellation: {lastProcessedError.isUserCancellation ? 'Yes' : 'No'}
            </Text>
            <Text style={styles.errorText}>
              User Action: {lastProcessedError.userAction}
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.analyzeButton}
            onPress={testErrorAnalysis}
          >
            <Text style={styles.analyzeButtonText}>Analyze Error</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>What This Demo Shows:</Text>
        <Text style={styles.infoText}>• User cancellations are handled silently (no error alerts)</Text>
        <Text style={styles.infoText}>• Actual errors still show user-friendly messages</Text>
        <Text style={styles.infoText}>• Retry and fallback options for genuine errors</Text>
        <Text style={styles.infoText}>• Smart detection of cancellation vs. actual errors</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
    color: '#666',
  },
  note: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
    color: '#007AFF',
    fontStyle: 'italic',
  },
  buttonContainer: {
    gap: 15,
    marginBottom: 30,
  },
  errorButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancellationButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonSubtext: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 5,
    opacity: 0.8,
  },
  errorInfo: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 10,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  errorText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
    fontFamily: 'monospace',
  },
  processedErrorInfo: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  processedErrorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  analyzeButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  analyzeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  infoContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
  },
});
