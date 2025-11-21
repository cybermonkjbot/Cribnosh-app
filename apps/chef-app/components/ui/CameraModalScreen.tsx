import { useChefAuth } from '@/contexts/ChefAuthContext';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import type { Sticker } from '@/utils/stickerData';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { AVPlaybackStatus, ResizeMode, Video } from 'expo-av';
import { CameraView } from 'expo-camera';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { Radio, Type, X } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Dimensions, PanResponder, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { captureRef } from 'react-native-view-shot';
import { CribNoshLogo } from './CribNoshLogo';
import { StickerEditor } from './StickerEditor';
import { StickerItem, type StickerItemData } from './StickerItem';
import { StickerLibrary } from './StickerLibrary';

const { width, height } = Dimensions.get('window');

// Draggable Text Overlay Component
interface DraggableTextOverlayProps {
  textOverlay: { id: string; text: string; x: number; y: number; color: string; fontSize: number };
  imageLayout: { x: number; y: number; width: number; height: number };
  onUpdate: (id: string, x: number, y: number) => void;
  onPress: () => void;
}

function DraggableTextOverlay({ textOverlay, imageLayout, onUpdate, onPress }: DraggableTextOverlayProps) {
  const startPos = useRef({ x: textOverlay.x, y: textOverlay.y });
  
  const textPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startPos.current = { x: textOverlay.x, y: textOverlay.y };
      },
      onPanResponderMove: (_, gestureState) => {
        const newX = Math.max(
          imageLayout.x, 
          Math.min(
            imageLayout.x + imageLayout.width - 100, 
            startPos.current.x + gestureState.dx
          )
        );
        const newY = Math.max(
          imageLayout.y, 
          Math.min(
            imageLayout.y + imageLayout.height - 30, 
            startPos.current.y + gestureState.dy
          )
        );
        onUpdate(textOverlay.id, newX, newY);
      },
      onPanResponderRelease: () => {
        // Keep editing state for tap to edit
      },
    })
  ).current;

  return (
    <View
      style={[
        styles.textOverlay,
        {
          left: textOverlay.x,
          top: textOverlay.y,
        },
      ]}
      {...textPanResponder.panHandlers}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.textOverlayText,
            {
              color: textOverlay.color,
              fontSize: textOverlay.fontSize,
            },
          ]}
        >
          {textOverlay.text}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

interface CameraModalScreenProps {
  onClose: () => void;
  onStartLiveStream?: (sessionId: string, liveSessionId?: Id<'liveSessions'>) => void;
  autoShowLiveStreamSetup?: boolean;
  onPhotoCaptured?: (photoUri: string) => void;
  onVideoRecorded?: (videoUri: string) => void;
  // Visibility controls based on trigger
  showGoLiveButton?: boolean;
  showVideoRecording?: boolean;
  showFilters?: boolean;
  mode?: 'photo' | 'video' | 'both' | 'live';
}

// Camera control icons
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

