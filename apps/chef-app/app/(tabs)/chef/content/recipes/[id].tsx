import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useChefAuth } from '@/contexts/ChefAuthContext';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useToast } from '@/lib/ToastContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Plus, X, Image as ImageIcon, Archive } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { getConvexClient } from '@/lib/convexClient';
import { Id } from '@/convex/_generated/dataModel';

interface Ingredient {
  name: string;
  amount: string;
  unit: string;
}

export default function EditRecipeScreen() {
  const { chef, sessionToken } = useChefAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { showSuccess, showError } = useToast();

  const recipeId = params.id as Id<'recipes'>;

  const recipe = useQuery(
    api.queries.recipes.getRecipeById,
    recipeId ? { recipeId, sessionToken: sessionToken || undefined } : 'skip'
  ) as any;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
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
  });

  const updateRecipe = useMutation(api.mutations.recipes.updateRecipe);
  const deleteRecipe = useMutation(api.mutations.recipes.deleteRecipe);

  // Populate form when recipe loads
  useEffect(() => {
    if (recipe) {
      setFormData({
        title: recipe.title || '',
        description: recipe.description || '',
        prepTime: recipe.prepTime?.toString() || '',
        cookTime: recipe.cookTime?.toString() || '',
        servings: recipe.servings?.toString() || '',
        difficulty: recipe.difficulty || 'medium',
        cuisine: recipe.cuisine || '',
        dietary: recipe.dietary || [],
        featuredImage: recipe.featuredImage || null,
        ingredients: recipe.ingredients || [],
        instructions: recipe.instructions || [],
        status: recipe.status || 'draft',
      });
    }
  }, [recipe]);

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

      // Generate upload URL
      const convex = getConvexClient();
      const uploadUrl = await convex.mutation(api.mutations.documents.generateUploadUrl);

      // Read file and convert to blob
      const response = await fetch(result.assets[0].uri);
      const blob = await response.blob();

      // Upload to Convex storage
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': result.assets[0].mimeType || 'image/jpeg',
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

  const handleSubmit = async (publish: boolean) => {
    if (!recipeId || !sessionToken) {
      showError('Error', 'Recipe information not available');
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

    const validIngredients = formData.ingredients.filter(
      ing => ing.name.trim() && ing.amount.trim() && ing.unit.trim()
    );

    if (validIngredients.length === 0) {
      showError('Validation Error', 'At least one complete ingredient is required');
      return;
    }

    const validInstructions = formData.instructions.filter(inst => inst.trim());

    if (validInstructions.length === 0) {
      showError('Validation Error', 'At least one instruction step is required');
      return;
    }

    setIsSubmitting(true);

    try {
      await updateRecipe({
        recipeId,
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
        featuredImage: formData.featuredImage || undefined,
        status: publish ? 'published' : formData.status,
        sessionToken,
      });

      showSuccess(
        publish ? 'Recipe Published' : 'Recipe Updated',
        publish
          ? 'Your recipe has been published successfully!'
          : 'Your recipe has been updated successfully.'
      );
      router.back();
    } catch (error: any) {
      showError('Error', error.message || 'Failed to update recipe');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async () => {
    if (!recipeId || !sessionToken) {
      return;
    }

    Alert.alert(
      'Archive Recipe',
      'Are you sure you want to archive this recipe? It will no longer be visible to customers.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRecipe({ recipeId, sessionToken });
              showSuccess('Recipe Archived', 'The recipe has been archived.');
              router.back();
            } catch (error: any) {
              showError('Error', error.message || 'Failed to archive recipe');
            }
          },
        },
      ]
    );
  };

  if (!recipe) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading recipe...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Recipe</Text>
          <TouchableOpacity onPress={handleArchive} style={styles.archiveButton}>
            <Archive size={20} color="#F44336" />
          </TouchableOpacity>
        </View>

        {/* Basic Information */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholder="e.g., Pasta Carbonara"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Describe your recipe..."
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.field, styles.halfField]}>
              <Text style={styles.label}>Prep Time (min)</Text>
              <TextInput
                style={styles.input}
                value={formData.prepTime}
                onChangeText={(text) => setFormData({ ...formData, prepTime: text })}
                placeholder="30"
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.field, styles.halfField]}>
              <Text style={styles.label}>Cook Time (min)</Text>
              <TextInput
                style={styles.input}
                value={formData.cookTime}
                onChangeText={(text) => setFormData({ ...formData, cookTime: text })}
                placeholder="45"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.field, styles.halfField]}>
              <Text style={styles.label}>Servings</Text>
              <TextInput
                style={styles.input}
                value={formData.servings}
                onChangeText={(text) => setFormData({ ...formData, servings: text })}
                placeholder="4"
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.field, styles.halfField]}>
              <Text style={styles.label}>Difficulty</Text>
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
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Cuisine</Text>
            <TextInput
              style={styles.input}
              value={formData.cuisine}
              onChangeText={(text) => setFormData({ ...formData, cuisine: text })}
              placeholder="e.g., Italian, Mediterranean"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Status</Text>
            <View style={styles.statusButtons}>
              {(['draft', 'published'] as const).map((status) => (
                <TouchableOpacity
                  key={status}
                  onPress={() => setFormData({ ...formData, status })}
                  style={[
                    styles.statusButton,
                    formData.status === status && styles.statusButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusButtonText,
                      formData.status === status && styles.statusButtonTextActive,
                    ]}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Card>

        {/* Featured Image */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Featured Image</Text>
          {formData.featuredImage ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: formData.featuredImage }} style={styles.image} />
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
                <ActivityIndicator size="large" color="#007AFF" />
              ) : (
                <>
                  <ImageIcon size={32} color="#007AFF" />
                  <Text style={styles.imagePickerText}>Add Image</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </Card>

        {/* Ingredients */}
        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ingredients *</Text>
            <TouchableOpacity onPress={handleAddIngredient} style={styles.addButton}>
              <Plus size={20} color="#007AFF" />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          {formData.ingredients.map((ingredient, index) => (
            <View key={index} style={styles.ingredientRow}>
              <View style={styles.ingredientFields}>
                <TextInput
                  style={[styles.input, styles.ingredientInput]}
                  value={ingredient.name}
                  onChangeText={(value) => handleUpdateIngredient(index, 'name', value)}
                  placeholder="Ingredient name"
                />
                <TextInput
                  style={[styles.input, styles.ingredientAmount]}
                  value={ingredient.amount}
                  onChangeText={(value) => handleUpdateIngredient(index, 'amount', value)}
                  placeholder="Amount"
                />
                <TextInput
                  style={[styles.input, styles.ingredientUnit]}
                  value={ingredient.unit}
                  onChangeText={(value) => handleUpdateIngredient(index, 'unit', value)}
                  placeholder="Unit"
                />
              </View>
              <TouchableOpacity
                onPress={() => handleRemoveIngredient(index)}
                style={styles.removeButton}
              >
                <X size={20} color="#F44336" />
              </TouchableOpacity>
            </View>
          ))}

          {formData.ingredients.length === 0 && (
            <Text style={styles.emptyText}>No ingredients added yet</Text>
          )}
        </Card>

        {/* Instructions */}
        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Instructions *</Text>
            <TouchableOpacity onPress={handleAddInstruction} style={styles.addButton}>
              <Plus size={20} color="#007AFF" />
              <Text style={styles.addButtonText}>Add Step</Text>
            </TouchableOpacity>
          </View>

          {formData.instructions.map((instruction, index) => (
            <View key={index} style={styles.instructionRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <TextInput
                style={[styles.input, styles.instructionInput]}
                value={instruction}
                onChangeText={(value) => handleUpdateInstruction(index, value)}
                placeholder={`Step ${index + 1}...`}
                multiline
              />
              <TouchableOpacity
                onPress={() => handleRemoveInstruction(index)}
                style={styles.removeButton}
              >
                <X size={20} color="#F44336" />
              </TouchableOpacity>
            </View>
          ))}

          {formData.instructions.length === 0 && (
            <Text style={styles.emptyText}>No instructions added yet</Text>
          )}
        </Card>

        {/* Submit Buttons */}
        <View style={styles.submitButtons}>
          <Button
            variant="outline"
            onPress={() => handleSubmit(false)}
            disabled={isSubmitting}
            style={styles.submitButton}
          >
            Save Changes
          </Button>
          {formData.status !== 'published' && (
            <Button
              onPress={() => handleSubmit(true)}
              disabled={isSubmitting}
              isLoading={isSubmitting}
              style={styles.submitButton}
            >
              Publish Recipe
            </Button>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    flex: 1,
    marginLeft: 12,
  },
  archiveButton: {
    padding: 5,
  },
  card: {
    marginBottom: 20,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  difficultyButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  difficultyButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  difficultyButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  difficultyButtonTextActive: {
    color: '#fff',
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  statusButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  statusButtonTextActive: {
    color: '#fff',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePicker: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  imagePickerText: {
    marginTop: 8,
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#E3F2FD',
  },
  addButtonText: {
    color: '#1976D2',
    fontSize: 14,
    fontWeight: '500',
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  ingredientFields: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  ingredientInput: {
    flex: 2,
  },
  ingredientAmount: {
    flex: 1,
  },
  ingredientUnit: {
    flex: 1,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  instructionInput: {
    flex: 1,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  removeButton: {
    padding: 8,
    marginTop: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  submitButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 40,
  },
  submitButton: {
    flex: 1,
  },
});

