import { EmotionType } from '@/utils/EmotionsUIContext';
import { MealCategory } from '@/utils/mealCategories';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { Dimensions, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming
} from 'react-native-reanimated';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface NoshMagicPortalProps {
  mood: EmotionType;
  mealChoice: MealCategory;
  onComplete: () => void;
  isActive: boolean;
}

interface ParticleProps {
  id: number;
  delay: number;
  isActive: boolean;
  color: string;
}

function Particle({ id, delay, isActive, color }: ParticleProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      // Staggered particle animation
      setTimeout(() => {
        translateX.value = withRepeat(
          withTiming(Math.random() * 200 - 100, { duration: 2000 }),
          -1,
          true
        );
        translateY.value = withRepeat(
          withTiming(Math.random() * 200 - 100, { duration: 2000 }),
          -1,
          true
        );
        scale.value = withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0.5, { duration: 1500 })
        );
        opacity.value = withSequence(
          withTiming(1, { duration: 300 }),
          withTiming(0, { duration: 1700 })
        );
        rotation.value = withRepeat(
          withTiming(360, { duration: 3000 }),
          -1,
          false
        );
      }, delay);
    } else {
      // Reset particles
      translateX.value = withTiming(0);
      translateY.value = withTiming(0);
      scale.value = withTiming(0);
      opacity.value = withTiming(0);
      rotation.value = withTiming(0);
    }
  }, [isActive, delay]);

  // Derived values for safe access
  const rotationDegrees = useDerivedValue(() => `${rotation.value}deg`);
  const currentTranslateX = useDerivedValue(() => translateX.value);
  const currentTranslateY = useDerivedValue(() => translateY.value);
  const currentScale = useDerivedValue(() => scale.value);
  const currentOpacity = useDerivedValue(() => opacity.value);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: currentTranslateX.value },
        { translateY: currentTranslateY.value },
        { scale: currentScale.value },
        { rotate: rotationDegrees.value },
      ],
      opacity: currentOpacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: color,
          left: screenWidth / 2 + (id % 3 - 1) * 50,
          top: screenHeight / 2 + (id % 3 - 1) * 50,
        },
        animatedStyle,
      ]}
    />
  );
}

export function NoshMagicPortal({
  mood,
  mealChoice,
  onComplete,
  isActive,
}: NoshMagicPortalProps) {
  const portalScale = useSharedValue(0);
  const portalOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textScale = useSharedValue(0.8);

  // Generate particles
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    delay: i * 100,
    color: i % 2 === 0 ? mealChoice.color : mealChoice.secondaryColor,
  }));

  useEffect(() => {
    if (isActive) {
      // Portal entrance animation
      portalScale.value = withSpring(1, { damping: 12, stiffness: 200 });
      portalOpacity.value = withTiming(1, { duration: 500 });

      // Text animation with delay
      setTimeout(() => {
        textOpacity.value = withTiming(1, { duration: 800 });
        textScale.value = withSpring(1, { damping: 15, stiffness: 300 });
      }, 300);

      // Complete transition after animation
      setTimeout(() => {
        onComplete();
      }, 3000);
    } else {
      // Reset animations
      portalScale.value = withTiming(0, { duration: 300 });
      portalOpacity.value = withTiming(0, { duration: 300 });
      textOpacity.value = withTiming(0, { duration: 200 });
      textScale.value = withTiming(0.8, { duration: 200 });
    }
  }, [isActive, onComplete]);

  // Derived values for portal animations
  const currentPortalScale = useDerivedValue(() => portalScale.value);
  const currentPortalOpacity = useDerivedValue(() => portalOpacity.value);
  const currentTextOpacity = useDerivedValue(() => textOpacity.value);
  const currentTextScale = useDerivedValue(() => textScale.value);

  const portalStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: currentPortalScale.value }],
      opacity: currentPortalOpacity.value,
    };
  });

  const textStyle = useAnimatedStyle(() => {
    return {
      opacity: currentTextOpacity.value,
      transform: [{ scale: currentTextScale.value }],
    };
  });

  if (!isActive) return null;

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 1000,
      }}
    >
      {/* Particles */}
      {particles.map((particle) => (
        <Particle
          key={particle.id}
          id={particle.id}
          delay={particle.delay}
          isActive={isActive}
          color={particle.color}
        />
      ))}

      {/* Magic Portal */}
      <Animated.View style={[portalStyle]}>
        <LinearGradient
          colors={[mealChoice.color, mealChoice.secondaryColor, mealChoice.color]}
          style={{
            width: 200,
            height: 200,
            borderRadius: 100,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: mealChoice.color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 30,
            elevation: 15,
          }}
        >
          <Text style={{ fontSize: 60 }}>✨</Text>
        </LinearGradient>
      </Animated.View>

      {/* Portal Text */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: screenHeight * 0.3,
            alignItems: 'center',
          },
          textStyle,
        ]}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: '700',
            color: 'white',
            textAlign: 'center',
            marginBottom: 8,
          }}
        >
          Consulting The Nosh Oracle...
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: 'rgba(255, 255, 255, 0.8)',
            textAlign: 'center',
          }}
        >
          {`Feeling ${mood}? Let's find the perfect ${mealChoice.label.toLowerCase()} for you!`}
        </Text>
      </Animated.View>

      {/* Swirling effect around portal */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 250,
          height: 250,
          borderRadius: 125,
          borderWidth: 2,
          borderColor: mealChoice.secondaryColor,
          borderStyle: 'dashed',
          opacity: 0.3,
        }}
      />
    </View>
  );
} 