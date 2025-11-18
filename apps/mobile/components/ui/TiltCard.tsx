import React, { useMemo } from 'react';
import { ViewProps } from 'react-native';
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useDeviceMotion } from '../../hooks/useDeviceMotion';

interface TiltCardProps extends ViewProps {
  children: React.ReactNode;
  intensity?: number;
  enabled?: boolean;
  springConfig?: {
    damping: number;
    stiffness: number;
    mass: number;
  };
}

export function TiltCard({
  children,
  intensity = 8,
  enabled = true,
  springConfig = {
    damping: 15,
    stiffness: 150,
    mass: 0.8,
  },
  style,
  ...props
}: TiltCardProps) {
  const { data: motionData, isAvailable } = useDeviceMotion({
    enabled,
    sensitivity: 0.3,
    updateInterval: 16,
  });

  // Shared values for smooth animations
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);
  const scale = useSharedValue(1);

  // Update tilt values based on device motion
  React.useEffect(() => {
    if (!enabled || !isAvailable || !motionData) {
      // Reset to neutral position when disabled
      tiltX.value = withSpring(0, springConfig);
      tiltY.value = withSpring(0, springConfig);
      scale.value = withSpring(1, springConfig);
      return;
    }

    // Extract rotation data
    const { beta, gamma } = motionData.rotation;
    
    // Convert device rotation to tilt angles
    // Beta is front-to-back tilt (X-axis rotation)
    // Gamma is left-to-right tilt (Y-axis rotation)
    const newTiltX = interpolate(
      beta || 0,
      [-45, 45],
      [-intensity, intensity],
      Extrapolate.CLAMP
    );
    
    const newTiltY = interpolate(
      gamma || 0,
      [-45, 45],
      [-intensity, intensity],
      Extrapolate.CLAMP
    );

    // Apply spring animations for smooth transitions
    tiltX.value = withSpring(newTiltX, springConfig);
    tiltY.value = withSpring(newTiltY, springConfig);
    
    // Subtle scale effect based on movement intensity
    const movementIntensity = Math.abs(beta || 0) + Math.abs(gamma || 0);
    const newScale = interpolate(
      movementIntensity,
      [0, 30],
      [1, 1.02],
      Extrapolate.CLAMP
    );
    scale.value = withSpring(newScale, springConfig);
  }, [motionData, enabled, isAvailable, intensity, springConfig, tiltX, tiltY, scale]);

  // Derived values for string interpolation
  const tiltXDegrees = useDerivedValue(() => `${tiltX.value}deg`);
  const tiltYDegrees = useDerivedValue(() => `${tiltY.value}deg`);

  // Animated style for the tilt effect - use shared values directly (safe in worklet context)
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { perspective: 1000 },
        { rotateX: tiltXDegrees.value },
        { rotateY: tiltYDegrees.value },
        { scale: scale.value },
      ],
    };
  }, []);

  // Memoize the component to prevent unnecessary re-renders
  const TiltCardComponent = useMemo(() => {
    return (
      <Animated.View
        style={[
          {
            // Ensure the card maintains its original styling
            transform: [{ perspective: 1000 }],
          },
          animatedStyle,
          style,
        ]}
        {...props}
      >
        {children}
      </Animated.View>
    );
  }, [children, animatedStyle, style, props]);

  return TiltCardComponent;
} 