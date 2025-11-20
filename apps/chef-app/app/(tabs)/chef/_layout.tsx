import { Button } from '@/components/ui/Button';
import { useChefAuth } from '@/contexts/ChefAuthContext';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChefLayout() {
  const { isLoading, isAuthenticated, isBasicOnboardingComplete, isOnboardingComplete, chef } = useChefAuth();
  const router = useRouter();
  const segments = useSegments();

  // Check current route segments
  const isOnOnboardingRoute = (segments as string[]).includes('onboarding');
  const isOnOnboardingSetupRoute = (segments as string[]).includes('onboarding-setup');
  const isOnProfileRoute = (segments as string[]).includes('profile');
  
  // Determine what the user needs
  const needsBasicOnboarding = !chef || !isBasicOnboardingComplete;
  const needsComplianceTraining = chef && isBasicOnboardingComplete && !isOnboardingComplete && !chef.complianceTrainingSkipped;
  const hasSkippedTraining = chef?.complianceTrainingSkipped === true;

  // Redirect BEFORE rendering - prevent mounting of wrong screens
  useEffect(() => {
    if (isLoading || !isAuthenticated) return;

    // If user has chef role but no chef profile, redirect to onboarding-setup
    if (!chef) {
      if (!isOnOnboardingSetupRoute && !isOnProfileRoute) {
        router.replace('/(tabs)/chef/onboarding-setup');
      }
      return;
    }
    
    // If basic onboarding (profile setup) is not complete, redirect to onboarding-setup
    if (needsBasicOnboarding) {
      // Block access to compliance training routes if basic onboarding not complete
      if (isOnOnboardingRoute && !isOnProfileRoute && !isOnOnboardingSetupRoute) {
        router.replace('/(tabs)/chef/onboarding-setup');
      }
      // If not on allowed routes, redirect
      if (!isOnProfileRoute && !isOnOnboardingSetupRoute) {
        router.replace('/(tabs)/chef/onboarding-setup');
      }
      return;
    }
    
    // If compliance training not complete and not skipped, redirect to onboarding
    if (needsComplianceTraining) {
      if (!isOnOnboardingRoute) {
        router.replace('/(tabs)/chef/onboarding');
      }
      return;
    }

    // If onboarding is complete, redirect away from onboarding routes
    if (isOnboardingComplete && isOnOnboardingRoute && !isOnOnboardingSetupRoute) {
      router.replace('/(tabs)');
    }
  }, [isLoading, isAuthenticated, isBasicOnboardingComplete, isOnboardingComplete, chef, needsBasicOnboarding, needsComplianceTraining, isOnOnboardingRoute, isOnOnboardingSetupRoute, isOnProfileRoute, router]);

  // Authentication guard: Show loading or sign-in prompt if not authenticated
  // The root index.tsx handles initial navigation to sign-in
  // This layout protects all chef routes by showing a prompt if user navigates here while unauthenticated

  // Show loading or sign-in prompt while checking auth
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Chef Platform</Text>
          <Text style={styles.subtitle}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Chef Platform</Text>
          <Text style={styles.subtitle}>Please sign in to continue</Text>
          <Button onPress={() => router.push('/sign-in')}>
            Sign In
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  // Prevent rendering Stack if we're redirecting - show loading instead
  // This prevents the wrong screen from mounting
  if (!isLoading && isAuthenticated) {
    // If basic onboarding not complete and not on allowed routes, show loading while redirecting
    if (needsBasicOnboarding && !isOnProfileRoute && !isOnOnboardingSetupRoute) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>Chef Platform</Text>
            <Text style={styles.subtitle}>Loading...</Text>
          </View>
        </SafeAreaView>
      );
    }
    
    // If needs compliance training and not on onboarding route, show loading while redirecting
    if (needsComplianceTraining && !isOnOnboardingRoute) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>Chef Platform</Text>
            <Text style={styles.subtitle}>Loading...</Text>
          </View>
        </SafeAreaView>
      );
    }

    // If onboarding complete and on onboarding route, show loading while redirecting
    if (isOnboardingComplete && isOnOnboardingRoute && !isOnOnboardingSetupRoute) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>Chef Platform</Text>
            <Text style={styles.subtitle}>Loading...</Text>
          </View>
        </SafeAreaView>
      );
    }
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding-setup" />
      <Stack.Screen 
        name="onboarding/course/[id]/module/[moduleId]/quiz" 
        options={{ presentation: 'modal' }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
});

