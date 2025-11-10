import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { logger } from '../utils/Logger';
import { useSendDriverOTPMutation } from '../store/driverApi';
import { useGetCurrentUserQuery } from '../store/driverApi';

export default function DriverPhoneAuthScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mode = params.mode as string; // 'signin' or 'signup'

  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Use RTK Query hooks instead of Convex mutations
  const [sendDriverOTP, { isLoading: isSendingOTP }] = useSendDriverOTPMutation();
  
  // TODO: Replace with appropriate query to check if user exists by phone
  // For now, we'll skip the user check and let the API handle it
  const getUserByPhone = null; // Placeholder - may need to create API endpoint for this

  const handleBack = () => {
    router.back();
  };

  const formatPhoneNumber = (text: string) => {
    // Remove all non-digit characters
    const cleaned = text.replace(/\D/g, '');
    
    // Add country code if not present (assuming Nigeria +234)
    if (cleaned.length > 0 && !cleaned.startsWith('234')) {
      return '+234' + cleaned;
    } else if (cleaned.length > 0) {
      return '+' + cleaned;
    }
    
    return cleaned;
  };

  const handlePhoneNumberChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhoneNumber(formatted);
  };

  const validatePhoneNumber = (phone: string) => {
    // Basic validation for Nigerian phone numbers
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    return /^\+234[0-9]{10}$/.test(cleaned);
  };

  const handleContinue = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      Alert.alert('Error', 'Please enter a valid Nigerian phone number');
      return;
    }

    // Show loading state immediately
    setIsLoading(true);
    
    try {
      const purpose = mode === 'signup' ? 'DRIVER_SIGNUP' : 'DRIVER_SIGNIN';
      
      // TODO: Add user existence check if needed
      // For now, let the API handle validation
      // The API will return appropriate errors if the account doesn't exist or isn't a driver

      // Use RTK Query mutation
      const result = await sendDriverOTP({
        phoneNumber: phoneNumber,
      }).unwrap();

      if (result.success) {
        // Navigate to OTP verification screen
        router.push({
          pathname: '/otp-auth',
          params: {
            phoneNumber: phoneNumber,
            purpose: purpose,
            mode: mode,
          }
        });
      } else {
        Alert.alert('Error', result.message || 'Failed to send OTP');
      }
    } catch (error: any) {
      logger.error('Error sending OTP:', error);
      const errorMessage = error?.data?.error?.message || error?.message || 'Failed to send OTP. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const isButtonDisabled = !phoneNumber.trim() || !validatePhoneNumber(phoneNumber) || isLoading || isSendingOTP;

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
              source={require('../assets/images/white-greenlogo.png')} 
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
              name={mode === 'signup' ? 'car' : 'log-in'} 
              size={48} 
              color={Colors.light.primary} 
            />
          </View>

          {/* Title and Description */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>
              {mode === 'signup' ? 'Enter Your Phone Number' : 'Welcome Back, Driver'}
            </Text>
            <Text style={styles.description}>
              {mode === 'signup' 
                ? 'We\'ll send you a verification code to confirm your phone number'
                : 'Enter your phone number to sign in to your driver account'
              }
            </Text>
          </View>

          {/* Phone Number Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Ionicons name="call" size={20} color={Colors.light.icon} />
              <TextInput
                style={styles.phoneInput}
                value={phoneNumber}
                onChangeText={handlePhoneNumberChange}
                placeholder="+234 801 234 5678"
                placeholderTextColor={Colors.light.icon}
                keyboardType="phone-pad"
                autoFocus
                maxLength={15}
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
            {(isLoading || isSendingOTP) ? (
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

          {/* Switch to Email */}
          <TouchableOpacity 
            style={styles.switchButton}
            onPress={() => router.push(`/email-auth?mode=${mode}&phone=${encodeURIComponent(phoneNumber)}`)}
          >
            <Ionicons name="mail" size={16} color={Colors.light.primary} />
            <Text style={styles.switchButtonText}>
              Use email address instead
            </Text>
          </TouchableOpacity>

          {/* Help Text */}
          <View style={styles.helpContainer}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.light.icon} />
            <Text style={styles.helpText}>
              We'll send you a 6-digit code via SMS
            </Text>
          </View>

          {/* Terms and Privacy */}
          {mode === 'signup' && (
            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>
                By continuing, you agree to our{' '}
                <Text 
                  style={styles.linkText}
                  onPress={() => router.push('/terms-of-service' as any)}
                >
                  Terms of Service
                </Text>
                {' '}and{' '}
                <Text 
                  style={styles.linkText}
                  onPress={() => router.push('/privacy-policy' as any)}
                >
                  Privacy Policy
                </Text>
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
  phoneInput: {
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
    marginBottom: 24,
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
});
