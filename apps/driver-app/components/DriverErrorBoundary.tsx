import { Ionicons } from '@expo/vector-icons';
import React, { Component, ReactNode } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { logger } from '../utils/Logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class DriverErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    logger.error('Driver App Error Boundary caught an error:', { error, errorInfo });
    
    // Log error to your error reporting service here
    // Example: logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  handleReportError = () => {
    const { error } = this.state;
    if (error) {
      // In a real app, you would send this to your error reporting service
      Alert.alert(
        'Error Reported',
        'Thank you for reporting this error. We will investigate and fix it.',
        [{ text: 'OK' }]
      );
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <View style={styles.iconWrapper}>
              <View style={styles.iconContainer}>
                <Ionicons name="car-sport-outline" size={48} color={Colors.light.primary} />
              </View>
            </View>
            
            <Text style={styles.title}>Driver App Error</Text>
            <Text style={styles.message}>
              We encountered an issue with your driver dashboard. Don&apos;t worry, your data is safe and our team has been notified.
            </Text>
            
            {__DEV__ && this.state.error && (
              <View style={styles.debugContainer}>
                <Text style={styles.debugTitle}>Debug Info:</Text>
                <Text style={styles.debugText}>{this.state.error.message}</Text>
                {this.state.error.stack && (
                  <Text style={styles.debugText}>{this.state.error.stack}</Text>
                )}
              </View>
            )}
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.retryButton} 
                onPress={this.handleRetry}
                accessible={true}
                accessibilityLabel="Try Again"
                accessibilityRole="button"
              >
                <Ionicons name="refresh" size={20} color={Colors.light.background} />
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.reportButton} 
                onPress={this.handleReportError}
                accessible={true}
                accessibilityLabel="Report Issue"
                accessibilityRole="button"
              >
                <Ionicons name="help-circle-outline" size={20} color={Colors.light.primary} />
                <Text style={styles.reportButtonText}>Get Help</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    backgroundColor: Colors.light.background,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  iconWrapper: {
    marginBottom: 24,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.light.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: Colors.light.icon,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  debugContainer: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.light.secondary,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.error,
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: Colors.light.text,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  retryButton: {
    flex: 1,
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.background,
  },
  reportButton: {
    flex: 1,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: Colors.light.primary,
  },
  reportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.primary,
  },
});
