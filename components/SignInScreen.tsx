import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import React, { useEffect, useState } from 'react';
import { ImageBackground, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { oauthConfig } from '../config/oauth';
import { useAuthContext } from '../contexts/AuthContext';
import { AppleSignInErrorHandler, handleAppleSignInError } from '../utils/appleSignInErrorHandler';
import { handleGoogleSignInError } from '../utils/googleSignInErrorHandler';
import { SignInSocialSelectionCard } from './SignInSocialSelectionCard';
import { CribNoshLogo } from './ui/CribNoshLogo';
import { PhoneSignInModal } from './ui/PhoneSignInModal';

interface SignInScreenProps {
  onGoogleSignIn?: (idToken: string) => void;
  onAppleSignIn?: (idToken: string) => void;
  onEmailSignIn?: () => void;
  onClose?: () => void;
  backgroundImage?: any;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({
  onGoogleSignIn,
  onAppleSignIn,
  onClose,
  backgroundImage,
}) => {
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuthContext();
  const [isAppleSignInAvailable, setIsAppleSignInAvailable] = useState<boolean | null>(null);
  const [isAppleSignInLoading, setIsAppleSignInLoading] = useState(false);
  const [isGoogleSignInLoading, setIsGoogleSignInLoading] = useState(false);
  const [isPhoneSignInModalVisible, setIsPhoneSignInModalVisible] = useState(false);
  
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
  const handleGoogleSignIn = () => {
    // Validate OAuth configuration before attempting sign-in
    if (!oauthConfig.google.webClientId || oauthConfig.google.webClientId.includes('<your-')) {
      console.error('Google OAuth not properly configured. Please update oauthConfig.ts with your actual client IDs.');
      alert('Google Sign-In is not configured. Please contact support.');
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
        () => handleGoogleSignIn(), // Retry function
        () => handleAppleSignIn() // Fallback to Apple
      );
    }
  };

  // Apple Sign-In handler with comprehensive error handling
  const handleAppleSignIn = async () => {
    if (!isAppleSignInAvailable) {
      handleAppleSignInError(
        { code: 'ERR_NOT_AVAILABLE', message: 'Apple Sign-In is not available on this device.' },
        undefined,
        () => {
          // Fallback to Google Sign-In
          handleGoogleSignIn();
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
        onAppleSignIn?.(credential.identityToken);
      } else {
        throw new Error('No identity token received from Apple');
      }
    } catch (error) {
      // Use comprehensive error handling
      handleAppleSignInError(
        error,
        () => handleAppleSignIn(), // Retry function
        () => handleGoogleSignIn() // Fallback to Google
      );
    } finally {
      setIsAppleSignInLoading(false);
    }
  };

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
        // For Google, we'll use the accessToken as the idToken
        // In a real implementation, you might want to exchange this for an ID token
        onGoogleSignIn?.(accessToken);
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
  }, [googleResponse, onGoogleSignIn]);

  return (
    <View style={styles.container}>
      <ImageBackground
        source={backgroundImage || require('../assets/images/signin-background.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Close Button */}
        {onClose && (
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
          <SignInSocialSelectionCard
            onGoogleSignIn={handleGoogleSignIn}
            onAppleSignIn={handleAppleSignIn}
            onEmailSignIn={() => {
              setIsPhoneSignInModalVisible(true);
            }}
            isAuthenticated={isAuthenticated}
            isAppleSignInAvailable={isAppleSignInAvailable}
            isAppleSignInLoading={isAppleSignInLoading}
            isGoogleSignInLoading={isGoogleSignInLoading}
          />
        </View>
        
        {/* Home Indicator */}
        <View style={[styles.homeIndicator, { bottom: insets.bottom + 8 }]} />
      </ImageBackground>
      
      {/* Phone Sign In Modal */}
      <PhoneSignInModal
        isVisible={isPhoneSignInModalVisible}
        onClose={() => setIsPhoneSignInModalVisible(false)}
        onPhoneSubmit={(phoneNumber) => {
          console.log('Phone number submitted:', phoneNumber);
          // TODO: Implement phone verification logic
        }}
        onSignInSuccess={() => {
          // Close the phone modal and the entire sign-in screen
          setIsPhoneSignInModalVisible(false);
          onClose?.();
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
