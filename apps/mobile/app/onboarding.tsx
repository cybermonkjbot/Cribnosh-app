import { OnboardingFlow } from '@/components/OnboardingFlow';
import { useAuthContext } from '@/contexts/AuthContext';
import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function OnboardingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthContext();

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/sign-in');
    }
  }, [isAuthenticated, router]);

  const handleOnboardingComplete = (data: any) => {
    // TODO: Save onboarding data to backend
    console.log('Onboarding completed with data:', data);
    
    // Navigate to main app
    router.replace('/(tabs)');
  };

  const handleOnboardingSkip = () => {
    console.log('Onboarding skipped');
    
    // Navigate to main app
    router.replace('/(tabs)');
  };

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <OnboardingFlow
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
        backgroundImage={require('../assets/images/signin-background.jpg')}
      />
    </>
  );
}

