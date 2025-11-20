import React, { useEffect } from 'react';
import { Dimensions, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface MealVideoCardSkeletonProps {
  isVisible?: boolean;
}

export function MealVideoCardSkeleton({ isVisible = true }: MealVideoCardSkeletonProps) {
  const shimmerOpacity = useSharedValue(0.3);

  useEffect(() => {
    if (isVisible) {
      shimmerOpacity.value = withRepeat(
        withTiming(1, { duration: 1500 }),
        -1,
        true
      );
    } else {
      shimmerOpacity.value = withTiming(0.3, { duration: 300 });
    }
  }, [isVisible]);

  // Derived values for safe access
  const shimmerOpacityInterpolated = useDerivedValue(() => {
    return interpolate(
      shimmerOpacity.value,
      [0.3, 1, 0.3],
      [0.3, 0.7, 0.3]
    );
  });

  const skeletonOpacityInterpolated = useDerivedValue(() => {
    return interpolate(
      shimmerOpacity.value,
      [0.3, 1, 0.3],
      [0.3, 0.6, 0.3]
    );
  });

  const shimmerStyle = useAnimatedStyle(() => {
    return {
      opacity: shimmerOpacityInterpolated.value,
    };
  });

  const skeletonStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: '#333',
      opacity: skeletonOpacityInterpolated.value,
    };
  });

  if (!isVisible) return null;

  return (
    <View style={{
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
      backgroundColor: '#000',
      position: 'relative'
    }}>
      {/* Video Background Skeleton */}
      <Animated.View style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#1a1a1a',
        },
        shimmerStyle
      ]} />

      {/* Dark Overlay Gradient Skeleton */}
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
      }} />

      {/* Right Side Actions Skeleton */}
      <View style={{
        position: 'absolute',
        right: 16,
        bottom: 120,
        alignItems: 'center',
        gap: 24,
      }}>
        {/* Kitchen Profile Skeleton */}
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Animated.View style={[
            {
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderWidth: 2,
              borderColor: 'rgba(255, 255, 255, 0.2)',
            },
            skeletonStyle
          ]} />
          <Animated.View style={[
            {
              width: 40,
              height: 12,
              borderRadius: 6,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
            },
            skeletonStyle
          ]} />
        </View>

        {/* Like Button Skeleton */}
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Animated.View style={[
            {
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.2)',
            },
            skeletonStyle
          ]} />
          <Animated.View style={[
            {
              width: 20,
              height: 12,
              borderRadius: 6,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
            },
            skeletonStyle
          ]} />
        </View>

        {/* Comment Button Skeleton */}
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Animated.View style={[
            {
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.2)',
            },
            skeletonStyle
          ]} />
          <Animated.View style={[
            {
              width: 20,
              height: 12,
              borderRadius: 6,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
            },
            skeletonStyle
          ]} />
        </View>

        {/* Share Button Skeleton */}
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Animated.View style={[
            {
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.2)',
            },
            skeletonStyle
          ]} />
          <Animated.View style={[
            {
              width: 30,
              height: 12,
              borderRadius: 6,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
            },
            skeletonStyle
          ]} />
        </View>
      </View>

      {/* Bottom Content Skeleton */}
      <View style={{
        position: 'absolute',
        bottom: 120,
        left: 16,
        right: 80,
      }}>
        {/* Kitchen Name Skeleton */}
        <Animated.View style={[
          {
            width: 80,
            height: 16,
            borderRadius: 8,
            backgroundColor: 'rgba(255, 59, 48, 0.3)',
            marginBottom: 4,
          },
          skeletonStyle
        ]} />

        {/* Meal Title Skeleton */}
        <Animated.View style={[
          {
            width: '70%',
            height: 28,
            borderRadius: 8,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            marginBottom: 8,
          },
          skeletonStyle
        ]} />

        {/* Description Skeleton */}
        <View style={{ marginBottom: 16 }}>
          <Animated.View style={[
            {
              width: '100%',
              height: 14,
              borderRadius: 7,
              backgroundColor: 'rgba(224, 224, 224, 0.2)',
              marginBottom: 6,
            },
            skeletonStyle
          ]} />
          <Animated.View style={[
            {
              width: '60%',
              height: 14,
              borderRadius: 7,
              backgroundColor: 'rgba(224, 224, 224, 0.2)',
            },
            skeletonStyle
          ]} />
        </View>

        {/* Price and Order Button Skeleton */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Price Skeleton */}
          <Animated.View style={[
            {
              width: 60,
              height: 24,
              borderRadius: 12,
              backgroundColor: 'rgba(255, 59, 48, 0.3)',
            },
            skeletonStyle
          ]} />

          {/* Order Button Skeleton */}
          <Animated.View style={[
            {
              width: 100,
              height: 36,
              borderRadius: 18,
              backgroundColor: 'rgba(255, 59, 48, 0.3)',
            },
            skeletonStyle
          ]} />
        </View>
      </View>
    </View>
  );
} 