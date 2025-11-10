import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { logger } from '../utils/Logger';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDriverAuth } from '../contexts/EnhancedDriverAuthContext';
import { CribNoshLogo } from '../components/CribNoshLogo';

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
    <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {/* Top Section */}
          <View style={styles.topSection}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <CribNoshLogo size={200} variant="default" />
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
          {/* Continue with Email */}
              <TouchableOpacity 
                style={styles.emailButton}
                onPress={() => router.push('/email-auth')}
              >
            <Ionicons name="mail" size={24} color={Colors.light.background} />
            <Text style={styles.emailButtonText}>Continue with Email</Text>
              </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
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
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  welcomeDescription: {
    fontSize: 16,
    color: Colors.light.icon,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  emailButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.background,
    marginLeft: 12,
  },
});
