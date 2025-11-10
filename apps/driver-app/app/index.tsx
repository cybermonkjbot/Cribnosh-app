import { Colors } from '../constants/Colors';
import { logger } from '../utils/Logger';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDriverAuth } from '../contexts/EnhancedDriverAuthContext';

export default function DriverWelcomeScreen() {
  const router = useRouter();
  const { driver, user, isLoading, isAuthenticated } = useDriverAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && user) {
        // User has DRIVER role
        if (driver) {
          // Driver profile exists, go to dashboard
          router.replace('/dashboard');
        } else {
          // User has DRIVER role but no driver profile - redirect to registration
          logger.info('User has DRIVER role but no driver profile, redirecting to registration');
          router.replace('/register');
        }
      } else if (!isAuthenticated) {
        // Not authenticated, redirect to auth entry
        router.replace('/auth-entry');
      }
    }
  }, [isLoading, isAuthenticated, driver, user, router]);

  // Always show loading screen during authentication check and redirects
  // This prevents flashing the welcome screen during session restoration
  // The screen always redirects based on auth state:
  // - If authenticated + has driver → redirect to dashboard
  // - If authenticated + no driver → redirect to register  
  // - If not authenticated → redirect to auth-entry
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.loadingContainer}>
        <Image 
          source={require('../assets/images/white-greenlogo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color={Colors.light.primary} style={styles.loader} />
        <Text style={styles.loadingText}>Loading...</Text>
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
  logo: {
    width: 120,
    height: 32,
    marginBottom: 24,
  },
  loader: {
    marginTop: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.light.icon,
    marginTop: 16,
  },
});
