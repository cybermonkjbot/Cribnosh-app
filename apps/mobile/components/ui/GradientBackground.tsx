import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

interface GradientBackgroundProps {
  children: React.ReactNode;
  colors?: string[];
  style?: ViewStyle;
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  animated?: boolean;
}

export const GradientBackground: React.FC<GradientBackgroundProps> = ({
  children,
  colors = ['#FFF5F5', '#F3E8FF', '#FFE8D6'],
  style,
  start = { x: 0, y: 0 },
  end = { x: 0, y: 1 },
  animated = true,
}) => {
  const floatingValue = useSharedValue(0);

  useEffect(() => {
    if (animated) {
      // Create floating animation for subtle motion
      floatingValue.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 6000 }),
          withTiming(0, { duration: 6000 })
        ),
        -1,
        false
      );
    }
  }, [animated]);



  // Use static gradient for now since animated gradients have type issues
  const gradientStart = start;
  const gradientEnd = end;

  const particle1Style = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: floatingValue.value * -10 }],
    };
  });

  const particle2Style = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: floatingValue.value * -15 }],
    };
  });

  const particle3Style = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: floatingValue.value * -8 }],
    };
  });

  const particle4Style = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: floatingValue.value * -12 }],
    };
  });

  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={colors as any}
        style={styles.gradient}
        start={gradientStart}
        end={gradientEnd}
      >
        {/* Floating particles for subtle motion */}
        {animated && (
          <>
            <Animated.View
              style={[
                styles.floatingParticle,
                styles.particle1,
                particle1Style,
              ]}
            />
            <Animated.View
              style={[
                styles.floatingParticle,
                styles.particle2,
                particle2Style,
              ]}
            />
            <Animated.View
              style={[
                styles.floatingParticle,
                styles.particle3,
                particle3Style,
              ]}
            />
            <Animated.View
              style={[
                styles.floatingParticle,
                styles.particle4,
                particle4Style,
              ]}
            />
          </>
        )}
        {children}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  floatingParticle: {
    position: 'absolute',
    borderRadius: 50,
    opacity: 0.1,
  },
  particle1: {
    width: 120,
    height: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    top: '20%',
    right: '10%',
  },
  particle2: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(147, 51, 234, 0.15)',
    top: '60%',
    left: '5%',
  },
  particle3: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(255, 218, 185, 0.25)',
    top: '40%',
    right: '20%',
  },
  particle4: {
    width: 100,
    height: 100,
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    top: '80%',
    right: '30%',
  },
}); 