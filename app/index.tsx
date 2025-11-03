import { useAuthContext } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, StyleSheet, Text, View } from 'react-native';

export default function Index() {
  const router = useRouter();
  const navigatedRef = useRef(false);
  
  // Get auth context - will be available since _layout.tsx wraps all routes with AuthProvider
  const { isAuthenticated, isLoading } = useAuthContext();

  // Animated values for subtle logo motion
  const scale = useRef(new Animated.Value(0.9)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Gentle pulsing animation
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.02, duration: 700, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 0.98, duration: 700, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(glow, { toValue: 1, duration: 900, useNativeDriver: true }),
          Animated.timing(glow, { toValue: 0, duration: 900, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, [scale, glow]);

  useEffect(() => {

    if (!isLoading && !navigatedRef.current) {
      navigatedRef.current = true;
      
      setTimeout(() => {
     
        console.log('Index: Navigating to /(tabs)');
        router.replace('/(tabs)');
      }, 1500);
    }
  }, [isLoading, router]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoCircle,
          {
            transform: [{ scale }],
            shadowOpacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.08, 0.35] }),
          },
        ]}
      >
        <Text style={styles.logoText}>N</Text>
      </Animated.View>

      <Text style={styles.title}>Nosh</Text>

      <ActivityIndicator size="small" color="#ffffff" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#02120A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logoCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#094327',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00FFB2',
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 6,
  },
  logoText: {
    color: 'white',
    fontSize: 34,
    fontWeight: '700',
  },
  title: {
    color: 'white',
    fontSize: 18,
    marginTop: 12,
    fontWeight: '600',
  },
  loader: {
    marginTop: 14,
  },
});

// Hide the default header for this splash/redirect route
export const unstable_settings = {
  headerShown: false,
};