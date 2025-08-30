import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

interface CaloriesNoshPointsCardsProps {
  caloriesProgress?: number; // 0-100
  noshPointsProgress?: number; // 0-100
}

// Memoize the component to prevent unnecessary re-renders
const MemoizedCaloriesNoshPointsCards: React.FC<CaloriesNoshPointsCardsProps> = React.memo(({
  caloriesProgress = 23,
  noshPointsProgress = 40,
}) => {
  const [isCaloriesOnTop, setIsCaloriesOnTop] = useState(false);
  const [arrowTapCount, setArrowTapCount] = useState(0);
  const [showSwipeCue, setShowSwipeCue] = useState(false);
  
  // Animation values
  const swipeAnimation = useRef(new Animated.Value(0)).current;
  const cueOpacity = useRef(new Animated.Value(0)).current;

  const handleCardTap = () => {
    setIsCaloriesOnTop(prev => !prev);
  };

  const handleArrowTap = () => {
    const newCount = arrowTapCount + 1;
    setArrowTapCount(newCount);
    
    // Show swipe cue after 2 or more taps
    if (newCount >= 2 && !showSwipeCue) {
      setShowSwipeCue(true);
      triggerSwipeAnimation();
    }
  };

  const triggerSwipeAnimation = () => {
    // Fade in the cue
    Animated.sequence([
      Animated.timing(cueOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // Swipe right animation
      Animated.timing(swipeAnimation, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      // Pull back animation
      Animated.timing(swipeAnimation, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      // Fade out the cue
      Animated.timing(cueOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSwipeCue(false);
      setArrowTapCount(0);
    });
  };

  const getActiveCardStyle = () => {
    const translateX = swipeAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 30],
    });

    return {
      transform: [
        { translateY: isCaloriesOnTop ? 0 : -5 },
        { translateX },
      ],
    };
  };

  return (
    <View style={styles.container}>
      {/* Calories Data Card */}
      <Animated.View style={[
        styles.caloriesCard,
        { 
          zIndex: isCaloriesOnTop ? 2 : 1,
          elevation: isCaloriesOnTop ? 2 : 1,
        },
        isCaloriesOnTop ? getActiveCardStyle() : {}
      ]}>
        <Pressable
          style={styles.cardPressable}
          onPress={handleCardTap}
          android_ripple={{ color: 'rgba(255, 255, 255, 0.2)', borderless: false }}
        >
          <LinearGradient
            colors={['rgba(12, 168, 93, 0.5)', 'rgba(5, 66, 37, 0.5)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientFill}
          >
            <BlurView intensity={27.5} style={styles.blurOverlay}>
              <View style={styles.caloriesContent}>
                <Text style={styles.caloriesTitle}>Calories Data</Text>
                
                {/* Current Calories and Goal */}
                <View style={styles.caloriesInfoContainer}>
                  <Text style={styles.currentCalories}>1,847</Text>
                  <Text style={styles.caloriesGoal}>/ 2,100</Text>
                </View>
                
                {/* Remaining Calories */}
                <Text style={styles.remainingCalories}>253 remaining</Text>
                
                {/* Progress Bar for Calories */}
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBarTrack}>
                    <View 
                      style={[
                        styles.progressBarFill, 
                        { width: `${caloriesProgress}%` }
                      ]} 
                    />
                  </View>
                </View>
                
                {/* Right Arrow with separate tap handler */}
                <Pressable
                  style={styles.arrowContainer}
                  onPress={handleArrowTap}
                  android_ripple={{ color: 'rgba(255, 255, 255, 0.3)', borderless: true }}
                >
                  <Ionicons name="chevron-forward" size={20} color="#E6FFE8" />
                </Pressable>
              </View>
            </BlurView>
          </LinearGradient>
        </Pressable>
      </Animated.View>

      {/* Nosh Points Card */}
      <Animated.View style={[
        styles.noshPointsCard,
        { 
          zIndex: isCaloriesOnTop ? 1 : 2,
          elevation: isCaloriesOnTop ? 1 : 2,
        },
        !isCaloriesOnTop ? getActiveCardStyle() : {}
      ]}>
        <Pressable
          style={styles.cardPressable}
          onPress={handleCardTap}
          android_ripple={{ color: 'rgba(255, 255, 255, 0.2)', borderless: false }}
        >
          <BlurView intensity={27.5} style={styles.blurOverlay}>
            <View style={styles.noshPointsContent}>
              <Text style={styles.noshPointsTitle}>Nosh Points</Text>
              
              {/* Nosh Points Amount */}
              <Text style={styles.noshPointsAmount}>1,240</Text>
              <Text style={styles.noshPointsSubtitle}>Available Coins</Text>
              
              {/* Progress Bar for Nosh Points */}
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarTrack}>
                  <View 
                    style={[
                      styles.progressBarFill, 
                      { width: `${noshPointsProgress}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.progressLabel}>Progress until next Coin</Text>
              </View>
            </View>
          </BlurView>
        </Pressable>
      </Animated.View>

      {/* Swipe Cue Overlay */}
      {showSwipeCue && (
        <Animated.View 
          style={[
            styles.swipeCueOverlay,
            {
              opacity: cueOpacity,
            }
          ]}
        >
          <View style={styles.swipeCueContent}>
            <Ionicons name="arrow-forward" size={24} color="#E6FFE8" />
            <Text style={styles.swipeCueText}>Swipe right to navigate</Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
});

// Export the memoized component
export const CaloriesNoshPointsCards = MemoizedCaloriesNoshPointsCards;

const styles = StyleSheet.create({
  container: {
    width: 342,
    height: 170,
    position: 'relative',
  },
  
  // Calories Data Card
  caloriesCard: {
    position: 'absolute',
    width: 333,
    height: 112,
    left: 7,
    top: 0,
    borderRadius: 14,
    overflow: 'hidden',
    // Add border to make it more visible
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    // Ensure touchability
    backgroundColor: 'transparent',
  },
  cardPressable: {
    flex: 1,
  },
  gradientFill: {
    flex: 1,
    borderRadius: 14,
  },
  blurOverlay: {
    flex: 1,
    borderRadius: 14,
  },
  caloriesContent: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 10,
    paddingRight: 20,
    paddingBottom: 15,
    paddingLeft: 14,
  },
  caloriesTitle: {
    position: 'absolute',
    width: 100,
    height: 25,
    left: 18,
    top: 5,
    fontFamily: 'Mukta',
    fontStyle: 'normal',
    fontWeight: '800',
    fontSize: 15,
    lineHeight: 25,
    color: '#E6FFE8',
  },
  caloriesInfoContainer: {
    position: 'absolute',
    left: 18,
    top: 30,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currentCalories: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 29,
    color: '#E6FFE8',
  },
  caloriesGoal: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 19,
    color: '#E6FFE8',
    opacity: 0.8,
    marginLeft: 4,
  },
  remainingCalories: {
    position: 'absolute',
    left: 18,
    top: 60,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 12,
    lineHeight: 15,
    color: '#E6FFE8',
    opacity: 0.7,
  },
  
  // Nosh Points Card
  noshPointsCard: {
    position: 'absolute',
    width: 342,
    height: 110,
    left: 0,
    top: 40,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(9, 67, 39, 0.3)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 55,
    elevation: 10,
    // Add border to make it more visible
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  noshPointsContent: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 10,
    paddingRight: 20,
    paddingBottom: 15,
    paddingLeft: 14,
  },
  noshPointsTitle: {
    position: 'absolute',
    width: 95,
    height: 25,
    left: 18,
    top: 5,
    fontFamily: 'Mukta',
    fontStyle: 'normal',
    fontWeight: '800',
    fontSize: 15,
    lineHeight: 25,
    color: '#E6FFE8',
  },
  noshPointsAmount: {
    position: 'absolute',
    width: 80,
    height: 25,
    right: 20,
    top: 5,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 25,
    color: '#E6FFE8',
    textAlign: 'right',
  },
  noshPointsSubtitle: {
    position: 'absolute',
    width: 90,
    height: 20,
    right: 20,
    top: 30,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 20,
    color: '#E6FFE8',
    textAlign: 'right',
    opacity: 0.8,
  },
  
  // Progress Bar
  progressBarContainer: {
    position: 'absolute',
    width: 280.79,
    height: 25,
    left: 18,
    top: 76,
  },
  progressBarTrack: {
    position: 'absolute',
    width: 280.79,
    height: 25,
    backgroundColor: '#000000',
    borderRadius: 10,
  },
  progressBarFill: {
    position: 'absolute',
    height: 25,
    backgroundColor: '#EBA10F',
    borderRadius: 10,
  },
  progressLabel: {
    position: 'absolute',
    width: 150,
    height: 20,
    left: 0,
    top: 30,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 11,
    lineHeight: 20,
    color: '#E6FFE8',
    opacity: 0.7,
  },
  
  // Arrow Container
  arrowContainer: {
    position: 'absolute',
    right: 10,
    top: 50,
    padding: 8,
    borderRadius: 20,
  },
  
  // Swipe Cue Overlay
  swipeCueOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  swipeCueContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  swipeCueText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500',
    color: '#E6FFE8',
  },
  
  // New styles for better visual feedback
  statusText: {
    position: 'absolute',
    right: 20,
    bottom: 5,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 10,
    color: '#E6FFE8',
  },
  
  tapInstruction: {
    position: 'absolute',
    bottom: -25,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  
  tapText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#E6FFE8',
    opacity: 0.6,
  },
});

export default CaloriesNoshPointsCards;