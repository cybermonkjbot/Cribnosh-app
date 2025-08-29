import { AVPlaybackStatus, ResizeMode, Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { AlertCircle, MessageCircle, Play, Send, ShoppingCart, UserRound } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Dimensions, Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';
import { useDebugLogger } from './DebugLogger';
import HearEmoteIcon from './HearEmoteIcon';
import { MealVideoCardSkeleton } from './MealVideoCardSkeleton';

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
  const logger = useDebugLogger('MealVideoCard');
  const videoRef = useRef<Video>(null);
  const [isLoading, setIsLoading] = useState(!isPreloaded);
  const [hasError, setHasError] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(isPreloaded);
  const loadingOpacity = useSharedValue(isPreloaded ? 0 : 1);
  const errorOpacity = useSharedValue(0);

  // Performance tracking
  const loadStartTimeRef = useRef<number>(0);

  // Log component mount
  useEffect(() => {
    logger.info('MealVideoCard mounted', { 
      videoSource, 
      title, 
      isPreloaded,
      isVisible 
    });
    
    return () => {
      logger.info('MealVideoCard unmounting', { title });
    };
  }, []);

  // Use derived values to avoid reading shared values during render
  const loadingOpacityDerived = useDerivedValue(() => {
    return loadingOpacity.value;
  });

  const errorOpacityDerived = useDerivedValue(() => {
    return errorOpacity.value;
  });

  // Control playback based on visibility
  useEffect(() => {
    try {
      if (isVisible && isVideoReady) {
        logger.debug('Starting video playback', { title });
        videoRef.current?.playAsync();
      } else {
        logger.debug('Pausing video playback', { title, isVisible, isVideoReady });
        videoRef.current?.pauseAsync();
      }
    } catch (error) {
      logger.error('Video playback control error', { title, error });
    }
  }, [isVisible, isVideoReady, logger, title]);

  // Reset states when video source changes
  useEffect(() => {
    logger.info('Video source changed', { 
      videoSource, 
      title, 
      isPreloaded 
    });
    
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
  }, [videoSource, isPreloaded, logger, title, loadingOpacity, errorOpacity]);

  // Start load timer when component mounts or video source changes
  useEffect(() => {
    if (!isPreloaded) {
      loadStartTimeRef.current = Date.now();
      logger.debug('Starting video load timer', { title });
    }
  }, [videoSource, isPreloaded, logger, title]);

  const handleLike = () => {
    try {
      logger.info('Like button pressed', { title });
      if (typeof onLike === 'function') {
        onLike();
      }
    } catch (error) {
      logger.error('Like button error', { title, error });
    }
  };

  const handleVideoLoad = () => {
    const loadTime = Date.now() - loadStartTimeRef.current;
    logger.info('Video loaded successfully', { title, loadTime });
    
    setIsLoading(false);
    setIsVideoReady(true);
    loadingOpacity.value = withTiming(0, { duration: 300 });
    
    // Log performance issues
    if (loadTime > 3000) {
      logger.warn('Slow video load', { title, loadTime });
    }
  };

  const handleVideoError = () => {
    const loadTime = Date.now() - loadStartTimeRef.current;
    logger.error('Video load error', { title, loadTime });
    
    setIsLoading(false);
    setHasError(true);
    loadingOpacity.value = withTiming(0, { duration: 300 });
    errorOpacity.value = withTiming(1, { duration: 300 });
  };

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    try {
      if (status.isLoaded) {
        if (status.isPlaying && isLoading) {
          handleVideoLoad();
        }
      } else if (status.error) {
        logger.error('Playback status error', { title, error: status.error });
        handleVideoError();
      }
    } catch (error) {
      logger.error('Playback status update error', { title, error });
    }
  };

  const retryVideo = () => {
    logger.info('Retrying video', { title });
    setHasError(false);
    setIsLoading(true);
    setIsVideoReady(false);
    loadingOpacity.value = withTiming(1, { duration: 300 });
    errorOpacity.value = withTiming(0, { duration: 300 });
    
    // Reset video
    videoRef.current?.loadAsync({ uri: videoSource }, {}, false);
  };

  const loadingStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: loadingOpacityDerived.value,
    };
  });

  const errorStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: errorOpacityDerived.value,
    };
  });

  // Validate required props
  if (!videoSource || !title || !kitchenName || !price) {
    logger.error('Invalid props provided', { videoSource, title, kitchenName, price });
    return null;
  }

  logger.debug('MealVideoCard rendering', { 
    title, 
    isVisible, 
    isLoading, 
    hasError, 
    isVideoReady 
  });

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
          zIndex: 10,
        },
        loadingStyle
      ]}>
        <MealVideoCardSkeleton isVisible={isLoading} />
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
            <Send size={24} color="#FFFFFF" />
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
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 16, 
          paddingHorizontal: 16 
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
              backgroundColor: 'rgba(255, 59, 48, 0.4)',
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 25,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.3)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.2,
              shadowRadius: 16,
              elevation: 12,
              // Additional glassmorphism effects
              overflow: 'hidden',
            }}
          >
            {/* Multiple glass border layers for light reactivity */}
            <View style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 25,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.2)',
            }} />
            <View style={{
              position: 'absolute',
              top: 1,
              left: 1,
              right: 1,
              bottom: 1,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.1)',
            }} />
            {/* Inner glass highlight */}
            <View style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderTopLeftRadius: 25,
              borderTopRightRadius: 25,
            }} />
            {/* Subtle bottom shadow for depth */}
            <View style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '30%',
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              borderBottomLeftRadius: 25,
              borderBottomRightRadius: 25,
            }} />
            <ShoppingCart size={16} color="#FFFFFF" />
            <Text style={{
              color: '#FFFFFF',
              fontWeight: '600',
              fontSize: 14,
            }}>
              Add to order
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
} 