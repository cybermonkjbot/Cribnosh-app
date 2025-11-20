import { AnimatedSplashScreen } from '@/components/AnimatedSplashScreen';
import { useChefAuth } from '@/contexts/ChefAuthContext';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

export default function Index() {
  const router = useRouter();
  const { isLoading } = useChefAuth();
  const navigatedRef = useRef(false);
  const [splashCompleted, setSplashCompleted] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Safety timeout: if loading takes more than 10 seconds, navigate anyway
    const timeout = setTimeout(() => {
      if (!navigatedRef.current) {
        console.warn('Chef App Index: Timeout reached, forcing navigation');
        navigatedRef.current = true;
        setShowSplash(false);
        SplashScreen.hideAsync().catch(() => {});
        // Always navigate to dashboard (like customer app)
        router.replace('/(tabs)');
      }
    }, 10000);

    // If both splash is complete and auth is loaded, navigate
    if (splashCompleted && !isLoading && !navigatedRef.current) {
      navigatedRef.current = true;
      clearTimeout(timeout);
      console.log('Chef App Index: Navigating to dashboard');
      
      // Hide native splash screen
      SplashScreen.hideAsync().catch(() => {});
      
      // Hide splash and navigate
      setShowSplash(false);
      
      // Use requestAnimationFrame to ensure state update happens before navigation
      requestAnimationFrame(() => {
        // Always navigate to dashboard (like customer app)
        router.replace('/(tabs)');
      });
    }

    return () => clearTimeout(timeout);
  }, [splashCompleted, isLoading, router]);

  const handleSplashComplete = () => {
    setSplashCompleted(true);
  };

  // Show splash screen while loading or not yet completed
  if (showSplash && !navigatedRef.current) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <AnimatedSplashScreen 
          onAnimationComplete={handleSplashComplete} 
          duration={2500}
        />
      </>
    );
  }

  // Return null after navigation to let the router handle the view
  return null;
}

