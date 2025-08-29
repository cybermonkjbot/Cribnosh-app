import React, { useState } from 'react';
import { OnboardingDietScreen } from './OnboardingDietScreen';
import { OnboardingAllergyScreen } from './OnboardingAllergyScreen';

interface OnboardingData {
  dietDescription: string;
  selectedPreference: string;
  allergyDescription: string;
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
  const [currentStep, setCurrentStep] = useState<'diet' | 'allergy'>('diet');
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    dietDescription: 'I like to eat a Fresh meat diet...',
    selectedPreference: 'Vegan',
    allergyDescription: 'I like to eat a Fresh meat diet...',
  });

  const handleDietNext = (dietDescription: string, selectedPreference: string) => {
    setOnboardingData(prev => ({
      ...prev,
      dietDescription,
      selectedPreference,
    }));
    setCurrentStep('allergy');
  };

  const handleAllergyNext = (allergyDescription: string) => {
    const finalData = {
      ...onboardingData,
      allergyDescription,
    };
    onComplete?.(finalData);
  };

  const handleAllergyBack = () => {
    setCurrentStep('diet');
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

  return (
    <OnboardingAllergyScreen
      onNext={handleAllergyNext}
      onSkip={handleAllergySkip}
      onBack={handleAllergyBack}
      backgroundImage={backgroundImage}
    />
  );
};

export default OnboardingFlow;
