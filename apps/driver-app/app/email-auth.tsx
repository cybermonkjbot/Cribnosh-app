import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { logger } from '../utils/Logger';
import { useEmailLoginMutation } from '../store/driverApi';

export default function DriverEmailAuthScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mode = params.mode as string; // 'signin' or 'signup'

  const [email, setEmail] = useState(typeof params.email === 'string' ? params.email : Array.isArray(params.email) ? params.email[0] || '' : '');
  const [isLoading, setIsLoading] = useState(false);

  // TODO: Email OTP may not be available - use email/password login instead
  // For now, we'll use email login mutation
  const [emailLogin, { isLoading: isLoggingIn }] = useEmailLoginMutation();
  
  // TODO: Replace with appropriate query to check if user exists by email
  // For now, we'll skip the user check and let the API handle it
  const getUserByEmail = null; // Placeholder - may need to create API endpoint for this

  const handleBack = () => {
    router.back();
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleContinue = async () => {
    const emailStr = typeof email === 'string' ? email : Array.isArray(email) ? email[0] || '' : '';
    if (!emailStr.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!isValidEmail(emailStr)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Show loading state immediately
    setIsLoading(true);
    
    try {
      // Determine the purpose first
      const purpose = mode === 'signup' ? 'SIGNUP' : 'SIGNIN';
      
      // TODO: Email OTP may not be available in web API
      // For now, redirect to password login or registration
      if (mode === 'signin') {
        // For signin, redirect to password entry screen
        Alert.alert(
          'Email Login',
          'Please use password login for email authentication.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Continue', 
              onPress: () => router.push(`/login?email=${encodeURIComponent(emailStr)}`)
            }
          ]
        );
        return;
      } else {
        // For signup, redirect to registration
        Alert.alert(
          'Email Registration',
          'Please use the registration screen to create a driver account.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Register', 
              onPress: () => router.push(`/register?email=${encodeURIComponent(emailStr)}`)
            }
          ]
        );
        return;
      }
    } catch (error) {
      logger.error('Error sending email OTP:', error);
      Alert.alert('Error', 'Failed to send verification email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const emailStr = typeof email === 'string' ? email : Array.isArray(email) ? email[0] || '' : '';
  const isButtonDisabled = !emailStr.trim() || !isValidEmail(emailStr) || isLoading;

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
            <Image 
              source={require('../assets/depictions/logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
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
            <Text style={styles.title}>
              {mode === 'signup' ? 'Enter Your Email Address' : 'Welcome Back, Driver'}
            </Text>
            <Text style={styles.description}>
              {mode === 'signup' 
                ? 'We\'ll send you a verification code to confirm your email address'
                : 'Enter your email address to sign in to your driver account'
              }
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
              isButtonDisabled && styles.continueButtonDisabled
            ]}
            onPress={handleContinue}
            disabled={isButtonDisabled}
          >
            {isLoading ? (
              <Text style={styles.continueButtonText}>
                Sending...
              </Text>
            ) : (
              <>
                <Ionicons name="arrow-forward" size={20} color={Colors.light.background} />
                <Text style={styles.continueButtonText}>Continue</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Switch to Phone */}
          <TouchableOpacity 
            style={styles.switchButton}
            onPress={() => router.push(`/phone-auth?mode=${mode}&email=${encodeURIComponent(email)}`)}
          >
            <Ionicons name="call" size={16} color={Colors.light.primary} />
            <Text style={styles.switchButtonText}>
              Use phone number instead
            </Text>
          </TouchableOpacity>

          {/* Help Text */}
          <View style={styles.helpContainer}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.light.icon} />
            <Text style={styles.helpText}>
              We'll send you a 6-digit code via email
            </Text>
          </View>

          {/* Terms and Privacy */}
          {mode === 'signup' && (
            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>
                By continuing, you agree to our{' '}
                <Text style={styles.linkText}>Terms of Service</Text>
                {' '}and{' '}
                <Text style={styles.linkText}>Privacy Policy</Text>
              </Text>
            </View>
          )}
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
  logo: {
    width: 120,
    height: 32,
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
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  continueButtonDisabled: {
    backgroundColor: Colors.light.icon,
    opacity: 0.6,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.background,
    marginLeft: 8,
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  switchButtonText: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '600',
    marginLeft: 8,
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  helpText: {
    fontSize: 14,
    color: Colors.light.icon,
    marginLeft: 8,
  },
  termsContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  termsText: {
    fontSize: 14,
    color: Colors.light.icon,
    textAlign: 'center',
    lineHeight: 20,
  },
  linkText: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
});

