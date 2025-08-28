import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SocialSignIn } from './SocialSignIn';

interface SignInSocialSelectionCardProps {
  onGoogleSignIn?: () => void;
  onAppleSignIn?: () => void;
  bottomInset?: number;
  isAppleSignInAvailable?: boolean | null;
  isAppleSignInLoading?: boolean;
}

export const SignInSocialSelectionCard: React.FC<SignInSocialSelectionCardProps> = ({
  onGoogleSignIn,
  onAppleSignIn,
  bottomInset = 0,
  isAppleSignInAvailable,
  isAppleSignInLoading,
}) => {
  return (
    <View style={[styles.container, { height: 378 + bottomInset }]}>
      {/* Title */}
      <Text style={styles.title}>Ready?{'\n'}Set, Eat</Text>
      
      {/* Divider Line */}
      <View style={styles.divider} />
      
      {/* Description */}
      <Text style={styles.description}>
        Welcome. Let&apos;s start by creating your{'\n'}account or sign in if you already have one
      </Text>
      
      {/* Social Sign In Buttons */}
      <View style={styles.socialButtonsContainer}>
        <SocialSignIn
          onGoogleSignIn={onGoogleSignIn}
          onAppleSignIn={onAppleSignIn}
          isAppleSignInAvailable={isAppleSignInAvailable}
          isAppleSignInLoading={isAppleSignInLoading}
        />
      </View>
      
      {/* Bottom spacing to push content above safe area */}
      <View style={{ height: bottomInset }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 378,
    backgroundColor: 'rgba(2, 18, 10, 0.98)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    alignItems: 'flex-start',
    paddingTop: 40,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontFamily: 'Poppins',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 32,
    lineHeight: 40,
    color: '#FFFFFF',
    textAlign: 'left',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  divider: {
    width: 32,
    height: 2,
    backgroundColor: '#4ADE80',
    marginBottom: 16,
    borderRadius: 1,
  },
  description: {
    fontFamily: 'SF Pro',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24,
    color: '#E5E7EB',
    textAlign: 'left',
    letterSpacing: -0.2,
    marginBottom: 32,
    opacity: 0.9,
  },
  socialButtonsContainer: {
    alignItems: 'stretch',
    gap: 20,
    width: '100%',
  },
});

export default SignInSocialSelectionCard;
