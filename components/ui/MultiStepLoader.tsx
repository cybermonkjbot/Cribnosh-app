import { BlurView } from 'expo-blur';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';
import { Mascot } from '../Mascot';

// Check Icon Components with Cribnosh styling
const CheckIcon = ({ size = 24, color = '#FF3B30' }: { size?: number; color?: string }) => {
  return (
    <View style={[styles.iconContainer, { width: size, height: size }]}>
      <Text style={{ color, fontSize: size * 0.6, fontWeight: 'bold' }}>○</Text>
    </View>
  );
};

const CheckFilled = ({ size = 24, color = '#FF3B30' }: { size?: number; color?: string }) => {
  return (
    <View style={[styles.iconContainer, { width: size, height: size }]}>
      <Text style={{ color, fontSize: size * 0.6, fontWeight: 'bold' }}>●</Text>
    </View>
  );
};

type LoadingState = {
  text: string;
  emotion: 'excited' | 'hungry' | 'satisfied' | 'happy' | 'default';
};

interface LoaderCoreProps {
  loadingStates: LoadingState[];
  value: number;
}

const LoaderCore: React.FC<LoaderCoreProps> = ({ loadingStates, value }) => {
  // Validate inputs
  const safeLoadingStates = useMemo(() => {
    if (!Array.isArray(loadingStates) || loadingStates.length === 0) {
      return [{ text: 'Loading...', emotion: 'default' as const }];
    }
    return loadingStates.map(state => ({
      text: state.text || 'Loading...',
      emotion: state.emotion || 'default'
    }));
  }, [loadingStates]);

  const safeValue = useMemo(() => {
    const maxIndex = safeLoadingStates.length - 1;
    if (typeof value !== 'number' || isNaN(value)) return 0;
    return Math.max(0, Math.min(value, maxIndex));
  }, [value, safeLoadingStates.length]);

  const currentEmotion = useMemo(() => {
    try {
      return safeLoadingStates[safeValue]?.emotion || 'default';
    } catch (error) {
      console.warn('MultiStepLoader: Error getting emotion:', error);
      return 'default';
    }
  }, [safeLoadingStates, safeValue]);

  return (
    <View style={styles.loaderContainer}>
      {/* Mascot Section */}
      <View style={styles.mascotContainer}>
        <Mascot 
          emotion={currentEmotion} 
          size={300}
        />
      </View>

      {/* Loading States */}
      <View style={styles.statesContainer}>
        {safeLoadingStates.map((loadingState, index) => {
          try {
            const distance = Math.abs(index - safeValue);
            const opacity = Math.max(1 - distance * 0.3, 0);

            return (
              <Animated.View
                key={`loading-state-${index}`}
                style={[
                  styles.loadingItem,
                  {
                    opacity,
                    transform: [{ translateY: -safeValue * 20 }],
                  },
                ]}
              >
                <View style={styles.iconContainer}>
                  {index > safeValue && <CheckIcon color="#FF3B30" />}
                  {index <= safeValue && (
                    <CheckFilled
                      color={safeValue === index ? '#FF3B30' : '#FF3B30'}
                    />
                  )}
                </View>
                <Text
                  style={[
                    styles.loadingText,
                    {
                      color: safeValue === index ? '#FF3B30' : '#374151',
                      fontWeight: safeValue === index ? '600' : '400',
                    },
                  ]}
                  numberOfLines={2}
                >
                  {loadingState.text}
                </Text>
              </Animated.View>
            );
          } catch (error) {
            console.warn('MultiStepLoader: Error rendering loading state:', error);
            return null;
          }
        })}
      </View>
    </View>
  );
};

interface MultiStepLoaderProps {
  loadingStates: LoadingState[];
  loading?: boolean;
  duration?: number;
  loop?: boolean;
}

export const MultiStepLoader: React.FC<MultiStepLoaderProps> = ({
  loadingStates,
  loading = false,
  duration = 2000,
  loop = true,
}) => {
  const [currentState, setCurrentState] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const opacity = useSharedValue(0);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Validate and memoize props
  const safeLoadingStates = useMemo(() => {
    if (!Array.isArray(loadingStates) || loadingStates.length === 0) {
      return [{ text: 'Loading...', emotion: 'default' as const }];
    }
    return loadingStates.map(state => ({
      text: state.text || 'Loading...',
      emotion: state.emotion || 'default'
    }));
  }, [loadingStates]);

  const safeDuration = useMemo(() => {
    const minDuration = 500;
    const maxDuration = 10000;
    if (typeof duration !== 'number' || isNaN(duration)) return 2000;
    return Math.max(minDuration, Math.min(duration, maxDuration));
  }, [duration]);

  const safeLoop = useMemo(() => {
    return typeof loop === 'boolean' ? loop : true;
  }, [loop]);

  // Safe state setter
  const safeSetCurrentState = useCallback((newState: number) => {
    try {
      const maxIndex = safeLoadingStates.length - 1;
      const safeNewState = Math.max(0, Math.min(newState, maxIndex));
      setCurrentState(safeNewState);
    } catch (error) {
      console.warn('MultiStepLoader: Error setting current state:', error);
      setCurrentState(0);
    }
  }, [safeLoadingStates.length]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Handle loading state changes
  useEffect(() => {
    cleanup();

    if (!loading) {
      setCurrentState(0);
      setIsVisible(false);
      opacity.value = withTiming(0, { duration: 300 });
      return;
    }

    setIsVisible(true);
    opacity.value = withTiming(1, { duration: 300 });

    // Set up the next state transition
    timeoutRef.current = setTimeout(() => {
      try {
        const nextState = safeLoop
          ? currentState === safeLoadingStates.length - 1
            ? 0
            : currentState + 1
          : Math.min(currentState + 1, safeLoadingStates.length - 1);
        
        safeSetCurrentState(nextState);
      } catch (error) {
        console.warn('MultiStepLoader: Error transitioning state:', error);
        safeSetCurrentState(0);
      }
    }, safeDuration);

    return cleanup;
  }, [currentState, loading, safeLoop, safeLoadingStates.length, safeDuration, opacity, safeSetCurrentState, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Derived value for safe access
  const currentOpacity = useDerivedValue(() => {
    'worklet';
    return opacity.value;
  });

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: currentOpacity.value,
    };
  });

  // Don't render if not loading
  if (!loading || !isVisible) return null;

  return (
    <Modal
      transparent
      visible={loading && isVisible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => {
        // Handle back button on Android
        console.log('MultiStepLoader: Back button pressed');
      }}
    >
      <Animated.View style={[styles.modalContainer, animatedStyle]}>
        <BlurView intensity={40} style={styles.blurContainer}>
          <View style={styles.contentContainer}>
            <LoaderCore value={currentState} loadingStates={safeLoadingStates} />
          </View>
        </BlurView>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
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
  contentContainer: {
    height: 850,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 320,
    width: '100%',
  },
  mascotContainer: {
    marginBottom: 60,
    alignItems: 'center',
  },
  statesContainer: {
    width: '100%',
    alignItems: 'flex-start',
  },
  loadingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 28,
    height: 28,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '400',
    flex: 1,
  },
}); 