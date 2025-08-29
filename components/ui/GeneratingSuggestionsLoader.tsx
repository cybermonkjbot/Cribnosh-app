import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import Animated, {
    cancelAnimation,
    Easing,
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';
import { Mascot } from '../Mascot';

interface GeneratingSuggestionsLoaderProps {
  isVisible: boolean;
  onComplete: () => void;
}

const LOADING_STEPS = [
  'Analyzing your preferences',
  'Scanning available options', 
  'Generating personalized suggestions',
  'Almost ready...',
];

export const GeneratingSuggestionsLoader: React.FC<GeneratingSuggestionsLoaderProps> = ({
  isVisible,
  onComplete,
}) => {
  const shimmerOpacity = useSharedValue(0.3);
  const currentStep = useSharedValue(0);
  const fadeOpacity = useSharedValue(0);
  const scaleValue = useSharedValue(0.8);
  const translateY = useSharedValue(20);
  const hasCompleted = useRef(false);
  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  const completeLoading = useCallback(() => {
    if (hasCompleted.current) return;
    hasCompleted.current = true;
    
    // Call onComplete early so the chat screen can appear while we're still animating
    runOnJS(onComplete)();
    
    // Enhanced completion animation with scale and slide
    scaleValue.value = withTiming(1.1, { duration: 200 }, () => {
      scaleValue.value = withTiming(0.8, { duration: 300 });
    });
    
    translateY.value = withTiming(-50, { duration: 300 });
    
    // Complete the visual animation after onComplete is called
    fadeOpacity.value = withTiming(0, { duration: 400 });
  }, [fadeOpacity, scaleValue, translateY, onComplete]);

  const startLoadingSequence = useCallback(() => {
    hasCompleted.current = false;
    currentStep.value = 0;
    
    // Soft reveal animation when appearing
    scaleValue.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.back(1.2)) });
    translateY.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) });
    fadeOpacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
    
    // Start shimmer animation
    shimmerOpacity.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      true
    );

    // Clear any existing timeouts
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current = [];

    // Progress through each step
    const stepDuration = 1500;
    LOADING_STEPS.forEach((_, index) => {
      const timeoutId = setTimeout(() => {
        if (hasCompleted.current) return;
        
        currentStep.value = index;
        
        // If this is the last step, complete after its duration
        if (index === LOADING_STEPS.length - 1) {
          const completionTimeout = setTimeout(() => {
            if (hasCompleted.current) return;
            completeLoading();
          }, stepDuration);
          timeoutRefs.current.push(completionTimeout);
        }
      }, index * stepDuration);
      timeoutRefs.current.push(timeoutId);
    });
  }, [currentStep, fadeOpacity, shimmerOpacity, scaleValue, translateY, completeLoading]);

  useEffect(() => {
    if (isVisible && !hasCompleted.current) {
      startLoadingSequence();
    } else if (!isVisible) {
      // Stop animations and clear timeouts when not visible
      cancelAnimation(shimmerOpacity);
      cancelAnimation(fadeOpacity);
      cancelAnimation(scaleValue);
      cancelAnimation(translateY);
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current = [];
      
      // Reset values for next appearance
      scaleValue.value = 0.8;
      translateY.value = 20;
      fadeOpacity.value = 0;
    }

    // Cleanup function
    return () => {
      cancelAnimation(shimmerOpacity);
      cancelAnimation(fadeOpacity);
      cancelAnimation(scaleValue);
      cancelAnimation(translateY);
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current = [];
    };
  }, [isVisible, startLoadingSequence, shimmerOpacity, fadeOpacity, scaleValue, translateY]);

  // Derived values for safe access
  const shimmerOpacityInterpolated = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        shimmerOpacity.value,
        [0.3, 1, 0.3],
        [0.3, 0.7, 0.3]
      ),
    };
  });

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeOpacity.value,
    transform: [
      { scale: scaleValue.value },
      { translateY: translateY.value }
    ],
  }));

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
    >
      <LinearGradient
        colors={['#f8e6f0', '#faf2e8']}
        style={styles.container}
      >
        <BlurView intensity={20} tint="light" style={styles.blurContainer}>
          <Animated.View style={[styles.content, containerAnimatedStyle]}>
            {/* Centered Mascot */}
            <View style={styles.mascotContainer}>
              <Mascot emotion="excited" size={200} />
            </View>

            {/* Loading Indicator */}
            <View style={styles.loadingIndicator}>
              <Animated.View style={[styles.loadingDot, shimmerOpacityInterpolated]} />
              <Animated.View style={[styles.loadingDot, shimmerOpacityInterpolated]} />
              <Animated.View style={[styles.loadingDot, shimmerOpacityInterpolated]} />
            </View>

            {/* Current Step Text */}
            <Text style={styles.currentStepText}>
              {LOADING_STEPS[Math.round(currentStep.value)] || LOADING_STEPS[0]}
            </Text>
          </Animated.View>
        </BlurView>
      </LinearGradient>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
    maxWidth: 400,
    width: '100%',
  },
  mascotContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#dc2626',
  },
  currentStepText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#dc2626',
    textAlign: 'center',
  },
});
