// components/ui/ToastDemo.tsx
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useCustomerToast } from '../../hooks/useCustomerToast';

export const ToastDemo: React.FC = () => {
  const {
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showApiError,
    showApiSuccess,
    showCartItemAdded,
    showAuthRequired,
    showNetworkError,
  } = useCustomerToast();

  const handleSuccessToast = () => {
    showSuccess('Success!', 'This is a success message', 3000, 'gradient');
  };

  const handleErrorToast = () => {
    showError('Error!', 'This is an error message', 4000, 'glass');
  };

  const handleInfoToast = () => {
    showInfo('Info', 'This is an info message', 3000, 'default');
  };

  const handleWarningToast = () => {
    showWarning('Warning!', 'This is a warning message', 4000, 'gradient');
  };

  const handleApiErrorToast = () => {
    showApiError('Network request failed', 'Custom error message');
  };

  const handleApiSuccessToast = () => {
    showApiSuccess('Data loaded successfully', 'API Success');
  };

  const handleCartToast = () => {
    showCartItemAdded('Delicious Pizza');
  };

  const handleAuthToast = () => {
    showAuthRequired('view this content');
  };

  const handleNetworkToast = () => {
    showNetworkError();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Toast Notification Demo</Text>
      
      <View style={styles.buttonGrid}>
        <TouchableOpacity style={[styles.button, styles.successButton]} onPress={handleSuccessToast}>
          <Text style={styles.buttonText}>Success Toast</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.errorButton]} onPress={handleErrorToast}>
          <Text style={styles.buttonText}>Error Toast</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.infoButton]} onPress={handleInfoToast}>
          <Text style={styles.buttonText}>Info Toast</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.warningButton]} onPress={handleWarningToast}>
          <Text style={styles.buttonText}>Warning Toast</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.apiButton]} onPress={handleApiErrorToast}>
          <Text style={styles.buttonText}>API Error</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.apiSuccessButton]} onPress={handleApiSuccessToast}>
          <Text style={styles.buttonText}>API Success</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.cartButton]} onPress={handleCartToast}>
          <Text style={styles.buttonText}>Cart Update</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.authButton]} onPress={handleAuthToast}>
          <Text style={styles.buttonText}>Auth Required</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.networkButton]} onPress={handleNetworkToast}>
          <Text style={styles.buttonText}>Network Error</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8e6f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#094327',
    textAlign: 'center',
    marginBottom: 30,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  button: {
    width: '48%',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  successButton: {
    backgroundColor: '#0B9E58',
  },
  errorButton: {
    backgroundColor: '#FF3B30',
  },
  infoButton: {
    backgroundColor: '#094327',
  },
  warningButton: {
    backgroundColor: '#FF6B35',
  },
  apiButton: {
    backgroundColor: '#6B7280',
  },
  apiSuccessButton: {
    backgroundColor: '#10B981',
  },
  cartButton: {
    backgroundColor: '#8B5CF6',
  },
  authButton: {
    backgroundColor: '#F59E0B',
  },
  networkButton: {
    backgroundColor: '#EF4444',
  },
});
