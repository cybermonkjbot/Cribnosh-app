import React, { useState } from 'react';
import { ImageBackground, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CribNoshLogo } from './ui/CribNoshLogo';

interface OnboardingDietScreenProps {
  onNext?: (dietDescription: string, selectedPreference: string) => void;
  onSkip?: () => void;
  backgroundImage?: any;
}

export const OnboardingDietScreen: React.FC<OnboardingDietScreenProps> = ({
  onNext,
  onSkip,
  backgroundImage,
}) => {
  const insets = useSafeAreaInsets();
  const [dietDescription, setDietDescription] = useState('I like to eat a Fresh meat diet...');
  const [selectedPreference, setSelectedPreference] = useState('Vegan');

  const preferences = [
    { id: 'Vegan', label: 'Vegan', icon: '🍎', color: '#EF4444' },
    { id: 'GlutenFree', label: 'Gluten Free', icon: '🌾', color: '#6B7280' },
    { id: 'Spicy', label: 'Spicy', icon: '🔥', color: '#6B7280' },
  ];

  const handlePreferenceSelect = (preferenceId: string) => {
    setSelectedPreference(preferenceId);
  };

  const handleNext = () => {
    onNext?.(dietDescription, selectedPreference);
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
          <View style={[styles.contentCard, { height: 500 + insets.bottom }]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Setup your Cribnosh experience</Text>
              <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
                <Text style={styles.skipButtonText}>Skip</Text>
              </TouchableOpacity>
            </View>
            
            {/* Description */}
            <Text style={styles.description}>
              Tell us what you like, skip what you don't.
            </Text>
            
            {/* Diet Description Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Describe your diet</Text>
              <TextInput
                style={styles.textInput}
                value={dietDescription}
                onChangeText={setDietDescription}
                placeholder="I like to eat a Fresh meat diet..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
              />
            </View>
            
            {/* Food Preferences Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Which of these do you love more ?</Text>
              <View style={styles.preferencesContainer}>
                {preferences.map((preference) => (
                  <TouchableOpacity
                    key={preference.id}
                    style={[
                      styles.preferenceButton,
                      {
                        backgroundColor: selectedPreference === preference.id ? preference.color : '#E5E7EB',
                      },
                    ]}
                    onPress={() => handlePreferenceSelect(preference.id)}
                  >
                    <Text style={styles.preferenceIcon}>{preference.icon}</Text>
                    <Text style={styles.preferenceText}>{preference.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Continue Button */}
            <TouchableOpacity style={styles.continueButton} onPress={handleNext}>
              <Text style={styles.continueButtonText}>Continue</Text>
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
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Poppins',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 28,
    lineHeight: 36,
    color: '#064E3B',
    flex: 1,
    marginRight: 16,
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
  description: {
    fontFamily: 'SF Pro',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24,
    color: '#6B7280',
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
  preferencesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  preferenceButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 8,
  },
  preferenceIcon: {
    fontSize: 20,
  },
  preferenceText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
  },
  continueButton: {
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
  continueButtonText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 20,
    color: '#FFFFFF',
  },
});

export default OnboardingDietScreen;
