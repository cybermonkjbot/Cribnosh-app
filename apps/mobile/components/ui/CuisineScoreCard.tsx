import { ChefHat, Globe, Soup } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withDelay,
    withSequence,
    withSpring,
    withTiming
} from 'react-native-reanimated';

interface CuisineScoreCardProps {
  cuisines: string[];
  onPress?: () => void;
}

// Memoize the component to prevent unnecessary re-renders
const MemoizedCuisineScoreCard: React.FC<CuisineScoreCardProps> = React.memo(({
  cuisines = ['Nigerian', 'Italian', 'Asian Fusion', 'Mexican', 'Indian'],
  onPress,
}) => {
  const uniqueCuisines = [...new Set(cuisines)];
  const cuisineCount = uniqueCuisines.length;

  // Animation values
  const cardScale = useSharedValue(1);
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(20);
  const iconScale = useSharedValue(0.8);
  const iconRotation = useSharedValue(0);
  const scoreScale = useSharedValue(0.8);
  const tagsProgress = useSharedValue(0);
  const celebrationScale = useSharedValue(0);

  // Derived values for safe access in JSX
  const currentTagsProgress = useDerivedValue(() => tagsProgress.value);
  const currentTagsOpacity = useDerivedValue(() => currentTagsProgress.value);
  const currentTagsTranslateX = useDerivedValue(() => (1 - currentTagsProgress.value) * 20);

  // State for JSX access
  const [tagsOpacityState, setTagsOpacityState] = useState(0);
  const [tagsTranslateXState, setTagsTranslateXState] = useState(0);

  // Update state from derived values
  useDerivedValue(() => {
    runOnJS(setTagsOpacityState)(currentTagsOpacity.value);
  });

  useDerivedValue(() => {
    runOnJS(setTagsTranslateXState)(currentTagsTranslateX.value);
  });

  // Derived values for safe access
  const currentCardOpacity = useDerivedValue(() => cardOpacity.value);
  const currentCardScale = useDerivedValue(() => cardScale.value);
  const currentCardTranslateY = useDerivedValue(() => cardTranslateY.value);
  const currentIconScale = useDerivedValue(() => iconScale.value);
  const currentIconRotation = useDerivedValue(() => `${iconRotation.value}deg`);
  const currentScoreScale = useDerivedValue(() => scoreScale.value);
  const currentCelebrationScale = useDerivedValue(() => celebrationScale.value);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: currentCardOpacity.value,
    transform: [
      { scale: currentCardScale.value },
      { translateY: currentCardTranslateY.value }
    ],
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: currentIconScale.value },
      { rotate: currentIconRotation.value }
    ],
  }));

  const scoreAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: currentScoreScale.value }],
  }));

  const celebrationAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: currentCelebrationScale.value }],
  }));

  // Start entrance animations
  useEffect(() => {
    // Card entrance
    cardOpacity.value = withTiming(1, { duration: 600 });
    cardTranslateY.value = withSpring(0, { damping: 15, stiffness: 150 });
    
    // Icon animation
    iconScale.value = withDelay(200, withSpring(1, { damping: 10, stiffness: 200 }));
    iconRotation.value = withDelay(200, withSpring(360, { damping: 15, stiffness: 150 }));
    
    // Score animation
    scoreScale.value = withDelay(400, withSpring(1, { damping: 15, stiffness: 200 }));
    
    // Tags animation
    tagsProgress.value = withDelay(600, withTiming(1, { duration: 800 }));
    
    // Celebration icons
    celebrationScale.value = withDelay(800, withSpring(1, { damping: 10, stiffness: 200 }));
  }, []);

  const handlePressIn = () => {
    cardScale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    cardScale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    // Trigger icon bounce animation
    iconScale.value = withSequence(
      withSpring(1.2, { damping: 8, stiffness: 300 }),
      withSpring(1, { damping: 15, stiffness: 300 })
    );
    
    // Trigger celebration animation
    celebrationScale.value = withSequence(
      withSpring(1.3, { damping: 8, stiffness: 300 }),
      withSpring(1, { damping: 15, stiffness: 300 })
    );
    
    if (onPress) {
      onPress();
    }
  };

  return (
    <Animated.View style={cardAnimatedStyle}>
      <Pressable 
        style={styles.container} 
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Animated.View style={[styles.icon, iconAnimatedStyle]}>
              <ChefHat size={20} color="#FF6B00" />
            </Animated.View>
            <Text style={styles.title}>Cuisine Score</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </View>

        {/* Summary Text */}
        <Text style={styles.summaryText}>
          You explored {cuisineCount} different cuisines this week.
        </Text>

        {/* Separator */}
        <View style={styles.separator} />

        {/* Cuisine Display */}
        <View style={styles.cuisineSection}>
          {/* Score Display */}
          <View style={styles.scoreContainer}>
            <Animated.Text style={[styles.scoreValue, scoreAnimatedStyle]}>{cuisineCount}</Animated.Text>
            <Text style={styles.scoreLabel}>unique cuisines</Text>
          </View>

          {/* Cuisine Tags */}
          <View style={styles.cuisineTags}>
            {uniqueCuisines.slice(0, 3).map((cuisine, index) => (
              <Animated.View 
                key={index} 
                style={[
                  styles.cuisineTag,
                  {
                    opacity: tagsOpacityState,
                    transform: [
                      { 
                        translateX: tagsTranslateXState * (index + 1) 
                      }
                    ]
                  }
                ]}
              >
                <Text style={styles.cuisineText}>{cuisine}</Text>
              </Animated.View>
            ))}
            {uniqueCuisines.length > 3 && (
              <Animated.View 
                style={[
                  styles.moreTag,
                  {
                    opacity: tagsOpacityState,
                    transform: [
                      { 
                        translateX: tagsTranslateXState * 4 
                      }
                    ]
                  }
                ]}
              >
                <Text style={styles.moreText}>+{uniqueCuisines.length - 3}</Text>
              </Animated.View>
            )}
          </View>
        </View>

        {/* Celebration Icons */}
        <Animated.View style={[styles.celebrationIcons, celebrationAnimatedStyle]}>
          <View style={styles.celebrationIcon}>
            <Globe size={16} color="#4A90E2" />
          </View>
          <View style={styles.celebrationIcon}>
            <Soup size={16} color="#FF6B00" />
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
});

// Export the memoized component
export const CuisineScoreCard = MemoizedCuisineScoreCard;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    marginVertical: 8,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: 20,
    height: 20,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B00',
  },
  chevron: {
    fontSize: 16,
    color: '#9BA1A6',
  },
  summaryText: {
    fontSize: 16,
    color: '#000000',
    lineHeight: 22,
    marginBottom: 12,
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginBottom: 16,
  },
  cuisineSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreContainer: {
    marginRight: 16,
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    lineHeight: 34,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#9BA1A6',
  },
  cuisineTags: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cuisineTag: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  cuisineText: {
    fontSize: 12,
    color: '#000000',
    fontWeight: '500',
  },
  moreTag: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  moreText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  celebrationIcons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 8,
  },
  celebrationIcon: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 