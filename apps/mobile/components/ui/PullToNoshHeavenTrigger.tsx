import { Sparkles, Utensils } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import AnimatedReanimated, {
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
} from 'react-native-reanimated';

interface PullToNoshHeavenTriggerProps {
  isVisible: boolean;
  onTrigger: () => void;
  pullProgress?: SharedValue<number>;
}

export function PullToNoshHeavenTrigger({
  isVisible,
  onTrigger,
  pullProgress,
}: PullToNoshHeavenTriggerProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      // Fade in when becoming visible
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      // Fade out when becoming invisible
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible, fadeAnim]);

  // Derived value for progress
  const progressValue = useDerivedValue(() => {
    return pullProgress?.value || 0;
  }, [pullProgress]);

  // Animated styles for icons and text based on progress
  const iconScale = useAnimatedStyle(() => {
    const scale = 1 + (progressValue.value * 0.2);
    return {
      transform: [{ scale }],
    };
  });

  const textStyle = useAnimatedStyle(() => {
    const opacity = 0.3 + (progressValue.value * 0.7);
    return {
      opacity,
    };
  });

  const progressBarStyle = useAnimatedStyle(() => {
    const width = progressValue.value * 100;
    return {
      width: `${width}%`,
    };
  });

  const iconOpacity = useAnimatedStyle(() => {
    const opacity = 0.5 + (progressValue.value * 0.5);
    return {
      opacity,
    };
  });

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        paddingHorizontal: 20,
      }}
      pointerEvents={isVisible ? 'auto' : 'none'}
    >
      {/* Icons with progress-based animation */}
      <AnimatedReanimated.View
        style={[
          {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            paddingHorizontal: 16,
          },
          iconScale,
          iconOpacity,
        ]}
      >
        <Utensils size={20} color="#666" />
        <FoodCreatorHat size={20} color="#666" />
        <Sparkles size={20} color="#666" />
      </AnimatedReanimated.View>

      {/* Message text with progress-based opacity */}
      <AnimatedReanimated.View
        style={[
          {
            marginBottom: 12,
          },
          textStyle,
        ]}
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: '600',
            color: '#666',
            textAlign: 'center',
            lineHeight: 22,
          }}
        >
          Pull Harder to Enter Nosh Heaven
        </Text>
      </AnimatedReanimated.View>

      {/* Progress bar */}
      {pullProgress && (
        <View
          style={{
            width: 200,
            height: 4,
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <AnimatedReanimated.View
            style={[
              {
                height: '100%',
                backgroundColor: '#ef4444',
                borderRadius: 2,
              },
              progressBarStyle,
            ]}
          />
        </View>
      )}
    </Animated.View>
  );
} 