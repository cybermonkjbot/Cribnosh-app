import React, { useState } from 'react';
import { OnboardingDietScreen } from './OnboardingDietScreen';
import { OnboardingAllergyScreen } from './OnboardingAllergyScreen';
import { OnboardingCuisinesScreen } from './OnboardingCuisinesScreen';

interface OnboardingData {
  dietDescription: string;
  selectedPreference: string;
  allergyDescription: string;
  selectedAllergies: string[];
  selectedCuisines: string[];
}

interface OnboardingFlowProps {
  onComplete?: (data: OnboardingData) => void;
  onSkip?: () => void;
  backgroundImage?: any;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  onComplete,
  onSkip,
  backgroundImage,
}) => {
  const [currentStep, setCurrentStep] = useState<'diet' | 'allergy' | 'cuisines'>('diet');
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    dietDescription: 'I like to eat a Fresh meat diet...',
    selectedPreference: 'Vegan',
    allergyDescription: '',
    selectedAllergies: [],
    selectedCuisines: [],
  });

  const handleDietNext = (dietDescription: string, selectedPreference: string) => {
    setOnboardingData(prev => ({
      ...prev,
      dietDescription,
      selectedPreference,
    }));
    setCurrentStep('allergy');
  };

  const handleAllergyNext = (allergyDescription: string, selectedAllergies: string[]) => {
    setOnboardingData(prev => ({
      ...prev,
      allergyDescription,
      selectedAllergies,
    }));
    setCurrentStep('cuisines');
  };

  const handleAllergyBack = () => {
    setCurrentStep('diet');
  };

  const handleCuisinesNext = (selectedCuisines: string[]) => {
    const finalData = {
      ...onboardingData,
      selectedCuisines,
    };
    onComplete?.(finalData);
  };

  const handleCuisinesBack = () => {
    setCurrentStep('allergy');
  };

  const handleCuisinesSkip = () => {
    onSkip?.();
  };



  const handleDietSkip = () => {
    onSkip?.();
  };

  const handleAllergySkip = () => {
    onSkip?.();
  };

  if (currentStep === 'diet') {
    return (
      <OnboardingDietScreen
        onNext={handleDietNext}
        onSkip={handleDietSkip}
        backgroundImage={backgroundImage}
      />
    );
  }

  if (currentStep === 'allergy') {
    return (
      <OnboardingAllergyScreen
        onNext={handleAllergyNext}
        onSkip={handleAllergySkip}
        onBack={handleAllergyBack}
        backgroundImage={backgroundImage}
      />
    );
  }

  return (
    <OnboardingCuisinesScreen
      onNext={handleCuisinesNext}
      onSkip={handleCuisinesSkip}
      onBack={handleCuisinesBack}
      backgroundImage={backgroundImage}
    />
  );
};

export default OnboardingFlow;
