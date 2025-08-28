import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet } from 'react-native';
import { CribNoshLogo } from './ui/CribNoshLogo';

const { width, height } = Dimensions.get('window');

interface AnimatedSplashScreenProps {
  onAnimationComplete?: () => void;
  duration?: number;
}

export const AnimatedSplashScreen: React.FC<AnimatedSplashScreenProps> = ({
  onAnimationComplete,
  duration = 3000
}) => {
  const backgroundColorAnim = useRef(new Animated.Value(0)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.8)).current;
  const logoOpacityAnim = useRef(new Animated.Value(0)).current;


  useEffect(() => {
    // Small delay to ensure seamless blending with Expo splash
    const timer = setTimeout(() => {
      // Start logo entrance animation
      Animated.parallel([
        Animated.timing(logoOpacityAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: false,
        }),
        Animated.spring(logoScaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: false,
        }),
      ]).start();
    }, 100);

    // Start background color cycling animation
    Animated.timing(backgroundColorAnim, {
      toValue: 1,
      duration: duration,
      useNativeDriver: false,
    }).start(() => {
      // Use requestAnimationFrame to ensure callback is called after render cycle
      if (onAnimationComplete) {
        requestAnimationFrame(() => {
          onAnimationComplete();
        });
      }
    });

    return () => {
      clearTimeout(timer);
    };
  }, [duration, onAnimationComplete, logoOpacityAnim, logoScaleAnim, backgroundColorAnim]);

  // Create interpolated background color using RGB values for better compatibility
  const backgroundColor = backgroundColorAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['rgb(255, 255, 255)', 'rgb(44, 44, 44)', 'rgb(220, 38, 38)'],
  });

  return (
    <Animated.View 
      style={[
        styles.container,
        { backgroundColor }
      ]}
    >
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacityAnim,
            transform: [{ scale: logoScaleAnim }],
          },
        ]}
      >
        <CribNoshLogo 
          size={250} 
          variant="default"
        />
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AnimatedSplashScreen;
