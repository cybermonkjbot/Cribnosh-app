import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SignInScreen } from '../components/SignInScreen';
import { useCribNoshAuth } from '../hooks/useCribNoshAuth';
import { useCribNoshOAuth } from '../hooks/useCribNoshOAuth';

// Example 1: Complete CribNosh Auth Integration
export const CribNoshAuthExample: React.FC = () => {
  const { 
    user, 
    isLoading, 
    isAuthenticated, 
    register, 
    login, 
    logout, 
    sendOTP, 
    verifyOTP,
    error 
  } = useCribNoshAuth();

  const { handleGoogleSignIn, handleAppleSignIn } = useCribNoshOAuth();

  const handleRegister = async () => {
    try {
      await register({
        email: 'user@example.com',
        password: 'password123',
        name: 'John Doe',
        confirmPassword: 'password123',
        phone_number: '+1234567890',
      });
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  const handleLogin = async () => {
    try {
      await login({
        email: 'user@example.com',
        password: 'password123',
      });
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleOTPFlow = async () => {
    try {
      // Send OTP
      await sendOTP('user@example.com');
      
      // In a real app, you'd show an OTP input form
      Alert.prompt(
        'Enter OTP',
        'Please enter the OTP sent to your email',
        async (otp) => {
          if (otp) {
            try {
              await verifyOTP('user@example.com', otp);
            } catch (error) {
              console.error('OTP verification failed:', error);
            }
          }
        }
      );
    } catch (error) {
      console.error('OTP flow failed:', error);
    }
  };

  if (isLoading) {
    return <Text style={styles.loading}>Loading...</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CribNosh Auth Integration</Text>
      
      {isAuthenticated ? (
        <View>
          <Text style={styles.welcome}>Welcome, {user?.name}!</Text>
          <Text style={styles.email}>Email: {user?.email}</Text>
          <Text style={styles.status}>Status: {user?.status}</Text>
          <Text style={styles.roles}>Roles: {user?.roles?.join(', ')}</Text>
          <TouchableOpacity style={styles.button} onPress={logout}>
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          <TouchableOpacity style={styles.button} onPress={handleRegister}>
            <Text style={styles.buttonText}>Register</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleOTPFlow}>
            <Text style={styles.buttonText}>OTP Flow</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {error && <Text style={styles.error}>Error: {error}</Text>}
    </View>
  );
};

// Example 2: Integration with existing SignInScreen
export const SignInScreenIntegration: React.FC = () => {
  const { handleGoogleSignIn, handleAppleSignIn } = useCribNoshOAuth();

  return (
    <SignInScreen
      onGoogleSignIn={handleGoogleSignIn}
      onAppleSignIn={handleAppleSignIn}
      backgroundImage={require('../assets/images/auth-background.jpg')}
    />
  );
};

// Example 3: OAuth-only authentication
export const OAuthOnlyExample: React.FC = () => {
  const { handleGoogleSignIn, handleAppleSignIn } = useCribNoshOAuth();

  const handleGoogle = async () => {
    try {
      // This would be called from your Google sign-in flow
      // with the actual idToken from Google
      await handleGoogleSignIn('mock-google-id-token');
    } catch (error) {
      console.error('Google sign-in failed:', error);
    }
  };

  const handleApple = async () => {
    try {
      // This would be called from your Apple sign-in flow
      // with the actual identityToken from Apple
      await handleAppleSignIn('mock-apple-identity-token');
    } catch (error) {
      console.error('Apple sign-in failed:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>OAuth Authentication</Text>
      
      <TouchableOpacity style={styles.button} onPress={handleGoogle}>
        <Text style={styles.buttonText}>Sign in with Google</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={handleApple}>
        <Text style={styles.buttonText}>Sign in with Apple</Text>
      </TouchableOpacity>
    </View>
  );
};

// Example 4: Phone OTP Authentication
export const PhoneOTPExample: React.FC = () => {
  const { sendOTP, verifyOTP, isLoading } = useCribNoshAuth();
  const [phone, setPhone] = useState('');

  const handleSendOTP = async () => {
    try {
      await sendOTP(phone);
      Alert.alert('OTP Sent', 'Please check your phone for the OTP code');
    } catch (error) {
      console.error('Failed to send OTP:', error);
    }
  };

  const handleVerifyOTP = async () => {
    Alert.prompt(
      'Enter OTP',
      'Please enter the OTP sent to your phone',
      async (otp) => {
        if (otp) {
          try {
            await verifyOTP(phone, otp);
          } catch (error) {
            console.error('OTP verification failed:', error);
          }
        }
      }
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Phone OTP Authentication</Text>
      
      <TouchableOpacity style={styles.button} onPress={handleSendOTP}>
        <Text style={styles.buttonText}>Send Phone OTP</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={handleVerifyOTP}>
        <Text style={styles.buttonText}>Verify OTP</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#02120A',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  welcome: {
    fontSize: 18,
    color: '#4CAF50',
    marginBottom: 10,
    textAlign: 'center',
  },
  email: {
    fontSize: 14,
    color: '#A0A0A0',
    marginBottom: 5,
    textAlign: 'center',
  },
  status: {
    fontSize: 14,
    color: '#A0A0A0',
    marginBottom: 5,
    textAlign: 'center',
  },
  roles: {
    fontSize: 14,
    color: '#A0A0A0',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  loading: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
  },
  error: {
    color: '#FF3B30',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
});
