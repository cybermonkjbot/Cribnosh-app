import { Apple, Beef, ChefHat, Cookie, Fish, Grape, Hamburger, Utensils, UtensilsCrossed } from 'lucide-react-native';
import React, { useState } from 'react';
import { ImageBackground, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CribNoshLogo } from './ui/CribNoshLogo';

interface FoodCreatorOnboardingProfileScreenProps {
  onNext?: (name: string, bio: string, specialties: string[]) => void;
  onSkip?: () => void;
  backgroundImage?: any;
  initialData?: {
    name: string;
    bio: string;
    specialties: string[];
  };
}

export const FoodCreatorOnboardingProfileScreen: React.FC<FoodCreatorOnboardingProfileScreenProps> = ({
  onNext,
  onSkip,
  backgroundImage,
  initialData,
}) => {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(initialData?.name || '');
  const [bio, setBio] = useState(initialData?.bio || '');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(initialData?.specialties || []);

  const specialties = [
    { id: 'Italian', label: 'Italian', icon: ChefHat },
    { id: 'Chinese', label: 'Chinese', icon: UtensilsCrossed },
    { id: 'Indian', label: 'Indian', icon: Grape },
    { id: 'Mexican', label: 'Mexican', icon: Beef },
    { id: 'Japanese', label: 'Japanese', icon: Fish },
    { id: 'Thai', label: 'Thai', icon: Cookie },
    { id: 'American', label: 'American', icon: Hamburger },
    { id: 'Mediterranean', label: 'Mediterranean', icon: Apple },
    { id: 'Seafood', label: 'Seafood', icon: Fish },
    { id: 'BBQ', label: 'BBQ', icon: Beef },
    { id: 'Bakery', label: 'Bakery', icon: Cookie },
    { id: 'Vegetarian', label: 'Vegetarian', icon: Grape },
  ];

  const handleSpecialtyToggle = (specialtyId: string) => {
    setSelectedSpecialties(prev =>
      prev.includes(specialtyId)
        ? prev.filter(id => id !== specialtyId)
        : [...prev, specialtyId]
    );
  };

  const handleNext = () => {
    if (name.trim() && bio.trim() && selectedSpecialties.length > 0) {
      onNext?.(name.trim(), bio.trim(), selectedSpecialties);
    }
  };

  const canContinue = name.trim().length > 0 && bio.trim().length > 0 && selectedSpecialties.length > 0;

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
              <Text style={styles.title}>Setup your Food Creator profile</Text>
            </View>

            {/* Description */}
            <Text style={styles.description}>
              Tell us about yourself and your cooking style.
            </Text>

            {/* Name Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Name</Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Bio Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About You</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell us about your cooking experience and style..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Specialties Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What cuisines do you specialize in?</Text>
              <View style={styles.specialtiesContainer}>
                {specialties.map((specialty) => {
                  const IconComponent = specialty.icon || Utensils;
                  const isSelected = selectedSpecialties.includes(specialty.id);
                  return (
                    <TouchableOpacity
                      key={specialty.id}
                      style={[
                        styles.specialtyChip,
                        isSelected && styles.specialtyChipActive,
                      ]}
                      onPress={() => handleSpecialtyToggle(specialty.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.chipIcon}>
                        <IconComponent
                          color={isSelected ? '#FFFFFF' : '#6B7280'}
                          size={14}
                        />
                      </View>
                      <Text style={[
                        styles.specialtyChipText,
                        isSelected && styles.specialtyChipTextActive,
                      ]}>
                        {specialty.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Floating Continue Button */}
          <View style={[styles.floatingButtonContainer, { paddingBottom: insets.bottom }]}>
            <TouchableOpacity
              style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}
              onPress={handleNext}
              disabled={!canContinue}
            >
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
    height: '75%',
    zIndex: 2,
  },
  contentCard: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FAFFFA',
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
    backgroundColor: '#FAFFFA',
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
    color: '#111827',
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
    color: '#111827',
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
    color: '#111827',
    marginBottom: 16,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontFamily: 'SF Pro',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  specialtyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 36,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  specialtyChipActive: {
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
  specialtyChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    lineHeight: 18,
    letterSpacing: -0.01,
    textAlign: 'center',
  },
  specialtyChipTextActive: {
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
  continueButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
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

export default FoodCreatorOnboardingProfileScreen;

