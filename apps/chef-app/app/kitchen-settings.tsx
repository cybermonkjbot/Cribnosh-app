import { Stack, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { useChefAuth } from '@/contexts/ChefAuthContext';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useToast } from '@/lib/ToastContext';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { getConvexClient, getSessionToken } from '@/lib/convexClient';

// Back arrow SVG
const backArrowSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M19 12H5M12 19L5 12L12 5" stroke="#094327" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const chevronRightIconSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M7 4L13 10L7 16" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export default function KitchenSettingsScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { chef, user, sessionToken, isAuthenticated } = useChefAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Form state
  const [address, setAddress] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [certified, setCertified] = useState(false);

  // Get kitchen ID from chef
  const kitchenId = useQuery(
    api.queries.kitchens.getKitchenByChefId,
    chef?._id ? { chefId: chef._id } : 'skip'
  );

  // Get kitchen details
  const kitchen = useQuery(
    api.queries.kitchens.getKitchenDetails,
    kitchenId ? { kitchenId } : 'skip'
  );

  // Get full kitchen document including images
  const kitchenDoc = useQuery(
    api.queries.kitchens.getKitchenById,
    kitchenId ? { kitchenId } : 'skip'
  );

  // Load kitchen data
  useEffect(() => {
    if (kitchen) {
      setAddress(kitchen.address || '');
      setCertified(kitchen.certified || false);
    }
    if (kitchenDoc?.images) {
      // Convert storage IDs to URLs for display
      const loadImageUrls = async () => {
        const imageUrls = await Promise.all(
          kitchenDoc.images!.map(img => getImageUrl(img))
        );
        setImages(imageUrls);
      };
      loadImageUrls();
    }
  }, [kitchen, kitchenDoc]);

  const createKitchen = useMutation(api.mutations.kitchens.createKitchen);
  const updateKitchen = useMutation(api.mutations.kitchens.updateKitchen);

  // Convert storage IDs to URLs for display
  const getImageUrl = async (imageIdOrUrl: string): Promise<string> => {
    // If it's already a URL, return as-is
    if (imageIdOrUrl.startsWith('http://') || imageIdOrUrl.startsWith('https://')) {
      return imageIdOrUrl;
    }
    
    // Otherwise, try to get URL from storage
    try {
      const convex = getConvexClient();
      const url = await convex.storage.getUrl(imageIdOrUrl as any);
      return url || imageIdOrUrl;
    } catch (error) {
      console.error('Error getting image URL:', error);
      return imageIdOrUrl;
    }
  };

  const handleBack = () => {
    router.back();
  };

  const uploadImage = async (imageUri: string): Promise<string | null> => {
    try {
      const convex = getConvexClient();
      const uploadUrl = await convex.mutation(api.mutations.documents.generateUploadUrl);

      const response = await fetch(imageUri);
      const blob = await response.blob();

      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': blob.type || 'image/jpeg',
        },
        body: blob,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }

      const uploadResult = await uploadResponse.json();
      const storageId = uploadResult.storageId || uploadResult;
      
      // Get file URL for display
      const fileUrl = await convex.storage.getUrl(storageId);
      return fileUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleSave = async () => {
    if (!user?._id || !sessionToken) {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Please sign in to update kitchen settings',
        duration: 3000,
      });
      return;
    }

    if (!address.trim()) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Kitchen address is required',
        duration: 3000,
      });
      return;
    }

    setIsSaving(true);
    setIsUploading(true);
    try {
      // Upload images if there are any local URIs
      let uploadedImageUrls: string[] = [];
      if (images.length > 0) {
        for (const imageUri of images) {
          // Check if it's already a URL (already uploaded)
          if (imageUri.startsWith('http://') || imageUri.startsWith('https://')) {
            // Already uploaded URL, use as is
            uploadedImageUrls.push(imageUri);
          } else {
            // Local URI, need to upload
            const imageUrl = await uploadImage(imageUri);
            if (imageUrl) {
              uploadedImageUrls.push(imageUrl);
            }
          }
        }
      }

      if (kitchenId) {
        // Update existing kitchen
        await updateKitchen({
          kitchenId,
          address: address.trim(),
          images: uploadedImageUrls,
        });
        
        showToast({
          type: 'success',
          title: 'Success',
          message: 'Kitchen settings updated successfully',
          duration: 3000,
        });
      } else {
        // Create new kitchen
        await createKitchen({
          owner_id: user._id,
          address: address.trim(),
          certified: certified,
          images: uploadedImageUrls,
        });
        
        showToast({
          type: 'success',
          title: 'Success',
          message: 'Kitchen created successfully',
          duration: 3000,
        });
      }
      
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error saving kitchen:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: error?.message || 'Failed to save kitchen settings',
        duration: 4000,
      });
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
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
          addr.country,
        ]
          .filter(Boolean)
          .join(', ');
        
        if (fullAddress) {
          setAddress(fullAddress);
        }
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get your location. Please enter address manually.');
    }
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
        allowsEditing: true,
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

  if (!isAuthenticated) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: false,
            title: 'Kitchen Settings',
          }}
        />
        <SafeAreaView style={styles.mainContainer}>
          <StatusBar barStyle="dark-content" backgroundColor="#FAFFFA" />
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <SvgXml xml={backArrowSVG} width={24} height={24} />
            </TouchableOpacity>
            <View style={styles.headerSpacer} />
          </View>
          <View style={styles.content}>
            <Text style={styles.errorText}>Please sign in to view kitchen settings</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          title: 'Kitchen Settings',
        }}
      />
      <SafeAreaView style={styles.mainContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAFFFA" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <SvgXml xml={backArrowSVG} width={24} height={24} />
          </TouchableOpacity>
          <View style={styles.headerSpacer} />
          {!isEditing ? (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setIsEditing(true)}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#094327" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.mainTitle}>Kitchen Settings</Text>

          {/* Kitchen Status */}
          {kitchen && (
            <View style={styles.statusCard}>
              <Text style={styles.statusLabel}>Kitchen Status</Text>
              <View style={styles.statusRow}>
                <Text style={styles.statusText}>
                  {kitchen.certified ? 'Certified' : 'Not Certified'}
                </Text>
                {kitchen.certified && (
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                )}
              </View>
            </View>
          )}

          {/* Address Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kitchen Address</Text>
            <TextInput
              style={[styles.textInput, styles.textArea, !isEditing && styles.textInputDisabled]}
              value={address}
              onChangeText={setAddress}
              placeholder="Enter your full kitchen address"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              editable={isEditing}
            />
            {isEditing && (
              <TouchableOpacity
                style={styles.locationButton}
                onPress={handleUseCurrentLocation}
                activeOpacity={0.7}
              >
                <Ionicons name="location" size={20} color="#094327" />
                <Text style={styles.locationButtonText}>Use Current Location</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Kitchen Images Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kitchen Images</Text>
            {isEditing ? (
              <>
                <Text style={styles.sectionDescription}>
                  Add up to 10 images of your kitchen
                </Text>
                
                <View style={styles.imagesContainer}>
                  {images.map((imageUri, index) => (
                    <View key={index} style={styles.imageWrapper}>
                      <Image source={{ uri: imageUri }} style={styles.image} />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => handleRemoveImage(index)}
                      >
                        <Ionicons name="close-circle" size={24} color="#FF3B30" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  
                  {images.length < 10 && (
                    <TouchableOpacity
                      style={styles.addImageButton}
                      onPress={handleImagePick}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="add" size={32} color="#6B7280" />
                      <Text style={styles.addImageText}>Add Image</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            ) : (
              <>
                {images.length > 0 ? (
                  <View style={styles.imagesContainer}>
                    {images.map((imageUri, index) => (
                      <View key={index} style={styles.imageWrapper}>
                        <Image source={{ uri: imageUri }} style={styles.image} />
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.emptyImagesText}>No kitchen images added yet</Text>
                )}
              </>
            )}
          </View>

          {/* Certification Info */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={20} color="#6B7280" />
            <Text style={styles.infoText}>
              Kitchen certification is managed by Cribnosh. Contact support if you need to update your certification status.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#FAFFFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerSpacer: {
    flex: 1,
  },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  editButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#094327',
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#094327',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  mainTitle: {
    fontFamily: 'Archivo',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 32,
    color: '#094327',
    textAlign: 'left',
    marginTop: 16,
    marginBottom: 24,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusLabel: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#094327',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Archivo',
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 24,
    color: '#094327',
    marginBottom: 12,
  },
  sectionDescription: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontFamily: 'Inter',
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
  textInputDisabled: {
    backgroundColor: '#F9FAFB',
    color: '#6B7280',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    gap: 8,
  },
  locationButtonText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#094327',
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imageWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
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
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  addImageText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
  errorText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 40,
  },
  emptyImagesText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 8,
  },
});

