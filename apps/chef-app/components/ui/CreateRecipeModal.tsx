import { useChefAuth } from '@/contexts/ChefAuthContext';
import { api } from '@/convex/_generated/api';
import { useToast } from '@/lib/ToastContext';
import { getConvexClient } from '@/lib/convexClient';
import { useMutation, useQuery } from 'convex/react';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Link2, Utensils, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

// Close icon SVG
const closeIconSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 6L6 18M6 6L18 18" stroke="#111827" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

interface Ingredient {
  name: string;
  amount: string;
  unit: string;
}

interface CreateRecipeModalProps {
  isVisible: boolean;
  onClose: () => void;
}

const STEPS = [
  { id: 'basic', question: "What's your recipe called?" },
  { id: 'details', question: 'Tell us about your recipe' },
  { id: 'image', question: 'Add a featured image' },
  { id: 'ingredients', question: 'What ingredients do you need?' },
  { id: 'instructions', question: 'How do you make it?' },
  { id: 'link', question: 'Link to a meal (optional)' },
];

export function CreateRecipeModal({ isVisible, onClose }: CreateRecipeModalProps) {
  const { chef, sessionToken, isAuthenticated } = useChefAuth();
  const { showSuccess, showError } = useToast();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    prepTime: '',
    cookTime: '',
    servings: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    cuisine: '',
    dietary: [] as string[],
    featuredImage: null as string | null,
    ingredients: [] as Ingredient[],
    instructions: [] as string[],
    status: 'draft' as 'draft' | 'published',
    linkedMealId: null as string | null,
  });
  const [showMealPicker, setShowMealPicker] = useState(false);

  const createRecipe = useMutation(api.mutations.recipes.createRecipe);
  const updateMeal = useMutation(api.mutations.meals.updateMeal);
  
  // Get meals for linking
  // @ts-ignore - Type instantiation is excessively deep (Convex type system limitation)
  const meals = useQuery(
    api.queries.meals.getByChefId,
    chef?._id ? { chefId: chef._id } : 'skip'
  ) as any[] | undefined;

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
      title: '',
      description: '',
      prepTime: '',
      cookTime: '',
      servings: '',
      difficulty: 'medium',
      cuisine: '',
      dietary: [],
      featuredImage: null,
      ingredients: [],
      instructions: [],
      status: 'draft',
      linkedMealId: null,
    });
    setCurrentStep(0);
    setIsSubmitted(false);
    onClose();
  };

  const handleAddIngredient = () => {
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { name: '', amount: '', unit: '' }],
    });
  };

  const handleRemoveIngredient = (index: number) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_, i) => i !== index),
    });
  };

  const handleUpdateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    const updated = [...formData.ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, ingredients: updated });
  };

  const handleAddInstruction = () => {
    setFormData({
      ...formData,
      instructions: [...formData.instructions, ''],
    });
  };

  const handleRemoveInstruction = (index: number) => {
    setFormData({
      ...formData,
      instructions: formData.instructions.filter((_, i) => i !== index),
    });
  };

  const handleUpdateInstruction = (index: number, value: string) => {
    const updated = [...formData.instructions];
    updated[index] = value;
    setFormData({ ...formData, instructions: updated });
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
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      setIsUploadingImage(true);

      // Validate assets array
      if (!result.assets || result.assets.length === 0 || !result.assets[0]) {
        throw new Error('No image selected');
      }

      const selectedAsset = result.assets[0];
      if (!selectedAsset.uri) {
        throw new Error('Selected image has no URI');
      }

      // Generate upload URL
      const convex = getConvexClient();
      const uploadUrl = await convex.mutation(api.mutations.documents.generateUploadUrl);

      // Read file and convert to blob
      const response = await fetch(selectedAsset.uri);
      const blob = await response.blob();

      // Upload to Convex storage
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': selectedAsset.mimeType || 'image/jpeg',
        },
        body: blob,
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      const uploadResult = await uploadResponse.json();
      const storageId = uploadResult.storageId || uploadResult;

      // Get file URL
      const fileUrl = await convex.storage.getUrl(storageId);

      setFormData({ ...formData, featuredImage: fileUrl });
      showSuccess('Image Uploaded', 'Recipe image uploaded successfully.');
    } catch (error: any) {
      showError('Error', error.message || 'Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const canProceed = useMemo(() => {
    const step = STEPS[currentStep];
    switch (step.id) {
      case 'basic':
        return !!formData.title.trim() && !!formData.description.trim();
      case 'details':
        return true; // Optional fields
      case 'image':
        return true; // Optional
      case 'ingredients':
        return formData.ingredients.length > 0 && 
          formData.ingredients.some(ing => ing.name.trim() && ing.amount.trim() && ing.unit.trim());
      case 'instructions':
        return formData.instructions.length > 0 && 
          formData.instructions.some(inst => inst.trim());
      case 'link':
        return true; // Optional
      default:
        return false;
    }
  }, [currentStep, formData]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (publish: boolean) => {
    if (!chef?.name || !sessionToken) {
      showError('Error', 'Chef information not available');
      return;
    }

    // Validation
    if (!formData.title.trim()) {
      showError('Validation Error', 'Recipe title is required');
      return;
    }

    if (!formData.description.trim()) {
      showError('Validation Error', 'Recipe description is required');
      return;
    }

    if (formData.ingredients.length === 0) {
      showError('Validation Error', 'At least one ingredient is required');
      return;
    }

    if (formData.instructions.length === 0) {
      showError('Validation Error', 'At least one instruction step is required');
      return;
    }

    const validIngredients = formData.ingredients.filter(
      ing => ing.name.trim() && ing.amount.trim() && ing.unit.trim()
    );

    if (validIngredients.length === 0) {
      showError('Validation Error', 'Please complete all ingredient fields');
      return;
    }

    const validInstructions = formData.instructions.filter(inst => inst.trim());

    if (validInstructions.length === 0) {
      showError('Validation Error', 'Please complete all instruction steps');
      return;
    }

    setIsSubmitting(true);

    try {
      const recipeId = await createRecipe({
        title: formData.title.trim(),
        description: formData.description.trim(),
        ingredients: validIngredients.map(ing => ({
          name: ing.name.trim(),
          amount: ing.amount.trim(),
          unit: ing.unit.trim(),
        })),
        instructions: validInstructions.map(inst => inst.trim()),
        prepTime: parseInt(formData.prepTime) || 0,
        cookTime: parseInt(formData.cookTime) || 0,
        servings: parseInt(formData.servings) || 1,
        difficulty: formData.difficulty,
        cuisine: formData.cuisine.trim() || 'Other',
        dietary: formData.dietary,
        author: chef.name,
        featuredImage: formData.featuredImage || undefined,
        status: publish ? 'published' : 'draft',
        sessionToken,
      });

      // If a meal is selected, link the recipe to that meal
      if (formData.linkedMealId && recipeId) {
        try {
          await updateMeal({
            mealId: formData.linkedMealId as any,
            updates: {
              linkedRecipeId: recipeId,
            },
            sessionToken,
          });
        } catch (error) {
          console.error('Error linking recipe to meal:', error);
          // Don't fail the recipe creation if linking fails
        }
      }
      
      setIsSubmitted(true);
      showSuccess(
        publish ? 'Recipe Published' : 'Recipe Saved',
        publish
          ? 'Your recipe has been published successfully!'
          : 'Your recipe has been saved as a draft.'
      );
    } catch (error: any) {
      showError('Error', error.message || 'Failed to create recipe');
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
                placeholder="Recipe title (e.g., Pasta Carbonara)"
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <View style={[styles.inputCard, styles.inputCardMultiline, styles.inputCardMarginTop]}>
              <TextInput
                style={[styles.inputCardText, styles.inputCardTextMultiline]}
                placeholder="Describe your recipe..."
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
              />
            </View>
            <Text style={styles.hintText}>Give your recipe a name and describe what makes it special</Text>
          </View>
        );

      case 'details':
        return (
          <View style={styles.stepContent}>
            <View style={styles.row}>
              <View style={[styles.inputCard, { flex: 1, marginRight: 8 }]}>
                <TextInput
                  style={styles.inputCardText}
                  placeholder="Prep (min)"
                  value={formData.prepTime}
                  onChangeText={(text) => setFormData({ ...formData, prepTime: text })}
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View style={[styles.inputCard, { flex: 1, marginLeft: 8 }]}>
                <TextInput
                  style={styles.inputCardText}
                  placeholder="Cook (min)"
                  value={formData.cookTime}
                  onChangeText={(text) => setFormData({ ...formData, cookTime: text })}
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>
            <View style={[styles.inputCard, styles.inputCardMarginTop]}>
              <TextInput
                style={styles.inputCardText}
                placeholder="Servings"
                value={formData.servings}
                onChangeText={(text) => setFormData({ ...formData, servings: text })}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <View style={styles.difficultyContainer}>
              <Text style={styles.hintText}>Difficulty Level</Text>
              <View style={styles.difficultyButtons}>
                {(['easy', 'medium', 'hard'] as const).map((level) => (
                  <TouchableOpacity
                    key={level}
                    onPress={() => setFormData({ ...formData, difficulty: level })}
                    style={[
                      styles.difficultyButton,
                      formData.difficulty === level && styles.difficultyButtonActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.difficultyButtonText,
                        formData.difficulty === level && styles.difficultyButtonTextActive,
                      ]}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={[styles.inputCard, styles.inputCardMarginTop]}>
              <TextInput
                style={styles.inputCardText}
                placeholder="Cuisine (e.g., Italian, Mediterranean)"
                value={formData.cuisine}
                onChangeText={(text) => setFormData({ ...formData, cuisine: text })}
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <Text style={styles.hintText}>Add timing and details about your recipe</Text>
          </View>
        );

      case 'image':
        return (
          <View style={styles.stepContent}>
            {formData.featuredImage ? (
              <View style={styles.imageContainer}>
                <Image 
                  source={{ uri: formData.featuredImage }} 
                  style={styles.image}
                  onError={() => {
                    console.warn('Failed to load featured image:', formData.featuredImage);
                    // Clear invalid image URI
                    setFormData({ ...formData, featuredImage: null });
                  }}
                />
                <TouchableOpacity
                  onPress={() => setFormData({ ...formData, featuredImage: null })}
                  style={styles.removeImageButton}
                >
                  <X size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handleImagePick}
                disabled={isUploadingImage}
                style={styles.imagePicker}
              >
                {isUploadingImage ? (
                  <ActivityIndicator size="large" color="#F23E2E" />
                ) : (
                  <Text style={styles.imagePickerText}>Add Featured Image</Text>
                )}
              </TouchableOpacity>
            )}
            <Text style={styles.hintText}>Add a beautiful image to showcase your recipe (optional)</Text>
          </View>
        );

      case 'ingredients':
        return (
          <View style={styles.stepContent}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Ingredients *</Text>
              <TouchableOpacity onPress={handleAddIngredient} style={styles.addButton}>
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>

            {formData.ingredients.map((ingredient, index) => (
              <View key={index} style={[styles.ingredientRow, index > 0 && styles.ingredientRowMargin]}>
                <View style={styles.ingredientFields}>
                  <View style={[styles.inputCard, { flex: 2, marginRight: 8 }]}>
                    <TextInput
                      style={styles.inputCardText}
                      placeholder="Ingredient"
                      value={ingredient.name}
                      onChangeText={(value) => handleUpdateIngredient(index, 'name', value)}
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                  <View style={[styles.inputCard, { flex: 1, marginRight: 8 }]}>
                    <TextInput
                      style={styles.inputCardText}
                      placeholder="Amount"
                      value={ingredient.amount}
                      onChangeText={(value) => handleUpdateIngredient(index, 'amount', value)}
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                  <View style={[styles.inputCard, { flex: 1 }]}>
                    <TextInput
                      style={styles.inputCardText}
                      placeholder="Unit"
                      value={ingredient.unit}
                      onChangeText={(value) => handleUpdateIngredient(index, 'unit', value)}
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleRemoveIngredient(index)}
                  style={styles.removeButton}
                >
                  <X size={20} color="#F23E2E" />
                </TouchableOpacity>
              </View>
            ))}

            {formData.ingredients.length === 0 && (
              <Text style={styles.emptyText}>No ingredients added yet. Tap "Add" to get started.</Text>
            )}
            <Text style={styles.hintText}>List all the ingredients needed for this recipe</Text>
          </View>
        );

      case 'link':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.hintText}>Optionally link this recipe to a meal</Text>
            <TouchableOpacity
              style={styles.linkMealButton}
              onPress={() => setShowMealPicker(true)}
            >
              <Utensils size={20} color="#094327" />
              <Text style={styles.linkMealButtonText}>
                {formData.linkedMealId ? 'Change Linked Meal' : 'Link to Meal'}
              </Text>
            </TouchableOpacity>
            {formData.linkedMealId && (
              <View style={styles.linkedMealInfo}>
                <Link2 size={16} color="#10B981" />
                <Text style={styles.linkedMealText}>
                  {meals?.find((m: any) => m._id === formData.linkedMealId)?.name || 'Meal linked'}
                </Text>
                <TouchableOpacity
                  onPress={() => setFormData({ ...formData, linkedMealId: null })}
                >
                  <X size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        );

      case 'instructions':
        return (
          <View style={styles.stepContent}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Instructions *</Text>
              <TouchableOpacity onPress={handleAddInstruction} style={styles.addButton}>
                <Text style={styles.addButtonText}>Add Step</Text>
              </TouchableOpacity>
            </View>

            {formData.instructions.map((instruction, index) => (
              <View key={index} style={[styles.instructionRow, index > 0 && styles.instructionRowMargin]}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <View style={[styles.inputCard, styles.inputCardMultiline, { flex: 1 }]}>
                  <TextInput
                    style={[styles.inputCardText, styles.inputCardTextMultiline]}
                    placeholder={`Step ${index + 1}...`}
                    value={instruction}
                    onChangeText={(value) => handleUpdateInstruction(index, value)}
                    placeholderTextColor="#9CA3AF"
                    multiline
                  />
                </View>
                <TouchableOpacity
                  onPress={() => handleRemoveInstruction(index)}
                  style={styles.removeButton}
                >
                  <X size={20} color="#F23E2E" />
                </TouchableOpacity>
              </View>
            ))}

            {formData.instructions.length === 0 && (
              <Text style={styles.emptyText}>No instructions added yet. Tap "Add Step" to get started.</Text>
            )}
            <Text style={styles.hintText}>Break down the cooking process into clear steps</Text>
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
            <Text style={styles.title}>New Recipe</Text>
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
              <Text style={styles.successTitle}>Recipe {formData.status === 'published' ? 'Published' : 'Saved'}!</Text>
              <Text style={styles.successMessage}>
                {formData.status === 'published' 
                  ? 'Your recipe has been published successfully and is now visible to customers.'
                  : 'Your recipe has been saved as a draft. You can publish it anytime from your content library.'}
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
                      {currentStep === STEPS.length - 1 ? 'Publish' : 'Next'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </SafeAreaView>

      {/* Meal Picker Modal */}
      <Modal
        visible={showMealPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMealPicker(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Meal</Text>
            <TouchableOpacity onPress={() => setShowMealPicker(false)}>
              <X size={24} color="#111827" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {meals === undefined ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#094327" />
                <Text style={styles.loadingText}>Loading meals...</Text>
              </View>
            ) : meals.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No meals available</Text>
                <Text style={styles.emptyStateSubtext}>Create meals first to link recipes</Text>
              </View>
            ) : (
              meals.map((meal: any) => (
                <TouchableOpacity
                  key={meal._id}
                  style={[
                    styles.mealOption,
                    formData.linkedMealId === meal._id && styles.mealOptionSelected
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, linkedMealId: meal._id });
                    setShowMealPicker(false);
                  }}
                >
                  <View style={styles.mealOptionContent}>
                    {meal.images && meal.images.length > 0 && (
                      <Image 
                        source={{ uri: meal.images[0] }} 
                        style={styles.mealOptionImage}
                        onError={() => {
                          console.warn('Failed to load meal image:', meal.images[0]);
                        }}
                      />
                    )}
                    <View style={styles.mealOptionInfo}>
                      <Text style={styles.mealOptionName}>{meal.name}</Text>
                      <Text style={styles.mealOptionPrice}>
                        £{((meal.price || 0) / 100).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                  {formData.linkedMealId === meal._id && (
                    <View style={styles.checkIcon}>
                      <X size={20} color="#10B981" />
                    </View>
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  row: {
    flexDirection: 'row',
  },
  difficultyContainer: {
    marginTop: 16,
  },
  difficultyButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  difficultyButton: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    paddingVertical: 12,
    alignItems: 'center',
  },
  difficultyButtonActive: {
    backgroundColor: '#FFF5F5',
    borderColor: '#F23E2E',
  },
  difficultyButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  difficultyButtonTextActive: {
    color: '#F23E2E',
  },
  hintText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter',
    marginTop: 12,
    textAlign: 'center',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePicker: {
    width: '100%',
    height: 200,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#F23E2E',
  },
  addButtonText: {
    color: '#F23E2E',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ingredientRowMargin: {
    marginTop: 12,
  },
  ingredientFields: {
    flex: 1,
    flexDirection: 'row',
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  instructionRowMargin: {
    marginTop: 12,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F23E2E',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  removeButton: {
    padding: 8,
    marginTop: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
    fontFamily: 'Inter',
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
});
