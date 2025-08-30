import { Ionicons } from '@expo/vector-icons';
import { CameraView } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import React, { useRef, useState } from 'react';
import { Alert, Dimensions, Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { CribNoshLogo } from './CribNoshLogo';

const { width, height } = Dimensions.get('window');

interface CameraModalScreenProps {
  onClose: () => void;
}

// Camera control icons
const flipCameraIconSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const flashIconSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M9 2L5 12H11L9 22L19 10H13L15 2H9Z" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const flashOffIconSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M9 2L5 12H11L9 22L19 10H13L15 2H9Z" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M2 2L22 22" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const closeIconSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 6L6 18M6 6L18 18" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const captureButtonSVG = `<svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="40" cy="40" r="36" stroke="#FFFFFF" stroke-width="4"/>
  <circle cx="40" cy="40" r="28" fill="#FFFFFF"/>
</svg>`;

type CameraType = 'front' | 'back';
type FlashMode = 'off' | 'on' | 'auto';

export function CameraModalScreen({ onClose }: CameraModalScreenProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [flashMode, setFlashMode] = useState<FlashMode>('off');
  const [selectedFilter, setSelectedFilter] = useState<string>('normal');
  const [lastCapturedPhoto, setLastCapturedPhoto] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [lastRecordedVideo, setLastRecordedVideo] = useState<string | null>(null);
  const [showVideoPreview, setShowVideoPreview] = useState<boolean>(false);
  const cameraRef = useRef<any>(null);

  React.useEffect(() => {
    (async () => {
      const { Camera } = await import('expo-camera');
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      
      // Request media library permissions for saving photos/videos
      const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();
      if (mediaStatus !== 'granted') {
        Alert.alert(
          'Media Library Permission Required',
          'To save your photos and videos, please grant access to your photo library.',
          [{ text: 'OK' }]
        );
      }
    })();
  }, []);

  const handleFlipCamera = () => {
    setCameraType((current: CameraType) => 
      current === 'back' ? 'front' : 'back'
    );
  };

  const handleFlashToggle = () => {
    setFlashMode((current: FlashMode) => 
      current === 'off' ? 'on' : 'off'
    );
  };

  const handleCapture = async () => {
    if (cameraRef.current && !isRecording) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: true,
        });
        // Save the captured photo URI
        setLastCapturedPhoto(photo.uri);
        console.log('Photo captured:', photo);
        
        // Automatically save to media library
        await saveToMediaLibrary(photo.uri, 'photo');
      } catch (error) {
        console.error('Error capturing photo:', error);
      }
    }
  };

  const startRecording = async () => {
    if (cameraRef.current && !isRecording) {
      try {
        setIsRecording(true);
        const recording = await cameraRef.current.recordAsync({
          quality: '720p',
          maxDuration: 60000, // 60 seconds in milliseconds
        });
        console.log('Video recording started:', recording);
      } catch (error) {
        console.error('Error starting video recording:', error);
        // Simulator fallback - create mock recording
        if (error instanceof Error && error.message?.includes('simulator')) {
          console.log('Using simulator fallback for video recording');
          // Simulate recording delay
          setTimeout(() => {
            setIsRecording(false);
            // Create mock video URI for simulator testing
            const mockVideoUri = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
            setLastRecordedVideo(mockVideoUri);
            setShowVideoPreview(true);
            console.log('Mock video recording completed for simulator testing');
          }, 2000); // 2 second mock recording
        } else {
          setIsRecording(false);
        }
      }
    }
  };

  const stopRecording = async () => {
    if (cameraRef.current && isRecording) {
      try {
        setIsRecording(false);
        // Get the recorded video URI and show preview
        if (cameraRef.current) {
          const video = await cameraRef.current.stopRecordingAsync();
                      if (video && video.uri) {
              setLastRecordedVideo(video.uri);
              setShowVideoPreview(true);
              console.log('Video recording stopped:', video);
              
              // Automatically save to media library
              await saveToMediaLibrary(video.uri, 'video');
            }
        }
      } catch (error) {
        console.error('Error stopping video recording:', error);
        setIsRecording(false);
      }
    }
  };

  const handleGalleryPress = () => {
    // TODO: Implement gallery opening functionality
    console.log('Gallery pressed');
    // This could open image picker or navigate to gallery
  };

  const handleFilterSelect = (filter: string) => {
    setSelectedFilter(filter);
    console.log('Filter selected:', filter);
  };

  const closeVideoPreview = () => {
    setShowVideoPreview(false);
    setLastRecordedVideo(null);
  };

  // iOS Storage Service for Creators
  const saveToMediaLibrary = async (uri: string, type: 'photo' | 'video') => {
    try {
      const asset = await MediaLibrary.createAssetAsync(uri);
      
      // Try to add to existing CribNosh album or create new one
      let album = await MediaLibrary.getAlbumAsync('CribNosh');
      if (!album) {
        album = await MediaLibrary.createAlbumAsync('CribNosh', asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }
      
      Alert.alert(
        'Saved Successfully!',
        `Your ${type} has been saved to your photo library in the CribNosh album.`,
        [{ text: 'OK' }]
      );
      
      console.log(`${type} saved to media library:`, asset);
      return asset;
    } catch (error) {
      console.error(`Error saving ${type} to media library:`, error);
      Alert.alert(
        'Save Failed',
        `Unable to save ${type} to your photo library. Please check your permissions.`,
        [{ text: 'OK' }]
      );
      return null;
    }
  };

  const savePhoto = async () => {
    if (lastCapturedPhoto) {
      await saveToMediaLibrary(lastCapturedPhoto, 'photo');
    }
  };

  const saveVideo = async () => {
    if (lastRecordedVideo) {
      await saveToMediaLibrary(lastRecordedVideo, 'video');
    }
  };

  if (hasPermission === null) {
    return <View style={styles.container} />;
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>No access to camera</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Camera View */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={cameraType}
        flash={flashMode}
      >
        {/* Top Controls */}
        <View style={styles.topControls}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <SvgXml xml={closeIconSVG} width={24} height={24} />
          </TouchableOpacity>
          
          {/* Center - CribNosh Logo */}
          <View style={styles.logoContainer}>
            <CribNoshLogo size={80} variant="white" />
          </View>
          
          <View style={styles.topRightControls}>
            <TouchableOpacity style={styles.controlButton} onPress={handleFlashToggle}>
              <SvgXml 
                xml={flashMode === 'off' ? flashOffIconSVG : flashIconSVG} 
                width={24} 
                height={24} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.controlButton} onPress={handleFlipCamera}>
              <SvgXml xml={flipCameraIconSVG} width={24} height={24} />
            </TouchableOpacity>
          </View>
        </View>



        {/* Photo Preview Overlay */}
        {lastCapturedPhoto && (
          <View style={styles.photoPreviewOverlay}>
            <View style={styles.photoPreviewHeader}>
              <TouchableOpacity 
                style={styles.closePreviewButton} 
                onPress={() => setLastCapturedPhoto(null)}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.photoPreviewTitle}>Photo Preview</Text>
              <TouchableOpacity style={styles.editPhotoButton}>
                <Ionicons name="create" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.photoPreviewContainer}>
              <Image 
                source={{ uri: lastCapturedPhoto }} 
                style={styles.photoPreviewImage}
                resizeMode="cover"
              />
            </View>
            <View style={styles.photoPreviewActions}>
              <TouchableOpacity style={styles.photoPreviewActionButton}>
                <Ionicons name="share" size={20} color="#FFFFFF" />
                <Text style={styles.photoPreviewActionText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.photoPreviewActionButton}
                onPress={savePhoto}
              >
                <Ionicons name="save" size={20} color="#FFFFFF" />
                <Text style={styles.photoPreviewActionText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoPreviewActionButton}>
                <Ionicons name="trash" size={20} color="#FFFFFF" />
                <Text style={styles.photoPreviewActionText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Video Preview Overlay */}
        {showVideoPreview && lastRecordedVideo && (
          <View style={styles.videoPreviewOverlay}>
            <View style={styles.videoPreviewHeader}>
              <TouchableOpacity style={styles.closePreviewButton} onPress={closeVideoPreview}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.videoPreviewTitle}>Video Preview</Text>
              <TouchableOpacity style={styles.editVideoButton}>
                <Ionicons name="create" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.videoPreviewContainer}>
              <Image 
                source={{ uri: lastRecordedVideo }} 
                style={styles.videoPreviewThumbnail}
                resizeMode="cover"
              />
              <View style={styles.videoPreviewControls}>
                <TouchableOpacity style={styles.videoPreviewPlayButton}>
                  <Ionicons name="play" size={32} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.videoPreviewActions}>
              <TouchableOpacity style={styles.videoPreviewActionButton}>
                <Ionicons name="share" size={20} color="#FFFFFF" />
                <Text style={styles.videoPreviewActionText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.videoPreviewActionButton}
                onPress={saveVideo}
              >
                <Ionicons name="save" size={20} color="#FFFFFF" />
                <Text style={styles.videoPreviewActionText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.videoPreviewActionButton}>
                <Ionicons name="trash" size={20} color="#FFFFFF" />
                <Text style={styles.videoPreviewActionText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Camera Filters Section - Above Shutter */}
        <View style={styles.filtersSection}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContainer}
          >
            {/* Normal Filter */}
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedFilter === 'normal' && styles.filterButtonActive
              ]}
              onPress={() => handleFilterSelect('normal')}
            >
              <Text style={[
                styles.filterEmoji,
                selectedFilter === 'normal' && styles.filterEmojiActive
              ]}>
                😊
              </Text>
            </TouchableOpacity>

            {/* Vivid Filter */}
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedFilter === 'vivid' && styles.filterButtonActive
              ]}
              onPress={() => handleFilterSelect('vivid')}
            >
              <Text style={[
                styles.filterEmoji,
                selectedFilter === 'vivid' && styles.filterEmojiActive
              ]}>
                🌈
              </Text>
            </TouchableOpacity>

            {/* Warm Filter */}
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedFilter === 'warm' && styles.filterButtonActive
              ]}
              onPress={() => handleFilterSelect('warm')}
            >
              <Text style={[
                styles.filterEmoji,
                selectedFilter === 'warm' && styles.filterEmojiActive
              ]}>
                🌅
              </Text>
            </TouchableOpacity>

            {/* Cool Filter */}
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedFilter === 'cool' && styles.filterButtonActive
              ]}
              onPress={() => handleFilterSelect('cool')}
            >
              <Text style={[
                styles.filterEmoji,
                selectedFilter === 'cool' && styles.filterEmojiActive
              ]}>
                ❄️
              </Text>
            </TouchableOpacity>

            {/* Dramatic Filter */}
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedFilter === 'dramatic' && styles.filterButtonActive
              ]}
              onPress={() => handleFilterSelect('dramatic')}
            >
              <Text style={[
                styles.filterEmoji,
                selectedFilter === 'dramatic' && styles.filterEmojiActive
              ]}>
                ⚡
              </Text>
            </TouchableOpacity>

            {/* Mono Filter */}
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedFilter === 'mono' && styles.filterButtonActive
              ]}
              onPress={() => handleFilterSelect('mono')}
            >
              <Text style={[
                styles.filterEmoji,
                selectedFilter === 'mono' && styles.filterButtonActive
              ]}>
                🖤
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          {/* Left side - Gallery Button / Last Photo Thumbnail */}
          <TouchableOpacity style={styles.galleryButton} onPress={handleGalleryPress}>
            {lastCapturedPhoto ? (
              <Image 
                source={{ uri: lastCapturedPhoto }} 
                style={styles.lastPhotoThumbnail}
                resizeMode="cover"
              />
            ) : (
              <Ionicons name="images" size={32} color="#FFFFFF" />
            )}
          </TouchableOpacity>
          
          {/* Center - Capture Button */}
          <TouchableOpacity 
            style={[styles.captureButton, isRecording && styles.captureButtonRecording]} 
            onPress={handleCapture}
            onLongPress={startRecording}
            onPressOut={isRecording ? stopRecording : undefined}
            delayLongPress={200}
          >
            <SvgXml xml={captureButtonSVG} width={80} height={80} />
            {isRecording && <View style={styles.recordingIndicator} />}
          </TouchableOpacity>
          
          {/* Right side - Additional options could go here */}
          <View style={styles.rightControls} />
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  topControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  logoContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 68,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 11,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 50,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  leftControls: {
    width: 80,
    height: 80,
  },
  galleryButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  lastPhotoThumbnail: {
    width: 56,
    height: 56,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  captureButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonRecording: {
    transform: [{ scale: 1.1 }],
  },
  recordingIndicator: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF3B30',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  videoPreviewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    zIndex: 20,
  },
  videoPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closePreviewButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPreviewTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  editVideoButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPreviewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  videoPreviewThumbnail: {
    width: width * 0.8,
    height: height * 0.4,
    borderRadius: 12,
    backgroundColor: '#1F1F1F',
  },
  videoPreviewControls: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPreviewPlayButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  videoPreviewActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  videoPreviewActionButton: {
    alignItems: 'center',
    padding: 16,
  },
  videoPreviewActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 8,
    opacity: 0.8,
  },
  photoPreviewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    zIndex: 20,
  },
  photoPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  photoPreviewTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  editPhotoButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPreviewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  photoPreviewImage: {
    width: width * 0.9,
    height: height * 0.5,
    borderRadius: 12,
    backgroundColor: '#1F1F1F',
  },
  photoPreviewActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  photoPreviewActionButton: {
    alignItems: 'center',
    padding: 16,
  },
  photoPreviewActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 8,
    opacity: 0.8,
  },
  rightControls: {
    width: 80,
    height: 80,
  },
  permissionText: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
  filtersSection: {
    position: 'absolute',
    bottom: 140, // Position above the bottom controls (shutter button)
    left: 0,
    right: 0,
    zIndex: 10,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  filterButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    width: 52,
    height: 52,
    // Glassy effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    // Subtle border
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.25)',
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  filterEmoji: {
    fontSize: 20,
    opacity: 0.5,
  },
  filterEmojiActive: {
    opacity: 1,
  },
});
