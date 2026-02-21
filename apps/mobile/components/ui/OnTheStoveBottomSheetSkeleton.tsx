import { useEffect } from 'react';
import { Dimensions, View } from 'react-native';
import Animated, {
    interpolate,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DRAWER_HEIGHT = Math.min(SCREEN_HEIGHT * 0.85, 600);
const COLLAPSED_HEIGHT = 200;

interface OnTheStoveBottomSheetSkeletonProps {
  isVisible?: boolean;
  isExpanded?: boolean;
}

export function OnTheStoveBottomSheetSkeleton({ 
  isVisible = true, 
  isExpanded = false 
}: OnTheStoveBottomSheetSkeletonProps) {
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
      backgroundColor: '#E0E0E0',
      opacity: skeletonOpacityInterpolated.value,
    };
  });

  if (!isVisible) return null;

  return (
    <View style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: isExpanded ? DRAWER_HEIGHT : COLLAPSED_HEIGHT,
      backgroundColor: 'rgba(250, 255, 250, 0.9)',
      borderTopLeftRadius: 35,
      borderTopRightRadius: 35,
      paddingHorizontal: 20,
      paddingTop: 20,
    }}>
      {/* Title with Sparkles Icon Skeleton */}
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: 16 
      }}>
        {/* Title Skeleton */}
        <Animated.View style={[
          {
            flex: 1,
            height: 36,
            borderRadius: 8,
            backgroundColor: 'rgba(9, 67, 39, 0.2)',
            marginRight: 16,
          },
          skeletonStyle
        ]} />
        
        {/* Sparkles Icon Skeleton */}
        <Animated.View style={[
          {
            width: 35,
            height: 32,
            borderRadius: 8,
            backgroundColor: 'rgba(9, 67, 39, 0.2)',
          },
          skeletonStyle
        ]} />
      </View>

      {/* Description Skeleton */}
      <View style={{ marginBottom: 24 }}>
        <Animated.View style={[
          {
            width: '100%',
            height: 17,
            borderRadius: 8,
            backgroundColor: 'rgba(9, 67, 39, 0.15)',
            marginBottom: 8,
          },
          skeletonStyle
        ]} />
        <Animated.View style={[
          {
            width: '90%',
            height: 17,
            borderRadius: 8,
            backgroundColor: 'rgba(9, 67, 39, 0.15)',
            marginBottom: 8,
          },
          skeletonStyle
        ]} />
        <Animated.View style={[
          {
            width: '75%',
            height: 17,
            borderRadius: 8,
            backgroundColor: 'rgba(9, 67, 39, 0.15)',
            marginBottom: 8,
          },
          skeletonStyle
        ]} />
        <Animated.View style={[
          {
            width: '60%',
            height: 17,
            borderRadius: 8,
            backgroundColor: 'rgba(9, 67, 39, 0.15)',
          },
          skeletonStyle
        ]} />
      </View>

      {/* Compact Meal Selection Skeleton */}
      <View style={{ marginBottom: 24 }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.6)',
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: 'rgba(9, 67, 39, 0.1)',
        }}>
          {/* Image Skeleton */}
          <Animated.View style={[
            {
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: 'rgba(9, 67, 39, 0.1)',
              marginRight: 16,
            },
            skeletonStyle
          ]} />
          
          {/* Content Skeleton */}
          <View style={{ flex: 1, marginRight: 16 }}>
            {/* Title Skeleton */}
            <Animated.View style={[
              {
                width: '80%',
                height: 18,
                borderRadius: 9,
                backgroundColor: 'rgba(9, 67, 39, 0.15)',
                marginBottom: 8,
              },
              skeletonStyle
            ]} />
            
            {/* Price Skeleton */}
            <Animated.View style={[
              {
                width: 50,
                height: 16,
                borderRadius: 8,
                backgroundColor: 'rgba(9, 67, 39, 0.15)',
              },
              skeletonStyle
            ]} />
          </View>
          
          {/* Quantity Controls Skeleton - IncrementalOrderAmount (Order Button) */}
          <Animated.View style={[
            {
              width: 79,
              height: 36,
              borderRadius: 10,
              backgroundColor: 'rgba(9, 67, 39, 0.2)',
            },
            skeletonStyle
          ]} />
        </View>
      </View>

      {/* Action Buttons Skeleton */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
        {/* Share Live Button Skeleton */}
        <Animated.View style={[
          {
            flex: 1,
            height: 35,
            borderRadius: 17.5,
            backgroundColor: 'rgba(9, 67, 39, 0.2)',
          },
          skeletonStyle
        ]} />

        {/* Treat Someone Button Skeleton */}
        <Animated.View style={[
          {
            flex: 1,
            height: 35,
            borderRadius: 17.5,
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
          },
          skeletonStyle
        ]} />
      </View>

      {/* Expanded Content Skeleton (only show when expanded) */}
      {isExpanded && (
        <View>
          {/* Additional content skeleton for expanded state */}
          <View style={{ marginBottom: 20 }}>
            <Animated.View style={[
              {
                width: '70%',
                height: 16,
                borderRadius: 8,
                backgroundColor: 'rgba(9, 67, 39, 0.1)',
                marginBottom: 12,
              },
              skeletonStyle
            ]} />
            
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Animated.View style={[
                {
                  width: 80,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: 'rgba(9, 67, 39, 0.1)',
                },
                skeletonStyle
              ]} />
              
              <Animated.View style={[
                {
                  width: 100,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: 'rgba(9, 67, 39, 0.1)',
                },
                skeletonStyle
              ]} />
            </View>
          </View>
          
          {/* Food Creator Bio Skeleton */}
          <View style={{ marginBottom: 20 }}>
            <Animated.View style={[
              {
                width: '100%',
                height: 16,
                borderRadius: 8,
                backgroundColor: 'rgba(9, 67, 39, 0.1)',
                marginBottom: 8,
              },
              skeletonStyle
            ]} />
            <Animated.View style={[
              {
                width: '85%',
                height: 16,
                borderRadius: 8,
                backgroundColor: 'rgba(9, 67, 39, 0.1)',
              },
              skeletonStyle
            ]} />
          </View>
        </View>
      )}
    </View>
  );
}
