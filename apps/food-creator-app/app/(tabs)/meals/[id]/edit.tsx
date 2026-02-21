import { ContentLinkSelector } from '@/components/ui/ContentLinkSelector';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { useFoodCreatorAuth } from '@/contexts/FoodCreatorAuthContext';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { getConvexClient } from '@/lib/convexClient';
import { useToast } from '@/lib/ToastContext';
import { useMutation, useQuery } from 'convex/react';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, BookOpen, Link2, Video, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CUISINE_OPTIONS = [
  'Italian', 'Chinese', 'Indian', 'Mexican', 'Japanese', 'Thai', 'French', 'Mediterranean',
  'American', 'British', 'Caribbean', 'Middle Eastern', 'Korean', 'Vietnamese', 'Greek', 'Spanish'
];

const DIETARY_OPTIONS = [
  'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Nut-Free', 'Halal', 'Kosher', 'Paleo', 'Keto', 'Low-Carb'
];

export default function EditMealPage() {
  const { foodCreator, sessionToken } = useFoodCreatorAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { showSuccess, showError } = useToast();

  const mealId = params.id as Id<'meals'>;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    cuisine: [] as string[],
    dietary: [] as string[],
    images: [] as string[],
    status: 'available' as 'available' | 'unavailable',
    linkedRecipeId: undefined as Id<'recipes'> | undefined,
    linkedVideoIds: [] as Id<'videoPosts'>[],
  });
  const [showContentSelector, setShowContentSelector] = useState(false);

  const updateMeal = useMutation(api.mutations.meals.updateMeal);

  // Fetch meal data
  const meal = useQuery(
    api.queries.meals.getMealByIdForEdit,
    mealId && sessionToken ? { mealId, sessionToken } : 'skip'
  ) as any;

  // Populate form when meal loads
  useEffect(() => {
    if (meal) {
      setFormData({
        name: meal.name || '',
        description: meal.description || '',
        price: ((meal.price || 0) / 100).toFixed(2),
        cuisine: Array.isArray(meal.cuisine) ? meal.cuisine : [],
        dietary: Array.isArray(meal.dietary) ? meal.dietary : [],
        images: Array.isArray(meal.images) ? meal.images : [],
        status: meal.status === 'available' || meal.status === 'active' ? 'available' : 'unavailable',
        linkedRecipeId: meal.linkedRecipeId,
        linkedVideoIds: Array.isArray(meal.linkedVideoIds) ? meal.linkedVideoIds : [],
      });
    }
  }, [meal]);

  const handleImagePick = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showError('Permission Required', 'Media library permission is needed to select photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        aspect: [16, 9],
        quality: 0.8,
        allowsMultipleSelection: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      setIsUploadingImage(true);

      try {
        const convex = getConvexClient();
        const uploadedImages: string[] = [];

        for (const asset of result.assets) {
          // Generate upload URL
          const uploadUrl = await convex.mutation(api.mutations.documents.generateUploadUrl);

          // Read file and convert to blob
          const response = await fetch(asset.uri);
          const blob = await response.blob();

          // Upload to Convex storage
          const uploadResponse = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
              'Content-Type': asset.mimeType || 'image/jpeg',
            },
            body: blob,
          });

          if (!uploadResponse.ok) {
            throw new Error('Upload failed');
          }

          const uploadResult = await uploadResponse.json();
          const storageId = uploadResult.storageId || uploadResult;

          // Get file URL
          const fileUrl = await (convex as any).storage.getUrl(storageId);
          uploadedImages.push(fileUrl);
        }

        setFormData({ ...formData, images: [...formData.images, ...uploadedImages] });
        showSuccess('Images Uploaded', `${uploadedImages.length} image(s) uploaded successfully.`);
      } catch (error: any) {
        showError('Error', error.message || 'Failed to upload images');
      } finally {
        setIsUploadingImage(false);
      }
    } catch (error: any) {
      showError('Error', error.message || 'Failed to select images');
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
  };

  const handleToggleCuisine = (cuisine: string) => {
    setFormData({
      ...formData,
      cuisine: formData.cuisine.includes(cuisine)
        ? formData.cuisine.filter(c => c !== cuisine)
        : [...formData.cuisine, cuisine],
    });
  };

  const handleToggleDietary = (dietary: string) => {
    setFormData({
      ...formData,
      dietary: formData.dietary.includes(dietary)
        ? formData.dietary.filter(d => d !== dietary)
        : [...formData.dietary, dietary],
    });
  };

  const handleSubmit = async () => {
    if (!mealId || !sessionToken) {
      showError('Error', 'Meal information not available');
      return;
    }

    // Validation
    if (!formData.name.trim()) {
      showError('Validation Error', 'Meal name is required');
      return;
    }

    if (!formData.description.trim()) {
      showError('Validation Error', 'Meal description is required');
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      showError('Validation Error', 'Please enter a valid price');
      return;
    }

    setIsSubmitting(true);

    try {
      await updateMeal({
        mealId,
        updates: {
          name: formData.name.trim(),
          description: formData.description.trim(),
          price: price * 100, // Convert to pence/cents
          cuisine: formData.cuisine,
          dietary: formData.dietary,
          status: formData.status,
          images: formData.images.length > 0 ? formData.images : undefined,
          linkedRecipeId: formData.linkedRecipeId,
          linkedVideoIds: formData.linkedVideoIds.length > 0 ? formData.linkedVideoIds : undefined,
        },
        sessionToken,
      });

      showSuccess('Meal Updated', 'Your meal has been updated successfully.');
      router.back();
    } catch (error: any) {
      showError('Error', error.message || 'Failed to update meal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = formData.name.trim() && formData.description.trim() && formData.price.trim() && !isNaN(parseFloat(formData.price)) && parseFloat(formData.price) > 0;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          title: 'Edit Meal'
        }}
      />
      <GradientBackground>
        <SafeAreaView style={styles.container} edges={['top']}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color="#031D11" />
            </TouchableOpacity>
            <Text style={styles.title}>Edit Meal</Text>
            <View style={styles.placeholder} />
          </View>

          {!meal ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#F23E2E" />
              <Text style={styles.loadingText}>Loading meal...</Text>
            </View>
          ) : (
            <>
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* Basic Information */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Basic Information</Text>

                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Meal Name *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., Grilled Chicken Pasta"
                      placeholderTextColor="#9CA3AF"
                      value={formData.name}
                      onChangeText={(text) => setFormData({ ...formData, name: text })}
                    />
                  </View>

                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Description *</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="Describe your meal..."
                      placeholderTextColor="#9CA3AF"
                      value={formData.description}
                      onChangeText={(text) => setFormData({ ...formData, description: text })}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>

                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Price (£) *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., 12.50"
                      placeholderTextColor="#9CA3AF"
                      value={formData.price}
                      onChangeText={(text) => setFormData({ ...formData, price: text })}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                {/* Cuisine Type */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Cuisine Type</Text>
                  <View style={styles.optionsGrid}>
                    {CUISINE_OPTIONS.map((cuisine) => (
                      <TouchableOpacity
                        key={cuisine}
                        onPress={() => handleToggleCuisine(cuisine)}
                        style={[
                          styles.optionChip,
                          formData.cuisine.includes(cuisine) && styles.optionChipSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.optionChipText,
                            formData.cuisine.includes(cuisine) && styles.optionChipTextSelected,
                          ]}
                        >
                          {cuisine}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Dietary Options */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Dietary Options</Text>
                  <View style={styles.optionsGrid}>
                    {DIETARY_OPTIONS.map((dietary) => (
                      <TouchableOpacity
                        key={dietary}
                        onPress={() => handleToggleDietary(dietary)}
                        style={[
                          styles.optionChip,
                          formData.dietary.includes(dietary) && styles.optionChipSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.optionChipText,
                            formData.dietary.includes(dietary) && styles.optionChipTextSelected,
                          ]}
                        >
                          {dietary}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Images */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Meal Images</Text>

                  {formData.images.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScrollView}>
                      <View style={styles.imagesContainer}>
                        {formData.images.map((imageUri, index) => (
                          <View key={index} style={styles.imageWrapper}>
                            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                            <TouchableOpacity
                              onPress={() => handleRemoveImage(index)}
                              style={styles.removeImageButton}
                            >
                              <X size={16} color="#fff" />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    </ScrollView>
                  )}

                  <TouchableOpacity
                    onPress={handleImagePick}
                    disabled={isUploadingImage}
                    style={styles.imagePicker}
                  >
                    {isUploadingImage ? (
                      <ActivityIndicator size="large" color="#F23E2E" />
                    ) : (
                      <Text style={styles.imagePickerText}>
                        {formData.images.length > 0 ? 'Add More Images' : 'Add Meal Images'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Linked Content */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Linked Content</Text>
                  <Text style={styles.sectionDescription}>
                    Link recipes and videos to this meal to provide additional context and instructions
                  </Text>

                  {/* Linked Recipe */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Recipe</Text>
                    {formData.linkedRecipeId ? (
                      <View style={styles.linkedContentCard}>
                        <BookOpen size={20} color="#094327" />
                        <Text style={styles.linkedContentText}>Recipe linked</Text>
                        <TouchableOpacity
                          onPress={() => setFormData({ ...formData, linkedRecipeId: undefined })}
                          style={styles.unlinkButton}
                        >
                          <X size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.linkContentButton}
                        onPress={() => setShowContentSelector(true)}
                      >
                        <Link2 size={20} color="#094327" />
                        <Text style={styles.linkContentButtonText}>Link Recipe</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Linked Videos */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Videos</Text>
                    {formData.linkedVideoIds.length > 0 ? (
                      <View style={styles.linkedVideosContainer}>
                        {formData.linkedVideoIds.map((videoId) => (
                          <View key={videoId} style={styles.linkedContentCard}>
                            <Video size={20} color="#094327" />
                            <Text style={styles.linkedContentText}>Video {videoId}</Text>
                            <TouchableOpacity
                              onPress={() => setFormData({
                                ...formData,
                                linkedVideoIds: formData.linkedVideoIds.filter(id => id !== videoId)
                              })}
                              style={styles.unlinkButton}
                            >
                              <X size={16} color="#EF4444" />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    ) : null}
                    <TouchableOpacity
                      style={styles.linkContentButton}
                      onPress={() => setShowContentSelector(true)}
                    >
                      <Link2 size={20} color="#094327" />
                      <Text style={styles.linkContentButtonText}>
                        {formData.linkedVideoIds.length > 0 ? 'Link More Videos' : 'Link Videos'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Status */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Availability</Text>
                  <View style={styles.statusOptions}>
                    <TouchableOpacity
                      onPress={() => setFormData({ ...formData, status: 'available' })}
                      style={[
                        styles.statusCard,
                        formData.status === 'available' && styles.statusCardSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusCardText,
                          formData.status === 'available' && styles.statusCardTextSelected,
                        ]}
                      >
                        Available
                      </Text>
                      <Text style={styles.statusCardSubtext}>
                        Customers can order this meal
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setFormData({ ...formData, status: 'unavailable' })}
                      style={[
                        styles.statusCard,
                        formData.status === 'unavailable' && styles.statusCardSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusCardText,
                          formData.status === 'unavailable' && styles.statusCardTextSelected,
                        ]}
                      >
                        Unavailable
                      </Text>
                      <Text style={styles.statusCardSubtext}>
                        Meal is temporarily unavailable
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>

              {/* Submit Button */}
              <View style={styles.footer}>
                <TouchableOpacity
                  style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={!canSubmit || isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </SafeAreaView>
      </GradientBackground>

      {/* Content Link Selector */}
      <ContentLinkSelector
        visible={showContentSelector}
        onClose={() => setShowContentSelector(false)}
        onSelect={(type, id) => {
          if (type === 'recipe') {
            setFormData({ ...formData, linkedRecipeId: id as Id<'recipes'> });
          } else {
            if (!formData.linkedVideoIds.includes(id as Id<'videoPosts'>)) {
              setFormData({
                ...formData,
                linkedVideoIds: [...formData.linkedVideoIds, id as Id<'videoPosts'>]
              });
            }
          }
        }}
        selectedRecipeId={formData.linkedRecipeId}
        selectedVideoIds={formData.linkedVideoIds}
        allowMultiple={true}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: 'transparent',
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#031D11',
    fontFamily: 'Inter',
  },
  placeholder: {
    width: 34,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontFamily: 'Inter',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#031D11',
    fontFamily: 'Inter',
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    fontFamily: 'Inter',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
    fontFamily: 'Inter',
    minHeight: 48,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  optionChipSelected: {
    backgroundColor: '#FFF5F5',
    borderColor: '#F23E2E',
  },
  optionChipText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  optionChipTextSelected: {
    color: '#F23E2E',
  },
  imagesScrollView: {
    marginBottom: 16,
  },
  imagesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  imageWrapper: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePicker: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  imagePickerText: {
    fontSize: 14,
    color: '#F23E2E',
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  statusOptions: {
    gap: 12,
  },
  statusCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    padding: 20,
    alignItems: 'center',
  },
  statusCardSelected: {
    backgroundColor: '#FFF5F5',
    borderColor: '#F23E2E',
  },
  statusCardText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: 'Inter',
    marginBottom: 4,
  },
  statusCardTextSelected: {
    color: '#F23E2E',
  },
  statusCardSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(229, 231, 235, 0.5)',
    backgroundColor: 'transparent',
  },
  submitButton: {
    backgroundColor: '#F23E2E',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#E5E7EB',
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    fontFamily: 'Inter',
    lineHeight: 20,
  },
  linkContentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 8,
  },
  linkContentButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#094327',
    fontFamily: 'Inter',
  },
  linkedContentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#E0F2FE',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#094327',
  },
  linkedContentText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    fontFamily: 'Inter',
  },
  linkedVideosContainer: {
    marginBottom: 8,
  },
  unlinkButton: {
    padding: 4,
  },
});

