import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming
} from 'react-native-reanimated';

interface CuisineScoreCardProps {
  cuisines: string[];
  onPress?: () => void;
}

// Memoize the component to prevent unnecessary re-renders
const MemoizedCuisineScoreCard: React.FC<CuisineScoreCardProps> = React.memo(({
  cuisines,
  onPress,
}) => {
  // Use empty array as default if no data
  const safeCuisines = cuisines || [];
  const uniqueCuisines = [...new Set(safeCuisines)];
  const cuisineCount = uniqueCuisines.length;

  // Animation values
  const cardScale = useSharedValue(1);
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(20);
  const scoreScale = useSharedValue(0.8);
  const tagsProgress = useSharedValue(0);

  // State for JSX access
  const [tagsOpacityState, setTagsOpacityState] = useState(0);
  const [tagsTranslateXState, setTagsTranslateXState] = useState(0);

  // Update state from shared values
  useDerivedValue(() => {
    const progress = tagsProgress.value;
    runOnJS(setTagsOpacityState)(progress);
    runOnJS(setTagsTranslateXState)((1 - progress) * 20);
  }, [tagsProgress]);

  // Animated styles - use shared values directly (safe in worklet context)
  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [
      { scale: cardScale.value },
      { translateY: cardTranslateY.value }
    ],
  }));

  const scoreAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scoreScale.value }],
  }));


  // Start entrance animations
  useEffect(() => {
    // Card entrance
    cardOpacity.value = withTiming(1, { duration: 600 });
    cardTranslateY.value = withSpring(0, { damping: 15, stiffness: 150 });

    // Score animation
    scoreScale.value = withDelay(400, withSpring(1, { damping: 15, stiffness: 200 }));

    // Tags animation
    tagsProgress.value = withDelay(600, withTiming(1, { duration: 800 }));

  }, [cardOpacity, cardTranslateY, scoreScale, tagsProgress]);

  const handlePressIn = () => {
    cardScale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    cardScale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
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
          <Text style={styles.title}>Cuisine Score</Text>
        </View>

        {/* Summary Text */}
        <Text style={styles.summaryText}>
          {cuisineCount > 0
            ? `You tried ${cuisineCount} unique ${cuisineCount === 1 ? 'cuisine' : 'cuisines'} this week.`
            : 'Start exploring different cuisines to build your score!'}
        </Text>

        {/* Separator */}
        <View style={styles.separator} />

        {/* Cuisine Display */}
        <View style={styles.cuisineSection}>
          {/* Score Display */}
          <View style={styles.scoreContainer}>
            <Animated.Text style={[styles.scoreValue, scoreAnimatedStyle]}>{cuisineCount}</Animated.Text>
            <Text style={styles.scoreLabel}>cuisines tried</Text>
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

      </Pressable>
    </Animated.View>
  );
});

MemoizedCuisineScoreCard.displayName = 'CuisineScoreCard';

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
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B00',
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
}); 