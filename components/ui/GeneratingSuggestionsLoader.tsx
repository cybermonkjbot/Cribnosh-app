import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import Animated, {
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

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
  const hasCompleted = useRef(false);

  useEffect(() => {
    if (isVisible && !hasCompleted.current) {
      startLoadingSequence();
    }
  }, [isVisible]);

  const startLoadingSequence = () => {
    hasCompleted.current = false;
    currentStep.value = 0;
    fadeOpacity.value = withTiming(1, { duration: 300 });
    
    // Start shimmer animation
    shimmerOpacity.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      true
    );

    // Progress through each step
    const stepDuration = 1500;
    LOADING_STEPS.forEach((_, index) => {
      setTimeout(() => {
        if (hasCompleted.current) return;
        
        currentStep.value = index;
        
        // If this is the last step, complete after its duration
        if (index === LOADING_STEPS.length - 1) {
          setTimeout(() => {
            if (hasCompleted.current) return;
            completeLoading();
          }, stepDuration);
        }
      }, index * stepDuration);
    });
  };

  const completeLoading = () => {
    if (hasCompleted.current) return;
    hasCompleted.current = true;
    
    // Final completion animation
    fadeOpacity.value = withTiming(0, { duration: 300 }, () => {
      runOnJS(onComplete)();
    });
  };

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

  const skeletonOpacityInterpolated = useAnimatedStyle(() => {
    return {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      opacity: interpolate(
        shimmerOpacity.value,
        [0.3, 1, 0.3],
        [0.3, 0.6, 0.3]
      ),
    };
  });

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeOpacity.value,
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
            {/* Header Skeleton - mimics AIChatDrawer header */}
            <View style={styles.headerSkeleton}>
              {/* Close button skeleton */}
              <Animated.View style={[styles.closeButtonSkeleton, skeletonOpacityInterpolated]} />
              
              {/* Logo skeleton */}
              <Animated.View style={[styles.logoSkeleton, skeletonOpacityInterpolated]} />
            </View>

            {/* Messages Skeleton - mimics AIChatDrawer message structure */}
            <View style={styles.messagesContainer}>
              {/* User message skeleton */}
              <View style={styles.userMessageSkeleton}>
                <View style={styles.userMessageBubbleSkeleton}>
                  <Animated.View style={[styles.messageTextSkeleton, skeletonOpacityInterpolated]} />
                  <Animated.View style={[styles.messageTextSkeleton, styles.messageTextShortSkeleton, skeletonOpacityInterpolated]} />
                </View>
                <Animated.View style={[styles.avatarSkeleton, skeletonOpacityInterpolated]} />
              </View>

              {/* AI message skeleton */}
              <View style={styles.aiMessageSkeleton}>
                <Animated.View style={[styles.aiAvatarSkeleton, skeletonOpacityInterpolated]} />
                <View style={styles.aiMessageContentSkeleton}>
                  <Animated.View style={[styles.messageTextSkeleton, skeletonOpacityInterpolated]} />
                  <Animated.View style={[styles.messageTextSkeleton, styles.messageTextShortSkeleton, skeletonOpacityInterpolated]} />
                  <Animated.View style={[styles.messageTextSkeleton, styles.messageTextShortSkeleton, skeletonOpacityInterpolated]} />
                </View>
              </View>

              {/* AI message with products skeleton */}
              <View style={styles.aiMessageSkeleton}>
                <Animated.View style={[styles.aiAvatarSkeleton, skeletonOpacityInterpolated]} />
                <View style={styles.aiMessageContentSkeleton}>
                  <Animated.View style={[styles.messageTextSkeleton, skeletonOpacityInterpolated]} />
                  
                  {/* Products skeleton */}
                  <View style={styles.productsSkeleton}>
                    <Animated.View style={[styles.productCardSkeleton, skeletonOpacityInterpolated]} />
                    <Animated.View style={[styles.productCardSkeleton, skeletonOpacityInterpolated]} />
                    <Animated.View style={[styles.productCardSkeleton, skeletonOpacityInterpolated]} />
                  </View>
                  
                  <Animated.View style={[styles.messageTextSkeleton, skeletonOpacityInterpolated]} />
                </View>
              </View>
            </View>

            {/* Chat Input Skeleton - mimics AIChatDrawer input */}
            <View style={styles.chatInputSkeleton}>
              <Animated.View style={[styles.inputFieldSkeleton, skeletonOpacityInterpolated]} />
              <Animated.View style={[styles.sendButtonSkeleton, skeletonOpacityInterpolated]} />
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
  headerSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 32,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  closeButtonSkeleton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  logoSkeleton: {
    width: 120,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  messagesContainer: {
    width: '100%',
    marginBottom: 32,
  },
  userMessageSkeleton: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  userMessageBubbleSkeleton: {
    maxWidth: '80%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    minWidth: 120,
  },
  aiMessageSkeleton: {
    marginBottom: 24,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  aiAvatarSkeleton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 12,
  },
  aiMessageContentSkeleton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 150,
  },
  messageTextSkeleton: {
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    marginBottom: 8,
    width: '100%',
  },
  messageTextShortSkeleton: {
    width: '70%',
  },
  avatarSkeleton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  productsSkeleton: {
    flexDirection: 'row',
    marginVertical: 16,
    gap: 12,
  },
  productCardSkeleton: {
    width: 140,
    height: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 12,
  },
  chatInputSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  inputFieldSkeleton: {
    flex: 1,
    height: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    paddingHorizontal: 16,
  },
  sendButtonSkeleton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
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
    marginTop: 8,
  },
});
