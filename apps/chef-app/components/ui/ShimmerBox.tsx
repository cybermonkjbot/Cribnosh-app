import { useEffect } from 'react';
import { View, ViewStyle } from 'react-native';
import Animated, {
    interpolate,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

interface SkeletonBoxProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  isVisible?: boolean;
}

export function SkeletonBox({
  width,
  height,
  borderRadius = 4,
  style,
  isVisible = true,
}: SkeletonBoxProps) {
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

  const shimmerOpacityInterpolated = useDerivedValue(() => {
    return interpolate(
      shimmerOpacity.value,
      [0.3, 1, 0.3],
      [0.3, 0.7, 0.3]
    );
  });

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: shimmerOpacityInterpolated.value,
  }));

  const baseStyle: ViewStyle = {
    width: width as ViewStyle['width'],
    height,
    borderRadius,
    backgroundColor: 'rgba(156, 163, 175, 0.3)',
  };

  // Use regular View for percentage widths, Animated.View for numeric widths
  if (typeof width === 'string') {
    return (
      <View style={[baseStyle, style, { overflow: 'hidden' }]}>
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(156, 163, 175, 0.3)',
              borderRadius,
            },
            animatedStyle,
          ]}
        />
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        baseStyle,
        animatedStyle,
        style,
      ]}
    />
  );
}

