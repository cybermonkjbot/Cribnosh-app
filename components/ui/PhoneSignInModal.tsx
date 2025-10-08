import { useAuthContext } from '@/contexts/AuthContext';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { showError, showSuccess } from '../../lib/GlobalToastManager';
import BigPackaging from './BigPackaging';
import { Button } from './Button';
import { CountryCodePicker } from './CountryCodePicker';
import { CribNoshLogo } from './CribNoshLogo';
import { Input } from './Input';


interface PhoneSignInModalProps {
  isVisible: boolean;
  onClose: () => void;
  onPhoneSubmit?: (phoneNumber: string) => void;
  onSignInSuccess?: () => void;
}

export function PhoneSignInModal({ 
  isVisible, 
  onClose, 
  onPhoneSubmit,
  onSignInSuccess
}: PhoneSignInModalProps) {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [step, setStep] = useState<'phone' | 'verification'>('phone');
  const [verificationCode, setVerificationCode] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [isCountryPickerVisible, setIsCountryPickerVisible] = useState(false);
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [isCompletingSignIn, setIsCompletingSignIn] = useState(false);
  const { handleSendOTP, handlePhoneLogin } = useAuth();
  const { login } = useAuthContext();
  
  const handlePhoneSubmit = async () => {
    if (isSendingOTP) return;
    setIsSendingOTP(true);
    try {
      const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
      // Ensure country code doesn't have + prefix when concatenating
      const countryCodeClean = countryCode.startsWith('+') ? countryCode.slice(1) : countryCode;
      const fullPhoneNumber = `+${countryCodeClean}${cleanPhoneNumber}`;
      const res = await handleSendOTP(fullPhoneNumber);
      if (res.data.success){
        onPhoneSubmit?.(fullPhoneNumber)
        showSuccess('OTP Sent', res.data.message || 'Verification code sent to your phone');
        setStep('verification');
      }
    
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      
      // Extract precise error message from API response
      let errorTitle = 'Failed to Send OTP';
      let errorMessage = 'Please check your phone number and try again';
      
      if (error?.data?.error) {
        const apiError = error.data.error;
        
        if (apiError === 'Too many requests') {
          errorTitle = 'Too Many Requests';
          // Check if there's a retryAfter field in the error
          const retryAfter = error?.data?.retryAfter;
          if (retryAfter) {
            errorMessage = `Please wait ${retryAfter} seconds before requesting another code`;
          } else {
            errorMessage = 'Please wait a moment before requesting another code';
          }
        } else if (apiError.includes('Invalid phone number')) {
          errorTitle = 'Invalid Phone Number';
          errorMessage = 'Please enter a valid phone number';
        } else if (apiError.includes('Phone number not found')) {
          errorTitle = 'Phone Number Not Found';
          errorMessage = 'This phone number is not registered with us';
        } else {
          errorMessage = apiError;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      showError(errorTitle, errorMessage);
    } finally {
      setIsSendingOTP(false);
    }
  };

  const handleVerificationSubmit = async () => {
    if (isCompletingSignIn) return;
    setIsCompletingSignIn(true);
    try {
      const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
      // Ensure country code doesn't have + prefix when concatenating
      const countryCodeClean = countryCode.startsWith('+') ? countryCode.slice(1) : countryCode;
      const fullPhoneNumber = `+${countryCodeClean}${cleanPhoneNumber}`;
      console.log('Verifying phone number:', fullPhoneNumber);
      const res = await handlePhoneLogin(fullPhoneNumber, verificationCode);
      if (res.data?.token && res.data?.user) {
        // Ensure user data has all required fields
        const userData = res.data.user;
        console.log('Received user data:', userData);
        console.log('User data validation:', {
          hasUserId: !!userData.user_id,
          hasEmail: !!userData.email,
          hasName: !!userData.name,
          userId: userData.user_id,
          email: userData.email,
          name: userData.name
        });
        
        if (userData.user_id && userData.name) {
          // Use the auth state hook to store data
          console.log('Calling login function with token and user data');
          await login(res.data.token, {
            user_id: userData.user_id,
            email: userData.email || '', // Allow empty email for phone-only auth
            name: userData.name,
            roles: userData.roles || [],
            picture: userData.picture || '',
            isNewUser: userData.isNewUser || false,
            provider: userData.provider || 'phone'
          });
          console.log('Login function completed');
          
          // Show success toast
          showSuccess('Sign In Successful', 'Welcome to CribNosh!');
          
          // Close modal and notify parent after a short delay
          setTimeout(() => {
            onClose();
            setStep('phone');
            onSignInSuccess?.();
          }, 1500); // Give time for toast to show
        } else {
          throw new Error('Invalid user data received');
        }
      }
    } catch (error: any) {
      console.error('Error completing sign in:', error);
      
      // Extract precise error message from API response
      let errorTitle = 'Sign In Failed';
      let errorMessage = 'Please check your verification code and try again';
      
      if (error?.data?.error) {
        const apiError = error.data.error;
        
        if (apiError.includes('Invalid verification code') || apiError.includes('Invalid OTP')) {
          errorTitle = 'Invalid Verification Code';
          errorMessage = 'The code you entered is incorrect. Please try again';
        } else if (apiError.includes('Code expired')) {
          errorTitle = 'Code Expired';
          errorMessage = 'Your verification code has expired. Please request a new one';
        } else if (apiError.includes('Too many attempts')) {
          errorTitle = 'Too Many Attempts';
          errorMessage = 'You have made too many attempts. Please wait before trying again';
        } else if (apiError.includes('Account not found')) {
          errorTitle = 'Account Not Found';
          errorMessage = 'No account found with this phone number';
        } else {
          errorMessage = apiError;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      showError(errorTitle, errorMessage);
    } finally {
      setIsCompletingSignIn(false);
    }
  };

  const handleBackToPhone = () => {
    setStep('phone');
    setVerificationCode('');
  };

  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    } else {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhoneNumber(formatted);
    
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleVerificationChange = (text: string) => {
    setVerificationCode(text);
    
    // Scroll to show button when typing
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
    >
      
       <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          {step === 'verification' && (
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={handleBackToPhone}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Logo - positioned at top like main sign-in screen */}
        <View style={styles.logoContainer}>
          <CribNoshLogo size={120} variant="default" />
        </View>

        {/* Content */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={true}
        >
          {step === 'phone' ? (
            <>
              <View style={styles.contentWrapper}>
                              <Text style={styles.title}>Get started with CribNosh</Text>
              <Text style={styles.subtitle}>
                Enter your phone number and we&apos;ll send you a secure verification code to sign in
              </Text>
                
                <View style={styles.inputContainer}>
                  <View style={styles.phoneInputWrapper}>
                    <TouchableOpacity 
                      style={styles.countryCodeButton}
                      onPress={() => setIsCountryPickerVisible(true)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.countryCodeText}>{countryCode}</Text>
                      <Ionicons name="chevron-down" size={16} color="#E6FFE8" />
                    </TouchableOpacity>
                    <View style={styles.phoneInputDivider} />
                    <Input
                      placeholder="(555) 123-4567"
                      value={phoneNumber}
                      onChangeText={handlePhoneChange}
                      keyboardType="phone-pad"
                      maxLength={14}
                      size="lg"
                      style={styles.phoneInput}
                      leftIcon={
                        <Ionicons name="call-outline" size={20} color="#E6FFE8" />
                      }
                    />
                  </View>
                </View>

                <Button
                  onPress={handlePhoneSubmit}
                  disabled={phoneNumber.length < 10 || isSendingOTP}
                  loading={isSendingOTP}
                  size="lg"
                  style={styles.submitButton}
                  elevated
                >
                  Send Code
                </Button>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.title}>Verify your phone</Text>
              <Text style={styles.subtitle}>
                We&apos;ve sent a 6-digit code to {phoneNumber}
              </Text>
              
              <View style={styles.contentWrapper}>
                <Text style={styles.title}>Almost there!</Text>
                <Text style={styles.subtitle}>
                  We&apos;ve sent a 6-digit code to {phoneNumber}. Enter it below to complete your sign in.
                </Text>
                
                <View style={styles.inputContainer}>
                  <Input
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChangeText={handleVerificationChange}
                    keyboardType="number-pad"
                    maxLength={6}
                    size="lg"
                    leftIcon={
                      <Ionicons name="key-outline" size={20} color="#E6FFE8" />
                    }
                  />
                </View>

                <Button
                  onPress={handleVerificationSubmit}
                  disabled={verificationCode.length < 6 || isCompletingSignIn}
                  loading={isCompletingSignIn}
                  size="lg"
                  style={[styles.submitButton, { paddingHorizontal: 32 }]}
                  backgroundColor="#4ADE80"
                  textColor="#FFFFFF"
                  borderRadius={20}
                  paddingVertical={20}
                  elevated
                >
                  Complete Sign In
                </Button>

                <TouchableOpacity 
                  style={styles.resendButton}
                  onPress={() => console.log('Resend code')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.resendText}>Didn&apos;t get the code? Tap to resend</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
        
        {/* Modal Toast */}
        {modalToast && (
          <View style={styles.modalToast}>
            <View style={[styles.modalToastContent, { backgroundColor: modalToast.type === 'success' ? '#10B981' : '#EF4444' }]}>
              <Text style={styles.modalToastTitle}>{modalToast.title}</Text>
              <Text style={styles.modalToastMessage}>{modalToast.message}</Text>
            </View>
          </View>
        )}
        
        {/* BigPackaging decoration - bottom right */}
        <View style={styles.packagingDecoration}>
          <BigPackaging />
        </View>
       </View>
      
      {/* Country Code Picker */}
      <CountryCodePicker
        isVisible={isCountryPickerVisible}
        onClose={() => setIsCountryPickerVisible(false)}
        onSelectCountry={(country) => {
          setCountryCode(country.dialCode);
          setIsCountryPickerVisible(false);
        }}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#02120A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    zIndex: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    position: 'absolute',
    left: 23,
    top: 80,
    zIndex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 200,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  contentWrapper: {
    alignItems: 'flex-start',
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontFamily: 'Poppins',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 32,
    lineHeight: 40,
    color: '#FFFFFF',
    textAlign: 'left',
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: 'SF Pro',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 17,
    lineHeight: 24,
    color: '#E5E7EB',
    textAlign: 'left',
    marginBottom: 48,
    opacity: 0.9,
    maxWidth: 280,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 32,
    maxWidth: 320,
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A4A4A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    width: '100%',
  },
  countryCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.1)',
  },
  countryCodeText: {
    color: '#E6FFE8',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  phoneInputDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  phoneInput: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
    marginRight: 8,
    minWidth: 0,
  },
  submitButton: {
    width: '100%',
    marginBottom: 24,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    minHeight: 64,
  },
  resendButton: {
    paddingVertical: 12,
  },
  resendText: {
    fontFamily: 'SF Pro',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 18,
    color: '#4ADE80',
    textAlign: 'center',
  },
  packagingDecoration: {
    position: 'absolute',
    bottom: -60,
    right: -80,
    zIndex: 1,
    opacity: 0.3,
    transform: [{ scale: 1.5 }],
  },
  modalToast: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    zIndex: 9999,
  },
  modalToastContent: {
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalToastTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  modalToastMessage: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
});
