import { FoodCreatorOnboardingFlow } from '@/components/FoodCreatorOnboardingFlow';
import { useFoodCreatorAuth } from '@/contexts/FoodCreatorAuthContext';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/convexClient';
import { useToast } from '@/lib/ToastContext';
import { useMutation, useQuery } from 'convex/react';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

export default function FoodCreatorOnboardingSetupPage() {
  const router = useRouter();
  const { isAuthenticated, foodCreator, user, sessionToken, isBasicOnboardingComplete, refreshFoodCreator: refreshFood Creator } = useFoodCreatorAuth();
  const { showSuccess, showError } = useToast();
  const createFood Creator = useMutation(api.mutations.foodCreators.createFood Creator);
  const updateFood Creator = useMutation(api.mutations.foodCreators.update);
  const createKitchen = useMutation(api.mutations.kitchens.createKitchen);
  const clearDraft = useMutation(api.mutations.foodCreators.clearOnboardingDraft);
  const [isUploading, setIsUploading] = useState(false);

  // Load existing foodCreator data including draft
  const foodCreatorData = useQuery(
    api.queries.foodCreators.getChefById,
    foodCreator?._id ? { foodCreatorId: foodCreator._id } : 'skip'
  );

  // Redirect if already completed basic onboarding
  useEffect(() => {
    if (isAuthenticated && foodCreator && isBasicOnboardingComplete) {
      router.replace('/(tabs)/food-creator/onboarding' as any);
    }
  }, [isAuthenticated, foodCreator, isBasicOnboardingComplete, router]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/sign-in');
    }
  }, [isAuthenticated, router]);

  const uploadImage = async (imageUri: string): Promise<string | null> => {
    try {
      const convex = getConvexClient();
      const uploadUrl = await convex.mutation(api.mutations.documents.generateUploadUrl);

      const response = await fetch(imageUri);
      const blob = await response.blob();

      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': blob.type || 'image/jpeg',
        },
        body: blob,
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      const uploadResult = await uploadResponse.json();
      const storageId = uploadResult.storageId || uploadResult;
      const fileUrl = await (convex as any).storage.getUrl(storageId);
      return fileUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleOnboardingComplete = async (data: {
    name: string;
    bio: string;
    specialties: string[];
    city: string;
    coordinates: [number, number];
    profileImage: string;
    kitchenName: string;
    kitchenAddress: string;
    kitchenType: string;
    kitchenImages: string[];
  }) => {
    try {
      setIsUploading(true);
      console.log('Food Creator onboarding completed with data:', data);

      if (!user?._id || !sessionToken) {
        showError('Error', 'Authentication required');
        router.replace('/sign-in');
        return;
      }

      // Upload profile image if provided
      let profileImageUrl: string | undefined;
      if (data.profileImage) {
        const uploadedUrl = await uploadImage(data.profileImage);
        if (uploadedUrl) {
          profileImageUrl = uploadedUrl;
        }
      }

      // Upload kitchen images if provided
      let kitchenImageUrls: string[] = [];
      if (data.kitchenImages && data.kitchenImages.length > 0) {
        const uploadPromises = data.kitchenImages.map(img => uploadImage(img));
        const uploadedUrls = await Promise.all(uploadPromises);
        kitchenImageUrls = uploadedUrls.filter((url): url is string => url !== null);
      }

      if (foodCreator) {
        // Update existing foodCreator profile
        await updateFood Creator({
          foodCreatorId: foodCreator._id,
          updates: {
            name: data.name,
            bio: data.bio,
            specialties: data.specialties,
            location: {
              city: data.city,
              coordinates: data.coordinates,
            },
            ...(profileImageUrl && { profileImage: profileImageUrl }),
          },
          sessionToken,
        });
        showSuccess('Profile Updated', 'Your foodCreator profile has been set up successfully!');
      } else {
        // Create new foodCreator profile
        const chefId = await createFood Creator({
          userId: user._id,
          name: data.name,
          bio: data.bio,
          specialties: data.specialties,
          location: {
            lat: data.coordinates[0],
            lng: data.coordinates[1],
            city: data.city,
          },
          image: profileImageUrl,
          sessionToken,
        });
        showSuccess('Profile Created', 'Your foodCreator profile has been created successfully!');

        // Create kitchen if kitchen data is provided
        if (data.kitchenName && data.kitchenAddress && data.kitchenType) {
          try {
            await createKitchen({
              owner_id: user._id,
              address: data.kitchenAddress,
              certified: false,
              images: kitchenImageUrls,
            });
          } catch (error) {
            console.error('Error creating kitchen:', error);
            // Don't fail the whole onboarding if kitchen creation fails
          }
        }
      }

      // Clear draft after successful completion
      if (foodCreator?._id && sessionToken) {
        try {
          await clearDraft({
            foodCreatorId: foodCreator._id,
            sessionToken,
          });
        } catch (error) {
          console.error('Error clearing draft:', error);
        }
      }

      // Refresh foodCreator context to update onboarding status
      await refreshFood Creator();

      // Use requestAnimationFrame to ensure navigation happens after render
      requestAnimationFrame(() => {
        // Navigate to compliance training
        router.replace('/(tabs)/food-creator/onboarding' as any);
      });
    } catch (error: any) {
      console.error('Error saving onboarding data:', error);
      showError('Error', error.message || 'Failed to save profile. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleOnboardingSkip = () => {
    console.log('Food Creator onboarding skipped');
    // Navigate to compliance training (they can complete profile later)
    router.replace('/(tabs)/food-creator/onboarding' as any);
  };

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  // Prepare initial draft data from saved draft or existing foodCreator profile
  const initialDraft = foodCreatorData?.onboardingDraft ? {
    ...foodCreatorData.onboardingDraft,
    coordinates: foodCreatorData.onboardingDraft.coordinates as [number, number] || [0, 0],
  } : (foodCreator ? {
    name: foodCreator.name || '',
    bio: foodCreator.bio || '',
    specialties: foodCreator.specialties || [],
    city: foodCreator.location?.city || '',
    coordinates: (foodCreator.location?.coordinates as [number, number]) || [0, 0],
    profileImage: foodCreator.profileImage || '',
    kitchenName: '',
    kitchenAddress: '',
    kitchenType: '',
    kitchenImages: [],
    currentStep: 'profile',
  } : undefined);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <FoodCreatorOnboardingFlow
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
        backgroundImage={require('../../../assets/images/signin-background.jpg')}
        chefId={foodCreator?._id}
        sessionToken={sessionToken || undefined}
        initialDraft={initialDraft}
      />
    </>
  );
}

