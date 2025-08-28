import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { OnboardingFlow } from './OnboardingFlow';
import { SignInScreen } from './SignInScreen';

interface OnboardingDemoProps {
  backgroundImage?: any;
}

export const OnboardingDemo: React.FC<OnboardingDemoProps> = ({
  backgroundImage,
}) => {
  const [currentScreen, setCurrentScreen] = useState<'signin' | 'onboarding'>('signin');
  const [onboardingData, setOnboardingData] = useState<any>(null);
  const [authData, setAuthData] = useState<any>(null);

  const handleSignInSuccess = (idToken: string, provider: 'google' | 'apple') => {
    setAuthData({ idToken, provider });
    console.log(`${provider} Sign-In successful with idToken:`, idToken);
    
    // Here you would typically:
    // 1. Send the idToken to Convex for verification
    // 2. await api.auth.signInWithProvider({ provider, idToken });
    // 3. Navigate to onboarding on success
    
    setCurrentScreen('onboarding');
  };

  const handleGoogleSignIn = (idToken: string) => {
    handleSignInSuccess(idToken, 'google');
  };

  const handleAppleSignIn = (idToken: string) => {
    handleSignInSuccess(idToken, 'apple');
  };

  const handleOnboardingComplete = (data: any) => {
    setOnboardingData(data);
    console.log('Onboarding completed with data:', data);
    console.log('User authenticated with:', authData);
    // Here you would typically navigate to the main app
    // For demo purposes, we'll just show the data
    setCurrentScreen('signin');
  };

  const handleOnboardingSkip = () => {
    console.log('Onboarding skipped');
    console.log('User authenticated with:', authData);
    // Here you would typically navigate to the main app
    setCurrentScreen('signin');
  };

  const handleBackToSignIn = () => {
    setCurrentScreen('signin');
  };

  if (currentScreen === 'onboarding') {
    return (
      <OnboardingFlow
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
        backgroundImage={backgroundImage}
      />
    );
  }

  return (
    <View style={styles.container}>
      <SignInScreen
        onGoogleSignIn={handleGoogleSignIn}
        onAppleSignIn={handleAppleSignIn}
        backgroundImage={backgroundImage}
      />
      
      {/* Demo Controls */}
      <View style={styles.demoControls}>
        <TouchableOpacity 
          style={styles.demoButton} 
          onPress={() => setCurrentScreen('onboarding')}
        >
          <Text style={styles.demoButtonText}>Go to Onboarding</Text>
        </TouchableOpacity>
        
        {authData && (
          <View style={styles.authDisplay}>
            <Text style={styles.authTitle}>Authentication Data:</Text>
            <Text style={styles.authText}>
              Provider: {authData.provider}
            </Text>
            <Text style={styles.authText}>
              ID Token: {authData.idToken.substring(0, 20)}...
            </Text>
          </View>
        )}
        
        {onboardingData && (
          <View style={styles.dataDisplay}>
            <Text style={styles.dataTitle}>Last Onboarding Data:</Text>
            <Text style={styles.dataText}>
              Diet: {onboardingData.dietDescription}
            </Text>
            <Text style={styles.dataText}>
              Preference: {onboardingData.selectedPreference}
            </Text>
            <Text style={styles.dataText}>
              Allergies: {onboardingData.allergyDescription}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  demoControls: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 16,
    borderRadius: 12,
    maxWidth: 200,
  },
  demoButton: {
    backgroundColor: '#064E3B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  demoButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  authDisplay: {
    backgroundColor: '#DBEAFE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  authTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 8,
  },
  authText: {
    fontSize: 11,
    color: '#1E40AF',
    marginBottom: 4,
  },
  dataDisplay: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
  },
  dataTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  dataText: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
  },
});

export default OnboardingDemo;