export function CameraModalScreen({ 
  onClose, 
  onStartLiveStream, 
  autoShowLiveStreamSetup = false, 
  onPhotoCaptured, 
  onVideoRecorded,
  showGoLiveButton = true,
  showVideoRecording = true,
  showFilters = true,
  mode = 'both'
}: CameraModalScreenProps) {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [flashMode, setFlashMode] = useState<FlashMode>('off');
  const [selectedFilter, setSelectedFilter] = useState<string>('normal');
  const [lastCapturedPhoto, setLastCapturedPhoto] = useState<string | null>(null);
  const [showPhotoPreview, setShowPhotoPreview] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [lastRecordedVideo, setLastRecordedVideo] = useState<string | null>(null);
  const [showVideoPreview, setShowVideoPreview] = useState<boolean>(false);
  const [showLiveStreamSetup, setShowLiveStreamSetup] = useState<boolean>(autoShowLiveStreamSetup);
  const [showStickerEditor, setShowStickerEditor] = useState<boolean>(false);
  const [editedPhotoUri, setEditedPhotoUri] = useState<string | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  const [showVideoControls, setShowVideoControls] = useState<boolean>(true);
  const [videoControlsTimeout, setVideoControlsTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const videoRef = useRef<Video>(null);
  const cameraRef = useRef<any>(null);
  const isMountedRef = useRef(true);
  const simulatorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panY = useRef(new Animated.Value(0)).current;
  const videoPanY = useRef(new Animated.Value(0)).current;
  const videoControlsOpacity = useRef(new Animated.Value(1)).current;
  const SWIPE_THRESHOLD = 100; // Minimum distance to trigger dismiss
  
  // Snapchat-like photo preview state
  const [previewStickers, setPreviewStickers] = useState<StickerItemData[]>([]);
  const [showStickerLibrary, setShowStickerLibrary] = useState<boolean>(false);
  const [showTextInput, setShowTextInput] = useState<boolean>(false);
  const [textOverlays, setTextOverlays] = useState<Array<{ id: string; text: string; x: number; y: number; color: string; fontSize: number }>>([]);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [imageLayout, setImageLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const photoPreviewRef = useRef<View>(null);
  const filterSwipeX = useRef(new Animated.Value(0)).current;
  const filters = ['normal', 'vivid', 'warm', 'cool', 'dramatic', 'mono'];
  const filterIndex = useRef(filters.indexOf(selectedFilter));
  
  // Update filter index when selectedFilter changes
  React.useEffect(() => {
    const index = filters.indexOf(selectedFilter);
    if (index !== -1) {
      filterIndex.current = index;
    }
  }, [selectedFilter]);

  // PanResponder for swipe down to dismiss
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to downward swipes that are more vertical than horizontal
        // Require significant downward movement to avoid interfering with camera controls
        return gestureState.dy > 20 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 2;
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow downward movement
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const currentValue = gestureState.dy;
        
        // If swiped down enough, dismiss
        if (currentValue > SWIPE_THRESHOLD) {
          Animated.timing(panY, {
            toValue: height,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onClose();
            panY.setValue(0);
          });
        } else {
          // Spring back to original position
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
          }).start();
        }
      },
    })
  ).current;

  React.useEffect(() => {
    (async () => {
      // @ts-ignore - Dynamic imports are only supported with certain module settings
      const { Camera } = await import('expo-camera');
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (isMountedRef.current) {
        setHasPermission(status === 'granted');
      }
    })();

    return () => {
      isMountedRef.current = false;
      if (simulatorTimeoutRef.current) {
        clearTimeout(simulatorTimeoutRef.current);
      }
    };
  }, []);

  const handleFlipCamera = () => {
    setCameraType((current: CameraType) => 
      current === 'back' ? 'front' : 'back'
    );
  };

  const handleFlashToggle = () => {
    setFlashMode((current: FlashMode) => {
      if (current === 'off') return 'on';
      if (current === 'on') return 'auto';
      return 'off';
    });
  };

  const handleCapture = async () => {
    if (!cameraRef.current || !isMountedRef.current) {
      return;
    }
    
    // If mode is video-only, toggle recording
    if (mode === 'video') {
      if (isRecording) {
        await stopRecording();
      } else {
        await startRecording();
      }
      return;
    }
    
    // For photo modes, don't capture if recording
    if (isRecording) {
      return;
    }
    
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });
      if (isMountedRef.current && photo?.uri) {
        setLastCapturedPhoto(photo.uri);
        setShowPhotoPreview(true);
        console.log('Photo captured:', photo);
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
    }
  };

  const startRecording = async () => {
    if (!cameraRef.current || !isMountedRef.current || isRecording) {
      return;
    }
    try {
      if (isMountedRef.current) {
        setIsRecording(true);
      }
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
        simulatorTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            setIsRecording(false);
            // Create mock video URI for simulator testing
            const mockVideoUri = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
            setLastRecordedVideo(mockVideoUri);
            setShowVideoPreview(true);
            console.log('Mock video recording completed for simulator testing');
            // Call callback if provided
            if (onVideoRecorded) {
              onVideoRecorded(mockVideoUri);
            }
          }
        }, 2000); // 2 second mock recording
      } else {
        if (isMountedRef.current) {
          setIsRecording(false);
        }
      }
    }
  };

  const stopRecording = async () => {
    if (!cameraRef.current || !isMountedRef.current || !isRecording) {
      return;
    }
    try {
      if (isMountedRef.current) {
        setIsRecording(false);
      }
      // Get the recorded video URI and show preview
      if (cameraRef.current && isMountedRef.current) {
        const video = await cameraRef.current.stopRecordingAsync();
        if (isMountedRef.current && video && video.uri) {
          setLastRecordedVideo(video.uri);
          setShowVideoPreview(true);
          console.log('Video recording stopped:', video);
          // Call callback if provided
          if (onVideoRecorded) {
            onVideoRecorded(video.uri);
          }
        }
      }
    } catch (error) {
      console.error('Error stopping video recording:', error);
      if (isMountedRef.current) {
        setIsRecording(false);
      }
    }
  };

  const handleGalleryPress = async () => {
    try {
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant permission to access your photo library.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Launch image library
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        if (selectedImage.uri) {
          setLastCapturedPhoto(selectedImage.uri);
          setShowPhotoPreview(true);
          console.log('Image selected from gallery:', selectedImage.uri);
        }
      }
    } catch (error) {
      console.error('Error opening gallery:', error);
      Alert.alert(
        'Error',
        'Failed to open gallery. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleFilterSelect = (filter: string) => {
    setSelectedFilter(filter);
    console.log('Filter selected:', filter);
  };

  const closePhotoPreview = () => {
    setShowPhotoPreview(false);
    setLastCapturedPhoto(null);
  };

  const usePhoto = () => {
    const photoToUse = editedPhotoUri || lastCapturedPhoto;
    if (photoToUse && onPhotoCaptured) {
      onPhotoCaptured(photoToUse);
    }
    setShowPhotoPreview(false);
    setEditedPhotoUri(null);
    onClose();
  };

  const handleStickerEditorSave = (editedUri: string) => {
    setEditedPhotoUri(editedUri);
    setShowStickerEditor(false);
    // Update the preview to show edited image
    setLastCapturedPhoto(editedUri);
  };

  const handleStickerEditorCancel = () => {
    setShowStickerEditor(false);
  };

  // Snapchat-like photo preview handlers
  const handleAddSticker = (sticker: Sticker) => {
    const newSticker: StickerItemData = {
      id: `sticker-${Date.now()}`,
      sticker,
      x: imageLayout.x + imageLayout.width / 2 - 60,
      y: imageLayout.y + imageLayout.height / 2 - 30,
      width: 120,
      height: 60,
      rotation: 0,
    };
    setPreviewStickers([...previewStickers, newSticker]);
  };

  const handleUpdateSticker = (updatedSticker: StickerItemData) => {
    setPreviewStickers(previewStickers.map(s => s.id === updatedSticker.id ? updatedSticker : s));
  };

  const handleUpdateTextPosition = (id: string, x: number, y: number) => {
    setTextOverlays(textOverlays.map(t => t.id === id ? { ...t, x, y } : t));
  };

  const handleDeleteSticker = (stickerId: string) => {
    setPreviewStickers(previewStickers.filter(s => s.id !== stickerId));
  };

  const handleAddText = () => {
    const newText = {
      id: `text-${Date.now()}`,
      text: 'Tap to edit',
      x: imageLayout.width > 0 ? imageLayout.x + imageLayout.width / 2 - 50 : width / 2 - 50,
      y: imageLayout.height > 0 ? imageLayout.y + imageLayout.height / 2 - 15 : height / 2 - 15,
      color: '#FFFFFF',
      fontSize: 24,
    };
    setTextOverlays([...textOverlays, newText]);
    setEditingTextId(newText.id);
    setShowTextInput(true);
  };

  const handleTextInputChange = (text: string) => {
    if (editingTextId) {
      setTextOverlays(textOverlays.map(t => 
        t.id === editingTextId ? { ...t, text } : t
      ));
    }
  };

  const handleTextInputSubmit = () => {
    setShowTextInput(false);
    setEditingTextId(null);
  };

  const handleImageLayout = (event: any) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    setImageLayout({ x, y, width, height });
  };

  // Filter swipe gesture handler
  const filterSwipeResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderMove: (_, gestureState) => {
        filterSwipeX.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        const threshold = 50;
        if (gestureState.dx > threshold) {
          // Swipe right - previous filter
          filterIndex.current = Math.max(0, filterIndex.current - 1);
          setSelectedFilter(filters[filterIndex.current]);
        } else if (gestureState.dx < -threshold) {
          // Swipe left - next filter
          filterIndex.current = Math.min(filters.length - 1, filterIndex.current + 1);
          setSelectedFilter(filters[filterIndex.current]);
        }
        Animated.spring(filterSwipeX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }).start();
      },
    })
  ).current;

  const saveEditedPhoto = async () => {
    try {
      if (!photoPreviewRef.current) {
        usePhoto();
        return;
      }

      const uri = await captureRef(photoPreviewRef.current, {
        format: 'jpg',
        quality: 0.9,
        result: 'tmpfile',
      });

      setEditedPhotoUri(uri);
      usePhoto();
    } catch (error) {
      console.error('Error saving edited photo:', error);
      usePhoto();
    }
  };

  const resetPhotoPreview = () => {
    setPreviewStickers([]);
    setTextOverlays([]);
    setShowStickerLibrary(false);
    setShowTextInput(false);
    setEditingTextId(null);
    filterIndex.current = 0;
    setSelectedFilter('normal');
  };

  const retakePhoto = () => {
    resetPhotoPreview();
    setShowPhotoPreview(false);
    setLastCapturedPhoto(null);
  };

  const closeVideoPreview = () => {
    setIsVideoPlaying(false);
    setShowVideoControls(true);
    if (videoRef.current) {
      videoRef.current.pauseAsync();
      videoRef.current.setPositionAsync(0);
    }
    if (videoControlsTimeout) {
      clearTimeout(videoControlsTimeout);
      setVideoControlsTimeout(null);
    }
    setShowVideoPreview(false);
    setLastRecordedVideo(null);
    videoPanY.setValue(0);
    videoControlsOpacity.setValue(1);
  };

  // Auto-hide controls after 3 seconds
  const resetControlsTimeout = () => {
    if (videoControlsTimeout) {
      clearTimeout(videoControlsTimeout);
    }
    setShowVideoControls(true);
    Animated.timing(videoControlsOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    const timeout = setTimeout(() => {
      if (isMountedRef.current && isVideoPlaying) {
        setShowVideoControls(false);
        Animated.timing(videoControlsOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    }, 3000);
    setVideoControlsTimeout(timeout);
  };

  // Auto-play video when preview opens
  React.useEffect(() => {
    if (showVideoPreview && lastRecordedVideo && videoRef.current) {
      // Small delay to ensure video is ready
      setTimeout(() => {
        if (videoRef.current && isMountedRef.current) {
          videoRef.current.playAsync();
          setIsVideoPlaying(true);
          resetControlsTimeout();
        }
      }, 100);
    }
    return () => {
      if (videoControlsTimeout) {
        clearTimeout(videoControlsTimeout);
      }
    };
  }, [showVideoPreview, lastRecordedVideo]);

  const handleVideoPlayPause = async () => {
    if (!videoRef.current) return;
    
    resetControlsTimeout();
    
    if (isVideoPlaying) {
      await videoRef.current.pauseAsync();
      setIsVideoPlaying(false);
    } else {
      await videoRef.current.playAsync();
      setIsVideoPlaying(true);
      resetControlsTimeout();
    }
  };

  const handleVideoTap = () => {
    handleVideoPlayPause();
  };

  // PanResponder for video preview swipe down to dismiss
  const videoPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 20 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 2;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          videoPanY.setValue(gestureState.dy);
          // Fade out as user swipes
          const opacity = Math.max(0, 1 - gestureState.dy / 300);
          videoControlsOpacity.setValue(opacity);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const currentValue = gestureState.dy;
        
        if (currentValue > SWIPE_THRESHOLD) {
          Animated.parallel([
            Animated.timing(videoPanY, {
              toValue: height,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(videoControlsOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            closeVideoPreview();
          });
        } else {
          Animated.parallel([
            Animated.spring(videoPanY, {
              toValue: 0,
              useNativeDriver: true,
              tension: 50,
              friction: 7,
            }),
            Animated.timing(videoControlsOpacity, {
              toValue: showVideoControls ? 1 : 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

  const handleVideoShare = async () => {
    if (!lastRecordedVideo) return;
    
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(lastRecordedVideo, {
          mimeType: 'video/mp4',
          dialogTitle: 'Share your video',
        });
      } else {
        Alert.alert('Sharing not available', 'Sharing is not available on this device.');
      }
    } catch (error) {
      console.error('Error sharing video:', error);
      Alert.alert('Error', 'Failed to share video. Please try again.');
    }
  };

  const handleUseVideo = () => {
    if (lastRecordedVideo && onVideoRecorded) {
      onVideoRecorded(lastRecordedVideo);
    }
    closeVideoPreview();
    onClose();
  };

  const closeCameraModal = () => {
    setShowVideoPreview(false);
    setShowPhotoPreview(false);
    setLastRecordedVideo(null);
    setLastCapturedPhoto(null);
    onClose();
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
    <Animated.View 
      style={[
        styles.container,
        {
          transform: [{ translateY: panY }],
        }
      ]}
      {...panResponder.panHandlers}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Camera View */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={cameraType}
        flash={flashMode}
      >
        {/* Swipe Down Indicator */}
        <View style={styles.swipeIndicator}>
          <View style={styles.swipeHandle} />
        </View>

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
              <Ionicons name="camera-reverse" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Effect - Gradient overlay to hide camera controls when live stream setup is visible */}
        {showLiveStreamSetup && (
          <LinearGradient
            colors={['rgba(0, 0, 0, 0.95)', 'rgba(0, 0, 0, 0.85)', 'rgba(0, 0, 0, 0.5)', 'rgba(0, 0, 0, 0)']}
            locations={[0, 0.3, 0.6, 1]}
            style={styles.heroGradientOverlay}
            pointerEvents="none"
          />
        )}


        {/* Photo Preview Overlay - Snapchat Style */}
        {showPhotoPreview && lastCapturedPhoto && (
          <View style={styles.photoPreviewOverlay}>
            {/* Top Bar - Minimal */}
            <View style={styles.photoPreviewTopBar}>
              <TouchableOpacity 
                style={styles.photoPreviewTopButton} 
                onPress={retakePhoto}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.photoPreviewTopButton} />
            </View>

            {/* Photo with overlays - Swipeable for filters */}
            <Animated.View 
              style={styles.photoPreviewContainer}
              {...filterSwipeResponder.panHandlers}
            >
              <View 
                ref={photoPreviewRef} 
                collapsable={false}
                style={StyleSheet.absoluteFill}
                onLayout={handleImageLayout}
              >
                <Image 
                  source={{ uri: editedPhotoUri || lastCapturedPhoto }} 
                  style={styles.photoPreviewImage}
                  resizeMode="contain"
                />
                
                {/* Text Overlays - Draggable */}
                {textOverlays.map((textOverlay) => (
                  <DraggableTextOverlay
                    key={textOverlay.id}
                    textOverlay={textOverlay}
                    imageLayout={imageLayout}
                    onUpdate={handleUpdateTextPosition}
                    onPress={() => {
                      setEditingTextId(textOverlay.id);
                      setShowTextInput(true);
                    }}
                  />
                ))}

                {/* Stickers */}
                {previewStickers.map((stickerData) => (
                  <StickerItem
                    key={stickerData.id}
                    stickerData={stickerData}
                    onUpdate={handleUpdateSticker}
                    onDelete={() => handleDeleteSticker(stickerData.id)}
                    imageWidth={imageLayout.width}
                    imageHeight={imageLayout.height}
                    imageX={imageLayout.x}
                    imageY={imageLayout.y}
                  />
                ))}
              </View>

              {/* Filter indicator */}
              {showFilters && (
                <View style={styles.filterIndicator}>
                  <Text style={styles.filterIndicatorText}>
                    {selectedFilter.charAt(0).toUpperCase() + selectedFilter.slice(1)}
                  </Text>
                  <Text style={styles.filterIndicatorHint}>Swipe left/right to change</Text>
                </View>
              )}
            </Animated.View>

            {/* Bottom Toolbar - Snapchat Style */}
            <View style={styles.photoPreviewBottomBar}>
              <TouchableOpacity
                style={styles.photoPreviewToolButton}
                onPress={handleAddText}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Type size={24} color="#FFFFFF" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.photoPreviewToolButton}
                onPress={() => setShowStickerLibrary(!showStickerLibrary)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="happy" size={24} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.photoPreviewSendButton}
                onPress={saveEditedPhoto}
                activeOpacity={0.8}
              >
                <Ionicons name="send" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Text Input Modal */}
            {showTextInput && editingTextId && (
              <View style={styles.textInputOverlay}>
                <View style={styles.textInputContainer}>
                  <TextInput
                    style={styles.textInput}
                    value={textOverlays.find(t => t.id === editingTextId)?.text || ''}
                    onChangeText={handleTextInputChange}
                    placeholder="Enter text"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    autoFocus
                    multiline
                    maxLength={50}
                    onSubmitEditing={handleTextInputSubmit}
                  />
                  <TouchableOpacity
                    style={styles.textInputDoneButton}
                    onPress={handleTextInputSubmit}
                  >
                    <Text style={styles.textInputDoneText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Sticker Library */}
            <StickerLibrary
              onSelectSticker={handleAddSticker}
              onClose={() => setShowStickerLibrary(false)}
              isVisible={showStickerLibrary}
            />
          </View>
        )}

        {/* Sticker Editor */}
        {showStickerEditor && lastCapturedPhoto && (
          <StickerEditor
            imageUri={lastCapturedPhoto}
            onSave={handleStickerEditorSave}
            onCancel={handleStickerEditorCancel}
            visible={showStickerEditor}
          />
        )}

        {/* Video Preview Overlay - Snapchat/TikTok Style */}
        {showVideoPreview && lastRecordedVideo && (
          <Animated.View 
            style={[
              styles.videoPreviewOverlay,
              {
                transform: [{ translateY: videoPanY }],
              }
            ]}
            {...videoPanResponder.panHandlers}
          >
            {/* Full-screen video */}
            <TouchableOpacity 
              style={styles.videoPreviewFullScreen}
              activeOpacity={1}
              onPress={handleVideoTap}
            >
              <Video
                ref={videoRef}
                source={{ uri: lastRecordedVideo }}
                style={styles.videoPreviewFullScreenVideo}
                resizeMode={ResizeMode.COVER}
                isLooping={false}
                shouldPlay={false}
                onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
                  if (status.isLoaded) {
                    setIsVideoPlaying(status.isPlaying);
                    if (status.didJustFinish) {
                      setIsVideoPlaying(false);
                      resetControlsTimeout();
                    }
                  }
                }}
              />
              
              {/* Large play/pause overlay - shows when paused */}
              {!isVideoPlaying && (
                <Animated.View 
                  style={[
                    styles.videoPreviewPlayOverlay,
                    { opacity: videoControlsOpacity }
                  ]}
                >
                  <TouchableOpacity 
                    style={styles.videoPreviewLargePlayButton}
                    onPress={handleVideoPlayPause}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="play" size={64} color="#FFFFFF" />
                  </TouchableOpacity>
                </Animated.View>
              )}
            </TouchableOpacity>

            {/* Top controls - fade in/out */}
            <Animated.View 
              style={[
                styles.videoPreviewTopControls,
                { opacity: videoControlsOpacity }
              ]}
              pointerEvents="box-none"
            >
              <TouchableOpacity 
                style={styles.videoPreviewCloseButton} 
                onPress={closeVideoPreview}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </Animated.View>

            {/* Bottom action bar - always visible but can fade */}
            <Animated.View 
              style={[
                styles.videoPreviewBottomBar,
                { opacity: videoControlsOpacity }
              ]}
            >
              <TouchableOpacity 
                style={styles.videoPreviewBottomAction}
                onPress={handleVideoShare}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <View style={styles.videoPreviewBottomActionIcon}>
                  <Ionicons name="share-social" size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.videoPreviewBottomActionText}>Share</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.videoPreviewBottomCaptureButton}
                onPress={handleUseVideo}
                activeOpacity={0.8}
              >
                <View style={styles.videoPreviewBottomCaptureButtonInner} />
              </TouchableOpacity>
              
              {showGoLiveButton && (
                <TouchableOpacity 
                  style={styles.videoPreviewBottomGoLive}
                  onPress={() => {
                    closeVideoPreview();
                    setShowLiveStreamSetup(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Radio size={20} color="#FFFFFF" />
                  <Text style={styles.videoPreviewBottomGoLiveText}>Go Live</Text>
                </TouchableOpacity>
              )}
              {!showGoLiveButton && (
                <View style={styles.videoPreviewBottomAction} />
              )}
            </Animated.View>
          </Animated.View>
        )}

        {/* Camera Filters Section - Above Shutter */}
        {showFilters && (
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
        )}

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
            onLongPress={(showVideoRecording && (mode === 'both' || mode === 'live')) ? startRecording : undefined}
            onPressOut={(isRecording && (mode === 'both' || mode === 'live')) ? stopRecording : undefined}
            delayLongPress={200}
          >
            <SvgXml xml={captureButtonSVG} width={80} height={80} />
            {isRecording && <View style={styles.recordingIndicator} />}
          </TouchableOpacity>
          
          {/* Right side - Go Live Button */}
          {showGoLiveButton && (
            <TouchableOpacity 
              style={styles.goLiveButton} 
              onPress={() => {
                onClose();
                router.push('/(tabs)/chef/live' as any);
              }}
            >
              <Radio size={20} color="#FFFFFF" />
              <Text style={styles.goLiveButtonText}>Go Live</Text>
            </TouchableOpacity>
          )}
          {!showGoLiveButton && <View style={styles.leftControls} />}
        </View>
      </CameraView>
    </Animated.View>
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
  swipeIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    zIndex: 100,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 8,
  },
  swipeHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
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
  videoPreviewFullScreen: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPreviewFullScreenVideo: {
    width: width,
    height: height,
    backgroundColor: '#000000',
  },
  videoPreviewPlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  videoPreviewLargePlayButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  videoPreviewTopControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 60,
    paddingHorizontal: 20,
    zIndex: 21,
  },
  videoPreviewCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
  },
  videoPreviewBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 50,
    paddingTop: 20,
    zIndex: 21,
  },
  videoPreviewBottomAction: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  videoPreviewBottomActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  videoPreviewBottomActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  videoPreviewBottomCaptureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: '#1F1F1F',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  videoPreviewBottomCaptureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1F1F1F',
  },
  videoPreviewBottomGoLive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 6,
    minWidth: 100,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  videoPreviewBottomGoLiveText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  photoPreviewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    zIndex: 200,
  },
  photoPreviewTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  photoPreviewTopButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPreviewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPreviewImage: {
    width: width,
    height: height * 0.75,
  },
  photoPreviewBottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 50,
    paddingTop: 20,
  },
  photoPreviewToolButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPreviewSendButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  textOverlay: {
    position: 'absolute',
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 100,
  },
  textOverlayText: {
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  textInputOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingBottom: 50,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 14,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  textInputDoneButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
  },
  textInputDoneText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  filterIndicator: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  filterIndicatorText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  filterIndicatorHint: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  goLiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  goLiveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  heroGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    zIndex: 50,
  },
  liveStreamOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    justifyContent: 'flex-end',
  },
  liveStreamOverlayBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  liveStreamOverlayContent: {
    flex: 1,
    zIndex: 101,
  },
  liveStreamOverlayContentContainer: {
    padding: 20,
    paddingTop: 60,
  },
  liveStreamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  liveStreamHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  startLiveButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  startLiveButtonDisabled: {
    backgroundColor: '#666',
    opacity: 0.5,
  },
  startLiveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  liveStreamInputContainer: {
    marginBottom: 20,
  },
  liveStreamInputLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  liveStreamTitleInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 14,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  liveStreamDescriptionInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 14,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  liveStreamTagInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 14,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  mealSelectButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  mealSelectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    flex: 1,
  },
  mealSelectHint: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginTop: 6,
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  mealPickerContainer: {
    marginTop: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    maxHeight: 200,
    overflow: 'hidden',
  },
  mealPickerScrollView: {
    maxHeight: 200,
  },
  mealPickerLoading: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  mealPickerLoadingText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  mealPickerEmpty: {
    padding: 20,
    alignItems: 'center',
  },
  mealPickerEmptyText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  mealPickerEmptySubtext: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  mealPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    gap: 12,
  },
  mealPickerItemSelected: {
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
  },
  mealPickerItemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  mealPickerItemContent: {
    flex: 1,
    gap: 4,
  },
  mealPickerItemName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  mealPickerItemDescription: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  mealPickerItemPrice: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
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

