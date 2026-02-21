import { useFoodCreatorAuth } from '@/contexts/FoodCreatorAuthContext';
import { api } from '@/convex/_generated/api';
import { useToast } from '@/lib/ToastContext';
import { getConvexClient } from '@/lib/convexClient';
import { generateVideoThumbnail, getVideoMetadata } from '@/utils/videoThumbnail';
import { useMutation } from 'convex/react';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { ArrowLeft, ChefHat, Link2, Utensils, Video as VideoIcon, X } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function VideoUploadScreen() {
  const { foodCreator, sessionToken } = useFoodCreatorAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();

  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const [videoMetadata, setVideoMetadata] = useState<{
    duration: number;
    fileSize: number;
    width: number;
    height: number;
  } | null>(null);
  const [linkedRecipeId, setLinkedRecipeId] = useState<string | null>(null);
  const [linkedMealId, setLinkedMealId] = useState<string | null>(null);
  const [showRecipePicker, setShowRecipePicker] = useState(false);
  const [showMealPicker, setShowMealPicker] = useState(false);

  const generateUploadUrl = useMutation(api.mutations.videoPosts.generateVideoUploadUrl);
  const createVideoPost = useMutation(api.mutations.videoPosts.createVideoPostByUserId);

  // Get recipes and meals for linking
  // @ts-ignore - Type instantiation is excessively deep (Convex type system limitation)
  const recipes = useQuery(
    api.queries.recipes.getByAuthor,
    foodCreator?.name && sessionToken
      ? { author: foodCreator.name, sessionToken }
      : 'skip'
  ) as any[] | undefined;

  // @ts-ignore - Type instantiation is excessively deep (Convex type system limitation)
  const meals = useQuery(
    api.queries.meals.getByChefId,
    foodCreator?._id ? { chefId: foodCreator._id } : 'skip'
  ) as any[] | undefined;

  const handlePickVideo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Media library permission is needed to select videos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
        videoMaxDuration: 1800, // 30 minutes max
      });

      if (!result.canceled && result.assets && result.assets.length > 0 && result.assets[0]) {
        const asset = result.assets[0];
        setVideoUri(asset.uri);

        // Generate thumbnail
        setIsGeneratingThumbnail(true);
        try {
          const thumbnail = await generateVideoThumbnail(asset.uri);
          setThumbnailUri(thumbnail);

          // Get video metadata
          const metadata = await getVideoMetadata(asset.uri);

          // Validate file size (max 500MB)
          const maxFileSize = 500 * 1024 * 1024; // 500MB in bytes
          if (metadata.fileSize > maxFileSize) {
            Alert.alert(
              'File Too Large',
              `Video file size (${formatFileSize(metadata.fileSize)}) exceeds the maximum allowed size of 500MB. Please select a smaller video.`,
              [{ text: 'OK' }]
            );
            setVideoUri(null);
            setThumbnailUri(null);
            setVideoMetadata(null);
            return;
          }

          // Validate duration (max 30 minutes)
          const maxDuration = 30 * 60; // 30 minutes in seconds
          if (metadata.duration > maxDuration) {
            Alert.alert(
              'Video Too Long',
              `Video duration (${formatDuration(metadata.duration)}) exceeds the maximum allowed duration of 30 minutes. Please select a shorter video.`,
              [{ text: 'OK' }]
            );
            setVideoUri(null);
            setThumbnailUri(null);
            setVideoMetadata(null);
            return;
          }

          setVideoMetadata(metadata);
        } catch (error) {
          console.error('Error generating thumbnail:', error);
          showToast({
            type: 'error',
            title: 'Error',
            message: 'Failed to generate thumbnail. You can still upload the video.',
            duration: 3000,
          });
        } finally {
          setIsGeneratingThumbnail(false);
        }
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to pick video',
        duration: 3000,
      });
    }
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!videoUri || !title.trim()) {
      Alert.alert('Validation Error', 'Please select a video and enter a title.');
      return;
    }

    if (!foodCreator || !sessionToken || !videoMetadata) {
      Alert.alert('Error', 'Missing required information.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const convex = getConvexClient();

      // Step 1: Upload video
      setUploadProgress(10);
      const videoUploadUrl = await generateUploadUrl();

      const videoResponse = await fetch(videoUri);
      const videoBlob = await videoResponse.blob();

      const videoUploadResponse = await fetch(videoUploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'video/mp4',
        },
        body: videoBlob,
      });

      if (!videoUploadResponse.ok) {
        throw new Error('Video upload failed');
      }

      const videoUploadResult = await videoUploadResponse.json();
      const videoStorageId = videoUploadResult.storageId || videoUploadResult;
      setUploadProgress(60);

      // Step 2: Upload thumbnail if available
      let thumbnailStorageId: string | undefined;
      if (thumbnailUri) {
        setUploadProgress(70);
        const thumbnailUploadUrl = await convex.mutation(api.mutations.documents.generateUploadUrl);

        const thumbnailResponse = await fetch(thumbnailUri);
        const thumbnailBlob = await thumbnailResponse.blob();

        const thumbnailUploadResponse = await fetch(thumbnailUploadUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'image/jpeg',
          },
          body: thumbnailBlob,
        });

        if (thumbnailUploadResponse.ok) {
          const thumbnailUploadResult = await thumbnailUploadResponse.json();
          thumbnailStorageId = thumbnailUploadResult.storageId || thumbnailUploadResult;
        }
        setUploadProgress(85);
      }

      // Step 3: Create video post
      setUploadProgress(90);
      await createVideoPost({
        userId: foodCreator.userId,
        title: title.trim(),
        description: description.trim() || undefined,
        videoStorageId: videoStorageId as any,
        thumbnailStorageId: thumbnailStorageId ? (thumbnailStorageId as any) : undefined,
        duration: videoMetadata.duration,
        fileSize: videoMetadata.fileSize,
        resolution: {
          width: videoMetadata.width,
          height: videoMetadata.height,
        },
        tags: tags,
        mealId: linkedMealId ? (linkedMealId as any) : undefined,
      });

      setUploadProgress(100);

      showToast({
        type: 'success',
        title: 'Success',
        message: 'Video uploaded successfully!',
        duration: 3000,
      });

      // Navigate back after a short delay
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error: any) {
      console.error('Error uploading video:', error);
      showToast({
        type: 'error',
        title: 'Upload Failed',
        message: error.message || 'Failed to upload video. Please try again.',
        duration: 4000,
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#094327" />
        </TouchableOpacity>
        <Text style={styles.title}>Upload Video</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Video Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Video</Text>
          {videoUri ? (
            <View style={styles.videoPreviewContainer}>
              {thumbnailUri ? (
                <Image
                  source={{ uri: thumbnailUri }}
                  style={styles.videoPreview}
                  onError={() => {
                    console.warn('Failed to load video thumbnail:', thumbnailUri);
                  }}
                />
              ) : (
                <View style={[styles.videoPreview, styles.videoPreviewPlaceholder]}>
                  <VideoIcon size={48} color="#9CA3AF" />
                </View>
              )}
              {isGeneratingThumbnail && (
                <View style={styles.thumbnailLoadingOverlay}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.thumbnailLoadingText}>Generating thumbnail...</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.removeVideoButton}
                onPress={() => {
                  setVideoUri(null);
                  setThumbnailUri(null);
                  setVideoMetadata(null);
                }}
              >
                <X size={20} color="#FFFFFF" />
              </TouchableOpacity>
              {videoMetadata && (
                <View style={styles.videoInfo}>
                  <Text style={styles.videoInfoText}>
                    {formatDuration(videoMetadata.duration)} • {formatFileSize(videoMetadata.fileSize)}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadButton} onPress={handlePickVideo}>
              <VideoIcon size={32} color="#094327" />
              <Text style={styles.uploadButtonText}>Select Video</Text>
              <Text style={styles.uploadButtonHint}>Max 30 minutes • 500MB</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter video title"
            placeholderTextColor="#9CA3AF"
            maxLength={100}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your video..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            maxLength={500}
          />
        </View>

        {/* Link to Recipe or Meal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Link to Content (Optional)</Text>
          <View style={styles.linkButtonsContainer}>
            <TouchableOpacity
              style={[styles.linkButton, linkedRecipeId && styles.linkButtonActive]}
              onPress={() => setShowRecipePicker(true)}
            >
              <ChefHat size={18} color={linkedRecipeId ? "#FFFFFF" : "#094327"} />
              <Text style={[styles.linkButtonText, linkedRecipeId && styles.linkButtonTextActive]}>
                {linkedRecipeId ? 'Recipe Linked' : 'Link Recipe'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.linkButton, linkedMealId && styles.linkButtonActive]}
              onPress={() => setShowMealPicker(true)}
            >
              <Utensils size={18} color={linkedMealId ? "#FFFFFF" : "#094327"} />
              <Text style={[styles.linkButtonText, linkedMealId && styles.linkButtonTextActive]}>
                {linkedMealId ? 'Meal Linked' : 'Link Meal'}
              </Text>
            </TouchableOpacity>
          </View>
          {(linkedRecipeId || linkedMealId) && (
            <View style={styles.linkedContentInfo}>
              <Link2 size={16} color="#10B981" />
              <Text style={styles.linkedContentText}>
                {linkedRecipeId && linkedMealId
                  ? 'Linked to recipe and meal'
                  : linkedRecipeId
                    ? 'Linked to recipe'
                    : 'Linked to meal'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setLinkedRecipeId(null);
                  setLinkedMealId(null);
                }}
              >
                <X size={16} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Tags */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tags</Text>
          <View style={styles.tagInputContainer}>
            <TextInput
              style={styles.tagInput}
              value={tagInput}
              onChangeText={setTagInput}
              placeholder="Add a tag"
              placeholderTextColor="#9CA3AF"
              onSubmitEditing={handleAddTag}
            />
            <TouchableOpacity style={styles.addTagButton} onPress={handleAddTag}>
              <Text style={styles.addTagButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          {tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                  <TouchableOpacity onPress={() => handleRemoveTag(index)}>
                    <X size={14} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Upload Progress */}
        {isUploading && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
            </View>
            <Text style={styles.progressText}>{uploadProgress}%</Text>
          </View>
        )}

        {/* Upload Button */}
        <TouchableOpacity
          style={[styles.submitButton, (!videoUri || !title.trim() || isUploading) && styles.submitButtonDisabled]}
          onPress={handleUpload}
          disabled={!videoUri || !title.trim() || isUploading}
        >
          {isUploading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Upload Video</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Recipe Picker Modal */}
      <Modal
        visible={showRecipePicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRecipePicker(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Recipe</Text>
            <TouchableOpacity onPress={() => setShowRecipePicker(false)}>
              <X size={24} color="#111827" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {recipes && recipes.length > 0 ? (
              recipes.map((recipe: any) => (
                <TouchableOpacity
                  key={recipe._id}
                  style={[
                    styles.optionItem,
                    linkedRecipeId === recipe._id && styles.optionItemSelected
                  ]}
                  onPress={() => {
                    setLinkedRecipeId(recipe._id);
                    setShowRecipePicker(false);
                  }}
                >
                  <Text style={styles.optionItemText}>{recipe.title}</Text>
                  {linkedRecipeId === recipe._id && (
                    <X size={20} color="#10B981" />
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No recipes available</Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

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
            {meals && meals.length > 0 ? (
              meals.map((meal: any) => (
                <TouchableOpacity
                  key={meal._id}
                  style={[
                    styles.optionItem,
                    linkedMealId === meal._id && styles.optionItemSelected
                  ]}
                  onPress={() => {
                    setLinkedMealId(meal._id);
                    setShowMealPicker(false);
                  }}
                >
                  <Text style={styles.optionItemText}>{meal.name}</Text>
                  {linkedMealId === meal._id && (
                    <X size={20} color="#10B981" />
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No meals available</Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFFFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#031D11',
    fontFamily: 'Inter',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
    fontFamily: 'Inter',
  },
  uploadButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#094327',
    fontFamily: 'Inter',
  },
  uploadButtonHint: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  videoPreviewContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  videoPreview: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  videoPreviewPlaceholder: {
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  thumbnailLoadingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter',
  },
  removeVideoButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoInfo: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  videoInfoText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111827',
    fontFamily: 'Inter',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  tagInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tagInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#111827',
    fontFamily: 'Inter',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addTagButton: {
    backgroundColor: '#094327',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  addTagButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tagText: {
    fontSize: 14,
    color: '#111827',
    fontFamily: 'Inter',
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#094327',
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  submitButton: {
    backgroundColor: '#094327',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
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
  linkButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  linkButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  linkButtonActive: {
    backgroundColor: '#094327',
    borderColor: '#094327',
  },
  linkButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#094327',
    fontFamily: 'Inter',
  },
  linkButtonTextActive: {
    color: '#FFFFFF',
  },
  linkedContentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  linkedContentText: {
    flex: 1,
    fontSize: 14,
    color: '#10B981',
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FAFFFA',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionItemSelected: {
    borderColor: '#10B981',
    borderWidth: 2,
    backgroundColor: '#F0FDF4',
  },
  optionItemText: {
    fontSize: 16,
    color: '#111827',
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
});

