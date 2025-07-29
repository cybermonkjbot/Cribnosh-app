import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import Svg, { Rect } from 'react-native-svg';

interface MealsLoggedCardProps {
  weekMeals: number[]; // Array of 7 numbers representing meals per day
  avgMeals: number;
  onPress?: () => void;
}

export const MealsLoggedCard: React.FC<MealsLoggedCardProps> = ({
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

  // Animated styles
  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [
      { scale: cardScale.value },
      { translateY: cardTranslateY.value }
    ],
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { rotate: `${iconRotation.value}deg` }
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
            <Animated.Text style={[styles.icon, iconAnimatedStyle]}>🍽</Animated.Text>
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

          {/* Bar Chart */}
          <View style={styles.chartContainer}>
            <Svg width={200} height={80} style={styles.chart}>
              {/* Average Line */}
              <Rect
                x={0}
                y={40 - barHeight(avgMeals)}
                width={200 * averageLineProgress.value}
                height={2}
                fill="#FF6B00"
              />
              
              {/* Daily Bars */}
              {weekMeals.map((meals, index) => {
                const animatedHeight = barHeight(meals) * barsProgress.value;
                return (
                  <Rect
                    key={index}
                    x={index * 28 + 4}
                    y={40 - animatedHeight}
                    width={20}
                    height={animatedHeight}
                    fill="#E5E5E5"
                    rx={2}
                  />
                );
              })}
            </Svg>
            
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
};

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
    marginBottom: 8,
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