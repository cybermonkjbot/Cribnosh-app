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

// App color constants - matching the home page and app theme
const COLORS = {
  primary: '#094327',      // Dark green - main brand color
  secondary: '#0B9E58',    // Green - secondary brand color
  accent: '#FF6B35',       // Orange accent - for highlights
  background: {
    primary: '#FFFFFF',     // White background
    secondary: '#F8F8F8',  // Light gray background
    soft: '#f8e6f0',       // Soft pink from home page
    cream: '#faf2e8',      // Soft cream from home page
  },
  text: {
    primary: '#1A202C',     // Dark text
    secondary: '#4A5568',   // Medium text
    muted: '#9BA1A6',      // Muted text
  },
  border: '#E5E5E5',       // Light border
  shadow: '#000000',       // Shadow color
};

interface CalorieCompareCardProps {
  kcalToday: number;
  kcalYesterday: number;
  onPress?: () => void;
}

// Memoize the component to prevent unnecessary re-renders
const MemoizedCalorieCompareCard: React.FC<CalorieCompareCardProps> = React.memo(({
  kcalToday,
  kcalYesterday,
  onPress,
}) => {
  // Use 0 as defaults if no data
  const safeKcalToday = kcalToday ?? 0;
  const safeKcalYesterday = kcalYesterday ?? 0;
  const difference = safeKcalToday - safeKcalYesterday;
  const isMore = difference > 0;
  const absDifference = Math.abs(difference);

  // Animation values
  const cardScale = useSharedValue(1);
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(20);
  const barsProgress = useSharedValue(0);
  const numbersScale = useSharedValue(0.8);

  // State for JSX access
  const [barsProgressState, setBarsProgressState] = useState(0);

  useDerivedValue(() => {
    runOnJS(setBarsProgressState)(barsProgress.value);
  }, [barsProgress]);

  // Animated styles - use shared values directly (safe in worklet context)
  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [
      { scale: cardScale.value },
      { translateY: cardTranslateY.value }
    ],
  }));

  const numbersAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: numbersScale.value }],
  }));

  // Start entrance animations
  useEffect(() => {
    // Card entrance
    cardOpacity.value = withTiming(1, { duration: 600 });
    cardTranslateY.value = withSpring(0, { damping: 15, stiffness: 150 });
    
    // Numbers animation
    numbersScale.value = withDelay(400, withSpring(1, { damping: 15, stiffness: 200 }));
    
    // Bars animation
    barsProgress.value = withDelay(600, withTiming(1, { duration: 600 }));
  }, []);

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
            <Text style={styles.title}>Calories Logged</Text>
        </View>

        {/* Summary Text */}
        <Text style={styles.summaryText}>
          {absDifference > 0 
            ? `You consumed ${absDifference.toLocaleString()} kcal ${isMore ? 'more' : 'less'} today compared to yesterday.`
            : 'Your calorie intake is the same as yesterday.'}
        </Text>

        {/* Separator */}
        <View style={styles.separator} />

        {/* Data Display */}
        <View style={styles.dataSection}>
          {/* Today */}
          <View style={styles.dataItem}>
            <Animated.Text style={[styles.dataValue, numbersAnimatedStyle]}>{safeKcalToday.toLocaleString()}</Animated.Text>
            <Text style={styles.dataUnit}>kcal</Text>
            <Animated.View 
              style={[
                styles.bar, 
                { 
                  backgroundColor: COLORS.accent,
                  width: 60 * barsProgressState
                }
              ]} 
            />
            <Text style={styles.dayLabel}>Today</Text>
          </View>

          {/* Yesterday */}
          <View style={styles.dataItem}>
            <Animated.Text style={[styles.dataValue, numbersAnimatedStyle]}>{safeKcalYesterday.toLocaleString()}</Animated.Text>
            <Text style={styles.dataUnit}>kcal</Text>
            <Animated.View 
              style={[
                styles.bar, 
                { 
                  backgroundColor: COLORS.border,
                  width: 60 * barsProgressState
                }
              ]} 
            />
            <View style={styles.dayHighlight}>
              <Text style={styles.dayLabel}>Yesterday</Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
});

// Export the memoized component
export const CalorieCompareCard = MemoizedCalorieCompareCard;

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background.primary,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    marginVertical: 8,
    shadowColor: COLORS.shadow,
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
    color: COLORS.accent,
  },
  summaryText: {
    fontSize: 16,
    color: COLORS.text.primary,
    lineHeight: 22,
    marginBottom: 12,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 16,
  },
  dataSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dataItem: {
    flex: 1,
    alignItems: 'flex-start',
  },
  dataValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    lineHeight: 34,
  },
  dataUnit: {
    fontSize: 14,
    color: COLORS.text.muted,
    marginBottom: 8,
  },
  bar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
  },
  dayLabel: {
    fontSize: 14,
    color: COLORS.text.primary,
  },
  dayHighlight: {
    backgroundColor: COLORS.background.cream,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
}); 