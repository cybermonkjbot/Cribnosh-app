import { useChefAuth } from '@/contexts/ChefAuthContext';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { getConvexClient } from '@/lib/convexClient';
import { useToast } from '@/lib/ToastContext';
import { useMutation, useQuery } from 'convex/react';
import * as ImagePicker from 'expo-image-picker';
import { X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

// Close icon SVG
const closeIconSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 6L6 18M6 6L18 18" stroke="#111827" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

interface EditMealModalProps {
  isVisible: boolean;
  onClose: () => void;
  mealId: Id<'meals'> | null;
}

const CUISINE_OPTIONS = [
  'Italian', 'Chinese', 'Indian', 'Mexican', 'Japanese', 'Thai', 'French', 'Mediterranean',
  'American', 'British', 'Caribbean', 'Middle Eastern', 'Korean', 'Vietnamese', 'Greek', 'Spanish'
];

const DIETARY_OPTIONS = [
  'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Nut-Free', 'Halal', 'Kosher', 'Paleo', 'Keto', 'Low-Carb'
];

const ALLERGEN_OPTIONS = [
  'Celery', 'Cereals containing gluten', 'Crustaceans', 'Eggs', 'Fish', 'Lupin', 'Milk', 'Molluscs',
  'Mustard', 'Nuts', 'Peanuts', 'Sesame seeds', 'Soya', 'Sulphur dioxide/Sulphites'
];

export function EditMealModal({ isVisible, onClose, mealId }: EditMealModalProps) {
  const { chef, sessionToken } = useChefAuth();
  const { showSuccess, showError } = useToast();
  const insets = useSafeAreaInsets();

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
    ingredients: [] as { name: string; quantity?: string; isAllergen?: boolean; allergenType?: string }[],
  });

  const [newIngredient, setNewIngredient] = useState({
    name: '',
    quantity: '',
    isAllergen: false,
    allergenType: '',
  });

  const updateMeal = useMutation(api.mutations.meals.updateMeal);

  // Fetch meal data when modal opens
  const meal = useQuery(
    api.queries.meals.getMealByIdForEdit,
    mealId && isVisible && sessionToken ? { mealId, sessionToken } : 'skip'
  ) as any;

  // Populate form when meal loads
  useEffect(() => {
    if (meal && isVisible) {
      setFormData({
        name: meal.name || '',
        description: meal.description || '',
        price: ((meal.price || 0) / 100).toFixed(2),
        cuisine: Array.isArray(meal.cuisine) ? meal.cuisine : [],
        dietary: Array.isArray(meal.dietary) ? meal.dietary : [],
        images: Array.isArray(meal.images) ? meal.images : [],
        status: meal.status === 'available' || meal.status === 'active' ? 'available' : 'unavailable',
        ingredients: Array.isArray(meal.ingredients) ? meal.ingredients : [],
      });
    }
  }, [meal, isVisible]);

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      cuisine: [],
      dietary: [],
      images: [],
      status: 'available',
      ingredients: [],
    });
    setNewIngredient({ name: '', quantity: '', isAllergen: false, allergenType: '' });
    onClose();
  };

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



  const handleAddIngredient = () => {
    if (!newIngredient.name.trim()) return;

    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { ...newIngredient, name: newIngredient.name.trim() }],
    });
    setNewIngredient({ name: '', quantity: '', isAllergen: false, allergenType: '' });
  };

  const handleRemoveIngredient = (index: number) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_, i) => i !== index),
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

    // Natasha's Law Compliance Check
    if (formData.status === 'available' && formData.ingredients.length === 0) {
      showError(
        'Compliance Error',
        'To list a meal as Available, you must list all ingredients.'
      );
      // Force status to unavailable
      setFormData({ ...formData, status: 'unavailable' });
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
          ingredients: formData.ingredients,
        },
        sessionToken,
      });

      showSuccess('Meal Updated', 'Your meal has been updated successfully.');
      handleClose();
    } catch (error: any) {
      showError('Error', error.message || 'Failed to update meal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = formData.name.trim() && formData.description.trim() && formData.price.trim() && !isNaN(parseFloat(formData.price)) && parseFloat(formData.price) > 0;

  if (!isVisible || !mealId) {
    return null;
  }

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {/* Header */}
          <View style={[styles.header, { paddingTop: Math.max(insets.top - 8, 0) }]}>
            <Text style={styles.title}>Edit Meal</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <SvgXml xml={closeIconSVG} width={24} height={24} />
            </TouchableOpacity>
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

                {/* Status */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Availability</Text>
                  <View style={styles.statusOptions}>
                    <TouchableOpacity
                      onPress={() => formData.ingredients.length > 0 ? setFormData({ ...formData, status: 'available' }) : null}
                      style={[
                        styles.statusCard,
                        formData.status === 'available' && styles.statusCardSelected,
                        formData.ingredients.length === 0 && { opacity: 0.5, backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' }
                      ]}
                      disabled={formData.ingredients.length === 0}
                    >
                      <Text
                        style={[
                          styles.statusCardText,
                          formData.status === 'available' && styles.statusCardTextSelected,
                          formData.ingredients.length === 0 && { color: '#9CA3AF' }
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

                  {formData.ingredients.length === 0 && (
                    <View style={{ marginTop: 16, padding: 12, backgroundColor: '#FEF2F2', borderRadius: 8, borderWidth: 1, borderColor: '#FECACA' }}>
                      <Text style={{ color: '#991B1B', fontWeight: '700', fontSize: 13, marginBottom: 4 }}>
                        ⚠️ Compliance Required
                      </Text>
                      <Text style={{ color: '#B91C1C', fontSize: 12, lineHeight: 16 }}>
                        You must list all ingredients to make this meal available.
                      </Text>
                    </View>
                  )}
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
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter',
    flex: 1,
    textAlign: 'left',
  },
  closeButton: {
    padding: 4,
    marginLeft: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
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
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    backgroundColor: '#F9FAFB',
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
    backgroundColor: '#F9FAFB',
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
    backgroundColor: '#F9FAFB',
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
    paddingTop: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
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
  hintText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter',
    marginBottom: 12,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  ingredientsList: {
    marginBottom: 24,
    gap: 8,
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  ingredientQuantity: {
    fontSize: 14,
    color: '#6B7280',
  },
  allergenBadge: {
    marginTop: 4,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  allergenText: {
    fontSize: 12,
    color: '#B91C1C',
    fontWeight: '500',
  },
  removeIngredientButton: {
    padding: 8,
  },
  addIngredientForm: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 48,
  },
  inputCardMarginTop: {
    marginTop: 12,
  },
  inputCardText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    fontFamily: 'Inter',
  },
  allergenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  allergenLabel: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  allergenTypeContainer: {
    marginBottom: 16,
  },
  subLabel: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  addButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    color: '#111827',
    fontWeight: '600',
  },
});


