import { Apple, Flame, Wheat, Leaf, Fish, Beef, Egg, Heart, Zap } from 'lucide-react-native';
import React, { useState } from 'react';
import { ImageBackground, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
    { id: 'Vegan', label: 'Vegan', icon: Apple, color: '#EF4444' },
    { id: 'Vegetarian', label: 'Vegetarian', icon: Leaf, color: '#6B7280' },
    { id: 'GlutenFree', label: 'Gluten Free', icon: Wheat, color: '#6B7280' },
    { id: 'Keto', label: 'Keto', icon: Beef, color: '#6B7280' },
    { id: 'Spicy', label: 'Spicy', icon: Flame, color: '#6B7280' },
    { id: 'Halal', label: 'Halal', icon: Fish, color: '#6B7280' },
    { id: 'HighProtein', label: 'High Protein', icon: Egg, color: '#6B7280' },
    { id: 'LowCarb', label: 'Low Carb', icon: Zap, color: '#6B7280' },
    { id: 'Healthy', label: 'Healthy', icon: Heart, color: '#6B7280' },
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
        {/* CribNosh Logo - positioned in upper left */}
        <View style={styles.logoContainer}>
          <CribNoshLogo size={172} variant="default" />
        </View>
        
        {/* Onboarding Content Card */}
        <View style={[styles.cardContainer, { bottom: 0 }]}>
          <ScrollView 
            style={styles.contentCard}
            contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Setup your Cribnosh experience</Text>
              <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
                <Text style={styles.skipButtonText}>Skip</Text>
              </TouchableOpacity>
            </View>
            
            {/* Description */}
            <Text style={styles.description}>
              Tell us what you like, skip what you don&apos;t.
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
                {preferences.map((preference) => {
                  const IconComponent = preference.icon;
                  const isSelected = selectedPreference === preference.id;
                  return (
                    <TouchableOpacity
                      key={preference.id}
                      style={[
                        styles.preferenceChip,
                        isSelected && styles.preferenceChipActive,
                      ]}
                      onPress={() => handlePreferenceSelect(preference.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.chipIcon}>
                        <IconComponent 
                          color={isSelected ? '#FFFFFF' : '#6B7280'} 
                          size={14} 
                        />
                      </View>
                      <Text style={[
                        styles.preferenceChipText,
                        isSelected && styles.preferenceChipTextActive,
                      ]}>
                        {preference.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>
          
          {/* Floating Continue Button */}
          <View style={[styles.floatingButtonContainer, { paddingBottom: insets.bottom }]}>
            <TouchableOpacity style={styles.continueButton} onPress={handleNext}>
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
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
    left: 24,
    top: 90,
    zIndex: 1,
  },
  cardContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
    zIndex: 2,
  },
  contentCard: {
    flex: 1,
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
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
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
    color: '#02120A',
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
    color: '#02120A',
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
    color: '#02120A',
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
    flexWrap: 'wrap',
    gap: 12,
  },
  preferenceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 36,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  preferenceChipActive: {
    backgroundColor: '#FF3B30',
    borderColor: '#FF3B30',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  chipIcon: {
    marginRight: 2,
  },
  preferenceChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    lineHeight: 18,
    letterSpacing: -0.01,
    textAlign: 'center',
  },
  preferenceChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  continueButton: {
    backgroundColor: '#094327',
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
