import React, { useState } from 'react';
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CribNoshLogo } from './ui/CribNoshLogo';

interface OnboardingAllergyScreenProps {
  onNext?: (allergyDescription: string) => void;
  onSkip?: () => void;
  onBack?: () => void;
  backgroundImage?: any;
}

export const OnboardingAllergyScreen: React.FC<OnboardingAllergyScreenProps> = ({
  onNext,
  onSkip,
  onBack,
  backgroundImage,
}) => {
  const insets = useSafeAreaInsets();
  const [allergyDescription, setAllergyDescription] = useState('I like to eat a Fresh meat diet...');

  const handleNext = () => {
    onNext?.(allergyDescription);
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={backgroundImage || require('../assets/images/signin-background.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* CribNosh Logo - positioned in upper center */}
        <View style={styles.logoContainer}>
          <CribNoshLogo size={172} variant="default" />
        </View>
        
        {/* Onboarding Content Card */}
        <View style={[styles.cardContainer, { bottom: 0 }]}>
          <View style={[styles.contentCard, { height: 400 + insets.bottom }]}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.backButton} onPress={onBack}>
                <Text style={styles.backButtonText}>←</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
                <Text style={styles.skipButtonText}>Skip</Text>
              </TouchableOpacity>
            </View>
            
            {/* Title */}
            <Text style={styles.title}>Setup your Cribnosh experience</Text>
            
            {/* Allergy Question */}
            <Text style={styles.allergyQuestion}>
              Do you have any Allergies we can help you avoid?
            </Text>
            
            {/* Allergy Description Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Describe your allergy</Text>
              <TextInput
                style={styles.textInput}
                value={allergyDescription}
                onChangeText={setAllergyDescription}
                placeholder="I like to eat a Fresh meat diet..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
              />
            </View>
            
            {/* Next Button */}
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>Continue</Text>
            </TouchableOpacity>
            
            {/* Bottom spacing to push content above safe area */}
            <View style={{ height: insets.bottom }} />
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  logoContainer: {
    position: 'absolute',
    left: '50%',
    top: 90,
    transform: [{ translateX: -86 }], // Half of logo width (172/2)
    zIndex: 1,
  },
  cardContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 2,
  },
  contentCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 40,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: '#064E3B',
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipButtonText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 20,
    color: '#064E3B',
  },
  title: {
    fontFamily: 'Poppins',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 28,
    lineHeight: 36,
    color: '#064E3B',
    marginBottom: 16,
  },
  allergyQuestion: {
    fontFamily: 'Poppins',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 24,
    color: '#064E3B',
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: 'Poppins',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 24,
    color: '#064E3B',
    marginBottom: 16,
  },
  textInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    fontFamily: 'SF Pro',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24,
    color: '#1F2937',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  nextButton: {
    backgroundColor: '#064E3B',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  nextButtonText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 20,
    color: '#FFFFFF',
  },
});

export default OnboardingAllergyScreen;