// Live Stream Setup Overlay Component
interface LiveStreamSetupOverlayProps {
  onClose: () => void;
  onStartLiveStream: (sessionId: string, liveSessionId?: Id<'liveSessions'>) => void;
}

function LiveStreamSetupOverlay({ onClose, onStartLiveStream }: LiveStreamSetupOverlayProps) {
  const { chef, sessionToken, isAuthenticated } = useChefAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [selectedMealName, setSelectedMealName] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [showMealPicker, setShowMealPicker] = useState(false);
  const isMountedRef = React.useRef(true);

  // Get chef's meals using Convex query
  // Note: TypeScript has type instantiation depth issues with complex Convex queries
  // This is a known limitation but the query works correctly at runtime
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - Type instantiation is excessively deep (Convex type system limitation)
  const meals = useQuery(
    api.queries.meals.getByChefId,
    chef?._id ? { chefId: chef._id, limit: 50 } : 'skip'
  ) as any[] | undefined;

  const createLiveSession = useMutation(api.mutations.liveSessions.createLiveSession);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Safe close handler
  const handleClose = React.useCallback(() => {
    if (isMountedRef.current) {
      // Reset state before closing
      setShowMealPicker(false);
      onClose();
    }
  }, [onClose]);

  const handleTagInput = (text: string) => {
    if (text.includes(',')) {
      const newTags = text.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      setTags(prev => [...prev, ...newTags]);
    }
  };

  const handleStartLiveStream = async () => {
    if (!isMountedRef.current) return;

    if (!isAuthenticated || !chef?._id || !sessionToken) {
      Alert.alert('Sign In Required', 'Please sign in to start a live stream.');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Title Required', 'Please add a title for your live stream.');
      return;
    }

    if (!selectedMealId) {
      Alert.alert('Meal Required', 'Please select a meal for your live stream.');
      return;
    }

    try {
      if (!isMountedRef.current) return;
      setIsStarting(true);
      // Generate a unique channel name
      const channelName = `chef-${chef._id}-${Date.now()}`;
      
      const liveSessionId = await createLiveSession({
        channelName,
        chefId: chef._id,
        title: title.trim(),
        description: description.trim() || 'Live cooking session',
        mealId: selectedMealId as any,
        tags: tags,
        sessionToken,
      });
      
      if (isMountedRef.current) {
        // Generate session ID from channel name for navigation
        const sessionId = channelName;
        onStartLiveStream(sessionId, liveSessionId);
      }
    } catch (error: any) {
      if (!isMountedRef.current) return;
      console.error('Error starting live stream:', error);
      let errorMessage = 'Please try again.';
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      Alert.alert('Failed to Start Live Stream', errorMessage);
    } finally {
      if (isMountedRef.current) {
        setIsStarting(false);
      }
    }
  };

  return (
    <View style={styles.liveStreamOverlay}>
      {/* Backdrop - allows closing by tapping outside */}
      <TouchableOpacity 
        style={styles.liveStreamOverlayBackdrop} 
        activeOpacity={1}
        onPress={handleClose}
        disabled={isStarting}
      />
      <ScrollView 
        style={styles.liveStreamOverlayContent} 
        contentContainerStyle={styles.liveStreamOverlayContentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.liveStreamHeader}>
          <TouchableOpacity onPress={handleClose} disabled={isStarting}>
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.liveStreamHeaderTitle}>Start Live Stream</Text>
          <TouchableOpacity
            onPress={handleStartLiveStream}
            disabled={isStarting || !title.trim() || !selectedMealId}
            style={[
              styles.startLiveButton,
              (isStarting || !title.trim() || !selectedMealId) && styles.startLiveButtonDisabled,
            ]}
          >
            {isStarting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.startLiveButtonText}>Start Live</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Title Input */}
        <View style={styles.liveStreamInputContainer}>
          <Text style={styles.liveStreamInputLabel}>Live Stream Title *</Text>
          <TextInput
            style={styles.liveStreamTitleInput}
            placeholder="What are you cooking today?"
            placeholderTextColor="#999"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
            editable={!isStarting}
            multiline={false}
          />
        </View>

        {/* Meal Selection */}
        <View style={styles.liveStreamInputContainer}>
          <Text style={styles.liveStreamInputLabel}>Meal Being Cooked *</Text>
          <TouchableOpacity 
            style={styles.mealSelectButton} 
            disabled={isStarting || !meals}
            onPress={() => setShowMealPicker(!showMealPicker)}
          >
            <Text style={styles.mealSelectButtonText}>
              {selectedMealName || 'Select a Meal'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
          {showMealPicker && (
            <View style={styles.mealPickerContainer}>
              <ScrollView style={styles.mealPickerScrollView} nestedScrollEnabled>
                {!meals ? (
                  <View style={styles.mealPickerLoading}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.mealPickerLoadingText}>Loading meals...</Text>
                  </View>
                ) : meals.length === 0 ? (
                  <View style={styles.mealPickerEmpty}>
                    <Text style={styles.mealPickerEmptyText}>No meals available</Text>
                    <Text style={styles.mealPickerEmptySubtext}>
                      Create a meal in your chef profile first
                    </Text>
                  </View>
                ) : (
                  meals.map((meal) => (
                    <TouchableOpacity
                      key={meal._id}
                      style={[
                        styles.mealPickerItem,
                        selectedMealId === meal._id && styles.mealPickerItemSelected,
                      ]}
                      onPress={() => {
                        setSelectedMealId(meal._id);
                        setSelectedMealName(meal.name);
                        setShowMealPicker(false);
                      }}
                    >
                      {meal.image && (
                        <Image
                          source={{ uri: meal.image }}
                          style={styles.mealPickerItemImage}
                          contentFit="cover"
                        />
                      )}
                      <View style={styles.mealPickerItemContent}>
                        <Text style={styles.mealPickerItemName}>{meal.name}</Text>
                        {meal.description && (
                          <Text style={styles.mealPickerItemDescription} numberOfLines={1}>
                            {meal.description}
                          </Text>
                        )}
                        {meal.price && (
                          <Text style={styles.mealPickerItemPrice}>£{meal.price.toFixed(2)}</Text>
                        )}
                      </View>
                      {selectedMealId === meal._id && (
                        <Ionicons name="checkmark-circle" size={24} color="#FF3B30" />
                      )}
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          )}
          <Text style={styles.mealSelectHint}>
            Link your live stream to a specific meal from your menu.
          </Text>
        </View>

        {/* Description Input */}
        <View style={styles.liveStreamInputContainer}>
          <Text style={styles.liveStreamInputLabel}>Description (Optional)</Text>
          <TextInput
            style={styles.liveStreamDescriptionInput}
            placeholder="Tell us more about your live session..."
            placeholderTextColor="#999"
            value={description}
            onChangeText={setDescription}
            maxLength={500}
            editable={!isStarting}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Tags Input */}
        <View style={styles.liveStreamInputContainer}>
          <Text style={styles.liveStreamInputLabel}>Tags (comma-separated)</Text>
          <TextInput
            style={styles.liveStreamTagInput}
            placeholder="e.g. italian, pasta, cooking"
            placeholderTextColor="#999"
            onChangeText={handleTagInput}
            editable={!isStarting}
          />
          {tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                  <TouchableOpacity
                    onPress={() => setTags(prev => prev.filter((_, i) => i !== index))}
                    disabled={isStarting}
                  >
                    <X size={14} color="#666" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
