import { EmotionType, useEmotionsUI } from '@/utils/EmotionsUIContext';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface AnimatedMoodButtonProps {
  emotion: EmotionType;
  label: string;
  isSelected?: boolean;
  onPress: () => void;
  style?: any;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AnimatedMoodButton({
  emotion,
  label,
  isSelected = false,
  onPress,
  style,
}: AnimatedMoodButtonProps) {
  const { getEmotionConfig, getPersonalityStyle } = useEmotionsUI();
  const emotionConfig = getEmotionConfig(emotion);
  const personalityStyle = getPersonalityStyle(emotion);

  // Animation values
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  // Derived values for string interpolation and calculations
  const currentRotation = useDerivedValue(() => `${rotation.value}deg`);
  const currentGlowScale = useDerivedValue(() => interpolate(glowOpacity.value, [0, 1], [0.8, 1.2]));

  // Animated styles - use shared values directly (safe in worklet context)
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { rotate: currentRotation.value },
      ],
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    return {
      opacity: glowOpacity.value,
      transform: [
        { scale: currentGlowScale.value },
      ],
    };
  });

  const handlePress = () => {
    // Bounce animation sequence
    scale.value = withSequence(
      withSpring(1.2, { damping: 8, stiffness: 300 }),
      withSpring(0.95, { damping: 10, stiffness: 400 }),
      withSpring(1, { damping: 12, stiffness: 500 })
    );

    // Rotation animation
    rotation.value = withSequence(
      withTiming(-5, { duration: 100 }),
      withTiming(5, { duration: 100 }),
      withTiming(0, { duration: 100 })
    );

    // Glow effect for selected state
    if (isSelected) {
      glowOpacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0.3, { duration: 300 })
      );
    }

    onPress();
  };

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  return (
    <View style={[{ alignItems: 'center' }, style]}>
      {/* Glow effect */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: emotionConfig.primaryColor,
            shadowColor: emotionConfig.primaryColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 20,
            elevation: 10,
          },
          glowStyle,
        ]}
      />
      
      {/* Main button */}
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          {
            width: 70,
            height: 70,
            borderRadius: 35,
            backgroundColor: isSelected 
              ? emotionConfig.primaryColor 
              : emotionConfig.backgroundColor,
            borderWidth: 3,
            borderColor: isSelected 
              ? emotionConfig.secondaryColor 
              : emotionConfig.primaryColor,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: emotionConfig.primaryColor,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isSelected ? 0.3 : 0.1,
            shadowRadius: 8,
            elevation: isSelected ? 8 : 4,
          },
          personalityStyle,
          animatedStyle,
        ]}
      >
        <Text style={{ fontSize: 32 }}>{emotionConfig.emoji}</Text>
      </AnimatedPressable>
      
      {/* Label */}
      <Text
        style={{
          marginTop: 8,
          fontSize: 14,
          fontWeight: isSelected ? '700' : '500',
          color: isSelected 
            ? emotionConfig.primaryColor 
            : emotionConfig.textColor,
          textAlign: 'center',
        }}
      >
        {label}
      </Text>
    </View>
  );
} 