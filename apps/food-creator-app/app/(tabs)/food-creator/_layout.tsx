import { useFoodCreatorAuth } from '@/contexts/FoodCreatorAuthContext';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FoodCreatorLayout() {
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const { isLoading, isAuthenticated, isBasicOnboardingComplete, isOnboardingComplete, foodCreator } = useFoodCreatorAuth();
  const router = useRouter();
  const segments = useSegments();

  // Check current route segments
  // IMPORTANT: Distinguish between basic onboarding (onboarding-setup) and compliance training (onboarding)
  const isOnOnboardingSetupRoute = (segments as string[]).includes('onboarding-setup');
  const isOnComplianceTrainingRoute = (segments as string[]).includes('onboarding') && !isOnOnboardingSetupRoute;
  const isOnProfileRoute = (segments as string[]).includes('profile');

  // Determine what the user needs
  // Basic onboarding (profile setup) must ALWAYS come before compliance training
  const needsBasicOnboarding = !foodCreator || !isBasicOnboardingComplete;
  // Compliance training can ONLY happen after basic onboarding is complete
  const needsComplianceTraining = foodCreator && isBasicOnboardingComplete && !isOnboardingComplete && !foodCreator.complianceTrainingSkipped;
  const hasSkippedTraining = foodCreator?.complianceTrainingSkipped === true;

  // Redirect BEFORE rendering - prevent mounting of wrong screens
  useEffect(() => {
    if (isLoading || !isAuthenticated) return;

    // PRIORITY 1: If user has food creator role but no profile, redirect to onboarding-setup
    if (!foodCreator) {
      if (!isOnOnboardingSetupRoute && !isOnProfileRoute) {
        router.replace('/(tabs)/food-creator/onboarding-setup' as any);
      }
      return;
    }

    // PRIORITY 2: Basic onboarding (profile setup) MUST be completed first
    // Block ALL access to compliance training if basic onboarding is not complete
    if (needsBasicOnboarding) {
      // If user tries to access compliance training routes, force them back to basic onboarding
      if (isOnComplianceTrainingRoute) {
        router.replace('/(tabs)/food-creator/onboarding-setup' as any);
        return;
      }
      // If not on allowed routes (onboarding-setup or profile), redirect to onboarding-setup
      if (!isOnProfileRoute && !isOnOnboardingSetupRoute) {
        router.replace('/(tabs)/food-creator/onboarding-setup' as any);
      }
      return;
    }

    // PRIORITY 3: Only after basic onboarding is complete, check compliance training
    // Compliance training can only be accessed if basic onboarding is complete
    if (needsComplianceTraining) {
      if (!isOnComplianceTrainingRoute && !isOnProfileRoute) {
        router.replace('/(tabs)/food-creator/onboarding' as any);
      }
      return;
    }

    // If all onboarding is complete, redirect away from onboarding routes
    if (isOnboardingComplete && (isOnComplianceTrainingRoute || isOnOnboardingSetupRoute)) {
      router.replace('/(tabs)');
    }
  }, [isLoading, isAuthenticated, isBasicOnboardingComplete, isOnboardingComplete, foodCreator, needsBasicOnboarding, needsComplianceTraining, isOnComplianceTrainingRoute, isOnOnboardingSetupRoute, isOnProfileRoute, router]);

  // Navigate to sign-in screen when not authenticated (instead of showing a button)
  // This MUST be called before any conditional returns to maintain hook order
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Small delay to prevent navigation loops
      const timeout = setTimeout(() => {
        router.replace('/sign-in?notDismissable=true');
      }, 100);

      return () => clearTimeout(timeout);
    }
  }, [isLoading, isAuthenticated, router]);

  // Authentication guard: Show loading or sign-in prompt if not authenticated
  // The root index.tsx handles initial navigation to sign-in
  // This layout protects all foodCreator routes by showing a prompt if user navigates here while unauthenticated

  // Show loading or sign-in prompt while checking auth
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Food Creator Platform</Text>
          <Text style={styles.subtitle}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    // Show loading while navigating to sign-in
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Food Creator Platform</Text>
          <Text style={styles.subtitle}>Redirecting to sign in...</Text>
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
            <Text style={styles.title}>Food Creator Platform</Text>
            <Text style={styles.subtitle}>Loading...</Text>
          </View>
        </SafeAreaView>
      );
    }

    // If needs compliance training and not on compliance training route, show loading while redirecting
    if (needsComplianceTraining && !isOnComplianceTrainingRoute && !isOnProfileRoute) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>Food Creator Platform</Text>
            <Text style={styles.subtitle}>Loading...</Text>
          </View>
        </SafeAreaView>
      );
    }

    // If onboarding complete and on any onboarding route, show loading while redirecting
    if (isOnboardingComplete && (isOnComplianceTrainingRoute || isOnOnboardingSetupRoute)) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>Food Creator Platform</Text>
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

