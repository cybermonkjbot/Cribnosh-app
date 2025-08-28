import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import React, { useEffect, useState } from 'react';
import { ImageBackground, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { oauthConfig } from '../config/oauth';
import { AppleSignInErrorHandler, handleAppleSignInError } from '../utils/appleSignInErrorHandler';
import { SignInSocialSelectionCard } from './SignInSocialSelectionCard';
import { CribNoshLogo } from './ui/CribNoshLogo';

interface SignInScreenProps {
  onGoogleSignIn?: (idToken: string) => void;
  onAppleSignIn?: (idToken: string) => void;
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
  const [isAppleSignInAvailable, setIsAppleSignInAvailable] = useState<boolean | null>(null);
  const [isAppleSignInLoading, setIsAppleSignInLoading] = useState(false);
  
  // Google Sign-In setup
  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    clientId: oauthConfig.google.webClientId,
    iosClientId: oauthConfig.google.iosClientId,
    androidClientId: oauthConfig.google.androidClientId,
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

  // Handle Google Sign-In response
  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const { accessToken } = googleResponse.authentication!;
      if (accessToken) {
        // For Google, we'll use the accessToken as the idToken
        // In a real implementation, you might want to exchange this for an ID token
        onGoogleSignIn?.(accessToken);
      }
    }
  }, [googleResponse, onGoogleSignIn]);

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

  // Google Sign-In handler
  const handleGoogleSignIn = () => {
    googlePromptAsync();
  };

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
            isAppleSignInAvailable={isAppleSignInAvailable}
            isAppleSignInLoading={isAppleSignInLoading}
          />
        </View>
        
        {/* Home Indicator */}
        <View style={[styles.homeIndicator, { bottom: insets.bottom + 8 }]} />
      </ImageBackground>
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
