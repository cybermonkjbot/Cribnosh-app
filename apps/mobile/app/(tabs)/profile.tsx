import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mascot } from '../../components/Mascot';
import { ThemedText } from '../../components/ThemedText';
import { CalorieCompareCard, CuisineScoreCard, MealsLoggedCard } from '../../components/ui';
import { Avatar } from '../../components/ui/Avatar';
import { CaloriesNoshPointsCards } from '../../components/ui/CaloriesNoshPointsCards';
import { EmptyState } from '../../components/ui/EmptyState';
import { KPICards } from '../../components/ui/KPICards';
import { ProfileScreenBackground } from '../../components/ui/ProfileScreenBackground';
import {
  BraggingCardsSkeleton,
  CaloriesNoshPointsSkeleton,
  ForkPrintScoreSkeleton,
  KPICardsSkeleton,
} from '../../components/ui/ProfileScreenSkeletons';
import { useAuthContext } from '../../contexts/AuthContext';
import {
  useGetCaloriesProgressQuery,
  useGetForkPrintScoreQuery,
  useGetMonthlyOverviewQuery,
  useGetNoshPointsQuery,
  useGetWeeklySummaryQuery,
} from '../../store/customerApi';
import { navigateToSignIn } from '../../utils/signInNavigationGuard';

// Constants moved outside component to prevent recreation
const SHEET_SNAP_POINT = 200; // Distance to pull up to open sheet
const SHEET_OPEN_HEIGHT = 400; // Height when sheet is fully open
const SCROLL_EXPANSION_THRESHOLD = 100;

// ForkPrint PNG component - memoized to prevent recreation
const ForkPrintImage = React.memo(() => {
  return (
    <Image 
      source={require('../../assets/images/ForkPrint.png')}
      style={styles.forkPrintImage}
      contentFit="contain"
    />
  );
});
ForkPrintImage.displayName = 'ForkPrintImage';

// Safe haptic feedback function - moved outside component
const safeHapticFeedback = async (style: Haptics.ImpactFeedbackStyle) => {
  try {
    await Haptics.impactAsync(style);
  } catch {
    // Silently fail - haptics not supported on this device
  }
};

