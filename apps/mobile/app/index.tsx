import { AnimatedSplashScreen } from '@/components/AnimatedSplashScreen';
import { useAuthContext } from '@/contexts/AuthContext';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

export default function Index() {
  const router = useRouter();
  const { isLoading } = useAuthContext();
  const navigatedRef = useRef(false);
  const [splashCompleted, setSplashCompleted] = useState(false);

  const navigateToTabs = useCallback(() => {
    if (!navigatedRef.current) {
      navigatedRef.current = true;
      console.log('Index: Navigating to /(tabs)');
      router.replace('/(tabs)');
    }
  }, [router]);

  useEffect(() => {
    // If both splash is complete and auth is loaded, navigate
    if (splashCompleted && !isLoading) {
      navigateToTabs();
    }
  }, [splashCompleted, isLoading, navigateToTabs]);

  const handleSplashComplete = () => {
    setSplashCompleted(true);
  };

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