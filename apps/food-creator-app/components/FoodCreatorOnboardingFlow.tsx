import { api } from '@/convex/_generated/api';
import { useMutation } from 'convex/react';
import React, { useCallback, useState } from 'react';
import { FoodCreatorOnboardingGDPRScreen } from './FoodCreatorOnboardingGDPRScreen';
import { FoodCreatorOnboardingImageScreen } from './FoodCreatorOnboardingImageScreen';
import { FoodCreatorOnboardingKitchenScreen } from './FoodCreatorOnboardingKitchenScreen';
import { FoodCreatorOnboardingLocationScreen } from './FoodCreatorOnboardingLocationScreen';
import { FoodCreatorOnboardingProfileScreen } from './FoodCreatorOnboardingProfileScreen';

interface FoodCreatorOnboardingData {
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
}

interface FoodCreatorOnboardingFlowProps {
  onComplete?: (data: FoodCreatorOnboardingData) => void;
  onSkip?: () => void;
  backgroundImage?: any;
  foodCreatorId?: string;
  sessionToken?: string;
  initialDraft?: FoodCreatorOnboardingData & { currentStep?: string };
}

export const FoodCreatorOnboardingFlow: React.FC<FoodCreatorOnboardingFlowProps> = ({
  onComplete,
  onSkip,
  backgroundImage,
  foodCreatorId,
  sessionToken,
  initialDraft,
}) => {
  const saveDraft = useMutation(api.mutations.foodCreators.saveOnboardingDraft);
  const [currentStep, setCurrentStep] = useState<'gdpr' | 'profile' | 'image' | 'location' | 'kitchen'>(
    (initialDraft?.currentStep as any) || 'gdpr'
  );
  const [onboardingData, setOnboardingData] = useState<FoodCreatorOnboardingData>({
    name: initialDraft?.name || '',
    bio: initialDraft?.bio || '',
    specialties: initialDraft?.specialties || [],
    city: initialDraft?.city || '',
    coordinates: initialDraft?.coordinates || [0, 0],
    profileImage: initialDraft?.profileImage || '',
    kitchenName: initialDraft?.kitchenName || '',
    kitchenAddress: initialDraft?.kitchenAddress || '',
    kitchenType: initialDraft?.kitchenType || '',
    kitchenImages: initialDraft?.kitchenImages || [],
  });

  // Save draft to backend after each step
  const saveProgress = useCallback(async (step: string, data: FoodCreatorOnboardingData) => {
    if (!foodCreatorId || !sessionToken) return;

    try {
      await saveDraft({
        foodCreatorId: foodCreatorId as any,
        draft: {
          ...data,
          currentStep: step,
        },
        sessionToken,
      });
    } catch (error) {
      console.error('Error saving onboarding draft:', error);
      // Don't block user flow if save fails
    }
  }, [foodCreatorId, sessionToken, saveDraft]);

  const handleProfileNext = async (name: string, bio: string, specialties: string[]) => {
    const newData = {
      ...onboardingData,
      name,
      bio,
      specialties,
    };
    setOnboardingData(newData);
    await saveProgress('image', newData);
    setCurrentStep('image');
  };

  const handleImageNext = async (imageUri: string) => {
    const newData = {
      ...onboardingData,
      profileImage: imageUri,
    };
    setOnboardingData(newData);
    await saveProgress('location', newData);
    setCurrentStep('location');
  };

  const handleLocationNext = async (city: string, coordinates: [number, number]) => {
    const newData = {
      ...onboardingData,
      city,
      coordinates,
    };
    setOnboardingData(newData);
    await saveProgress('kitchen', newData);
    setCurrentStep('kitchen');
  };

  const handleKitchenNext = (kitchenName: string, address: string, kitchenType: string, images: string[]) => {
    const finalData = {
      ...onboardingData,
      kitchenName,
      kitchenAddress: address,
      kitchenType,
      kitchenImages: images,
    };
    onComplete?.(finalData);
  };

  const handleImageBack = () => {
    setCurrentStep('profile');
  };

  const handleLocationBack = () => {
    setCurrentStep('image');
  };

  const handleKitchenBack = () => {
    setCurrentStep('location');
  };

  const handleImageSkip = () => {
    setCurrentStep('location');
  };

  const handleKitchenSkip = () => {
    onSkip?.();
  };

  if (currentStep === 'gdpr') {
    return (
      <FoodCreatorOnboardingGDPRScreen
        onNext={() => setCurrentStep('profile')}
        backgroundImage={backgroundImage}
      />
    );
  }

  if (currentStep === 'profile') {
    return (
      <FoodCreatorOnboardingProfileScreen
        onNext={handleProfileNext}
        backgroundImage={backgroundImage}
        initialData={{
          name: onboardingData.name,
          bio: onboardingData.bio,
          specialties: onboardingData.specialties,
        }}
      />
    );
  }

  if (currentStep === 'image') {
    return (
      <FoodCreatorOnboardingImageScreen
        onNext={handleImageNext}
        onSkip={handleImageSkip}
        onBack={handleImageBack}
        backgroundImage={backgroundImage}
        initialData={{
          imageUri: onboardingData.profileImage,
        }}
      />
    );
  }

  if (currentStep === 'location') {
    return (
      <FoodCreatorOnboardingLocationScreen
        onNext={handleLocationNext}
        onBack={handleLocationBack}
        backgroundImage={backgroundImage}
        initialData={{
          city: onboardingData.city,
          coordinates: onboardingData.coordinates,
        }}
      />
    );
  }

  return (
    <FoodCreatorOnboardingKitchenScreen
      onNext={handleKitchenNext}
      onSkip={handleKitchenSkip}
      onBack={handleKitchenBack}
      backgroundImage={backgroundImage}
      initialData={{
        kitchenName: onboardingData.kitchenName,
        address: onboardingData.kitchenAddress,
        kitchenType: onboardingData.kitchenType,
        images: onboardingData.kitchenImages,
      }}
    />
  );
};

export default FoodCreatorOnboardingFlow;

