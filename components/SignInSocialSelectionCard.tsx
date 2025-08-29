import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SocialSignIn } from './SocialSignIn';

interface SignInSocialSelectionCardProps {
  onGoogleSignIn?: () => void;
  onAppleSignIn?: () => void;
  onEmailSignIn?: () => void;
  bottomInset?: number;
  isAppleSignInAvailable?: boolean | null;
  isAppleSignInLoading?: boolean;
  isGoogleSignInLoading?: boolean;
}

export const SignInSocialSelectionCard: React.FC<SignInSocialSelectionCardProps> = ({
  onGoogleSignIn,
  onAppleSignIn,
  onEmailSignIn,
  bottomInset = 0,
  isAppleSignInAvailable,
  isAppleSignInLoading,
  isGoogleSignInLoading,
}) => {
  return (
    <View style={[styles.container, { height: 378 + bottomInset }]}>
      {/* Title and Email Sign In Button */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Ready?{'\n'}Set, Eat</Text>
        <TouchableOpacity 
          style={styles.emailSignInButton}
          onPress={onEmailSignIn}
          activeOpacity={0.7}
        >
          <Text style={styles.emailSignInText}>Sign in with email</Text>
          <Ionicons name="arrow-forward" size={16} color="#4ADE80" />
        </TouchableOpacity>
      </View>
      
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
          isGoogleSignInLoading={isGoogleSignInLoading}
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
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Poppins',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 32,
    lineHeight: 40,
    color: '#FFFFFF',
    textAlign: 'left',
    letterSpacing: -0.5,
    flex: 1,
  },
  emailSignInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'transparent',
    borderWidth: 0,
    gap: 4,
  },
  emailSignInText: {
    fontFamily: 'SF Pro',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 13,
    lineHeight: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
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
