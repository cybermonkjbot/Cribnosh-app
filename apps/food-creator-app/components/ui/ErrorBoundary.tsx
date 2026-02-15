import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { AlertCircle, ArrowUpCircle, RefreshCw } from 'lucide-react-native';
import React, { Component, ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackComponent?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetKeys?: (string | number)[];
  resetOnPropsChange?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  isUpdateAvailable: boolean;
  isCheckingUpdate: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isUpdateAvailable: false,
      isCheckingUpdate: false
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null,
      isUpdateAvailable: false,
      isCheckingUpdate: false
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });

    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo);
      } catch (handlerError) {
        console.warn('Error in error handler:', handlerError);
      }
    }

    // Check for updates when an error occurs in production
    this.checkForUpdates();
  }

  checkForUpdates = async () => {
    // Only check for updates in production builds
    if (__DEV__ || Constants.executionEnvironment === 'storeClient') {
      return;
    }

    // Check if Updates is available and enabled
    if (!Updates.isEnabled || typeof Updates.checkForUpdateAsync !== 'function') {
      return;
    }

    try {
      this.setState({ isCheckingUpdate: true });
      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        this.setState({ isUpdateAvailable: true });
        // Fetch it in the background immediately
        await Updates.fetchUpdateAsync();
      }
    } catch (error) {
      console.warn('ErrorBoundary: Update check failed:', error);
    } finally {
      this.setState({ isCheckingUpdate: false });
    }
  };

  handleUpdateAndRestart = async () => {
    try {
      // If we already detected an update, it should be fetched by now
      // but let's double check before reloading
      await Updates.reloadAsync();
    } catch (error) {
      console.error('ErrorBoundary: Failed to reload app:', error);
      // Fallback to resetting the error boundary if reload fails
      this.resetErrorBoundary();
    }
  };

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    if (hasError && resetKeys && prevProps.resetKeys) {
      const hasResetKeyChanged = resetKeys.some(
        (resetKey, idx) => prevProps.resetKeys![idx] !== resetKey
      );

      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }

    if (hasError && resetOnPropsChange && prevProps !== this.props) {
      this.resetErrorBoundary();
    }
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.resetTimeoutId = setTimeout(() => {
      this.setState({ hasError: false, error: null, errorInfo: null });
    }, 100);
  };

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallbackComponent) {
        return this.props.fallbackComponent;
      }

      return (
        <View style={styles.container}>
          <AlertCircle size={48} color="#ff6b6b" />
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            We encountered an unexpected error. Please try again.
          </Text>
          <Pressable
            onPress={this.resetErrorBoundary}
            style={styles.button}
          >
            <RefreshCw size={16} color="#fff" />
            <Text style={styles.buttonText}>Try Again</Text>
          </Pressable>

          {this.state.isUpdateAvailable && (
            <Pressable
              onPress={this.handleUpdateAndRestart}
              style={[styles.button, styles.updateButton]}
            >
              <ArrowUpCircle size={16} color="#fff" />
              <Text style={styles.buttonText}>Update & Restart</Text>
            </Pressable>
          )}

          {this.state.isCheckingUpdate && !this.state.isUpdateAvailable && (
            <View style={styles.checkingContainer}>
              <ActivityIndicator size="small" color="#094327" />
              <Text style={styles.checkingText}>Checking for fixes...</Text>
            </View>
          )}

          {__DEV__ && this.state.error && (
            <View style={styles.errorDetails}>
              <Text style={styles.errorText}>
                Error: {this.state.error.message}
              </Text>
              {this.state.errorInfo && (
                <Text style={styles.errorStack}>
                  {this.state.errorInfo.componentStack}
                </Text>
              )}
            </View>
          )}
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFFFA',
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#094327',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Archivo',
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    fontFamily: 'Inter',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#094327',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  updateButton: {
    backgroundColor: '#094327',
    marginTop: 12,
  },
  checkingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  checkingText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  errorDetails: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxWidth: '100%',
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#ff6b6b',
    marginBottom: 8,
  },
  errorStack: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#666',
  },
});

