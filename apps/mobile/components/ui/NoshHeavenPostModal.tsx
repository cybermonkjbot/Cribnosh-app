import * as ImagePicker from 'expo-image-picker';
import { CameraView } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Camera, Image as ImageIcon, Video as VideoIcon, X, FileVideo, ChefHat, Utensils } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Modal, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthContext } from '@/contexts/AuthContext';
import { api } from '@/convex/_generated/api';
import { getConvexClient, getSessionToken } from '@/lib/convexClient';
import { showError, showSuccess } from '@/lib/GlobalToastManager';
import * as FileSystem from 'expo-file-system';
import { EncodingType } from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Video, AVPlaybackStatus } from 'expo-av';

const { width } = Dimensions.get('window');

interface NoshHeavenPostModalProps {
  isVisible: boolean;
  onClose: () => void;
}

type PostType = 'recipe' | 'meal' | null;
type MediaType = 'photo' | 'video' | null;

interface MediaFile {
  uri: string;
  type: MediaType;
  width: number;
  height: number;
}

export function NoshHeavenPostModal({ isVisible, onClose }: NoshHeavenPostModalProps) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthContext();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<any>(null);
  const isMountedRef = useRef(true);
  
  // Media state
  const [mediaFile, setMediaFile] = useState<MediaFile | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [cameraType, setCameraType] = useState<'front' | 'back'>('back');
  const [isRecording, setIsRecording] = useState(false);
  
  // Post content state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [postType, setPostType] = useState<PostType>(null);
  const [tags, setTags] = useState<string[]>([]);
  
  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Close handler
  const handleClose = useCallback(() => {
    setMediaFile(null);
    setShowCamera(false);
    setShowMediaPicker(false);
    setTitle('');
    setDescription('');
    setPostType(null);
    setTags([]);
    setIsRecording(false);
    onClose();
  }, [onClose]);
  
  // Camera handlers
  const handleOpenCamera = useCallback(async () => {
    try {
      const { Camera } = await import('expo-camera');
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera permission is required to take photos and videos.'
        );
        return;
      }
      setShowMediaPicker(false);
      setShowCamera(true);
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      showError('Failed to access camera', 'Please try again');
    }
  }, []);
  
  const handleCapturePhoto = useCallback(async () => {
    if (!cameraRef.current) return;
    
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });
      
      if (photo?.uri) {
        // Get image dimensions
        const imageInfo = await Image.getSize(photo.uri);
        setMediaFile({
          uri: photo.uri,
          type: 'photo',
          width: imageInfo.width,
          height: imageInfo.height,
        });
        setShowCamera(false);
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      showError('Failed to capture photo', 'Please try again');
    }
  }, []);
  
  const handleStartRecording = useCallback(async () => {
    if (!cameraRef.current || isRecording) return;
    
    try {
      setIsRecording(true);
      const recording = await cameraRef.current.recordAsync({
        quality: '720p',
        maxDuration: 60, // 60 seconds
      });
      
      // Note: recordAsync returns a promise that resolves when recording stops
      // The actual video URI is available when stopRecording is called
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
      showError('Failed to start recording', 'Please try again');
    }
  }, [isRecording]);
  
  const handleStopRecording = useCallback(async () => {
    if (!cameraRef.current || !isRecording) return;
    
    try {
      setIsRecording(false);
      const video = await cameraRef.current.stopRecordingAsync();
      
      if (video?.uri) {
        // Get video dimensions (default to 720p)
        setMediaFile({
          uri: video.uri,
          type: 'video',
          width: 1280,
          height: 720,
        });
        setShowCamera(false);
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      setIsRecording(false);
      showError('Failed to stop recording', 'Please try again');
    }
  }, [isRecording]);
  
  // Media picker handlers
  const handleOpenGallery = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Media library permission is required to select photos and videos.'
        );
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: true,
        quality: 0.8,
        videoQuality: 'high',
        allowsMultipleSelection: false,
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const isVideo = asset.type === 'video';
        
        if (isVideo && asset.uri) {
          setMediaFile({
            uri: asset.uri,
            type: 'video',
            width: asset.width || 1280,
            height: asset.height || 720,
          });
        } else if (!isVideo && asset.uri) {
          setMediaFile({
            uri: asset.uri,
            type: 'photo',
            width: asset.width || 1080,
            height: asset.height || 1080,
          });
        }
        setShowMediaPicker(false);
      }
    } catch (error) {
      console.error('Error selecting media:', error);
      showError('Failed to select media', 'Please try again');
    }
  }, []);
  
  // Get file info
  const getFileInfo = useCallback(async (uri: string): Promise<{ size: number; name: string; mimeType: string }> => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }
      
      const size = fileInfo.size || 0;
      const extension = uri.split('.').pop()?.toLowerCase() || 'mp4';
      const name = `post_${Date.now()}.${extension}`;
      
      let mimeType = 'video/mp4';
      if (extension === 'jpg' || extension === 'jpeg') {
        mimeType = 'image/jpeg';
      } else if (extension === 'png') {
        mimeType = 'image/png';
      } else if (extension === 'mov') {
        mimeType = 'video/quicktime';
      }
      
      return { size, name, mimeType };
    } catch (error) {
      console.error('Error getting file info:', error);
      throw error;
    }
  }, []);
  
  // Upload media to Convex storage
  const uploadMediaToStorage = useCallback(async (mediaUri: string, isVideo: boolean): Promise<string> => {
    try {
      const fileInfo = await getFileInfo(mediaUri);
      
      // Validate file exists
      if (!fileInfo.size || fileInfo.size === 0) {
        throw new Error('File is empty or cannot be read');
      }
      
      // Get Convex upload URL with timeout
      const convex = getConvexClient();
      const sessionToken = await getSessionToken();

      if (!sessionToken) {
        throw new Error('Please sign in to upload videos.');
      }

      const uploadUrlPromise = convex.action(api.actions.users.customerGetConvexVideoUploadUrl, {
        sessionToken,
      });
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout: Failed to get upload URL')), 30000);
      });
      
      const uploadUrlResult = await Promise.race([uploadUrlPromise, timeoutPromise]) as { success: boolean; uploadUrl?: string; error?: string };
      
      if (!uploadUrlResult.success || !uploadUrlResult.uploadUrl) {
        throw new Error(uploadUrlResult.error || 'Failed to get upload URL from server');
      }
      
      // Read file as base64 with error handling
      let fileContent: string;
      try {
        fileContent = await FileSystem.readAsStringAsync(mediaUri, {
          encoding: EncodingType.Base64,
        });
      } catch (readError) {
        throw new Error('Failed to read file. Please try selecting a different file.');
      }
      
      // Convert base64 to buffer/blob
      const binaryString = atob(fileContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Upload to Convex storage (POST method, not PUT) with timeout
      const uploadPromise = fetch(uploadUrlResult.uploadUrl!, {
        method: 'POST',
        headers: {
          'Content-Type': fileInfo.mimeType,
        },
        body: bytes,
      });
      
      const uploadTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Upload timeout: File upload took too long')), 300000); // 5 minutes
      });
      
      const uploadResponse = await Promise.race([uploadPromise, uploadTimeoutPromise]) as Response;
      
      if (!uploadResponse.ok) {
        let errorText = '';
        try {
          errorText = await uploadResponse.text();
        } catch {
          errorText = uploadResponse.statusText;
        }
        
        if (uploadResponse.status === 413) {
          throw new Error('File too large. Please select a smaller file.');
        } else if (uploadResponse.status === 401 || uploadResponse.status === 403) {
          throw new Error('Permission denied. Please sign in and try again.');
        } else {
          throw new Error(`Upload failed: ${uploadResponse.statusText}`);
        }
      }
      
      // Extract storageId from Convex response
      let result: { storageId?: string };
      try {
        result = await uploadResponse.json();
      } catch (parseError) {
        throw new Error('Invalid response from server. Please try again.');
      }
      
      if (!result.storageId) {
        throw new Error('Server did not return a storage ID. Please try again.');
      }
      
      // Return Convex storage ID
      return result.storageId;
    } catch (error: any) {
      console.error('Error uploading media:', error);
      
      // Re-throw with user-friendly message
      if (error.message) {
        throw error;
      } else {
        throw new Error('Failed to upload file. Please check your connection and try again.');
      }
    }
  }, [getFileInfo]);
  
  // Get video duration
  const getVideoDuration = useCallback(async (videoUri: string): Promise<number> => {
    try {
      const { Video: VideoComponent } = await import('expo-av');
      const video = new VideoComponent({ uri: videoUri });
      
      return new Promise((resolve, reject) => {
        let resolved = false;
        
        const cleanup = async () => {
          try {
            await video.unloadAsync();
          } catch {
            // Ignore cleanup errors
          }
        };
        
        video.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
          if (status.isLoaded && status.durationMillis && !resolved) {
            resolved = true;
            cleanup();
            resolve(status.durationMillis / 1000); // Convert to seconds
          }
        });
        
        video.loadAsync().catch((error) => {
          cleanup();
          reject(error);
        });
        
        // Timeout after 10 seconds
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            cleanup();
            reject(new Error('Timeout loading video'));
          }
        }, 10000);
      });
    } catch (error) {
      console.error('Error getting video duration:', error);
      // Return default duration of 1 second if we can't get it
      return 1;
    }
  }, []);

  // Generate thumbnail from video
  const generateThumbnail = useCallback(async (videoUri: string): Promise<string | null> => {
    try {
      // Use expo-av to extract first frame
      const { Video: VideoComponent } = await import('expo-av');
      const video = new VideoComponent({ uri: videoUri });
      
      return new Promise((resolve, reject) => {
        let thumbnailUri: string | null = null;
        
        const checkStatus = (status: AVPlaybackStatus) => {
          if (status.isLoaded) {
            // Seek to beginning and capture frame
            video.setPositionAsync(0).then(() => {
              // Use expo-av's snapshot feature if available
              // For now, we'll use a workaround: pause at 0 and capture
              video.pauseAsync().then(() => {
                // For expo-av, we need to use a different approach
                // Since snapshot might not be available, we'll return null
                // and let the backend generate the thumbnail
                video.unloadAsync();
                resolve(null);
              }).catch(reject);
            }).catch(reject);
          }
        };
        
        video.setOnPlaybackStatusUpdate(checkStatus);
        
        video.loadAsync().then(() => {
          video.playAsync().catch(reject);
        }).catch(reject);
        
        // Timeout after 10 seconds
        setTimeout(() => {
          video.unloadAsync();
          resolve(null);
        }, 10000);
      });
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      // Return null and let backend handle thumbnail generation
      return null;
    }
  }, []);
  
  // Handle post submission
  const handlePost = useCallback(async () => {
    if (!isAuthenticated) {
      Alert.alert('Sign In Required', 'Please sign in to post to Nosh Heaven.');
      return;
    }
    
    if (!mediaFile) {
      showError('Media Required', 'Please add a photo or video to your post.');
      return;
    }
    
    if (!title.trim()) {
      showError('Title Required', 'Please add a title to your post.');
      return;
    }
    
    if (!postType) {
      showError('Post Type Required', 'Please select a post type (Recipe or Meal).');
      return;
    }
    
    try {
      if (!isMountedRef.current) return;
      setIsUploading(true);
      setUploadProgress(0);
      
      // Get file info
      const fileInfo = await getFileInfo(mediaFile.uri);
      
      if (!isMountedRef.current) return;
      
      // Validate file size (max 100MB for videos, 10MB for photos)
      const maxSize = mediaFile.type === 'video' ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
      if (fileInfo.size > maxSize) {
        showError(
          'File Too Large',
          `File size must be less than ${mediaFile.type === 'video' ? '100MB' : '10MB'}.`
        );
        if (isMountedRef.current) {
          setIsUploading(false);
          setUploadProgress(0);
        }
        return;
      }
      
      // Get video duration if it's a video
      let duration = 1; // Default for photos
      if (mediaFile.type === 'video') {
        if (isMountedRef.current) {
          setUploadProgress(0.1);
        }
        try {
          duration = await getVideoDuration(mediaFile.uri);
        } catch (error) {
          console.error('Error getting video duration:', error);
          // Use default duration if we can't get it
          duration = 1;
        }
      }
      
      if (!isMountedRef.current) return;
      
      // Upload video/photo to storage
      setUploadProgress(0.2);
      const videoStorageId = await uploadMediaToStorage(
        mediaFile.uri,
        mediaFile.type === 'video'
      );
      
      if (!isMountedRef.current) return;
      
      // Generate thumbnail
      setUploadProgress(0.5);
      let thumbnailStorageId: string | undefined;
      if (mediaFile.type === 'photo') {
        // Use the photo as thumbnail (upload as image)
        thumbnailStorageId = await uploadMediaToStorage(mediaFile.uri, false);
      } else {
        // For videos, try to generate thumbnail, but if it fails, let backend handle it
        const thumbnailUri = await generateThumbnail(mediaFile.uri);
        if (thumbnailUri) {
          thumbnailStorageId = await uploadMediaToStorage(thumbnailUri, false);
        }
        // If thumbnail generation fails, we'll pass undefined and let backend generate it
      }
      
      if (!isMountedRef.current) return;
      
      // Prepare tags
      const postTags = [...tags];
      if (postType === 'recipe') {
        postTags.push('recipe');
      } else if (postType === 'meal') {
        postTags.push('meal');
      }
      
      // Create video post
      setUploadProgress(0.8);
      const result = await convex.action(api.actions.users.customerCreateVideoPost, {
        sessionToken: sessionToken!,
        title: title.trim(),
        description: description.trim() || undefined,
        videoStorageId, // Convex storage ID
        thumbnailStorageId, // Optional Convex storage ID
        duration, // Actual duration in seconds
        fileSize: fileInfo.size,
        resolution: {
          width: mediaFile.width,
          height: mediaFile.height,
        },
        tags: postTags,
        isLive: false,
      });
      
      if (!isMountedRef.current) return;
      
      if (result.success === false) {
        throw new Error(result.error || 'Failed to create video post');
      }
      
      setUploadProgress(1);
      showSuccess('Post Created!', 'Your post has been shared to Nosh Heaven.');
      handleClose();
    } catch (error: any) {
      console.error('Error creating post:', error);
      let errorMessage = 'Please try again.';
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      showError('Failed to Create Post', errorMessage);
    } finally {
      if (isMountedRef.current) {
        setIsUploading(false);
        setUploadProgress(0);
      }
    }
  }, [isAuthenticated, mediaFile, title, description, postType, tags, uploadMediaToStorage, getFileInfo, generateThumbnail, getVideoDuration, handleClose]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Handle post type selection
  const handlePostTypeSelect = useCallback((type: PostType) => {
    setPostType(type);
  }, []);
  
  // Handle tag input
  const handleTagInput = useCallback((text: string) => {
    if (text.includes(',')) {
      const newTags = text.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      setTags(prev => [...prev, ...newTags]);
    }
  }, []);
  
  // Render camera view
  const renderCameraView = () => {
    return (
      <View style={[styles.cameraContainer, { paddingTop: insets.top }]}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={cameraType}
        >
          <View style={styles.cameraControls}>
            <TouchableOpacity
              style={styles.cameraCloseButton}
              onPress={() => {
                setShowCamera(false);
                if (isRecording) {
                  handleStopRecording();
                }
              }}
            >
              <X size={24} color="#fff" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.flipButton}
              onPress={() => setCameraType(prev => prev === 'back' ? 'front' : 'back')}
            >
              <Camera size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.cameraBottomControls}>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={isRecording ? handleStopRecording : handleCapturePhoto}
              onLongPress={handleStartRecording}
              delayLongPress={200}
            >
              <View style={[styles.captureButtonInner, isRecording && styles.captureButtonRecording]} />
            </TouchableOpacity>
            
            <Text style={styles.cameraHint}>
              {isRecording ? 'Tap to stop recording' : 'Tap for photo, hold for video'}
            </Text>
          </View>
        </CameraView>
      </View>
    );
  };
  
  // Render media picker
  const renderMediaPicker = () => {
    return (
      <View style={[styles.mediaPickerContainer, { paddingTop: insets.top }]}>
        <View style={styles.mediaPickerHeader}>
          <Text style={styles.mediaPickerTitle}>Select Media</Text>
          <TouchableOpacity onPress={() => setShowMediaPicker(false)}>
            <X size={24} color="#333" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.mediaPickerOptions}>
          <TouchableOpacity
            style={styles.mediaPickerOption}
            onPress={handleOpenCamera}
          >
            <Camera size={32} color="#F23E2E" />
            <Text style={styles.mediaPickerOptionText}>Camera</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.mediaPickerOption}
            onPress={handleOpenGallery}
          >
            <ImageIcon size={32} color="#F23E2E" />
            <Text style={styles.mediaPickerOptionText}>Gallery</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  // Render post form
  const renderPostForm = () => {
    return (
      <ScrollView style={styles.contentContainer} contentContainerStyle={styles.contentContainerStyle}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} disabled={isUploading}>
            <X size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Post</Text>
          <TouchableOpacity
            onPress={handlePost}
            disabled={isUploading || !mediaFile || !title.trim() || !postType}
            style={[
              styles.postButton,
              (isUploading || !mediaFile || !title.trim() || !postType) && styles.postButtonDisabled,
            ]}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.postButtonText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>
        
        {/* Upload Progress */}
        {isUploading && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${uploadProgress * 100}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {Math.round(uploadProgress * 100)}% uploaded
            </Text>
          </View>
        )}
        
        {/* Media Preview */}
        {mediaFile && (
          <View style={styles.mediaPreview}>
            <Image
              source={{ uri: mediaFile.uri }}
              style={styles.mediaPreviewImage}
              resizeMode="cover"
            />
            <TouchableOpacity
              style={styles.removeMediaButton}
              onPress={() => setMediaFile(null)}
              disabled={isUploading}
            >
              <X size={20} color="#fff" />
            </TouchableOpacity>
            {mediaFile.type === 'video' && (
              <View style={styles.videoBadge}>
                <VideoIcon size={16} color="#fff" />
                <Text style={styles.videoBadgeText}>Video</Text>
              </View>
            )}
          </View>
        )}
        
        {/* Media Selection */}
        {!mediaFile && (
          <TouchableOpacity
            style={styles.addMediaButton}
            onPress={() => setShowMediaPicker(true)}
            disabled={isUploading}
          >
            <View style={styles.addMediaIcon}>
              <ImageIcon size={32} color="#F23E2E" />
            </View>
            <Text style={styles.addMediaText}>Add Photo or Video</Text>
            <Text style={styles.addMediaSubtext}>Tap to select from camera or gallery</Text>
          </TouchableOpacity>
        )}
        
        {/* Title Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Title *</Text>
          <TextInput
            style={styles.titleInput}
            placeholder="What's cooking?"
            placeholderTextColor="#999"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
            editable={!isUploading}
            multiline={false}
          />
        </View>
        
        {/* Description Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Description</Text>
          <TextInput
            style={styles.descriptionInput}
            placeholder="Tell us more about your creation..."
            placeholderTextColor="#999"
            value={description}
            onChangeText={setDescription}
            maxLength={500}
            editable={!isUploading}
            multiline
            numberOfLines={4}
          />
        </View>
        
        {/* Post Type Selection */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Post Type *</Text>
          <View style={styles.postTypeContainer}>
            <TouchableOpacity
              style={[
                styles.postTypeButton,
                postType === 'recipe' && styles.postTypeButtonActive,
              ]}
              onPress={() => handlePostTypeSelect('recipe')}
              disabled={isUploading}
            >
              <ChefHat size={24} color={postType === 'recipe' ? '#fff' : '#666'} />
              <Text style={[
                styles.postTypeButtonText,
                postType === 'recipe' && styles.postTypeButtonTextActive,
              ]}>
                Recipe
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.postTypeButton,
                postType === 'meal' && styles.postTypeButtonActive,
              ]}
              onPress={() => handlePostTypeSelect('meal')}
              disabled={isUploading}
            >
              <Utensils size={24} color={postType === 'meal' ? '#fff' : '#666'} />
              <Text style={[
                styles.postTypeButtonText,
                postType === 'meal' && styles.postTypeButtonTextActive,
              ]}>
                Meal
              </Text>
            </TouchableOpacity>
            
          </View>
        </View>
        
        {/* Tags Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Tags (comma-separated)</Text>
          <TextInput
            style={styles.tagInput}
            placeholder="e.g. pasta, italian, cooking"
            placeholderTextColor="#999"
            onChangeText={handleTagInput}
            editable={!isUploading}
          />
          {tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                  <TouchableOpacity
                    onPress={() => setTags(prev => prev.filter((_, i) => i !== index))}
                    disabled={isUploading}
                  >
                    <X size={14} color="#666" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    );
  };
  
  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <SafeAreaView style={[styles.modalContainer, { paddingTop: insets.top }]}>
        {showCamera ? (
          renderCameraView()
        ) : showMediaPicker ? (
          renderMediaPicker()
        ) : (
          renderPostForm()
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    flex: 1,
  },
  contentContainerStyle: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  postButton: {
    backgroundColor: '#F23E2E',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  postButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.5,
  },
  postButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F23E2E',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  mediaPreview: {
    width: '100%',
    height: 300,
    marginVertical: 16,
    position: 'relative',
    backgroundColor: '#000',
  },
  mediaPreviewImage: {
    width: '100%',
    height: '100%',
  },
  removeMediaButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  videoBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  addMediaButton: {
    marginHorizontal: 16,
    marginVertical: 16,
    height: 200,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
  },
  addMediaIcon: {
    marginBottom: 12,
  },
  addMediaText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  addMediaSubtext: {
    fontSize: 12,
    color: '#999',
  },
  inputContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  postTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  postTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    gap: 8,
  },
  postTypeButtonActive: {
    backgroundColor: '#F23E2E',
    borderColor: '#F23E2E',
  },
  postTypeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  postTypeButtonTextActive: {
    color: '#fff',
  },
  tagInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  tagText: {
    fontSize: 14,
    color: '#333',
  },
  // Camera styles
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
  },
  cameraCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flipButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: 40,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
  },
  captureButtonRecording: {
    backgroundColor: '#F23E2E',
  },
  cameraHint: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  // Media picker styles
  mediaPickerContainer: {
    padding: 16,
  },
  mediaPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  mediaPickerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  mediaPickerOptions: {
    flexDirection: 'row',
    gap: 16,
  },
  mediaPickerOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 12,
    gap: 12,
  },
  mediaPickerOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});

