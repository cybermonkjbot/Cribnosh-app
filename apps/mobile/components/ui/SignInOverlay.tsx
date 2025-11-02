import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Mascot } from '../Mascot';
import { navigateToSignIn } from '../../utils/signInNavigationGuard';

interface SignInOverlayProps {
  isVisible: boolean;
}

export const SignInOverlay: React.FC<SignInOverlayProps> = ({
  isVisible,
}) => {
  const handleSignInPress = () => {
    navigateToSignIn();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.haloContainer}>
        {/* Seamless halo using strong shadows */}
        <View style={styles.haloShadow}>
          <BlurView
            intensity={100}
            tint="light"
            style={styles.blurContainer}
          >
            <View style={styles.container}>
              {/* Mascot */}
              <View style={styles.mascotContainer}>
                <Mascot emotion="excited" size={250} />
              </View>

              {/* Message */}
              <Text style={styles.message}>
                Sign in to access all features and track your food journey.
              </Text>

              {/* Sign In Button */}
              <TouchableOpacity
                style={styles.signInButton}
                onPress={handleSignInPress}
                activeOpacity={0.8}
              >
                <Text style={styles.signInButtonText}>Sign In</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 9999,
  },
  haloContainer: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    justifyContent: 'center',
  },
  haloShadow: {
    borderRadius: 20,
    width: '100%',
    // Multiple shadow layers for seamless halo effect
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 120,
    elevation: 120,
    // Additional iOS shadow
    backgroundColor: 'transparent',
  },
  blurContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 32,
    width: '100%',
    alignItems: 'center',
    // Inner shadow for depth
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  mascotContainer: {
    marginBottom: 24,
  },
  message: {
    fontFamily: 'Urbanist',
    fontSize: 16,
    fontWeight: '400',
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  signInButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signInButtonText: {
    fontFamily: 'Urbanist',
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

