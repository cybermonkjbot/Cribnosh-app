import { Ionicons } from '@expo/vector-icons';
import { ChefHat, UtensilsCrossed, Fish, Beef, Sushi, Pizza, Hamburger, Grape, Apple, Cookie } from 'lucide-react-native';
import React, { useState } from 'react';
import { ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CribNoshLogo } from './ui/CribNoshLogo';

interface OnboardingCuisinesScreenProps {
  onNext?: (selectedCuisines: string[]) => void;
  onSkip?: () => void;
  onBack?: () => void;
  backgroundImage?: any;
}

export const OnboardingCuisinesScreen: React.FC<OnboardingCuisinesScreenProps> = ({
  onNext,
  onSkip,
  onBack,
  backgroundImage,
}) => {
  const insets = useSafeAreaInsets();
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);

  const cuisines = [
    { id: 'Italian', label: 'Italian', icon: ChefHat },
    { id: 'Chinese', label: 'Chinese', icon: UtensilsCrossed },
    { id: 'Indian', label: 'Indian', icon: Grape },
    { id: 'Mexican', label: 'Mexican', icon: Beef },
    { id: 'Japanese', label: 'Japanese', icon: Fish },
    { id: 'Thai', label: 'Thai', icon: Cookie },
    { id: 'American', label: 'American', icon: Hamburger },
    { id: 'Mediterranean', label: 'Mediterranean', icon: Apple },
    { id: 'Sushi', label: 'Sushi', icon: Sushi },
    { id: 'Pizza', label: 'Pizza', icon: Pizza },
    { id: 'Burgers', label: 'Burgers', icon: Hamburger },
  ];

  const handleCuisineToggle = (cuisineId: string) => {
    setSelectedCuisines(prev => 
      prev.includes(cuisineId)
        ? prev.filter(id => id !== cuisineId)
        : [...prev, cuisineId]
    );
  };

  const handleNext = () => {
    onNext?.(selectedCuisines);
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
            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButtonContainer}
              onPress={onBack}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={20} color="#02120A" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
            
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
            
            {/* Cuisine Question */}
            <Text style={styles.cuisineQuestion}>
              What cuisines do you love?
            </Text>
            
            {/* Cuisine Chips Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select your favorite cuisines</Text>
              <View style={styles.cuisinesContainer}>
                {cuisines.map((cuisine) => {
                  const IconComponent = cuisine.icon;
                  const isSelected = selectedCuisines.includes(cuisine.id);
                  return (
                    <TouchableOpacity
                      key={cuisine.id}
                      style={[
                        styles.cuisineChip,
                        isSelected && styles.cuisineChipActive,
                      ]}
                      onPress={() => handleCuisineToggle(cuisine.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.chipIcon}>
                        <IconComponent 
                          color={isSelected ? '#FFFFFF' : '#6B7280'} 
                          size={14} 
                        />
                      </View>
                      <Text style={[
                        styles.cuisineChipText,
                        isSelected && styles.cuisineChipTextActive,
                      ]}>
                        {cuisine.label}
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
  backButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 8,
  },
  backButtonText: {
    fontFamily: 'SF Pro',
    fontSize: 17,
    color: '#02120A',
    marginLeft: 8,
    fontWeight: '400',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
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
  description: {
    fontFamily: 'SF Pro',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24,
    color: '#6B7280',
    marginBottom: 32,
  },
  cuisineQuestion: {
    fontFamily: 'Poppins',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 24,
    color: '#02120A',
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
  cuisinesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cuisineChip: {
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
  cuisineChipActive: {
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
  cuisineChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    lineHeight: 18,
    letterSpacing: -0.01,
    textAlign: 'center',
  },
  cuisineChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
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

export default OnboardingCuisinesScreen;

