import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import React, { useState } from 'react';
import { Alert, Image, ImageBackground, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CribNoshLogo } from './ui/CribNoshLogo';

interface ChefOnboardingKitchenScreenProps {
  onNext?: (kitchenName: string, address: string, kitchenType: string, images: string[]) => void;
  onSkip?: () => void;
  onBack?: () => void;
  backgroundImage?: any;
  initialData?: {
    kitchenName: string;
    address: string;
    kitchenType: string;
    images: string[];
  };
}

export const ChefOnboardingKitchenScreen: React.FC<ChefOnboardingKitchenScreenProps> = ({
  onNext,
  onSkip,
  onBack,
  backgroundImage,
  initialData,
}) => {
  const insets = useSafeAreaInsets();
  const [kitchenName, setKitchenName] = useState(initialData?.kitchenName || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [kitchenType, setKitchenType] = useState(initialData?.kitchenType || '');
  const [images, setImages] = useState<string[]>(initialData?.images || []);

  const kitchenTypes = [
    { id: 'home', label: 'Home Kitchen' },
    { id: 'commercial', label: 'Commercial Kitchen' },
  ];

  const handleKitchenTypeSelect = (type: string) => {
    setKitchenType(type);
  };

  const handleImagePick = async () => {
    if (images.length >= 10) {
      Alert.alert('Limit Reached', 'You can upload up to 10 kitchen images.');
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Media library permission is needed to select photos.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map(asset => asset.uri);
        setImages(prev => [...prev, ...newImages].slice(0, 10));
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to select images. Please try again.');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleUseCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission',
          'Location permission is needed to get your address.'
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const [lat, lng] = [location.coords.latitude, location.coords.longitude];
      
      const reverseGeocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (reverseGeocode && reverseGeocode.length > 0) {
        const addr = reverseGeocode[0];
        const fullAddress = [
          addr.streetNumber,
          addr.street,
          addr.city,
          addr.region,
          addr.postalCode,
        ].filter(Boolean).join(', ');
        setAddress(fullAddress);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get your location. Please enter address manually.');
    }
  };

  const handleNext = () => {
    if (kitchenName.trim() && address.trim() && kitchenType) {
      onNext?.(kitchenName.trim(), address.trim(), kitchenType, images);
    }
  };

  const canContinue = kitchenName.trim().length > 0 && address.trim().length > 0 && kitchenType.length > 0;

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
            {onBack && (
              <TouchableOpacity
                style={styles.backButtonContainer}
                onPress={onBack}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={20} color="#02120A" />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            )}
            
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Tell us about your kitchen</Text>
              <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
                <Text style={styles.skipButtonText}>Skip</Text>
              </TouchableOpacity>
            </View>
            
            {/* Description */}
            <Text style={styles.description}>
              Help customers understand your kitchen setup and location.
            </Text>
            
            {/* Kitchen Name Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Kitchen Name</Text>
              <TextInput
                style={styles.textInput}
                value={kitchenName}
                onChangeText={setKitchenName}
                placeholder="e.g., Maria's Home Kitchen"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            
            {/* Kitchen Type Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Kitchen Type</Text>
              <View style={styles.typeContainer}>
                {kitchenTypes.map((type) => {
                  const isSelected = kitchenType === type.id;
                  return (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.typeChip,
                        isSelected && styles.typeChipActive,
                      ]}
                      onPress={() => handleKitchenTypeSelect(type.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.typeChipText,
                        isSelected && styles.typeChipTextActive,
                      ]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            
            {/* Address Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Kitchen Address</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={address}
                onChangeText={setAddress}
                placeholder="Enter your full kitchen address"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
              />
              <TouchableOpacity
                style={styles.locationButton}
                onPress={handleUseCurrentLocation}
                activeOpacity={0.7}
              >
                <Ionicons name="location" size={20} color="#094327" />
                <Text style={styles.locationButtonText}>Use Current Location</Text>
              </TouchableOpacity>
            </View>
            
            {/* Kitchen Images Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Kitchen Photos (Optional)</Text>
              <Text style={styles.sectionSubtitle}>
                Add up to 10 photos of your kitchen. Help customers see your setup.
              </Text>
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={handleImagePick}
                activeOpacity={0.7}
              >
                <Ionicons name="camera" size={24} color="#094327" />
                <Text style={styles.addImageButtonText}>
                  {images.length > 0 ? `Add More (${images.length}/10)` : 'Add Photos'}
                </Text>
              </TouchableOpacity>
              
              {images.length > 0 && (
                <View style={styles.imagesContainer}>
                  {images.map((uri, index) => (
                    <View key={index} style={styles.imageWrapper}>
                      <Image source={{ uri }} style={styles.kitchenImage} />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => handleRemoveImage(index)}
                      >
                        <Ionicons name="close-circle" size={24} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
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
    height: '85%',
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
  backButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButtonText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 20,
    color: '#02120A',
    marginLeft: 8,
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
  sectionSubtitle: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    marginBottom: 12,
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
    minHeight: 80,
    textAlignVertical: 'top',
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  typeChipActive: {
    backgroundColor: '#094327',
    borderColor: '#094327',
  },
  typeChipText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
  typeChipTextActive: {
    color: '#FFFFFF',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  locationButtonText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
    color: '#094327',
    marginLeft: 8,
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#094327',
    borderStyle: 'dashed',
  },
  addImageButtonText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 20,
    color: '#094327',
    marginLeft: 8,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  imageWrapper: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  kitchenImage: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
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

export default ChefOnboardingKitchenScreen;

