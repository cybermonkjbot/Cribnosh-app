import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppleIcon } from './AppleIcon';
import { GoogleIcon } from './GoogleIcon';

interface SocialSignInProps {
  onGoogleSignIn?: () => void;
  onAppleSignIn?: () => void;
  isAppleSignInAvailable?: boolean | null;
  isAppleSignInLoading?: boolean;
  isGoogleSignInLoading?: boolean;
}

export const SocialSignIn: React.FC<SocialSignInProps> = ({
  onGoogleSignIn,
  onAppleSignIn,
  isAppleSignInAvailable,
  isAppleSignInLoading,
  isGoogleSignInLoading,
}) => {
  return (
    <View style={styles.container}>
      {/* Apple Sign In Button */}
      <TouchableOpacity
        style={[
          styles.appleButton,
          !isAppleSignInAvailable && styles.disabledButton,
          isAppleSignInLoading && styles.loadingButton
        ]}
        onPress={() => {
          console.log('Apple button pressed');
          if (isAppleSignInAvailable && !isAppleSignInLoading) {
            onAppleSignIn?.();
          }
        }}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        disabled={!isAppleSignInAvailable || isAppleSignInLoading}
      >
        {isAppleSignInLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <AppleIcon size={20} />
        )}
        <Text style={[
          styles.appleButtonText,
          !isAppleSignInAvailable && styles.disabledButtonText
        ]}>
          {isAppleSignInLoading ? 'Signing in...' : 'Sign in with Apple'}
        </Text>
      </TouchableOpacity>

      {/* Google Sign In Button */}
      <TouchableOpacity
        style={[
          styles.googleButton,
          isGoogleSignInLoading && styles.loadingButton
        ]}
        onPress={() => {
          console.log('Google button pressed');
          if (!isGoogleSignInLoading) {
            onGoogleSignIn?.();
          }
        }}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        disabled={isGoogleSignInLoading}
      >
        {isGoogleSignInLoading ? (
          <ActivityIndicator size="small" color="#000000" />
        ) : (
          <GoogleIcon size={20} />
        )}
        <Text style={[
          styles.googleButtonText,
          isGoogleSignInLoading && styles.loadingButtonText
        ]}>
          {isGoogleSignInLoading ? 'Signing in...' : 'Sign in with Google'}
        </Text>
      </TouchableOpacity>

      {/* Apple Sign-In availability notice */}
      {isAppleSignInAvailable === false && (
        <Text style={styles.availabilityNotice}>
          Apple Sign-In is not available on this device
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
    alignItems: 'stretch',
    width: '100%',
  },
  appleButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    gap: 10,
    width: '100%',
    minHeight: 56,
    backgroundColor: '#000000',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: '#666666',
    opacity: 0.6,
  },
  loadingButton: {
    backgroundColor: '#333333',
  },
  appleButtonText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 20,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  disabledButtonText: {
    color: '#CCCCCC',
  },
  googleButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    gap: 10,
    width: '100%',
    minHeight: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  googleButtonText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 20,
    color: '#000000',
    textAlign: 'center',
  },
  loadingButtonText: {
    color: '#666666',
  },
  availabilityNotice: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default SocialSignIn;

