import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BigPackaging from './BigPackaging';
import { Button } from './Button';
import { CountryCodePicker } from './CountryCodePicker';
import { CribNoshLogo } from './CribNoshLogo';
import { Input } from './Input';

interface Country {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
}

interface PhoneSignInModalProps {
  isVisible: boolean;
  onClose: () => void;
  onPhoneSubmit?: (phoneNumber: string) => void;
}

export function PhoneSignInModal({ 
  isVisible, 
  onClose, 
  onPhoneSubmit 
}: PhoneSignInModalProps) {
  const insets = useSafeAreaInsets();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [step, setStep] = useState<'phone' | 'verification'>('phone');
  const [verificationCode, setVerificationCode] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [isCountryPickerVisible, setIsCountryPickerVisible] = useState(false);

  const handlePhoneSubmit = () => {
    if (phoneNumber.trim()) {
      setStep('verification');
      onPhoneSubmit?.(phoneNumber.trim());
    }
  };

  const handleVerificationSubmit = () => {
    if (verificationCode.trim()) {
      // Handle verification code submission
      console.log('Verification code submitted:', verificationCode);
      onClose();
    }
  };

  const handleBackToPhone = () => {
    setStep('phone');
    setVerificationCode('');
  };

  const formatPhoneNumber = (text: string) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
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
        <View style={styles.content}>
          {step === 'phone' ? (
            <>
              <View style={styles.contentWrapper}>
                              <Text style={styles.title}>Get started with CribNosh</Text>
              <Text style={styles.subtitle}>
                Enter your phone number and we'll send you a secure verification code to sign in
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
                  disabled={phoneNumber.length < 10}
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
                We've sent a 6-digit code to {phoneNumber}
              </Text>
              
              <View style={styles.contentWrapper}>
                <Text style={styles.title}>Almost there!</Text>
                <Text style={styles.subtitle}>
                  We've sent a 6-digit code to {phoneNumber}. Enter it below to complete your sign in.
                </Text>
                
                <View style={styles.inputContainer}>
                  <Input
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChangeText={setVerificationCode}
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
                  disabled={verificationCode.length < 6}
                  size="lg"
                  style={styles.submitButton}
                  backgroundColor="#4ADE80"
                  textColor="#000000"
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
                  <Text style={styles.resendText}>Didn't get the code? Tap to resend</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
        
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
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
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    minHeight: 56,
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
});
