import { AVPlaybackStatus, ResizeMode, Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { AlertCircle, MessageCircle, Play, Share2, ShoppingCart, UserRound } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';
import HearEmoteIcon from './HearEmoteIcon';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface MealVideoCardProps {
  videoSource: string;
  title: string;
  description: string;
  kitchenName: string;
  price: string;
  chef?: string;
  isVisible: boolean;
  isPreloaded?: boolean;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onAddToCart?: () => void;
  onKitchenPress?: () => void;
  likes?: number;
  comments?: number;
}

export function MealVideoCard({
  videoSource,
  title,
  description,
  kitchenName,
  price,
  chef,
  isVisible,
  isPreloaded = false,
  onLike,
  onComment,
  onShare,
  onAddToCart,
  onKitchenPress,
  likes = 0,
  comments = 0,
}: MealVideoCardProps) {
  const videoRef = useRef<Video>(null);
  const [isLoading, setIsLoading] = useState(!isPreloaded);
  const [hasError, setHasError] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(isPreloaded);
  const loadingOpacity = useSharedValue(isPreloaded ? 0 : 1);
  const errorOpacity = useSharedValue(0);

  // Use derived values to avoid reading shared values during render
  const loadingOpacityDerived = useDerivedValue(() => {
    return loadingOpacity.value;
  });

  const errorOpacityDerived = useDerivedValue(() => {
    return errorOpacity.value;
  });

  // Validate required props
  if (!videoSource || !title || !kitchenName || !price) {
    return null;
  }

  // Control playback based on visibility
  useEffect(() => {
    try {
      if (isVisible && isVideoReady) {
        videoRef.current?.playAsync();
      } else {
        videoRef.current?.pauseAsync();
      }
    } catch (error) {
      console.warn('Video playback control error:', error);
    }
  }, [isVisible, isVideoReady]);

  // Reset states when video source changes
  useEffect(() => {
    setIsLoading(!isPreloaded);
    setHasError(false);
    setIsVideoReady(isPreloaded);
    // Use runOnJS to update shared values safely
    if (isPreloaded) {
      loadingOpacity.value = 0;
      errorOpacity.value = 0;
    } else {
      loadingOpacity.value = 1;
      errorOpacity.value = 0;
    }
  }, [videoSource, isPreloaded]);

  const handleLike = () => {
    try {
      if (typeof onLike === 'function') {
        onLike();
      }
    } catch (error) {
      console.warn('Like button error:', error);
    }
  };

  const handleVideoLoad = () => {
    setIsLoading(false);
    setIsVideoReady(true);
    loadingOpacity.value = withTiming(0, { duration: 300 });
  };

  const handleVideoError = () => {
    setIsLoading(false);
    setHasError(true);
    loadingOpacity.value = withTiming(0, { duration: 300 });
    errorOpacity.value = withTiming(1, { duration: 300 });
  };

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      if (status.isPlaying && isLoading) {
        handleVideoLoad();
      }
    } else if (status.error) {
      handleVideoError();
    }
  };

  const retryVideo = () => {
    setHasError(false);
    setIsLoading(true);
    setIsVideoReady(false);
    loadingOpacity.value = withTiming(1, { duration: 300 });
    errorOpacity.value = withTiming(0, { duration: 300 });
    
    // Reset video
    videoRef.current?.loadAsync({ uri: videoSource }, {}, false);
  };

  const loadingStyle = useAnimatedStyle(() => ({
    opacity: loadingOpacityDerived.value,
  }));

  const errorStyle = useAnimatedStyle(() => ({
    opacity: errorOpacityDerived.value,
  }));

  return (
    <View style={{
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
      backgroundColor: '#000',
      position: 'relative'
    }}>
      {/* Video Component */}
      <Video
        ref={videoRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
        source={{ uri: videoSource }}
        resizeMode={ResizeMode.COVER}
        shouldPlay={isVisible && isVideoReady}
        isLooping
        isMuted={false}
        useNativeControls={false}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        onLoad={handleVideoLoad}
        onError={handleVideoError}
      />

      {/* Loading Overlay */}
      <Animated.View style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#000',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10,
        },
        loadingStyle
      ]}>
        <ActivityIndicator size="large" color="#FF3B30" />
        <Text style={{
          color: '#FFFFFF',
          fontSize: 16,
          marginTop: 16,
          textAlign: 'center',
        }}>
          Loading video...
        </Text>
      </Animated.View>

      {/* Error Overlay */}
      <Animated.View style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#000',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10,
        },
        errorStyle
      ]}>
        <AlertCircle size={48} color="#FF3B30" />
        <Text style={{
          color: '#FFFFFF',
          fontSize: 16,
          marginTop: 16,
          marginBottom: 24,
          textAlign: 'center',
        }}>
          Failed to load video
        </Text>
        <Pressable
          onPress={retryVideo}
          style={{
            backgroundColor: '#FF3B30',
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 25,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Play size={16} color="#FFFFFF" />
          <Text style={{
            color: '#FFFFFF',
            fontWeight: '600',
            fontSize: 14,
          }}>
            Retry
          </Text>
        </Pressable>
      </Animated.View>

      {/* Dark Overlay for Better Text Readability */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />

      {/* Right Side Actions */}
      <View style={{
        position: 'absolute',
        right: 16,
        bottom: 120,
        alignItems: 'center',
        gap: 24,
      }}>
        {/* Kitchen Profile */}
        <Pressable
          onPress={onKitchenPress}
          style={{
            alignItems: 'center',
            gap: 4,
          }}
        >
          <View style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 2,
            borderColor: 'rgba(255, 255, 255, 0.3)',
          }}>
            <UserRound size={24} color="#FFFFFF" />
          </View>
          <Text style={{
            color: '#FFFFFF',
            fontSize: 12,
            fontWeight: '600',
            textShadowColor: 'rgba(0, 0, 0, 0.75)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2,
          }}>
            Kitchen
          </Text>
        </Pressable>

        {/* Like Button */}
        <View style={{
          alignItems: 'center',
          gap: 4,
        }}>
          <View style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
          }}>
            <HearEmoteIcon 
              width={28}
              height={28}
              liked={false} // This component manages its own liked state
              onLikeChange={handleLike}
            />
          </View>
          <Text style={{
            color: '#FFFFFF',
            fontSize: 12,
            fontWeight: '600',
            textShadowColor: 'rgba(0, 0, 0, 0.75)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2,
          }}>
            {likes}
          </Text>
        </View>

        {/* Comment Button */}
        <Pressable
          onPress={onComment}
          style={{
            alignItems: 'center',
            gap: 4,
          }}
        >
          <View style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
          }}>
            <MessageCircle size={24} color="#FFFFFF" />
          </View>
          <Text style={{
            color: '#FFFFFF',
            fontSize: 12,
            fontWeight: '600',
            textShadowColor: 'rgba(0, 0, 0, 0.75)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2,
          }}>
            {comments}
          </Text>
        </Pressable>

        {/* Share Button */}
        <Pressable
          onPress={onShare}
          style={{
            alignItems: 'center',
            gap: 4,
          }}
        >
          <View style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
          }}>
            <Share2 size={24} color="#FFFFFF" />
          </View>
          <Text style={{
            color: '#FFFFFF',
            fontSize: 12,
            fontWeight: '600',
            textShadowColor: 'rgba(0, 0, 0, 0.75)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2,
          }}>
            Share
          </Text>
        </Pressable>
      </View>

      {/* Bottom Content */}
      <View style={{
        position: 'absolute',
        bottom: 120, // Moved up significantly to start above the tab bar area
        left: 16,
        right: 80, // Account for right side actions
      }}>
        {/* Kitchen Name */}
        <Text style={{
          fontSize: 14,
          color: '#FF3B30',
          fontWeight: '600',
          marginBottom: 4,
          textShadowColor: 'rgba(0, 0, 0, 0.75)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 2,
        }}>
          {kitchenName}
        </Text>

        {/* Meal Title */}
        <Text style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: '#FFFFFF',
          marginBottom: 8,
          textShadowColor: 'rgba(0, 0, 0, 0.75)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 2,
        }}>
          {title}
        </Text>

        {/* Compact Description */}
        <Text style={{
          fontSize: 14,
          color: '#E0E0E0',
          marginBottom: 16,
          lineHeight: 18,
          textShadowColor: 'rgba(0, 0, 0, 0.75)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 2,
        }}>
          {description.length > 80 ? `${description.substring(0, 80)}...` : description}
        </Text>

        {/* Price and Order Button */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Text style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: '#FF3B30',
            textShadowColor: 'rgba(0, 0, 0, 0.75)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2,
          }}>
            {price}
          </Text>

          <Pressable
            onPress={onAddToCart}
            style={{
              backgroundColor: '#FF3B30',
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 25,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <ShoppingCart size={16} color="#FFFFFF" />
            <Text style={{
              color: '#FFFFFF',
              fontWeight: '600',
              fontSize: 14,
            }}>
              Order now
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
} 