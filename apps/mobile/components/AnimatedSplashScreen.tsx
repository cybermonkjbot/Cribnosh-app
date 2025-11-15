import React, { useEffect } from "react";
import { Dimensions, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  useDerivedValue,
  interpolate,
  withTiming,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { CribNoshLogo } from "./ui/CribNoshLogo";

const { width, height } = Dimensions.get("window");

interface AnimatedSplashScreenProps {
  onAnimationComplete?: () => void;
  duration?: number;
}

export const AnimatedSplashScreen: React.FC<AnimatedSplashScreenProps> = ({
  onAnimationComplete,
  duration = 3000,
}) => {
  const backgroundColorAnim = useSharedValue(0);
  const logoScaleAnim = useSharedValue(0.8);
  const logoOpacityAnim = useSharedValue(0.3); // Start visible to avoid white flash
  const [logoVariant, setLogoVariant] = React.useState<"default" | "white">(
    "default"
  );

  useEffect(() => {
    // Start logo entrance animation immediately (no delay)
    // Parallel animations in reanimated are just concurrent updates
    logoOpacityAnim.value = withTiming(1, { duration: 600 });
    logoScaleAnim.value = withSpring(1, {
      tension: 50,
      friction: 7,
    });

    // Start background color cycling animation
    backgroundColorAnim.value = withTiming(1, { duration }, (finished) => {
      "worklet";
      if (finished && onAnimationComplete) {
        runOnJS(onAnimationComplete)();
      }
    });
  }, [duration, onAnimationComplete]);

  // Listen to background animation changes to update logo variant
  useAnimatedReaction(
    () => backgroundColorAnim.value,
    (currentValue) => {
      "worklet";
      if (currentValue > 0.7) {
        runOnJS(setLogoVariant)("white");
      } else {
        runOnJS(setLogoVariant)("default");
      }
    }
  );

  // Create interpolated background color using RGB values for better compatibility
  // Start with dark background instead of white to avoid white flash
  const containerAnimatedStyle = useAnimatedStyle(() => {
    "worklet";
    const r = interpolate(backgroundColorAnim.value, [0, 0.5, 1], [2, 44, 220]);
    const g = interpolate(backgroundColorAnim.value, [0, 0.5, 1], [18, 44, 38]);
    const b = interpolate(backgroundColorAnim.value, [0, 0.5, 1], [10, 44, 38]);
    return {
      backgroundColor: `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`,
    };
  });

  const logoAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: logoOpacityAnim.value,
      transform: [{ scale: logoScaleAnim.value }],
    };
  });

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
        <CribNoshLogo size={250} variant={logoVariant} />
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width,
    height,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
});

export default AnimatedSplashScreen;
