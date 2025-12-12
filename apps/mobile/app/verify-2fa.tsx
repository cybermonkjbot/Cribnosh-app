import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '../lib/ToastContext';
import { useAuth } from '@/hooks/useAuth';

// Back arrow SVG
const backArrowSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M19 12H5M12 19L5 12L12 5" stroke="#094327" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const shieldIconSVG = `<svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M40 10L10 20V35C10 50 20 62.5 40 70C60 62.5 70 50 70 35V20L40 10Z" fill="#FF3B30" fill-opacity="0.1"/>
  <path d="M40 10L10 20V35C10 50 20 62.5 40 70C60 62.5 70 50 70 35V20L40 10Z" stroke="#FF3B30" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M30 40L36 46L50 32" stroke="#FF3B30" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export default function Verify2FAScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { showToast } = useToast();
  const { login } = useAuthContext();
  const { handleVerify2FA } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  const verificationToken = params.verificationToken as string;
  const [code, setCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const inputRefs = useRef<(TextInput | null)[]>([]);
  
  useEffect(() => {
    if (!verificationToken) {
      Alert.alert('Error', 'Invalid verification session. Please try signing in again.');
      router.back();
    }
  }, [verificationToken, router]);
  
  const handleCodeChange = (text: string, index: number) => {
    // Only allow digits
    const cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.length > 1) {
      return; // Prevent multiple digits in one input
    }
    
    const newCode = code.split('');
    newCode[index] = cleaned;
    const updatedCode = newCode.join('').slice(0, 6);
    setCode(updatedCode);
    setError(null);
    
    // Auto-focus next input
    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Auto-submit when 6 digits are entered (for TOTP codes)
    if (!useBackupCode && updatedCode.length === 6 && updatedCode.split('').every(d => d !== '')) {
      handleVerify();
    }
  };
  
  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };
  
  const handleVerify = async () => {
    if (code.length !== 6) {
      setError(useBackupCode ? 'Please enter a valid backup code.' : 'Please enter a 6-digit code.');
      return;
    }
    
    if (!verificationToken) {
      setError('Invalid verification session. Please try signing in again.');
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await handleVerify2FA(verificationToken, code.trim());
      
      if (result.data?.token && result.data?.user) {
        // Store authentication data
        await login(result.data.token, {
          user_id: result.data.user.user_id,
          email: result.data.user.email || '',
          name: result.data.user.name,
          roles: result.data.user.roles || [],
          picture: result.data.user.picture || '',
          isNewUser: result.data.user.isNewUser || false,
          provider: result.data.user.provider || 'email',
        });
        
        showToast({
          type: 'success',
          title: 'Verification Successful',
          message: 'You have been signed in successfully.',
          duration: 3000,
        });
        
        // Navigate to onboarding for new users, otherwise to main app
        if (result.data.user.isNewUser === true) {
          router.replace('/onboarding' as any);
        } else {
          router.replace('/(tabs)' as any);
        }
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Error verifying 2FA:', error);
      const errorMessage =
        error?.data?.error?.message ||
        error?.data?.message ||
        error?.message ||
        'Invalid code. Please try again.';
      setError(errorMessage);
      
      // Clear code on error
      setCode('');
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleBack = () => {
    router.back();
  };
  
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          title: 'Verify 2FA',
        }}
      />
      <SafeAreaView style={styles.mainContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAFFFA" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <SvgXml xml={backArrowSVG} width={24} height={24} />
          </TouchableOpacity>
        </View>
        
        {/* Content */}
        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <SvgXml xml={shieldIconSVG} width={80} height={80} />
          </View>
          
          {/* Title */}
          <Text style={styles.title}>Two-Factor Authentication</Text>
          <Text style={styles.subtitle}>
            {useBackupCode
              ? 'Enter one of your backup codes'
              : 'Enter the 6-digit code from your authenticator app'}
          </Text>
          
          {/* Code Input (shown when NOT using backup code) */}
          {!useBackupCode && (
            <View style={styles.codeContainer}>
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  style={[
                    styles.codeInput,
                    code[index] && styles.codeInputFilled,
                    error && styles.codeInputError,
                  ]}
                  value={code[index] || ''}
                  onChangeText={(text) => handleCodeChange(text, index)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  autoFocus={index === 0}
                />
              ))}
            </View>
          )}
          
          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          
          {/* Backup Code Toggle */}
          <TouchableOpacity
            style={styles.backupToggle}
            onPress={() => {
              setUseBackupCode(!useBackupCode);
              setCode('');
              setError(null);
              inputRefs.current[0]?.focus();
            }}
          >
            <Text style={styles.backupToggleText}>
              {useBackupCode ? 'Use authenticator code' : 'Use backup code instead'}
            </Text>
          </TouchableOpacity>
          
          {/* Backup Code Input (shown when useBackupCode is true) */}
          {useBackupCode && (
            <View style={styles.backupCodeInputContainer}>
              <TextInput
                style={[styles.backupCodeInput, error && styles.backupCodeInputError]}
                value={code}
                onChangeText={(text) => {
                  // Allow alphanumeric for backup codes
                  const cleaned = text.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
                  setCode(cleaned);
                  setError(null);
                }}
                placeholder="Enter backup code"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="characters"
                autoFocus
                maxLength={16} // Backup codes are typically 8-16 characters
              />
            </View>
          )}
          
          {/* Verify Button */}
          <TouchableOpacity
            style={[
              styles.verifyButton,
              ((!useBackupCode && code.length !== 6) || (useBackupCode && code.length < 8) || isLoading) && styles.verifyButtonDisabled
            ]}
            onPress={handleVerify}
            disabled={((!useBackupCode && code.length !== 6) || (useBackupCode && code.length < 8) || isLoading)}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.verifyButtonText}>Verify</Text>
            )}
          </TouchableOpacity>
          
          {/* Help Text */}
          <Text style={styles.helpText}>
            Can&apos;t access your authenticator app?{'\n'}
            Use one of your backup codes or contact support.
          </Text>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#FAFFFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 32,
  },
  title: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 28,
    lineHeight: 36,
    color: '#094327',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24,
    color: '#6B7280',
    marginBottom: 40,
    textAlign: 'center',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
    gap: 12,
  },
  codeInput: {
    flex: 1,
    height: 64,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 24,
    lineHeight: 32,
    color: '#094327',
  },
  codeInputFilled: {
    borderColor: '#094327',
    backgroundColor: '#F0FDF4',
  },
  codeInputError: {
    borderColor: '#EF4444',
  },
  errorContainer: {
    width: '100%',
    marginBottom: 16,
  },
  errorText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#EF4444',
    textAlign: 'center',
  },
  backupToggle: {
    marginBottom: 24,
  },
  backupToggleText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 24,
    color: '#FF3B30',
    textAlign: 'center',
  },
  verifyButton: {
    width: '100%',
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  verifyButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  verifyButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
  },
  helpText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

