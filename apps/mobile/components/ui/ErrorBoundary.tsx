import { AlertCircle, RefreshCw } from 'lucide-react-native';
import React, { Component, ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

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
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error
    console.warn('ErrorBoundary caught an error:', error, errorInfo);
    
    // Update state with error info
    this.setState({ errorInfo });
    
    // Call optional error handler
    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo);
      } catch (handlerError) {
        console.warn('Error in error handler:', handlerError);
      }
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    // Reset error boundary when resetKeys change
    if (hasError && resetKeys && prevProps.resetKeys) {
      const hasResetKeyChanged = resetKeys.some(
        (resetKey, idx) => prevProps.resetKeys![idx] !== resetKey
      );
      
      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }

    // Reset error boundary when any prop changes (if enabled)
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
      // Render custom fallback if provided
      if (this.props.fallbackComponent) {
        return this.props.fallbackComponent;
      }

      // Default fallback UI
      return (
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f5f5f5',
          padding: 20,
        }}>
          <AlertCircle size={48} color="#ff6b6b" />
          <Text style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: '#333',
            textAlign: 'center',
            marginTop: 16,
            marginBottom: 8,
          }}>
            Something went wrong
          </Text>
          <Text style={{
            fontSize: 14,
            color: '#666',
            textAlign: 'center',
            marginBottom: 24,
            lineHeight: 20,
          }}>
            We encountered an unexpected error. Please try again.
          </Text>
          <Pressable
            onPress={this.resetErrorBoundary}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#007AFF',
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 8,
              gap: 8,
            }}
          >
            <RefreshCw size={16} color="#fff" />
            <Text style={{
              color: '#fff',
              fontSize: 16,
              fontWeight: '600',
            }}>
              Try Again
            </Text>
          </Pressable>
          
          {/* Development error details */}
          {__DEV__ && this.state.error && (
            <View style={{
              marginTop: 24,
              padding: 16,
              backgroundColor: '#fff',
              borderRadius: 8,
              borderWidth: 1,
              borderColor: '#ddd',
              maxWidth: '100%',
            }}>
              <Text style={{
                fontSize: 12,
                fontFamily: 'monospace',
                color: '#ff6b6b',
                marginBottom: 8,
              }}>
                Error: {this.state.error.message}
              </Text>
              {this.state.errorInfo && (
                <Text style={{
                  fontSize: 10,
                  fontFamily: 'monospace',
                  color: '#666',
                }}>
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

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Specialized error boundary for Nosh Heaven components
export function NoshHeavenErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallbackComponent={
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#000',
          padding: 20,
        }}>
          <AlertCircle size={48} color="#FF3B30" />
          <Text style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: '#fff',
            textAlign: 'center',
            marginTop: 16,
            marginBottom: 8,
          }}>
            Nosh Heaven Error
          </Text>
          <Text style={{
            fontSize: 14,
            color: '#ccc',
            textAlign: 'center',
            marginBottom: 24,
            lineHeight: 20,
          }}>
            Unable to load the immersive experience. Please return to the main feed.
          </Text>
        </View>
      }
      onError={(error, errorInfo) => {
        console.warn('Nosh Heaven Error:', error);
        // Could integrate with crash reporting service here
      }}
      resetOnPropsChange
    >
      {children}
    </ErrorBoundary>
  );
} 