import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ImageBackground, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { oauthConfig } from '@/config/oauth';
import { useChefAuth } from '@/contexts/ChefAuthContext';
import { AppleSignInErrorHandler, handleAppleSignInError } from '@/utils/appleSignInErrorHandler';
import { handleGoogleSignInError } from '@/utils/googleSignInErrorHandler';
import { mockAppleSignIn, mockGoogleSignIn } from '@/utils/mockAuthUtils';
import { isMockModeEnabled } from '@/utils/mockConfig';
import { SignInSocialSelectionCard } from './SignInSocialSelectionCard';
import { CribNoshLogo } from './ui/CribNoshLogo';
import { EmailSignInModal } from './ui/EmailSignInModal';

interface SignInScreenProps {
  onGoogleSignIn?: (idToken: string) => void;
  onAppleSignIn?: (idToken: string) => void;
  onEmailSignIn?: () => void;
  onClose?: () => void;
  onSignInSuccess?: () => void;
  backgroundImage?: any;
  notDismissable?: boolean; // If true, hides close button and prevents dismissal
}

export const SignInScreen: React.FC<SignInScreenProps> = ({
  onGoogleSignIn,
  onAppleSignIn,
  onClose,
  onSignInSuccess,
  backgroundImage,
  notDismissable = false,
}) => {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, login } = useChefAuth();
  const [isAppleSignInAvailable, setIsAppleSignInAvailable] = useState<boolean | null>(null);
  const [isAppleSignInLoading, setIsAppleSignInLoading] = useState(false);
  const [isGoogleSignInLoading, setIsGoogleSignInLoading] = useState(false);
  const [isEmailSignInModalVisible, setIsEmailSignInModalVisible] = useState(false);
  
  // Refs to avoid circular dependencies
  const handleGoogleSignInRef = useRef<(() => void) | null>(null);
  const handleAppleSignInRef = useRef<(() => void) | null>(null);
  
  // Google Sign-In setup
  const [, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    clientId: oauthConfig.google.webClientId,
    iosClientId: oauthConfig.google.iosClientId,
    androidClientId: oauthConfig.google.androidClientId,
    scopes: ['openid', 'profile', 'email'],
    redirectUri: AuthSession.makeRedirectUri(),
  });

  // Check Apple Sign-In availability on component mount
  useEffect(() => {
    const checkAppleSignInAvailability = async () => {
      try {
        const available = await AppleSignInErrorHandler.isAvailable();
        setIsAppleSignInAvailable(available);
      } catch (error) {
        console.error('Error checking Apple Sign-In availability:', error);
        setIsAppleSignInAvailable(false);
      }
    };

    checkAppleSignInAvailability();
  }, []);



  // Google Sign-In handler with error handling
  const handleGoogleSignIn = useCallback(() => {
    // Validate OAuth configuration before attempting sign-in
    if (!oauthConfig.google.webClientId || oauthConfig.google.webClientId.includes('<your-')) {
      console.warn('Google OAuth not properly configured. Redirecting to email sign-in.');
      // Gracefully handle by opening email sign-in modal
      setIsEmailSignInModalVisible(true);
      return;
    }

    setIsGoogleSignInLoading(true);
    
    try {
      console.log('Starting Google Sign-In with client ID:', oauthConfig.google.webClientId);
      googlePromptAsync();
    } catch (error) {
      console.error('Error starting Google Sign-In:', error);
      setIsGoogleSignInLoading(false);
      handleGoogleSignInError(
        error,
        () => handleGoogleSignInRef.current?.(), // Retry function
        () => {
          // Fallback to email sign-in
          setIsEmailSignInModalVisible(true);
        }
      );
    }
  }, [googlePromptAsync]);

  // Apple Sign-In handler with comprehensive error handling
  const handleAppleSignIn = useCallback(async () => {
    if (!isAppleSignInAvailable) {
      handleAppleSignInError(
        { code: 'ERR_NOT_AVAILABLE', message: 'Apple Sign-In is not available on this device.' },
        undefined,
        () => {
          // Fallback to Google Sign-In
          handleGoogleSignInRef.current?.();
        }
      );
      return;
    }

    setIsAppleSignInLoading(true);
    
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential.identityToken) {
        // Use mock implementation if enabled
        if (isMockModeEnabled()) {
          console.log('🔧 Using mock Apple sign-in');
          try {
            const result = await mockAppleSignIn(credential.identityToken);
            if (result.data.success) {
              await login(result.data.token, result.data.user);
              // Wait for auth state to propagate before closing
              setTimeout(() => {
                onClose?.();
              }, 500);
            }
          } catch (error) {
            console.error('Mock Apple sign-in error:', error);
            throw error;
          }
        } else {
          onAppleSignIn?.(credential.identityToken);
        }
      } else {
        throw new Error('No identity token received from Apple');
      }
    } catch (error) {
      // Use comprehensive error handling
      handleAppleSignInError(
        error,
        () => handleAppleSignInRef.current?.(), // Retry function
        () => {
          // Fallback to Google Sign-In
          handleGoogleSignInRef.current?.();
        }
      );
    } finally {
      setIsAppleSignInLoading(false);
    }
  }, [isAppleSignInAvailable, onAppleSignIn]);

  // Update refs
  handleGoogleSignInRef.current = handleGoogleSignIn;
  handleAppleSignInRef.current = handleAppleSignIn;

  // Reset Google loading state when response changes
  useEffect(() => {
    if (googleResponse?.type === 'success' || googleResponse?.type === 'error') {
      setIsGoogleSignInLoading(false);
    }
  }, [googleResponse]);

  // Handle Google Sign-In response with error handling
  useEffect(() => {
    if (googleResponse?.type === 'success') {
      console.log('Google Sign-In successful:', googleResponse);
      const { accessToken } = googleResponse.authentication!;
      if (accessToken) {
        // Use mock implementation if enabled
        if (isMockModeEnabled()) {
          console.log('🔧 Using mock Google sign-in');
          mockGoogleSignIn(accessToken).then(async (result) => {
            if (result.data.success) {
              await login(result.data.token, result.data.user);
              // Notify parent to navigate (will be handled by sign-in.tsx)
              onSignInSuccess?.();
            }
          }).catch(error => {
            console.error('Mock Google sign-in error:', error);
            setIsGoogleSignInLoading(false);
          });
        } else {
          // For Google, we'll use the accessToken as the idToken
          // In a real implementation, you might want to exchange this for an ID token
          onGoogleSignIn?.(accessToken);
        }
      } else {
        console.error('No access token received from Google');
        setIsGoogleSignInLoading(false);
      }
    } else if (googleResponse?.type === 'error') {
      // Handle Google Sign-In errors
      console.error('Google Sign-In error response:', googleResponse.error);
      console.error('Error details:', {
        error: googleResponse.error,
        errorCode: googleResponse.errorCode,
        params: googleResponse.params
      });
      setIsGoogleSignInLoading(false);
      handleGoogleSignInError(
        googleResponse.error,
        () => handleGoogleSignIn(), // Retry function
        () => handleAppleSignIn() // Fallback to Apple Sign-In
      );
    } else if (googleResponse?.type === 'cancel') {
      console.log('Google Sign-In cancelled by user');
      setIsGoogleSignInLoading(false);
    }
  }, [googleResponse, onGoogleSignIn, handleAppleSignIn, handleGoogleSignIn, login, onClose]);

  return (
    <View style={styles.container}>
      <ImageBackground
        source={backgroundImage || require('../assets/images/signin-background.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Close Button - only show if notDismissable is false */}
        {onClose && !notDismissable && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        
        {/* CribNosh Logo - positioned in upper left quadrant */}
        <View style={styles.logoContainer}>
          <CribNoshLogo size={172} variant="default" />
        </View>
        
        {/* Social Selection Card at bottom */}
        <View style={[styles.cardContainer, { bottom: 0 }]}>
          {(() => {
            const shouldShowCard = !isAuthenticated;
            return shouldShowCard ? (
              <SignInSocialSelectionCard
                onGoogleSignIn={handleGoogleSignIn}
                onAppleSignIn={handleAppleSignIn}
                onEmailSignIn={() => {
                  setIsEmailSignInModalVisible(true);
                }}
                isAuthenticated={isAuthenticated}
                isAppleSignInAvailable={isAppleSignInAvailable}
                isAppleSignInLoading={isAppleSignInLoading}
                isGoogleSignInLoading={isGoogleSignInLoading}
              />
            ) : null;
          })()}
        </View>
        
        {/* Home Indicator */}
        <View style={[styles.homeIndicator, { bottom: insets.bottom + 8 }]} />
      </ImageBackground>
      
      {/* Email Sign In Modal */}
      <EmailSignInModal
        isVisible={isEmailSignInModalVisible}
        onClose={() => setIsEmailSignInModalVisible(false)}
        onEmailSubmit={(email) => {
          console.log('Email submitted:', email);
        }}
        onSignInSuccess={() => {
          // Close the email modal
          setIsEmailSignInModalVisible(false);
          // Notify parent to handle navigation
          onSignInSuccess?.();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  logoContainer: {
    position: 'absolute',
    left: 23,
    top: 90,
    zIndex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 2,
  },
  homeIndicator: {
    position: 'absolute',
    bottom: 8,
    left: '50%',
    width: 148,
    height: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    transform: [{ translateX: -74 }],
  },
});

export default SignInScreen;
