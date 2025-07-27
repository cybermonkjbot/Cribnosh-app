import { ChefHat, Sparkles, Utensils } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import Animated, {
    Extrapolate,
    interpolate,
    runOnJS,
    useAnimatedStyle,
} from 'react-native-reanimated';

interface PullToNoshHeavenTriggerProps {
  pullProgress: Animated.SharedValue<number>; // 0 to 1 progress
  onTrigger: () => void;
  threshold?: number; // threshold to trigger (default 0.9)
  isVisible: boolean;
}

export function PullToNoshHeavenTrigger({
  pullProgress,
  onTrigger,
  threshold = 0.9, // Increased default threshold for more intentional pull
  isVisible,
}: PullToNoshHeavenTriggerProps) {
  const hasTriggeredRef = useRef(false);
  const onTriggerRef = useRef(onTrigger);
  const isMountedRef = useRef(true);
  
  // Update ref when onTrigger changes to avoid stale closures
  useEffect(() => {
    if (isMountedRef.current && typeof onTrigger === 'function') {
      onTriggerRef.current = onTrigger;
    }
  }, [onTrigger]);

  // Reset trigger state when component becomes visible
  useEffect(() => {
    if (isVisible && isMountedRef.current && hasTriggeredRef.current) {
      hasTriggeredRef.current = false;
    }
  }, [isVisible]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Trigger callback function that prevents multiple calls
  const triggerCallback = useCallback(() => {
    try {
      if (isMountedRef.current && hasTriggeredRef.current !== null && !hasTriggeredRef.current) {
        hasTriggeredRef.current = true;
        if (onTriggerRef.current && typeof onTriggerRef.current === 'function') {
          onTriggerRef.current();
        }
      }
    } catch (error) {
      console.warn('Trigger callback error:', error);
    }
  }, []);

  // Single optimized animated style with trigger logic in worklet
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    try {
      if (!pullProgress || typeof pullProgress.value !== 'number') {
        return { 
          opacity: 0,
          transform: [{ translateY: 50 }, { scale: 0.8 }]
        };
      }

      const currentProgress = pullProgress.value;
      
      // Trigger logic in worklet - runs on UI thread for better performance
      if (currentProgress >= threshold && hasTriggeredRef.current !== null && !hasTriggeredRef.current) {
        runOnJS(triggerCallback)();
      }
      
      // Reset trigger when progress drops significantly
      if (currentProgress < 0.1 && hasTriggeredRef.current !== null) {
        runOnJS(() => {
          if (isMountedRef.current && hasTriggeredRef.current !== null) {
            hasTriggeredRef.current = false;
          }
        })();
      }
      
      const opacity = interpolate(
        currentProgress,
        [0, 0.3, 1],
        [0, 1, 1],
        Extrapolate.CLAMP
      );

      const translateY = interpolate(
        currentProgress,
        [0, 1],
        [50, 0],
        Extrapolate.CLAMP
      );

      // More dramatic scale for intentional pull
      const scale = interpolate(
        currentProgress,
        [0, threshold, 1],
        [0.8, 1.2, 1.3],
        Extrapolate.CLAMP
      );

      return {
        opacity,
        transform: [
          { translateY },
          { scale },
        ],
      };
    } catch (error) {
      // Fallback style in case of error
      return { 
        opacity: 0,
        transform: [{ translateY: 50 }, { scale: 0.8 }]
      };
    }
  }, [threshold, triggerCallback]);

  // Progress bar animated style - separate for better performance
  const progressBarStyle = useAnimatedStyle(() => {
    'worklet';
    try {
      if (!pullProgress || typeof pullProgress.value !== 'number') {
        return { width: '0%', backgroundColor: '#666' };
      }

      const currentProgress = pullProgress.value;
      
      const width = interpolate(
        currentProgress,
        [0, threshold, 1],
        [0, 100, 100],
        Extrapolate.CLAMP
      );

      // More dramatic color change for intentional pull
      const backgroundColor = currentProgress >= threshold ? '#FF3B30' : '#666';

      return {
        width: `${width}%`,
        backgroundColor,
      };
    } catch (error) {
      return { width: '0%', backgroundColor: '#666' };
    }
  }, [threshold]);

  // Don't render if not visible or if props are invalid
  if (!isVisible || !pullProgress || typeof onTrigger !== 'function' || !isMountedRef.current) {
    return null;
  }

  return (
    <Animated.View style={[
      {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 30, // Increased padding for better visibility
        paddingHorizontal: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.95)', // Semi-transparent background for better visibility
        borderRadius: 20, // Rounded corners for better appearance
        marginHorizontal: 20, // Horizontal margin to avoid edges
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5, // Android shadow
      },
      animatedStyle
    ]}>
      {/* Sparkle Background */}
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.1,
      }}>
        <Sparkles size={120} color="#FF3B30" />
      </View>

      {/* Icons */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
      }}>
        <Utensils size={24} color="#FF3B30" />
        <ChefHat size={24} color="#FF3B30" />
        <Sparkles size={24} color="#FF3B30" />
      </View>

      {/* Message Text */}
      <Text style={{
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 24, // Better line height for readability
      }}>
        Pull Harder to Enter Nosh Heaven 🍽️
      </Text>

      {/* Progress Bar */}
      <View style={{
        width: 200,
        height: 4,
        backgroundColor: '#E0E0E0',
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: 12,
      }}>
        <Animated.View style={[
          {
            height: '100%',
            borderRadius: 2,
          },
          progressBarStyle
        ]} />
      </View>

      {/* Subtitle */}
      <Text style={{
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20, // Better line height for readability
      }}>
        Keep pulling to unlock the immersive experience
      </Text>
    </Animated.View>
  );
} 