import { OnboardingFlow } from '@/components/OnboardingFlow';
import { useAuthContext } from '@/contexts/AuthContext';
import { api } from '@/convex/_generated/api';
import { getConvexClient, getSessionToken } from '@/lib/convexClient';
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

  const handleOnboardingComplete = async (data: any) => {
    try {
      console.log('Onboarding completed with data:', data);
      
      const convex = getConvexClient();
      const sessionToken = await getSessionToken();

      if (!sessionToken) {
        console.error('Not authenticated, skipping onboarding data save');
        router.replace('/(tabs)');
        return;
      }

      // Map dietary preference to dietary preferences array
      const dietaryPreferences: string[] = [];
      if (data.selectedPreference) {
        // Map common preference strings to dietary preference values
        const preferenceMap: Record<string, string> = {
          'Vegan': 'vegan',
          'Vegetarian': 'vegetarian',
          'Gluten-Free': 'gluten_free',
          'Keto': 'keto',
          'Paleo': 'paleo',
        };
        const mappedPreference = preferenceMap[data.selectedPreference] || data.selectedPreference.toLowerCase().replace(/\s+/g, '_');
        dietaryPreferences.push(mappedPreference);
      }

      // Save dietary preferences
      if (dietaryPreferences.length > 0) {
        try {
          await convex.action(api.actions.users.customerUpdateDietaryPreferences, {
            sessionToken,
            preferences: dietaryPreferences,
            religious_requirements: [],
            health_driven: [],
          });
        } catch (error) {
          console.error('Error saving dietary preferences:', error);
        }
      }

      // Save cuisines to profile preferences
      if (data.selectedCuisines && data.selectedCuisines.length > 0) {
        try {
          await convex.action(api.actions.users.customerUpdateProfile, {
            sessionToken,
            preferences: {
              favorite_cuisines: data.selectedCuisines,
              dietary_restrictions: dietaryPreferences,
            },
          });
        } catch (error) {
          console.error('Error saving cuisines:', error);
        }
      }

      // Save allergies
      if (data.selectedAllergies && data.selectedAllergies.length > 0) {
        try {
          // Map allergy strings to allergy objects with default values
          const allergies = data.selectedAllergies.map((allergyName: string) => ({
            name: allergyName,
            type: 'allergy' as const,
            severity: 'moderate' as const,
          }));

          await convex.action(api.actions.users.customerUpdateAllergies, {
            sessionToken,
            allergies,
          });
        } catch (error) {
          console.error('Error saving allergies:', error);
        }
      }
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      // Continue to navigation even if save fails
    }
    
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

