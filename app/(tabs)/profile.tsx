import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Image, Text, View } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mascot } from '../../components/Mascot';
import { ThemedText } from '../../components/ThemedText';
import { CalorieCompareCard, CuisineScoreCard, MealsLoggedCard } from '../../components/ui';
import { Avatar } from '../../components/ui/Avatar';
import { CaloriesNoshPointsCards } from '../../components/ui/CaloriesNoshPointsCards';
import { KPICards } from '../../components/ui/KPICards';
import { ProfileScreenBackground } from '../../components/ui/ProfileScreenBackground';
import { generateMockWeeklyData, sampleWeeklyData } from '../../utils/braggingCardsData';

// Removed unused constants

// ForkPrint PNG component
const ForkPrintImage = () => {
  return (
    <Image 
      source={require('../../assets/images/ForkPrint.png')}
      style={{ width: 170, height: 40, resizeMode: 'contain' }}
    />
  );
};

// Safe haptic feedback function
const safeHapticFeedback = async (style: Haptics.ImpactFeedbackStyle) => {
  try {
    await Haptics.impactAsync(style);
  } catch {
    console.log('Haptic feedback not supported on this device');
  }
};

export default function ProfileScreen() {
  const [braggingData, setBraggingData] = useState(sampleWeeklyData);
  const [showDebug] = useState(true); // Enable debug by default
  
  // Simplified state management
  const [isExpanded, setIsExpanded] = useState(false);
  const isAnimating = useRef(false);
  
  // Simple shared values
  const scrollY = useSharedValue(0);
  
  // Animation values
  const headerOpacity = useSharedValue(0);
  const scoreScale = useSharedValue(0.8);
  const cardsTranslateY = useSharedValue(50);
  const cardsOpacity = useSharedValue(0);
  const braggingCardsTranslateY = useSharedValue(50);
  const braggingCardsOpacity = useSharedValue(0);

  // Refs
  const scrollViewRef = useRef<Animated.ScrollView>(null);

  // Simple animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const scoreAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scoreScale.value }],
  }));

  const cardsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardsOpacity.value,
    transform: [{ translateY: cardsTranslateY.value }],
  }));

  const braggingCardsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: braggingCardsOpacity.value,
    transform: [{ translateY: braggingCardsTranslateY.value }],
  }));

  const statsSectionAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: 0 },
      { scale: 1 }
    ],
    opacity: 1,
  }));

  const resistanceAnimatedStyle = useAnimatedStyle(() => {
    const resistance = Math.min(scrollY.value * 0.3, 50);
    return {
      transform: [{ translateY: resistance }],
    };
  });

  const gestureIndicatorAnimatedStyle = useAnimatedStyle(() => {
    const shouldShow = scrollY.value > 50;
    return {
      marginTop: 8,
      paddingHorizontal: 12,
      paddingVertical: 4,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 8,
      opacity: shouldShow ? 1 : 0
    };
  });

  // Safe scroll to function - removed unused function

  // Simple expansion function
  const expandStats = useCallback(() => {
    if (isAnimating.current || isExpanded) return;
    
    console.log('Starting expansion animation');
    isAnimating.current = true;
    setIsExpanded(true);
    
    // Add haptic feedback
    safeHapticFeedback(Haptics.ImpactFeedbackStyle.Medium);
    
    // Simple state change without complex animations
    setTimeout(() => {
      isAnimating.current = false;
      console.log('Expansion completed');
    }, 300);
  }, [isExpanded]);

  // Removed unused collapseStats function

  // Minimal scroll handler - just track scroll position
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      'worklet';
      scrollY.value = event.contentOffset.y;
    },
  });

  // Simple expansion trigger using useEffect
  useEffect(() => {
    const checkExpansion = () => {
      if (scrollY.value > 100 && !isExpanded && !isAnimating.current) {
        expandStats();
      }
    };
    
    const interval = setInterval(checkExpansion, 100);
    return () => clearInterval(interval);
  }, [isExpanded, expandStats, scrollY.value]);

  // Simple mount effect
  useEffect(() => {
    console.log('Profile screen mounted');
    
    // Start entrance animations
    const startAnimations = () => {
      headerOpacity.value = withTiming(1, { duration: 800 });
      scoreScale.value = withDelay(200, withSpring(1, { damping: 15, stiffness: 150 }));
      cardsOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
      cardsTranslateY.value = withDelay(400, withSpring(0, { damping: 15, stiffness: 150 }));
      braggingCardsOpacity.value = withDelay(600, withTiming(1, { duration: 600 }));
      braggingCardsTranslateY.value = withDelay(600, withSpring(0, { damping: 15, stiffness: 150 }));
    };

    // Small delay to ensure component is fully mounted
    setTimeout(startAnimations, 100);
    
    return () => {
      console.log('Profile screen unmounting');
    };
  }, [headerOpacity, scoreScale, cardsOpacity, cardsTranslateY, braggingCardsOpacity, braggingCardsTranslateY]);

  const handleMealsPress = () => {
    Alert.alert('Meals Logged', 'Show detailed meals breakdown');
  };

  const handleCaloriesPress = () => {
    Alert.alert('Calories Tracked', 'Show detailed calorie analysis');
  };

  const handleCuisinePress = () => {
    Alert.alert('Cuisine Score', 'Show all cuisines explored');
  };

  const refreshBraggingData = useCallback(() => {
    if (isAnimating.current) return;
    
    isAnimating.current = true;
    
    // Animate the refresh
    braggingCardsOpacity.value = withTiming(0, { duration: 200 });
    braggingCardsTranslateY.value = withTiming(20, { duration: 200 }, () => {
      setBraggingData(generateMockWeeklyData());
      braggingCardsOpacity.value = withTiming(1, { duration: 300 });
      braggingCardsTranslateY.value = withSpring(0, { damping: 15, stiffness: 150 });
    });
    
    setTimeout(() => {
      isAnimating.current = false;
    }, 500);
  }, [braggingCardsOpacity, braggingCardsTranslateY]);

  return (
    <ProfileScreenBackground>
      <SafeAreaView style={{ flex: 1, width: '100%' }}>
        <Animated.ScrollView 
          ref={scrollViewRef}
          style={{ flex: 1, width: '100%' }} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100, width: '100%' }}
          onScroll={scrollHandler}
          scrollEventThrottle={33}
          bounces={true}
          alwaysBounceVertical={true}
          removeClippedSubviews={false}
        >
            {/* Header */}
            <Animated.View style={headerAnimatedStyle}>
              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingTop: 10,
                paddingBottom: 20
              }}>
                <Image 
                  source={require('../../assets/images/white-greenlogo.png')}
                  style={{ width: 120, height: 40, resizeMode: 'contain' }}
                />
                <Avatar 
                  size="md"
                  source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face' }}
                />
              </View>
            </Animated.View>

            {/* ForkPrint Score and Tastemaker Section */}
            <Animated.View style={[scoreAnimatedStyle, resistanceAnimatedStyle]}>
              <View style={{ paddingHorizontal: 16, marginBottom: 30, position: 'relative' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1, position: 'relative' }}>
                    <Text style={{
                      fontFamily: 'Mukta',
                      fontStyle: 'normal',
                      fontWeight: '800',
                      fontSize: 20,
                      lineHeight: 33,
                      color: '#FFFFFF',
                      marginBottom: -5,
                      marginLeft: 80
                    }}>
                      Score
                    </Text>
                    
                    <ForkPrintImage />
                    
                    <Text style={{
                      fontFamily: 'Inter',
                      fontStyle: 'normal',
                      fontWeight: '700',
                      fontSize: 64,
                      lineHeight: 77,
                      color: '#FFFFFF',
                      marginTop: 10
                    }}>
                      799
                    </Text>
                  </View>
                </View>
                
                <View style={{ 
                  position: 'absolute', 
                  top: -50, 
                  right: -50, 
                  alignItems: 'center',
                  zIndex: 1
                }}>
                  <Mascot 
                    emotion="happy" 
                    size={280}
                    style={{ marginBottom: 10 }}
                  />
                  
                  <ThemedText style={{ 
                    fontSize: 16, 
                    color: 'white', 
                    fontWeight: '600',
                    marginBottom: 5,
                    position: 'absolute',
                    bottom: 40,
                    zIndex: 2,
                    textAlign: 'right'
                  }}>
                    Tastemaker
                  </ThemedText>
                  <ThemedText style={{ 
                    fontSize: 12, 
                    color: 'white', 
                    opacity: 0.8,
                    textAlign: 'right',
                    position: 'absolute',
                    bottom: 20,
                    zIndex: 2
                  }}>
                    3 Points to Food Influencer
                  </ThemedText>
                </View>
              </View>
            </Animated.View>

            {/* Data Cards */}
            <Animated.View style={cardsAnimatedStyle}>
              <View style={{ paddingHorizontal: 16, marginBottom: 30, marginTop: 20, position: 'relative' }}>
                <CaloriesNoshPointsCards 
                  caloriesProgress={23}
                  noshPointsProgress={40}
                />
              </View>
            </Animated.View>

            {/* KPI Cards */}
            <Animated.View style={cardsAnimatedStyle}>
              <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
                <KPICards 
                  timeSaved="15.7 hours"
                  costSaved="£ 29.3"
                />
              </View>
            </Animated.View>

            {/* Breakpoint Trigger Area */}
            <View style={{ height: 100, justifyContent: 'flex-end' }}>
              <View style={{ 
                paddingHorizontal: 16, 
                paddingBottom: 20,
                alignItems: 'center'
              }}>
                <Text style={{
                  fontSize: 16,
                  color: '#FFFFFF',
                  opacity: 0.7,
                  fontFamily: 'Mukta',
                  textAlign: 'center'
                }}>
                  Pull up to view your food stats
                </Text>
                <View style={{
                  width: 40,
                  height: 4,
                  backgroundColor: '#FFFFFF',
                  opacity: 0.3,
                  borderRadius: 2,
                  marginTop: 8
                }} />
                
                {/* Gesture indicator */}
                <Animated.View style={gestureIndicatorAnimatedStyle}>
                  <Text style={{
                    fontSize: 12,
                    color: '#FFFFFF',
                    fontFamily: 'Mukta',
                    textAlign: 'center'
                  }}>
                    Ready to Expand
                  </Text>
                </Animated.View>
              </View>
            </View>

            {/* Bragging Cards Section - Sticky Header */}
            <Animated.View style={[braggingCardsAnimatedStyle, statsSectionAnimatedStyle]}>
              <View style={{ 
                marginHorizontal: 0, 
                marginBottom: 40, 
                marginTop: 20,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 16,
                padding: 16,
                backdropFilter: 'blur(10px)',
              }}>
                <View style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: 16,
                  paddingHorizontal: 4
                }}>
                  <Text style={{
                    fontSize: 20,
                    fontWeight: 'bold',
                    color: '#FFFFFF',
                    fontFamily: 'Mukta',
                  }}>
                    Your Food Stats
                  </Text>
                  <Text 
                    style={{
                      fontSize: 14,
                      color: '#FFFFFF',
                      opacity: 0.8,
                      fontFamily: 'Mukta',
                    }}
                    onPress={refreshBraggingData}
                  >
                    Refresh
                  </Text>
                </View>
                
                {/* Individual Bragging Cards */}
                <MealsLoggedCard
                  weekMeals={braggingData.weekMeals}
                  avgMeals={braggingData.avgMeals}
                  onPress={handleMealsPress}
                />
                
                <CalorieCompareCard
                  kcalToday={braggingData.kcalToday}
                  kcalYesterday={braggingData.kcalYesterday}
                  onPress={handleCaloriesPress}
                />
                
                <CuisineScoreCard
                  cuisines={braggingData.cuisines}
                  onPress={handleCuisinePress}
                />
              </View>
            </Animated.View>
            
            {/* Extra bottom padding for proper scrolling */}
            <View style={{ height: 200 }} />
          </Animated.ScrollView>
        </SafeAreaView>

        {/* Debug Tester - Remove this in production */}
        {showDebug && (
          <View style={{ padding: 20, backgroundColor: 'rgba(0,0,0,0.8)' }}>
            <Text style={{ color: 'white' }}>Scroll Y: {scrollY.value}</Text>
            <Text style={{ color: 'white' }}>Expanded: {isExpanded ? 'Yes' : 'No'}</Text>
          </View>
        )}
      </ProfileScreenBackground>
  );
} 