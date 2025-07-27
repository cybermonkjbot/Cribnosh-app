import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';

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
  const animatedValue = useRef(new Animated.Value(0)).current;
  const floatingValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      // Create a continuous animation for the gradient
      const gradientAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 8000,
            useNativeDriver: false,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 8000,
            useNativeDriver: false,
          }),
        ])
      );

      // Create floating animation for subtle motion
      const floatingAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(floatingValue, {
            toValue: 1,
            duration: 6000,
            useNativeDriver: true,
          }),
          Animated.timing(floatingValue, {
            toValue: 0,
            duration: 6000,
            useNativeDriver: true,
          }),
        ])
      );

      gradientAnimation.start();
      floatingAnimation.start();

      return () => {
        gradientAnimation.stop();
        floatingAnimation.stop();
      };
    }
  }, [animated]);

  const animatedStart = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [start.x, start.x + 0.1],
  });

  const animatedEnd = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [end.x, end.x + 0.1],
  });

  // Use static gradient for now since animated gradients have type issues
  const gradientStart = start;
  const gradientEnd = end;

  const floatingTranslateY = floatingValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
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
                {
                  transform: [{ translateY: floatingTranslateY }],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.floatingParticle,
                styles.particle2,
                {
                  transform: [{ translateY: floatingTranslateY.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -15],
                  }) }],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.floatingParticle,
                styles.particle3,
                {
                  transform: [{ translateY: floatingTranslateY.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -8],
                  }) }],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.floatingParticle,
                styles.particle4,
                {
                  transform: [{ translateY: floatingTranslateY.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -12],
                  }) }],
                },
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