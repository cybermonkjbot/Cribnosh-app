import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

interface InlineAILoaderProps {
  isVisible: boolean;
}

const COLORS = {
  red: '#dc2626', // CribNosh red
  gray: {
    500: '#6B7280',
    600: '#374151',
  },
};

export const InlineAILoader: React.FC<InlineAILoaderProps> = ({ isVisible }) => {
  const shimmerOpacity = useSharedValue(0.3);
  const fadeOpacity = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      // Fade in
      fadeOpacity.value = withTiming(1, { duration: 300 });
      
      // Start shimmer animation
      shimmerOpacity.value = withRepeat(
        withTiming(1, { duration: 1500 }),
        -1,
        true
      );
    } else {
      // Fade out
      fadeOpacity.value = withTiming(0, { duration: 200 });
      cancelAnimation(shimmerOpacity);
    }

    return () => {
      cancelAnimation(shimmerOpacity);
      cancelAnimation(fadeOpacity);
    };
  }, [isVisible, shimmerOpacity, fadeOpacity]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeOpacity.value,
  }));

  const dotStyle = useAnimatedStyle(() => ({
    opacity: shimmerOpacity.value,
  }));

  if (!isVisible) return null;

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <View style={styles.content}>
        <ActivityIndicator size="small" color={COLORS.red} style={styles.spinner} />
        <Text style={styles.text}>Generating suggestions...</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  spinner: {
    marginRight: 12,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[600],
  },
});

