import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, StyleSheet, Text as RNText, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { logger } from '../utils/Logger';
import { useDriverAuth } from '../contexts/EnhancedDriverAuthContext';
import { sessionManager } from '../lib/convex';
import { usePhoneLoginMutation } from '../store/driverApi';

export default function DriverOTPAuthScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const phoneNumber = params.phoneNumber as string;
  const email = params.email as string;
  const purpose = params.purpose as string;
  const mode = params.mode as string;
  const authType = params.authType as string || 'phone'; // 'phone' or 'email'

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');

  const otpInputRefs = useRef<(TextInput | null)[]>([]);
  const { verifyDriverOTP, sendDriverOTP, driver, isAuthenticated, isLoading: authLoading, setSessionToken } = useDriverAuth();
  
  // Use RTK Query hooks instead of Convex mutations
  const [phoneLogin, { isLoading: isVerifyingPhone }] = usePhoneLoginMutation();
  const [sendDriverOTPAPI, { isLoading: isSendingOTP }] = useSendDriverOTPMutation();
  
  // TODO: Email OTP may not be available - may need to create endpoint or use alternative
  // For now, email OTP verification is not implemented
  const [shouldNavigate, setShouldNavigate] = useState(false);

  useEffect(() => {
    // Countdown timer for OTP expiry
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Resend cooldown timer
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendCooldown]);

  // Wait for auth state to be ready after successful signin before navigating
  useEffect(() => {
    if (!shouldNavigate) return;

    let timer: NodeJS.Timeout;
    let fallbackTimer: NodeJS.Timeout;

    // If auth state is confirmed, navigate after short delay
    if (!authLoading && isAuthenticated && driver) {
      timer = setTimeout(() => {
        router.replace('/dashboard');
      }, 500);
    } else {
      // Fallback: Navigate after 2 seconds even if auth state isn't confirmed yet
      // This prevents users from getting stuck if auth queries are slow
      fallbackTimer = setTimeout(() => {
        logger.info('Fallback navigation triggered - auth queries may be slow');
        router.replace('/dashboard');
      }, 2000);
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, [shouldNavigate, authLoading, isAuthenticated, driver, router]);

  const handleBack = () => {
    router.back();
  };

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      // Handle paste
      const pastedOtp = value.replace(/\D/g, '').slice(0, 6);
      const newOtp = [...otp];
      for (let i = 0; i < pastedOtp.length && i < 6; i++) {
        newOtp[i] = pastedOtp[i];
      }
      setOtp(newOtp);
      
      // Focus the next empty input or the last one
      const nextIndex = Math.min(pastedOtp.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
    } else {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-focus next input
      if (value && index < 5) {
        otpInputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the complete 6-digit code');
      return;
    }

    if (timeRemaining <= 0) {
      Alert.alert('OTP Expired', 'The OTP has expired. Please request a new one.');
      return;
    }

    setIsVerifying(true);
    try {
      if (authType === 'email' && email) {
        // TODO: Email OTP verification may not be available in web API
        // For now, show error message
        Alert.alert(
          'Email OTP Not Available',
          'Email OTP verification is not currently available. Please use phone number authentication or password login.',
          [{ text: 'OK' }]
        );
        return;
      } else if (authType === 'phone' && phoneNumber) {
        // Phone OTP verification - use RTK Query mutation
        try {
          const result = await phoneLogin({
            phoneNumber: phoneNumber,
            otp: otpCode,
          }).unwrap();

          // Session token is automatically stored by the mutation's transformResponse
          if (result.success) {
            setSuccessMessage('Signing you in...');
            setShouldNavigate(true);
          } else {
            Alert.alert('Invalid OTP', result.message || 'The OTP you entered is incorrect. Please try again.');
          }
        } catch (error: any) {
          logger.error('Error verifying OTP:', error);
          const errorMessage = error?.data?.error?.message || error?.message || 'Failed to verify OTP. Please try again.';
          Alert.alert('Error', errorMessage);
        }
      }
    } catch (error: any) {
      logger.error('Error verifying OTP:', error);
      const errorMessage = error?.data?.error?.message || error?.message || 'Failed to verify OTP. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    try {
      let result;
      if (authType === 'email' && email) {
        // TODO: Email OTP may not be available
        Alert.alert('Error', 'Email OTP resend is not currently available. Please use phone number authentication.');
        return;
      } else if (authType === 'phone' && phoneNumber) {
        // Use RTK Query mutation
        result = await sendDriverOTPAPI({
          phoneNumber: phoneNumber,
        }).unwrap();
      } else {
        Alert.alert('Error', 'Invalid authentication type');
        return;
      }

      if (result.success) {
        Alert.alert(
          'OTP Sent', 
          authType === 'email' 
            ? 'A new verification code has been sent to your email.' 
            : 'A new verification code has been sent to your phone.'
        );
        setTimeRemaining(600); // Reset timer
        setResendCooldown(30); // 30 second cooldown
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        otpInputRefs.current[0]?.focus();
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      logger.error('Error resending OTP:', error);
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatPhoneNumber = (phone: string) => {
    // Format phone number for display
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    if (cleaned.startsWith('+234')) {
      const number = cleaned.slice(4);
      return `+234 ${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6)}`;
    }
    return phone;
  };

  const isButtonDisabled = otp.join('').length !== 6 || timeRemaining <= 0 || isVerifying;

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
            <Ionicons name="car" size={48} color={Colors.light.primary} />
          </View>

          {/* Title and Description */}
          <View style={styles.textContainer}>
            <RNText style={styles.title}>
              Enter Verification Code
            </RNText>
            <RNText style={styles.description}>
              We've sent a 6-digit code to{'\n'}
              <RNText style={styles.phoneNumber}>
                {authType === 'email' 
                  ? email 
                  : formatPhoneNumber(phoneNumber)}
              </RNText>
            </RNText>
          </View>

          {/* OTP Input */}
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref: TextInput | null) => { otpInputRefs.current[index] = ref; }}
                style={[
                  styles.otpInput,
                  digit && styles.otpInputFilled
                ]}
                value={digit}
                onChangeText={(value: string) => handleOtpChange(value, index)}
                onKeyPress={({ nativeEvent }: { nativeEvent: any }) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="numeric"
                maxLength={6}
                textAlign="center"
                selectTextOnFocus
              />
            ))}
          </View>

          {/* Timer */}
          {!successMessage && (
            <View style={styles.timerContainer}>
              <Ionicons name="time-outline" size={20} color={Colors.light.icon} />
              <RNText style={styles.timerText}>
                Code expires in {formatTime(timeRemaining)}
              </RNText>
            </View>
          )}

          {/* Success Message */}
          {successMessage && (
            <View style={styles.successContainer}>
              <Ionicons name="checkmark-circle" size={24} color={Colors.light.accent} />
              <RNText style={styles.successText}>{successMessage}</RNText>
            </View>
          )}

          {/* Verify Button */}
          <TouchableOpacity
            style={[
              styles.verifyButton,
              isButtonDisabled && styles.verifyButtonDisabled
            ]}
            onPress={handleVerifyOTP}
            disabled={isButtonDisabled}
          >
            {isVerifying ? (
              <RNText style={styles.verifyButtonText}>Verifying...</RNText>
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color={Colors.light.background} />
                <RNText style={styles.verifyButtonText}>Verify</RNText>
              </>
            )}
          </TouchableOpacity>

          {/* Resend Button */}
          <TouchableOpacity 
            style={[
              styles.resendButton,
              !canResend && styles.resendButtonDisabled
            ]}
            onPress={handleResendOTP}
            disabled={!canResend}
          >
            <Ionicons 
              name="refresh" 
              size={20} 
              color={canResend ? Colors.light.primary : Colors.light.icon} 
            />
            <RNText style={[
              styles.resendButtonText,
              !canResend && styles.resendButtonTextDisabled
            ]}>
              {canResend ? 'Resend Code' : `Resend in ${resendCooldown}s`}
            </RNText>
          </TouchableOpacity>

          {/* Help Text */}
          <View style={styles.helpContainer}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.light.icon} />
            <RNText style={styles.helpText}>
              Didn't receive the code? Check your {authType === 'email' ? 'email' : 'SMS'} or try resending
            </RNText>
          </View>
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
  },
  phoneNumber: {
    fontWeight: '600',
    color: Colors.light.text,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  otpInput: {
    width: 45,
    height: 55,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light.secondary,
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
    textAlign: 'center',
  },
  otpInputFilled: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary + '10',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  timerText: {
    fontSize: 16,
    color: Colors.light.icon,
    marginLeft: 8,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    padding: 16,
    backgroundColor: Colors.light.accent + '20',
    borderRadius: 12,
  },
  successText: {
    fontSize: 16,
    color: Colors.light.accent,
    marginLeft: 8,
    fontWeight: '600',
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  verifyButtonDisabled: {
    backgroundColor: Colors.light.icon,
    opacity: 0.6,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.background,
    marginLeft: 8,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: Colors.light.primary,
  },
  resendButtonDisabled: {
    borderColor: Colors.light.icon,
    opacity: 0.6,
  },
  resendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.primary,
    marginLeft: 8,
  },
  resendButtonTextDisabled: {
    color: Colors.light.icon,
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  helpText: {
    fontSize: 14,
    color: Colors.light.icon,
    marginLeft: 8,
    textAlign: 'center',
    flex: 1,
  },
});
