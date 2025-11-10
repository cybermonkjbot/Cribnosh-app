import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { logger } from '../utils/Logger';
import { useEmailLoginMutation } from '../store/driverApi';
import { CribNoshLogo } from '../components/CribNoshLogo';

export default function DriverEmailAuthScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [email, setEmail] = useState(typeof params.email === 'string' ? params.email : Array.isArray(params.email) ? params.email[0] || '' : '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null);

  const [emailLogin] = useEmailLoginMutation();

  const handleBack = () => {
    if (isNewUser !== null) {
      // Reset to email entry
      setIsNewUser(null);
      setPassword('');
      setShowPassword(false);
    } else {
      router.back();
    }
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailContinue = async () => {
    const emailStr = typeof email === 'string' ? email : Array.isArray(email) ? email[0] || '' : '';
    if (!emailStr.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!isValidEmail(emailStr)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Move to password entry - we'll check if user exists during login
    setIsNewUser(false);
  };

  const handleLogin = async () => {
    const emailStr = typeof email === 'string' ? email : Array.isArray(email) ? email[0] || '' : '';
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await emailLogin({ email: emailStr, password }).unwrap();
      
      if (result.success) {
        // Navigate to dashboard - auth context will handle the rest
        router.replace('/dashboard');
      } else {
        Alert.alert('Error', result.message || 'Invalid email or password. Please try again.');
      }
    } catch (error: any) {
      logger.error('Login error:', error);
      
      // Check if it's a network error
      if (error?.status === 'FETCH_ERROR' || error?.error === 'TypeError: Network request failed') {
        Alert.alert(
          'Connection Error',
          'Unable to connect to the server. Please check your internet connection and try again.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      const errorMessage = error?.data?.message || error?.data?.error?.message || error?.message || '';
      const status = error?.status;
      
      // For 401 errors, show error with option to create account
      // The API doesn't distinguish between "user not found" and "wrong password" for security
      if (status === 401 || errorMessage.toLowerCase().includes('invalid credentials')) {
        Alert.alert(
          'Invalid Credentials',
          'The email or password you entered is incorrect. Would you like to create a new account?',
          [
            { text: 'Try Again', style: 'cancel' },
            { 
              text: 'Create Account', 
              onPress: () => {
                setIsNewUser(true);
                setPassword('');
              }
            }
          ]
        );
      } else if (errorMessage.toLowerCase().includes('not found') || 
                 errorMessage.toLowerCase().includes('does not exist') ||
                 errorMessage.toLowerCase().includes('no account')) {
        // Explicit "user not found" - show signup option
        setIsNewUser(true);
        setPassword('');
      } else if (errorMessage) {
        // Other error
        Alert.alert('Error', errorMessage);
      } else {
        // Unknown error
        Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = () => {
    const emailStr = typeof email === 'string' ? email : Array.isArray(email) ? email[0] || '' : '';
    router.push(`/register?email=${encodeURIComponent(emailStr)}`);
  };

  const emailStr = typeof email === 'string' ? email : Array.isArray(email) ? email[0] || '' : '';
  const isEmailButtonDisabled = !emailStr.trim() || !isValidEmail(emailStr);
  const isPasswordButtonDisabled = !password.trim() || isLoading;

  // Show password entry for existing users
  if (isNewUser === false) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
            </TouchableOpacity>
            <View style={styles.logoContainer}>
              <CribNoshLogo size={120} variant="default" />
            </View>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.content}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <Ionicons 
                name="lock-closed" 
                size={48} 
                color={Colors.light.primary} 
              />
            </View>

            {/* Title and Description */}
            <View style={styles.textContainer}>
              <Text style={styles.title}>Welcome Back!</Text>
              <Text style={styles.description}>
                Enter your password to sign in to your driver account
              </Text>
            </View>

            {/* Email Display */}
            <View style={styles.emailDisplayContainer}>
              <Text style={styles.emailDisplayText}>{emailStr}</Text>
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed" size={20} color={Colors.light.icon} />
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor={Colors.light.icon}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.passwordToggle}
                >
                  <Ionicons 
                    name={showPassword ? "eye-off" : "eye"} 
                    size={20} 
                    color={Colors.light.icon} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[
                styles.continueButton,
                isPasswordButtonDisabled && styles.continueButtonDisabled
              ]}
              onPress={handleLogin}
              disabled={isPasswordButtonDisabled}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={Colors.light.background} />
              ) : (
                <>
                  <Text style={styles.continueButtonText}>Sign In</Text>
                  <Ionicons name="arrow-forward" size={20} color={Colors.light.background} />
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Show signup prompt for new users
  if (isNewUser === true) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
            </TouchableOpacity>
            <View style={styles.logoContainer}>
              <CribNoshLogo size={120} variant="default" />
            </View>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.content}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <Ionicons 
                name="person-add" 
                size={48} 
                color={Colors.light.primary} 
              />
            </View>

            {/* Title and Description */}
            <View style={styles.textContainer}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.description}>
                We don't have an account with this email. Let's create one for you!
              </Text>
            </View>

            {/* Email Display */}
            <View style={styles.emailDisplayContainer}>
              <Text style={styles.emailDisplayText}>{emailStr}</Text>
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleSignup}
            >
              <Text style={styles.continueButtonText}>Create Account</Text>
              <Ionicons name="arrow-forward" size={20} color={Colors.light.background} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Default: Email entry screen
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <CribNoshLogo size={120} variant="default" />
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons 
              name="mail" 
              size={48} 
              color={Colors.light.primary} 
            />
          </View>

          {/* Title and Description */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>Enter Your Email</Text>
            <Text style={styles.description}>
              Enter your email address to continue
            </Text>
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail" size={20} color={Colors.light.icon} />
              <TextInput
                style={styles.emailInput}
                value={email}
                onChangeText={setEmail}
                placeholder="email@example.com"
                placeholderTextColor={Colors.light.icon}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
              />
            </View>
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={[
              styles.continueButton,
              isEmailButtonDisabled && styles.continueButtonDisabled
            ]}
            onPress={handleEmailContinue}
            disabled={isEmailButtonDisabled}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color={Colors.light.background} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.secondary,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 32,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: Colors.light.icon,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  inputContainer: {
    marginBottom: 32,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: Colors.light.secondary,
  },
  emailInput: {
    flex: 1,
    fontSize: 18,
    color: Colors.light.text,
    marginLeft: 12,
    fontWeight: '500',
  },
  passwordInput: {
    flex: 1,
    fontSize: 18,
    color: Colors.light.text,
    marginLeft: 12,
    fontWeight: '500',
  },
  passwordToggle: {
    padding: 4,
  },
  emailDisplayContainer: {
    backgroundColor: Colors.light.secondary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  emailDisplayText: {
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: '500',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 16,
    gap: 8,
  },
  continueButtonDisabled: {
    backgroundColor: Colors.light.icon,
    opacity: 0.6,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.background,
  },
});

