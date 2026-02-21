import { useFoodCreatorAuth } from '@/contexts/FoodCreatorAuthContext';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/convexClient';
import { useToast } from '@/lib/ToastContext';
import { useMutation } from 'convex/react';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Modal, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

// Close icon SVG
const closeIconSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 6L6 18M6 6L18 18" stroke="#111827" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

interface CreateMealModalProps {
  isVisible: boolean;
  onClose: () => void;
}

const STEPS = [
  { id: 'basic', question: "What's your meal called?" },
  { id: 'details', question: 'Tell us about your meal' },
  { id: 'ingredients', question: 'What\'s in your meal?' },
  { id: 'images', question: 'Add meal images' },
  { id: 'status', question: 'Set availability' },
];

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

export function CreateMealModal({ isVisible, onClose }: CreateMealModalProps) {
  const { foodCreator, sessionToken, isAuthenticated } = useFoodCreatorAuth();
  const { showSuccess, showError } = useToast();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    cuisine: [] as string[],
    dietary: [] as string[],
    images: [] as string[],
    status: 'available' as 'available' | 'unavailable',
    ingredients: [] as { name: string; quantity: string; isAllergen: boolean; allergenType: string }[],
  });

  // New ingredient state
  const [newIngredient, setNewIngredient] = useState({
    name: '',
    quantity: '',
    isAllergen: false,
    allergenType: '',
  });

  const createMeal = useMutation(api.mutations.meals.createMeal);

  // Check authentication when modal opens
  useEffect(() => {
    if (isVisible && !isAuthenticated) {
      onClose();
      router.push({
        pathname: '/sign-in',
        params: { notDismissable: 'true' }
      });
    }
  }, [isVisible, isAuthenticated, onClose, router]);

  const handleClose = () => {
    // Reset form
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
    setCurrentStep(0);
    setIsSubmitted(false);
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

  const canProceed = useMemo(() => {
    const step = STEPS[currentStep];
    switch (step.id) {
      case 'basic':
        return !!formData.name.trim() && !!formData.description.trim();
      case 'details':
        return !!formData.price.trim() && !isNaN(parseFloat(formData.price)) && parseFloat(formData.price) > 0;
      case 'ingredients':
        // Natasha's Law: Must have at least one ingredient to act as a compliance check? 
        // Or strictly valid only if Status is Available. But here we just check progress.
        // Let's require at least one ingredient to be thorough, or at least rely on the final check.
        // Let's make it optional here for UX, but enforced on submit if "Available".
        return true;
      case 'images':
        return true; // Optional
      case 'status':
        return true; // Always can proceed
      default:
        return false;
    }
  }, [currentStep, formData]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!foodCreator?._id || !sessionToken) {
      showError('Error', 'Food Creator information not available');
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
        'To list a meal as Available, you must list all ingredients and allergens.'
      );
      // Force status to unavailable if they try to bypass
      setFormData({ ...formData, status: 'unavailable' });
      // Navigate to ingredients step
      setCurrentStep(STEPS.findIndex(s => s.id === 'ingredients'));
      return;
    }

    setIsSubmitting(true);

    try {
      await createMeal({
        foodCreatorId: foodCreator._id.toString(),
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: price * 100, // Convert to pence/cents
        cuisine: formData.cuisine,
        dietary: formData.dietary,
        status: formData.status,
        images: formData.images.length > 0 ? formData.images : undefined,
        ingredients: formData.ingredients,
        sessionToken,
      });

      setIsSubmitted(true);
      showSuccess(
        'Meal Created',
        'Your meal has been created successfully and is now available for customers to order.'
      );
    } catch (error: any) {
      showError('Error', error.message || 'Failed to create meal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    const step = STEPS[currentStep];

    switch (step.id) {
      case 'basic':
        return (
          <View style={styles.stepContent}>
            <View style={styles.inputCard}>
              <TextInput
                style={styles.inputCardText}
                placeholder="Meal name (e.g., Grilled Chicken Pasta)"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <View style={[styles.inputCard, styles.inputCardMultiline, styles.inputCardMarginTop]}>
              <TextInput
                style={[styles.inputCardText, styles.inputCardTextMultiline]}
                placeholder="Describe your meal..."
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
              />
            </View>
            <Text style={styles.hintText}>Give your meal a name and describe what makes it special</Text>
          </View>
        );

      case 'details':
        return (
          <View style={styles.stepContent}>
            <View style={styles.inputCard}>
              <TextInput
                style={styles.inputCardText}
                placeholder="Price (e.g., 12.50)"
                value={formData.price}
                onChangeText={(text) => setFormData({ ...formData, price: text })}
                keyboardType="decimal-pad"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <View style={styles.optionsSection}>
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
            <View style={[styles.optionsSection, styles.optionsSectionMarginTop]}>
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
            <Text style={styles.hintText}>Set the price and categorize your meal</Text>
          </View>
        );

      case 'ingredients':
        return (
          <View style={styles.stepContent}>
            {/* List of added ingredients */}
            {formData.ingredients.length > 0 && (
              <View style={styles.ingredientsList}>
                {formData.ingredients.map((ing, i) => (
                  <View key={i} style={styles.ingredientItem}>
                    <View style={styles.ingredientInfo}>
                      <Text style={styles.ingredientName}>{ing.name}</Text>
                      {ing.quantity ? <Text style={styles.ingredientQuantity}>{ing.quantity}</Text> : null}
                      {ing.isAllergen && (
                        <View style={styles.allergenBadge}>
                          <Text style={styles.allergenText}>⚠️ {ing.allergenType || 'Allergen'}</Text>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity onPress={() => handleRemoveIngredient(i)} style={styles.removeIngredientButton}>
                      <X size={16} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Add new ingredient form */}
            <View style={styles.addIngredientForm}>
              <Text style={styles.sectionTitle}>Add Ingredient</Text>

              <View style={styles.inputCard}>
                <TextInput
                  style={styles.inputCardText}
                  placeholder="Ingredient Name (e.g. Flour)"
                  value={newIngredient.name}
                  onChangeText={(t) => setNewIngredient({ ...newIngredient, name: t })}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={[styles.inputCard, styles.inputCardMarginTop]}>
                <TextInput
                  style={styles.inputCardText}
                  placeholder="Quantity (optional, e.g. 100g)"
                  value={newIngredient.quantity}
                  onChangeText={(t) => setNewIngredient({ ...newIngredient, quantity: t })}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.allergenRow}>
                <Text style={styles.allergenLabel}>Is this an allergen?</Text>
                <Switch
                  value={newIngredient.isAllergen}
                  onValueChange={(val) => setNewIngredient({ ...newIngredient, isAllergen: val })}
                  trackColor={{ false: '#E5E7EB', true: '#F23E2E' }}
                />
              </View>

              {newIngredient.isAllergen && (
                <View style={styles.allergenTypeContainer}>
                  <Text style={styles.subLabel}>Allergen Type:</Text>
                  <View style={styles.optionsGrid}>
                    {ALLERGEN_OPTIONS.map((type) => (
                      <TouchableOpacity
                        key={type}
                        onPress={() => setNewIngredient({ ...newIngredient, allergenType: type })}
                        style={[
                          styles.optionChip,
                          newIngredient.allergenType === type && styles.optionChipSelected
                        ]}
                      >
                        <Text style={[
                          styles.optionChipText,
                          newIngredient.allergenType === type && styles.optionChipTextSelected
                        ]}>{type}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={[styles.addButton, !newIngredient.name.trim() && styles.addButtonDisabled]}
                onPress={handleAddIngredient}
                disabled={!newIngredient.name.trim()}
              >
                <Text style={styles.addButtonText}>Add Ingredient</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.hintText}>Natasha's Law requires full ingredient lists for pre-packed food.</Text>
          </View>
        );

      case 'images':
        return (
          <View style={styles.stepContent}>
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
            <Text style={styles.hintText}>Add photos to showcase your meal (optional)</Text>
          </View>
        );

      case 'status':
        const hasIngredients = formData.ingredients.length > 0;

        return (
          <View style={styles.stepContent}>
            <View style={styles.statusOptions}>
              <TouchableOpacity
                onPress={() => hasIngredients ? setFormData({ ...formData, status: 'available' }) : null}
                style={[
                  styles.statusCard,
                  formData.status === 'available' && styles.statusCardSelected,
                  !hasIngredients && { opacity: 0.5, backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' }
                ]}
                disabled={!hasIngredients}
              >
                <Text
                  style={[
                    styles.statusCardText,
                    formData.status === 'available' && styles.statusCardTextSelected,
                    !hasIngredients && { color: '#9CA3AF' }
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

            {!hasIngredients ? (
              <View style={{ marginTop: 24, padding: 16, backgroundColor: '#FEF2F2', borderRadius: 12, borderWidth: 1, borderColor: '#FECACA' }}>
                <Text style={{ color: '#991B1B', fontWeight: '700', fontSize: 14, marginBottom: 4 }}>
                  ⚠️ Natasha's Law Compliance
                </Text>
                <Text style={{ color: '#B91C1C', fontSize: 13, lineHeight: 18 }}>
                  You cannot list this meal as "Available" until you have added a full list of ingredients and allergens. Please go back to the "Ingredients" step.
                </Text>
              </View>
            ) : (
              <Text style={styles.hintText}>Set whether this meal is currently available for orders</Text>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  const currentStepData = STEPS[currentStep];
  const progress = ((currentStep + 1) / STEPS.length) * 100;

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
            <Text style={styles.title}>New Meal</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <SvgXml xml={closeIconSVG} width={24} height={24} />
            </TouchableOpacity>
          </View>

          {isSubmitted ? (
            /* Success State */
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.successContainer}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.successIconContainer} />
              <Text style={styles.successTitle}>Meal Created!</Text>
              <Text style={styles.successMessage}>
                Your meal has been created successfully and is now {formData.status === 'available' ? 'available' : 'unavailable'} for customers to order.
              </Text>
              <TouchableOpacity
                style={styles.doneButton}
                onPress={handleClose}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            /* Step-by-step Wizard */
            <View style={styles.wizardContainer}>
              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
                <Text style={styles.progressText}>
                  Step {currentStep + 1} of {STEPS.length}
                </Text>
              </View>

              {/* Step Question */}
              <View style={styles.questionContainer}>
                <Text style={styles.questionText}>{currentStepData.question}</Text>
              </View>

              {/* Step Content */}
              <ScrollView
                style={styles.stepScrollView}
                contentContainerStyle={styles.stepScrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {renderStepContent()}
              </ScrollView>

              {/* Navigation Buttons */}
              <View style={styles.navigationContainer}>
                {currentStep > 0 && (
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={handleBack}
                  >
                    <Text style={styles.backButtonText}>Back</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[
                    styles.nextButton,
                    !canProceed && styles.nextButtonDisabled,
                  ]}
                  onPress={handleNext}
                  disabled={!canProceed || isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.nextButtonText}>
                      {currentStep === STEPS.length - 1 ? 'Create Meal' : 'Next'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
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
    marginBottom: 20,
  },
  title: {
    flex: 1,
    textAlign: 'left',
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter',
  },
  closeButton: {
    padding: 4,
    marginLeft: 16,
  },
  wizardContainer: {
    flex: 1,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F23E2E',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  questionContainer: {
    marginBottom: 32,
    alignItems: 'center',
  },
  questionText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  stepScrollView: {
    flex: 1,
  },
  stepScrollContent: {
    paddingBottom: 20,
  },
  stepContent: {
    flex: 1,
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    paddingHorizontal: 20,
    paddingVertical: 18,
    minHeight: 64,
  },
  inputCardMultiline: {
    alignItems: 'flex-start',
    paddingTop: 18,
  },
  inputCardMarginTop: {
    marginTop: 16,
  },
  inputCardText: {
    flex: 1,
    fontSize: 18,
    color: '#111827',
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  inputCardTextMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  hintText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter',
    marginTop: 12,
    textAlign: 'center',
  },
  optionsSection: {
    marginTop: 24,
  },
  optionsSectionMarginTop: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter',
    marginBottom: 12,
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
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  imagePickerText: {
    marginTop: 8,
    fontSize: 14,
    color: '#F23E2E',
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  statusOptions: {
    gap: 16,
  },
  statusCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    padding: 24,
    alignItems: 'center',
  },
  statusCardSelected: {
    backgroundColor: '#FFF5F5',
    borderColor: '#F23E2E',
  },
  statusCardText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: 'Inter',
    marginTop: 12,
  },
  statusCardTextSelected: {
    color: '#F23E2E',
  },
  statusCardSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'Inter',
    marginTop: 4,
    textAlign: 'center',
  },
  navigationContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 20,
    paddingBottom: 20,
  },
  backButton: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  backButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  nextButton: {
    flex: 2,
    backgroundColor: '#F23E2E',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  nextButtonDisabled: {
    backgroundColor: '#E5E7EB',
    opacity: 0.6,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  scrollView: {
    flex: 1,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  successIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    marginBottom: 32,
    fontFamily: 'Inter',
  },
  doneButton: {
    backgroundColor: '#F23E2E',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    minWidth: 120,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
    textAlign: 'center',
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
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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

