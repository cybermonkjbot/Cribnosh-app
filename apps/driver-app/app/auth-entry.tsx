import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { logger } from '../utils/Logger';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDriverAuth } from '../contexts/EnhancedDriverAuthContext';

export default function DriverAuthEntryScreen() {
  const router = useRouter();
  const { driver, user, isLoading, isAuthenticated } = useDriverAuth();

  useEffect(() => {
    // If user is authenticated, redirect appropriately
    if (!isLoading && isAuthenticated && user) {
      if (driver) {
        // Driver profile exists, go to dashboard
        router.replace('/dashboard');
      } else {
        // User has DRIVER role but no driver profile - redirect to registration
        logger.info('User has DRIVER role but no driver profile, redirecting to registration');
        router.replace('/register');
      }
    }
  }, [isLoading, isAuthenticated, driver, user, router]);

  const handleSignIn = () => {
    router.push('/phone-auth?mode=signin');
  };

  const handleSignUp = () => {
    router.push('/phone-auth?mode=signup');
  };

  // Show loading while checking authentication status
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // If driver is authenticated, don't show this screen
  if (isAuthenticated) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Background Image */}
      <Image 
        source={require('../assets/depictions/logo.png')} 
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      
      {/* Overlay */}
      <View style={styles.overlay} />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Top Section */}
          <View style={styles.topSection}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image 
                source={require('../assets/depictions/logo.png')} 
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>

            {/* Welcome Message */}
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeTitle}>
                Welcome Driver!
              </Text>
              <Text style={styles.welcomeDescription}>
                Join our network of professional drivers and start earning by delivering meals to customers.
              </Text>
            </View>
          </View>

          {/* Bottom Section - Authentication */}
          <View style={styles.bottomSection}>
            {/* Quick Sign In */}
            <View style={styles.quickSignIn}>
              <TouchableOpacity style={styles.quickSignInButton} onPress={handleSignIn}>
                <Ionicons name="call" size={24} color={Colors.light.background} />
                <View style={styles.quickSignInText}>
                  <Text style={styles.quickSignInTitle}>Continue</Text>
                  <Text style={styles.quickSignInSubtitle}>Sign in or sign up</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.light.background} />
              </TouchableOpacity>
            </View>

            {/* Alternative Options */}
            <View style={styles.alternativeContainer}>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.socialButtons}>
                <TouchableOpacity style={styles.socialButton} onPress={handleSignIn}>
                  <Ionicons name="log-in" size={20} color={Colors.light.text} />
                  <Text style={styles.socialButtonText}>Sign In</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.socialButton} onPress={handleSignUp}>
                  <Ionicons name="person-add" size={20} color={Colors.light.text} />
                  <Text style={styles.socialButtonText}>Sign Up</Text>
                </TouchableOpacity>
              </View>

              {/* Email Option */}
              <TouchableOpacity 
                style={styles.emailButton}
                onPress={() => router.push('/email-auth?mode=signin')}
              >
                <Ionicons name="mail" size={20} color={Colors.light.text} />
                <Text style={styles.emailButtonText}>Sign in with Email</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeArea: {
    flex: 1,
    zIndex: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.light.background,
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
    zIndex: 3,
  },
  topSection: {
    flex: 1,
    justifyContent: 'center',
  },
  bottomSection: {
    paddingBottom: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoImage: {
    width: 200,
    height: 60,
    marginBottom: 16,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.light.background,
    marginBottom: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  welcomeDescription: {
    fontSize: 16,
    color: Colors.light.background,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  quickSignIn: {
    marginBottom: 24,
  },
  quickSignInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primary,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quickSignInText: {
    flex: 1,
    marginLeft: 16,
  },
  quickSignInTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.background,
    marginBottom: 2,
  },
  quickSignInSubtitle: {
    fontSize: 14,
    color: Colors.light.background,
    opacity: 0.9,
  },
  alternativeContainer: {
    marginBottom: 0,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.light.secondary,
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginLeft: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.light.background,
    opacity: 0.6,
  },
  dividerText: {
    marginHorizontal: 16,
    color: Colors.light.background,
    fontSize: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.light.secondary,
    marginTop: 12,
  },
  emailButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginLeft: 8,
  },
});
