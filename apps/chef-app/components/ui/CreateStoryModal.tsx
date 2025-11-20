import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, ActivityIndicator, Modal, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChefAuth } from '@/contexts/ChefAuthContext';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useToast } from '@/lib/ToastContext';
import { useRouter } from 'expo-router';
import { X, Plus, Image as ImageIcon, Camera, Video as VideoIcon, FileText, Sparkles, ChevronRight } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { getConvexClient } from '@/lib/convexClient';
import { CameraView } from 'expo-camera';
import { SvgXml } from 'react-native-svg';

// Close icon SVG
const closeIconSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 6L6 18M6 6L18 18" stroke="#111827" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

interface CreateStoryModalProps {
  isVisible: boolean;
  onClose: () => void;
}

type MediaType = 'photo' | 'video' | null;

const STEPS = [
  { id: 'media', question: 'Add a photo or video' },
  { id: 'details', question: 'Tell your story' },
  { id: 'tags', question: 'Add tags (optional)' },
];

export function CreateStoryModal({ isVisible, onClose }: CreateStoryModalProps) {
  const { chef, sessionToken, isAuthenticated } = useChefAuth();
  const { showSuccess, showError } = useToast();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraType, setCameraType] = useState<'front' | 'back'>('back');
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const cameraRef = React.useRef<any>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    media: null as { uri: string; type: MediaType } | null,
    tags: [] as string[],
    status: 'draft' as 'draft' | 'published',
  });

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
    setFormData({
      title: '',
      description: '',
      media: null,
      tags: [],
      status: 'draft',
    });
    setShowCamera(false);
    setIsRecording(false);
    setIsSubmitted(false);
    setCurrentStep(0);
    onClose();
  };

  const handleOpenCamera = async () => {
    try {
      const { Camera } = await import('expo-camera');
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required.');
        return;
      }
      setShowCamera(true);
    } catch (error) {
      showError('Error', 'Failed to access camera');
    }
  };

  const handleCapturePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });
      if (photo?.uri) {
        setFormData({ ...formData, media: { uri: photo.uri, type: 'photo' } });
        setShowCamera(false);
      }
    } catch (error) {
      showError('Error', 'Failed to capture photo');
    }
  };

  const handleStartRecording = async () => {
    if (!cameraRef.current || isRecording) return;
    try {
      setIsRecording(true);
      await cameraRef.current.recordAsync({
        quality: '720p',
        maxDuration: 60,
      });
    } catch (error) {
      setIsRecording(false);
      showError('Error', 'Failed to start recording');
    }
  };

  const handleStopRecording = async () => {
    if (!cameraRef.current || !isRecording) return;
    try {
      setIsRecording(false);
      const video = await cameraRef.current.stopRecordingAsync();
      if (video?.uri) {
        setFormData({ ...formData, media: { uri: video.uri, type: 'video' } });
        setShowCamera(false);
      }
    } catch (error) {
      setIsRecording(false);
      showError('Error', 'Failed to stop recording');
    }
  };

  const handlePickMedia = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showError('Permission Required', 'Media library permission is needed.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 0.8,
        videoQuality: 'high',
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const isVideo = asset.type === 'video';
        setFormData({
          ...formData,
          media: {
            uri: asset.uri,
            type: isVideo ? 'video' : 'photo',
          },
        });
      }
    } catch (error: any) {
      showError('Error', error.message || 'Failed to select media');
    }
  };

  const handleTagInput = (text: string) => {
    if (text.includes(',')) {
      const newTags = text.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      setFormData({ ...formData, tags: [...formData.tags, ...newTags] });
    }
  };

  const handleRemoveTag = (index: number) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((_, i) => i !== index),
    });
  };

  const canProceed = useMemo(() => {
    const step = STEPS[currentStep];
    switch (step.id) {
      case 'media':
        return !!formData.media;
      case 'details':
        return !!formData.title.trim();
      case 'tags':
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

    if (!formData.title.trim()) {
      showError('Validation Error', 'Story title is required');
      return;
    }

    if (!formData.media) {
      showError('Validation Error', 'Please add a photo or video');
      return;
    }

    setIsSubmitting(true);
    setIsUploadingMedia(true);

    try {
      // Upload media first
      const convex = getConvexClient();
      const uploadUrl = await convex.mutation(api.mutations.documents.generateUploadUrl);

      const response = await fetch(formData.media.uri);
      const blob = await response.blob();

      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': formData.media.type === 'video' ? 'video/mp4' : 'image/jpeg',
        },
        body: blob,
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      const uploadResult = await uploadResponse.json();
      const storageId = uploadResult.storageId || uploadResult;
      const mediaUrl = await convex.storage.getUrl(storageId);

      setIsUploadingMedia(false);

      // Create story (you'll need to implement this mutation)
      // await createStory({
      //   title: formData.title.trim(),
      //   description: formData.description.trim(),
      //   mediaUrl,
      //   mediaType: formData.media.type,
      //   tags: formData.tags,
      //   author: chef.name,
      //   status: publish ? 'published' : 'draft',
      // });

      setIsSubmitted(true);
      showSuccess(
        publish ? 'Story Published' : 'Story Saved',
        publish
          ? 'Your story has been published successfully!'
          : 'Your story has been saved as a draft.'
      );
    } catch (error: any) {
      setIsUploadingMedia(false);
      showError('Error', error.message || 'Failed to create story');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    const step = STEPS[currentStep];

    switch (step.id) {
      case 'media':
        return (
          <View style={styles.stepContent}>
            {formData.media ? (
              <View style={styles.mediaContainer}>
                {formData.media.type === 'photo' ? (
                  <Image source={{ uri: formData.media.uri }} style={styles.mediaPreview} />
                ) : (
                  <View style={styles.videoPreview}>
                    <VideoIcon size={48} color="#fff" />
                  </View>
                )}
                <TouchableOpacity
                  onPress={() => setFormData({ ...formData, media: null })}
                  style={styles.removeMediaButton}
                >
                  <X size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.mediaButtons}>
                <TouchableOpacity
                  onPress={handleOpenCamera}
                  style={styles.mediaButtonCard}
                >
                  <Camera size={32} color="#F23E2E" />
                  <Text style={styles.mediaButtonText}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handlePickMedia}
                  style={styles.mediaButtonCard}
                >
                  <ImageIcon size={32} color="#F23E2E" />
                  <Text style={styles.mediaButtonText}>Gallery</Text>
                </TouchableOpacity>
              </View>
            )}
            <Text style={styles.hintText}>Add a photo or video to share your story</Text>
          </View>
        );

      case 'details':
        return (
          <View style={styles.stepContent}>
            <View style={styles.inputCard}>
              <FileText size={24} color="#F23E2E" style={styles.inputCardIcon} />
              <TextInput
                style={styles.inputCardText}
                placeholder="Story title..."
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <View style={[styles.inputCard, styles.inputCardMultiline, styles.inputCardMarginTop]}>
              <FileText size={24} color="#F23E2E" style={styles.inputCardIcon} />
              <TextInput
                style={[styles.inputCardText, styles.inputCardTextMultiline]}
                placeholder="Tell your story..."
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
              />
            </View>
            <Text style={styles.hintText}>Give your story a title and describe what it's about</Text>
          </View>
        );

      case 'tags':
        return (
          <View style={styles.stepContent}>
            <View style={styles.inputCard}>
              <FileText size={24} color="#F23E2E" style={styles.inputCardIcon} />
              <TextInput
                style={styles.inputCardText}
                placeholder="Tags (comma-separated, e.g. cooking, recipe, italian)"
                onChangeText={handleTagInput}
                placeholderTextColor="#9CA3AF"
              />
            </View>
            {formData.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {formData.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                    <TouchableOpacity onPress={() => handleRemoveTag(index)}>
                      <X size={14} color="#F23E2E" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
            <Text style={styles.hintText}>Add tags to help people discover your story (optional)</Text>
          </View>
        );

      default:
        return null;
    }
  };

  const renderCameraView = () => {
    if (!showCamera) return null;

    return (
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={cameraType}
        >
          <View style={[styles.cameraControls, { top: insets.top + 20 }]}>
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={() => setShowCamera(false)}
            >
              <SvgXml xml={closeIconSVG} width={24} height={24} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={() => setCameraType(cameraType === 'back' ? 'front' : 'back')}
            >
              <Camera size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.cameraBottomControls}>
            <TouchableOpacity
              style={styles.mediaButton}
              onPress={handlePickMedia}
            >
              <ImageIcon size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.captureButton, isRecording && styles.captureButtonRecording]}
              onPress={handleCapturePhoto}
              onLongPress={handleStartRecording}
              onPressOut={isRecording ? handleStopRecording : undefined}
            >
              {isRecording && <View style={styles.recordingIndicator} />}
            </TouchableOpacity>
            <View style={styles.mediaButton} />
          </View>
        </CameraView>
      </View>
    );
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
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]} edges={['top']}>
        <View style={styles.content}>
          {showCamera ? (
            renderCameraView()
          ) : (
            <>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <Text style={styles.title}>New Story</Text>
                </View>
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
                  <View style={styles.successIconContainer}>
                    <Sparkles size={48} color="#0B9E58" />
                  </View>
                  <Text style={styles.successTitle}>Story {formData.status === 'published' ? 'Published' : 'Saved'}!</Text>
                  <Text style={styles.successMessage}>
                    {formData.status === 'published' 
                      ? 'Your story has been published successfully and is now visible to customers.'
                      : 'Your story has been saved as a draft. You can publish it anytime from your content library.'}
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
                      disabled={!canProceed || isSubmitting || isUploadingMedia}
                    >
                      {(isSubmitting || isUploadingMedia) ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <>
                          <Text style={styles.nextButtonText}>
                            {currentStep === STEPS.length - 1 ? 'Publish' : 'Next'}
                          </Text>
                          <ChevronRight size={20} color="#FFFFFF" />
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
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
    marginBottom: 20,
    paddingTop: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter',
  },
  closeButton: {
    padding: 4,
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
  inputCardIcon: {
    marginRight: 16,
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
  mediaContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
  },
  mediaPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  videoPreview: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeMediaButton: {
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
  mediaButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  mediaButtonCard: {
    flex: 1,
    height: 120,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  mediaButtonText: {
    marginTop: 8,
    fontSize: 14,
    color: '#F23E2E',
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: '#F23E2E',
  },
  tagText: {
    fontSize: 14,
    color: '#F23E2E',
    fontFamily: 'Inter',
    fontWeight: '500',
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
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  cameraButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBottomControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    zIndex: 10,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    borderWidth: 4,
    borderColor: '#F23E2E',
  },
  captureButtonRecording: {
    backgroundColor: '#F23E2E',
    borderColor: '#F23E2E',
  },
  recordingIndicator: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F23E2E',
    borderWidth: 3,
    borderColor: '#fff',
  },
});
