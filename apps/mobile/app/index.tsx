import { AnimatedSplashScreen } from '@/components/AnimatedSplashScreen';
import { useAuthContext } from '@/contexts/AuthContext';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

export default function Index() {
  const router = useRouter();
  const { isLoading } = useAuthContext();
  const navigatedRef = useRef(false);
  const [splashCompleted, setSplashCompleted] = useState(false);

  useEffect(() => {
    // If both splash is complete and auth is loaded, navigate
    if (splashCompleted && !isLoading && !navigatedRef.current) {
      navigatedRef.current = true;
      console.log('Index: Navigating to /(tabs)');
      router.replace('/(tabs)');
    }
  }, [splashCompleted, isLoading, router]);

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