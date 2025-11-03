
import { MealCategory } from '@/utils/mealCategories';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
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

const { width: screenWidth } = Dimensions.get('window');

interface GachaMealSpinnerProps {
  items: MealCategory[];
  onComplete: (selectedItem: MealCategory) => void;
  isSpinning?: boolean;
}

interface SpinnerItemProps {
  item: MealCategory;
  index: number;
  isSpinning: boolean;
  isSelected: boolean;
}

function SpinnerItem({ item, index, isSpinning, isSelected }: SpinnerItemProps) {

  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (isSpinning) {
      // Continuous spinning animation
      translateY.value = withRepeat(
        withTiming(-1000, { duration: 2000 }),
        -1,
        false
      );
      rotation.value = withRepeat(
        withTiming(360, { duration: 1000 }),
        -1,
        false
      );
    } else if (isSelected) {
      // Stop and highlight selected item
      translateY.value = withSpring(0, { damping: 15, stiffness: 300 });
      rotation.value = withSpring(0, { damping: 15, stiffness: 300 });
      scale.value = withSequence(
        withSpring(1.2, { damping: 8, stiffness: 300 }),
        withSpring(1, { damping: 12, stiffness: 500 })
      );
    }
  }, [isSpinning, isSelected]);

  // Derived values for safe access
  const currentTranslateY = useDerivedValue(() => translateY.value);
  const currentScale = useDerivedValue(() => scale.value);
  const currentRotation = useDerivedValue(() => `${rotation.value}deg`);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: currentTranslateY.value },
        { scale: currentScale.value },
        { rotate: currentRotation.value },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        {
          width: 120,
          height: 120,
          marginHorizontal: 8,
          justifyContent: 'center',
          alignItems: 'center',
        },
        animatedStyle,
      ]}
    >
      <LinearGradient
        colors={[item.color, item.secondaryColor]}
        style={{
          width: 100,
          height: 100,
          borderRadius: 50,
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: item.color,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isSelected ? 0.4 : 0.2,
          shadowRadius: 8,
          elevation: isSelected ? 8 : 4,
        }}
      >
        <Text style={{ fontSize: 40 }}>{item.emoji}</Text>
        <Text
          style={{
            fontSize: 10,
            color: 'white',
            fontWeight: '600',
            textAlign: 'center',
            marginTop: 4,
          }}
        >
          {item.label}
        </Text>
      </LinearGradient>
    </Animated.View>
  );
}

export function GachaMealSpinner({
  items,
  onComplete,
  isSpinning = false,
}: GachaMealSpinnerProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const spinDuration = useRef(3000);
  const spinTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const containerScale = useSharedValue(1);
  const containerOpacity = useSharedValue(1);

  useEffect(() => {
    if (isSpinning) {
      // Start spinning animation
      containerScale.value = withSpring(1.05, { damping: 8, stiffness: 300 });
      
      // Stop spinning after duration
      spinTimeout.current = setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * items.length);
        setSelectedIndex(randomIndex);
        setIsRevealing(true);
        
        // Call onComplete after reveal animation
        setTimeout(() => {
          onComplete(items[randomIndex]);
        }, 1000);
      }, spinDuration.current);
    } else {
      // Reset state
      setSelectedIndex(null);
      setIsRevealing(false);
      containerScale.value = withSpring(1, { damping: 15, stiffness: 300 });
    }

    return () => {
      if (spinTimeout.current) {
        clearTimeout(spinTimeout.current);
      }
    };
  }, [isSpinning, items, onComplete]);

  // Derived values for safe access
  const currentContainerScale = useDerivedValue(() => containerScale.value);

  const containerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: currentContainerScale.value }],
      opacity: containerOpacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        {
          width: screenWidth - 40,
          height: 200,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: 20,
          padding: 20,
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.2,
          shadowRadius: 16,
          elevation: 8,
        },
        containerStyle,
      ]}
    >
      {/* Spinner title */}
      <Text
        style={{
          fontSize: 18,
          fontWeight: '700',
          color: '#11181C',
          marginBottom: 20,
          textAlign: 'center',
        }}
      >
        {isSpinning ? '🎰 Spinning for your perfect nosh...' : '🎯 Your Nosh Awaits!'}
      </Text>

      {/* Spinner items container */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          height: 120,
          overflow: 'hidden',
        }}
      >
        {items.map((item, index) => (
          <SpinnerItem
            key={item.id}
            item={item}
            index={index}
            isSpinning={isSpinning}
            isSelected={selectedIndex === index && isRevealing}
          />
        ))}
      </View>

      {/* Reveal message */}
      {isRevealing && selectedIndex !== null && (
        <Animated.View
          style={{
            position: 'absolute',
            bottom: 20,
            backgroundColor: items[selectedIndex].color,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
          }}
        >
          <Text
            style={{
              color: 'white',
              fontSize: 14,
              fontWeight: '600',
              textAlign: 'center',
            }}
          >
            🎉 {items[selectedIndex].label} it is!
          </Text>
        </Animated.View>
      )}
    </Animated.View>
  );
} 