export default function ProfileScreen() {
  const { isAuthenticated, isLoading: authLoading } = useAuthContext();
  const insets = useSafeAreaInsets();
  const [braggingData, setBraggingData] = useState<{
    weekMeals: number[];
    avgMeals: number;
    kcalToday: number;
    kcalYesterday: number;
    cuisines: string[];
  }>({
    weekMeals: [],
    avgMeals: 0,
    kcalToday: 0,
    kcalYesterday: 0,
    cuisines: [],
  });
  const router = useRouter();

  // API Queries
  const {
    data: forkPrintData,
    isLoading: forkPrintLoading,
    error: forkPrintError,
    refetch: refetchForkPrint,
  } = useGetForkPrintScoreQuery(undefined, {
    skip: !isAuthenticated,
  });

  const {
    data: noshPointsData,
    isLoading: noshPointsLoading,
    error: noshPointsError,
    refetch: refetchNoshPoints,
  } = useGetNoshPointsQuery(undefined, {
    skip: !isAuthenticated,
  });

  const {
    data: caloriesProgressData,
    isLoading: caloriesProgressLoading,
    error: caloriesProgressError,
    refetch: refetchCaloriesProgress,
  } = useGetCaloriesProgressQuery(undefined, {
    skip: !isAuthenticated,
  });

  const {
    data: monthlyOverviewData,
    isLoading: monthlyOverviewLoading,
    error: monthlyOverviewError,
    refetch: refetchMonthlyOverview,
  } = useGetMonthlyOverviewQuery(undefined, {
    skip: !isAuthenticated,
  });

  const {
    data: weeklySummaryData,
    isLoading: weeklySummaryLoading,
    error: weeklySummaryError,
    refetch: refetchWeeklySummary,
  } = useGetWeeklySummaryQuery(undefined, {
    skip: !isAuthenticated,
  });
  
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
  
  // Sheet animation values
  const sheetTranslateY = useSharedValue(0);
  const sheetHeight = useSharedValue(0);
  const isSheetOpen = useSharedValue(0);

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
  
  // Sheet animated styles
  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
    height: sheetHeight.value,
  }));
  
  const sheetBackgroundAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    const progress = Math.min(Math.abs(sheetTranslateY.value) / SHEET_SNAP_POINT, 1);
    const opacity = 0.1 + (progress * 0.8); // From 0.1 to 0.9 opacity
    const r = Math.round(255);
    const g = Math.round(255);
    const b = Math.round(255);
    
    return {
      backgroundColor: `rgba(${r}, ${g}, ${b}, ${opacity})`,
    };
  });



  // Safe scroll to function - removed unused function

  // Sheet gesture handler
  const sheetGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
    })
    .onUpdate((event) => {
      'worklet';
      const newTranslateY = Math.max(-SHEET_OPEN_HEIGHT, Math.min(0, event.translationY));
      sheetTranslateY.value = newTranslateY;
      
      // Calculate sheet height based on pull distance
      const pullDistance = Math.abs(newTranslateY);
      const progress = Math.min(pullDistance / SHEET_SNAP_POINT, 1);
      sheetHeight.value = progress * SHEET_OPEN_HEIGHT;
    })
    .onEnd((event) => {
      'worklet';
      const velocity = event.velocityY;
      const currentTranslateY = sheetTranslateY.value;
      
      if (currentTranslateY < -SHEET_SNAP_POINT || velocity < -500) {
        // Snap to open
        sheetTranslateY.value = withSpring(-SHEET_OPEN_HEIGHT, {
          damping: 20,
          stiffness: 200,
        });
        sheetHeight.value = withSpring(SHEET_OPEN_HEIGHT, {
          damping: 20,
          stiffness: 200,
        });
        isSheetOpen.value = withTiming(1, { duration: 300 });
        runOnJS(safeHapticFeedback)(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        // Snap back to closed
        sheetTranslateY.value = withSpring(0, {
          damping: 20,
          stiffness: 200,
        });
        sheetHeight.value = withSpring(0, {
          damping: 20,
          stiffness: 200,
        });
        isSheetOpen.value = withTiming(0, { duration: 300 });
      }
  });

  // Simple expansion function
  const expandStats = useCallback(() => {
    if (isAnimating.current || isExpanded) return;
    
    if (__DEV__) {
      console.log('Starting expansion animation');
    }
    isAnimating.current = true;
    setIsExpanded(true);
    
    // Add haptic feedback
    safeHapticFeedback(Haptics.ImpactFeedbackStyle.Medium);
    
    // Simple state change without complex animations
    setTimeout(() => {
      isAnimating.current = false;
      if (__DEV__) {
        console.log('Expansion completed');
      }
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

  // Optimized expansion trigger using useAnimatedReaction instead of setInterval
  // This is more performant as it only triggers when scrollY actually changes
  useAnimatedReaction(
    () => scrollY.value,
    (currentScrollY) => {
      'worklet';
      if (currentScrollY > SCROLL_EXPANSION_THRESHOLD && !isExpanded && !isAnimating.current) {
        runOnJS(expandStats)();
      }
    }
  );

  // Simple mount effect - removed unnecessary dependencies (shared values don't change)
  useEffect(() => {
    // Start entrance animations immediately - no delay for faster perceived performance
    headerOpacity.value = withTiming(1, { duration: 800 });
    scoreScale.value = withDelay(200, withSpring(1, { damping: 15, stiffness: 150 }));
    cardsOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
    cardsTranslateY.value = withDelay(400, withSpring(0, { damping: 15, stiffness: 150 }));
    braggingCardsOpacity.value = withDelay(600, withTiming(1, { duration: 600 }));
    braggingCardsTranslateY.value = withDelay(600, withSpring(0, { damping: 15, stiffness: 150 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run on mount

  const handleMealsPress = useCallback(() => {
    Alert.alert('Meals Logged', 'Show detailed meals breakdown');
  }, []);

  const handleCaloriesPress = useCallback(() => {
    Alert.alert('Calories Tracked', 'Show detailed calorie analysis');
  }, []);

  const handleCuisinePress = useCallback(() => {
    Alert.alert('Cuisine Score', 'Show all cuisines explored');
  }, []);

  // Update bragging data when API data changes
  useEffect(() => {
    if (weeklySummaryData?.success && weeklySummaryData.data) {
      const weeklyData = weeklySummaryData.data;
      setBraggingData({
        weekMeals: weeklyData.week_meals || [],
        avgMeals: weeklyData.avg_meals || 0,
        kcalToday: weeklyData.kcal_today || 0,
        kcalYesterday: weeklyData.kcal_yesterday || 0,
        cuisines: weeklyData.cuisines || [],
      });
    }
  }, [weeklySummaryData]);

  const refreshBraggingData = useCallback(() => {
    if (isAnimating.current) return;
    
    isAnimating.current = true;
    
    // Refetch weekly summary data
    refetchWeeklySummary();
    
    // Animate the refresh
    braggingCardsOpacity.value = withTiming(0, { duration: 200 });
    braggingCardsTranslateY.value = withTiming(20, { duration: 200 }, () => {
      braggingCardsOpacity.value = withTiming(1, { duration: 300 });
      braggingCardsTranslateY.value = withSpring(0, { damping: 15, stiffness: 150 });
    });
    
    setTimeout(() => {
      isAnimating.current = false;
    }, 500);
  }, [braggingCardsOpacity, braggingCardsTranslateY, refetchWeeklySummary]);

  // Memoized scroll view props to prevent re-creation
  const scrollViewProps = useMemo(() => ({
    ref: scrollViewRef,
    style: { flex: 1, width: '100%' as const },
    showsVerticalScrollIndicator: false,
    contentContainerStyle: { paddingBottom: 100, width: '100%' as const },
    onScroll: scrollHandler,
    scrollEventThrottle: 16, // Optimized from 33 to 16 for smoother scrolling
    bounces: true,
    alwaysBounceVertical: true,
    removeClippedSubviews: true, // Enable view recycling
    maxToRenderPerBatch: 10, // Limit batch rendering
    windowSize: 5, // Reduce window size for better performance
  }), [scrollHandler]);

  // Automatically trigger sign-in when not authenticated (similar to app-wide behavior)
  // Make it non-dismissable so users can't dismiss and see forever loading
  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      navigateToSignIn({
        returnPath: '/(tabs)/profile',
        notDismissable: true,
      });
    }
  }, [isAuthenticated, authLoading]);

  return (
    <ProfileScreenBackground>
      <SafeAreaView style={styles.safeArea}>
        <Animated.ScrollView 
          {...scrollViewProps}
          scrollEnabled={isAuthenticated || authLoading}
        >
            {/* Header */}
            <Animated.View style={headerAnimatedStyle}>
              <View style={styles.headerContainer}>
                <Image 
                  source={require('../../assets/images/white-greenlogo.png')}
                  style={styles.headerLogo}
                  contentFit="contain"
                />
                <TouchableOpacity onPress={() => router.push('/account-details')}>
                  <Avatar 
                    size="md"
                    source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face' }}
                  />
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* ForkPrint Score and Tastemaker Section */}
            <Animated.View style={[scoreAnimatedStyle, resistanceAnimatedStyle]}>
              <View style={styles.scoreSectionContainer}>
                {!isAuthenticated || forkPrintLoading ? (
                  <ForkPrintScoreSkeleton />
                ) : forkPrintError ? (
                      <EmptyState
                        title="Unable to Load ForkPrint Score"
                        subtitle="Failed to load your ForkPrint score. Please try again."
                        icon="alert-circle-outline"
                        titleColor="#FFFFFF"
                        subtitleColor="rgba(255, 255, 255, 0.8)"
                        iconColor="#FFFFFF"
                        actionButton={{
                          label: "Retry",
                          onPress: () => refetchForkPrint(),
                        }}
                      />
                    ) : forkPrintData?.data ? (
                      <>
                        <View style={styles.scoreRow}>
                          <View style={styles.scoreContent}>
                            <Text style={styles.scoreLabel}>
                              Score
                            </Text>
                            
                            <ForkPrintImage />
                            
                            <Text style={styles.scoreValue}>
                              {forkPrintData.data.score}
                            </Text>
                          </View>
                        </View>
                        
                        <View style={styles.mascotContainer}>
                          <Mascot 
                            emotion="happy" 
                            size={280}
                            style={styles.mascotImage}
                          />
                          
                          <ThemedText style={styles.mascotStatus}>
                            {forkPrintData.data.status}
                          </ThemedText>
                          <ThemedText style={styles.mascotSubtext}>
                            {forkPrintData.data.points_to_next} Points to {forkPrintData.data.next_level}
                          </ThemedText>
                        </View>
                      </>
                    ) : null}
                  </View>
                </Animated.View>

            {/* Data Cards */}
            <Animated.View style={cardsAnimatedStyle}>
              <View style={styles.dataCardsContainer}>
                {!isAuthenticated || caloriesProgressLoading || noshPointsLoading ? (
                  <CaloriesNoshPointsSkeleton />
                ) : caloriesProgressError || noshPointsError ? (
                      <EmptyState
                        title="Unable to Load Progress Data"
                        subtitle="Failed to load calories and Nosh Points progress. Please try again."
                        icon="alert-circle-outline"
                        titleColor="#FFFFFF"
                        subtitleColor="rgba(255, 255, 255, 0.8)"
                        iconColor="#FFFFFF"
                        actionButton={{
                          label: "Retry",
                          onPress: () => {
                            refetchCaloriesProgress();
                            refetchNoshPoints();
                          },
                        }}
                      />
                    ) : caloriesProgressData?.data && noshPointsData?.data ? (
                      <CaloriesNoshPointsCards 
                        caloriesProgress={caloriesProgressData.data.progress_percentage ?? 0}
                        noshPointsProgress={noshPointsData.data.progress_percentage ?? 0}
                        availableCoins={noshPointsData.data.available_points}
                      />
                    ) : null}
                  </View>
                </Animated.View>

            {/* KPI Cards */}
            <Animated.View style={cardsAnimatedStyle}>
              <View style={styles.kpiCardsContainer}>
                {!isAuthenticated || monthlyOverviewLoading ? (
                  <KPICardsSkeleton />
                ) : monthlyOverviewError ? (
                      <EmptyState
                        title="Unable to Load Monthly Overview"
                        subtitle="Failed to load your monthly statistics. Please try again."
                        icon="alert-circle-outline"
                        titleColor="#FFFFFF"
                        subtitleColor="rgba(255, 255, 255, 0.8)"
                        iconColor="#FFFFFF"
                        actionButton={{
                          label: "Retry",
                          onPress: () => refetchMonthlyOverview(),
                        }}
                      />
                    ) : monthlyOverviewData?.data ? (
                      <KPICards
                        mealsLogged={monthlyOverviewData.data.meals?.count?.toString()}
                        caloriesTracked={monthlyOverviewData.data.calories?.tracked?.toString()}
                        streakDays={monthlyOverviewData.data.streak?.current?.toString()}
                      />
                    ) : null}
                  </View>
                </Animated.View>

            {/* Breakpoint Trigger Area */}
            {isAuthenticated && (
              <View style={styles.triggerArea}>
                <View style={styles.triggerContent}>
                  <Text style={styles.triggerText}>
                    Pull up to view your food stats
                  </Text>
                  <View style={styles.triggerIndicator} />
                </View>
              </View>
            )}

            {/* Bragging Cards Section - Sheet */}
            <GestureDetector gesture={sheetGesture}>
              <Animated.View style={[braggingCardsAnimatedStyle, statsSectionAnimatedStyle, sheetAnimatedStyle]}>
                <Animated.View style={[styles.sheetContent, sheetBackgroundAnimatedStyle]}>
                  {!isAuthenticated ? (
                    <BraggingCardsSkeleton />
                  ) : (
                    <>
                      <View style={styles.sheetHeader}>
                        <Text style={styles.sheetTitle}>
                          Your Food Stats
                        </Text>
                        <TouchableOpacity onPress={refreshBraggingData} activeOpacity={0.7}>
                          <Text style={styles.sheetRefresh}>
                            Refresh
                          </Text>
                        </TouchableOpacity>
                      </View>
                      
                      {weeklySummaryLoading ? (
                        <BraggingCardsSkeleton />
                      ) : weeklySummaryError ? (
                        <EmptyState
                          title="Unable to Load Weekly Summary"
                          subtitle="Failed to load your weekly food statistics. Please try again."
                          icon="alert-circle-outline"
                          titleColor="#FFFFFF"
                          subtitleColor="rgba(255, 255, 255, 0.8)"
                          iconColor="#FFFFFF"
                          actionButton={{
                            label: "Retry",
                            onPress: () => refetchWeeklySummary(),
                          }}
                        />
                      ) : braggingData.weekMeals.length > 0 || braggingData.cuisines.length > 0 ? (
                        <>
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
                        </>
                      ) : null}
                    </>
                  )}
                </Animated.View>
              </Animated.View>
            </GestureDetector>
            
            {/* Extra bottom padding for proper scrolling */}
            <View style={styles.bottomPadding} />
          </Animated.ScrollView>

          {/* Not Logged In Indicator - Pill shaped at bottom center */}
          {!isAuthenticated && !authLoading && (
            <View style={[styles.notLoggedInIndicator, { bottom: Math.max(insets.bottom, 20) + 100 }]}>
              <Text style={styles.notLoggedInText}>Not logged in</Text>
            </View>
          )}
        </SafeAreaView>
      </ProfileScreenBackground>
  );
}

// Styles extracted to prevent inline object creation on every render
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    width: '100%',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerLogo: {
    width: 120,
    height: 40,
  },
  forkPrintImage: {
    width: 170,
    height: 40,
  },
  scoreSectionContainer: {
    paddingHorizontal: 16,
    marginBottom: 30,
    marginTop: 20,
    position: 'relative',
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  scoreContent: {
    flex: 1,
    position: 'relative',
  },
  scoreLabel: {
    fontFamily: 'Mukta',
    fontStyle: 'normal',
    fontWeight: '800',
    fontSize: 20,
    lineHeight: 33,
    color: '#FFFFFF',
    marginBottom: -5,
    marginLeft: 80,
  },
  scoreValue: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 64,
    lineHeight: 77,
    color: '#FFFFFF',
    marginTop: 10,
  },
  mascotContainer: {
    position: 'absolute',
    top: -50,
    right: -50,
    alignItems: 'center',
    zIndex: 1,
  },
  mascotImage: {
    marginBottom: 10,
  },
  mascotStatus: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
    marginBottom: 5,
    position: 'absolute',
    bottom: 40,
    zIndex: 2,
    textAlign: 'right',
  },
  mascotSubtext: {
    fontSize: 12,
    color: 'white',
    opacity: 0.8,
    textAlign: 'right',
    position: 'absolute',
    bottom: 20,
    zIndex: 2,
  },
  dataCardsContainer: {
    paddingHorizontal: 16,
    marginBottom: 30,
    marginTop: 20,
    position: 'relative',
  },
  kpiCardsContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  triggerArea: {
    height: 100,
    justifyContent: 'flex-end',
  },
  triggerContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    alignItems: 'center',
  },
  triggerText: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.7,
    fontFamily: 'Mukta',
    textAlign: 'center',
  },
  triggerIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#FFFFFF',
    opacity: 0.3,
    borderRadius: 2,
    marginTop: 8,
  },
  sheetContent: {
    marginHorizontal: 0,
    marginBottom: 40,
    marginTop: 20,
    borderRadius: 16,
    padding: 16,
    minHeight: 200,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Mukta',
  },
  sheetRefresh: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    fontFamily: 'Mukta',
  },
  bottomPadding: {
    height: 200,
  },
  notLoggedInIndicator: {
    position: 'absolute',
    bottom: 20,
    left: '50%',
    transform: [{ translateX: -75 }], // Half of width (150/2)
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 150,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  notLoggedInText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Mukta',
    letterSpacing: 0.2,
  },
}); 