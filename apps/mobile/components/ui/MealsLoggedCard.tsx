import { Utensils } from 'lucide-react-native';
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

interface MealsLoggedCardProps {
  weekMeals: number[]; // Array of 7 numbers representing meals per day
  avgMeals: number;
  onPress?: () => void;
}

// Memoize the component to prevent unnecessary re-renders
const MemoizedMealsLoggedCard: React.FC<MealsLoggedCardProps> = React.memo(({
  weekMeals = [2, 3, 4, 3, 5, 1, 2],
  avgMeals = 2.9,
  onPress,
}) => {
  const maxMeals = Math.max(...weekMeals, avgMeals);
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  
  // Animation values
  const cardScale = useSharedValue(1);
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(20);
  const barsProgress = useSharedValue(0);
  const averageLineProgress = useSharedValue(0);
  const iconScale = useSharedValue(0.8);
  const iconRotation = useSharedValue(0);

  // Derived values for safe access
  const currentCardOpacity = useDerivedValue(() => cardOpacity.value);
  const currentCardScale = useDerivedValue(() => cardScale.value);
  const currentCardTranslateY = useDerivedValue(() => cardTranslateY.value);
  const currentIconScale = useDerivedValue(() => iconScale.value);
  const currentIconRotation = useDerivedValue(() => `${iconRotation.value}deg`);
  const currentAverageLineProgress = useDerivedValue(() => averageLineProgress.value);

  // State for JSX access
  const [barsProgressState, setBarsProgressState] = useState(0);
  const [averageLineProgressState, setAverageLineProgressState] = useState(0);

  useDerivedValue(() => {
    runOnJS(setBarsProgressState)(barsProgress.value);
  }, [barsProgress]);
  useDerivedValue(() => {
    runOnJS(setAverageLineProgressState)(averageLineProgress.value);
  }, [averageLineProgress]);

  // Animated styles
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

  // Start entrance animations
  useEffect(() => {
    // Card entrance
    cardOpacity.value = withTiming(1, { duration: 600 });
    cardTranslateY.value = withSpring(0, { damping: 15, stiffness: 150 });
    
    // Icon animation
    iconScale.value = withDelay(200, withSpring(1, { damping: 10, stiffness: 200 }));
    iconRotation.value = withDelay(200, withSpring(360, { damping: 15, stiffness: 150 }));
    
    // Bars animation
    barsProgress.value = withDelay(400, withTiming(1, { duration: 800 }));
    averageLineProgress.value = withDelay(600, withTiming(1, { duration: 400 }));
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
    
    if (onPress) {
      onPress();
    }
  };

  const barHeight = (value: number) => (value / maxMeals) * 60; // Max bar height of 60

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
              <Utensils size={20} color="#FF6B00" />
            </Animated.View>
            <Text style={styles.title}>Meals Logged</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </View>

        {/* Summary Text */}
        <Text style={styles.summaryText}>
          Over the last 7 days, you logged an average of {avgMeals.toFixed(1)} meals per day.
        </Text>

        {/* Separator */}
        <View style={styles.separator} />

        {/* Chart Section */}
        <View style={styles.chartSection}>
          {/* Average Display */}
          <View style={styles.averageContainer}>
            <Text style={styles.averageLabel}>Average Meals</Text>
            <Text style={styles.averageValue}>{avgMeals.toFixed(1)}</Text>
            <Text style={styles.averageUnit}>meals</Text>
          </View>

          {/* Bar Chart - Replaced SVG with View-based bars */}
          <View style={styles.chartContainer}>
            <View style={styles.chart}>
              {/* Daily Bars */}
              <View style={styles.barsContainer}>
                {weekMeals.map((meals, index) => {
                  const animatedHeight = barHeight(meals) * barsProgressState;
                  return (
                    <Animated.View
                      key={index}
                      style={[
                        styles.bar,
                        {
                          height: animatedHeight,
                          width: 20,
                        }
                      ]}
                    />
                  );
                })}
              </View>
              
              {/* Average Line */}
              <Animated.View
                style={[
                  styles.averageLine,
                  {
                    width: `${averageLineProgressState * 100}%`,
                    bottom: `${(barHeight(avgMeals) / 60) * 100}%`,
                  }
                ]}
              />
            </View>
            
            {/* Day Labels */}
            <View style={styles.dayLabels}>
              {days.map((day, index) => (
                <Text key={index} style={styles.dayLabel}>
                  {day}
                </Text>
              ))}
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
});

// Export the memoized component
export const MealsLoggedCard = MemoizedMealsLoggedCard;

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
    fontSize: 16,
    marginRight: 8,
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
  chartSection: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  averageContainer: {
    marginRight: 24,
  },
  averageLabel: {
    fontSize: 14,
    color: '#9BA1A6',
    marginBottom: 4,
  },
  averageValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    lineHeight: 34,
  },
  averageUnit: {
    fontSize: 14,
    color: '#9BA1A6',
  },
  chartContainer: {
    flex: 1,
  },
  chart: {
    height: 80,
    width: 200,
    position: 'relative',
    marginBottom: 8,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 60,
    paddingHorizontal: 4,
    position: 'relative',
    marginBottom: 2,
  },
  bar: {
    backgroundColor: '#E5E5E5',
    borderRadius: 2,
    marginHorizontal: 2,
    minHeight: 2,
  },
  averageLine: {
    position: 'absolute',
    left: 4,
    right: 4,
    height: 2,
    backgroundColor: '#FF6B00',
    zIndex: 1,
  },
  dayLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  dayLabel: {
    fontSize: 12,
    color: '#9BA1A6',
    width: 20,
    textAlign: 'center',
  },
}); 