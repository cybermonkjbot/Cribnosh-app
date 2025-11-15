import { api } from '@/convex/_generated/api';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolate,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
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
import { KPICards } from '../../components/ui/KPICards';
import { ProfileScreenBackground } from '../../components/ui/ProfileScreenBackground';
import { QueryStateWrapper } from '../../components/ui/QueryStateWrapper';
import { useAuthContext } from '../../contexts/AuthContext';
import { useAnalytics } from '../../hooks/useAnalytics';
import { getSessionToken } from '../../lib/convexClient';
import { useQuery } from 'convex/react';
import { getAbsoluteImageUrl } from '../../utils/imageUrl';
import { navigateToSignIn } from '../../utils/signInNavigationGuard';

// Constants moved outside component to prevent recreation
const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_COLLAPSED_HEIGHT = 30; // Always visible collapsed height (shorter initial state)
const SHEET_EXPANDED_HEIGHT = Math.min(SCREEN_HEIGHT * 0.85, 600); // Max 85% of screen or 600px
const SHEET_SNAP_POINT = 200; // Distance to pull up to expand sheet
const VELOCITY_THRESHOLD = 500;

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

// Helper function to extract ForkPrint score data
const extractForkPrintScoreData = (forkPrintData: unknown) => {
  try {
    const data = (forkPrintData as any)?.data?.data || (forkPrintData as any)?.data;
    if (data && typeof data === 'object' && 'score' in data) {
      return {
        score: data.score ?? 0,
        status: data.status ?? 'Starter',
        pointsToNext: data.points_to_next ?? 100,
        nextLevel: data.next_level ?? 'Tastemaker',
      };
    }
    return null;
  } catch {
    return null;
  }
};

export default function ProfileScreen() {
  const { isAuthenticated, isLoading: authLoading } = useAuthContext();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Get session token for reactive queries
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  
  useEffect(() => {
    const loadToken = async () => {
      if (isAuthenticated) {
        const token = await getSessionToken();
        setSessionToken(token);
      } else {
        setSessionToken(null);
      }
    };
    loadToken();
  }, [isAuthenticated]);

  // Get user by session token (reactive query)
  const user = useQuery(
    api.queries.users.getUserBySessionToken,
    sessionToken ? { sessionToken } : "skip"
  );

  // Get user profile (reactive query)
  const profileDataRaw = useQuery(
    api.queries.users.getUserProfile,
    user?._id && sessionToken ? { userId: user._id, sessionToken } : "skip"
  );

  // Transform profile data to match expected format
  const profileData = useMemo(() => {
    if (!profileDataRaw) return null;
    return {
      data: {
        ...profileDataRaw,
      },
    };
  }, [profileDataRaw]);

  const profileLoading = user === undefined || (user && profileDataRaw === undefined);

  // Get ForkPrint score (reactive query)
  const forkPrintDataRaw = useQuery(
    api.queries.forkPrint.getScoreByUserId,
    user?._id ? { userId: user._id } : "skip"
  );

  // Transform ForkPrint data to match expected format
  const forkPrintData = useMemo(() => {
    if (!forkPrintDataRaw) return null;
    return {
      data: {
        data: forkPrintDataRaw,
      },
    };
  }, [forkPrintDataRaw]);

  const forkPrintLoading = user === undefined || (user && forkPrintDataRaw === undefined);
  const forkPrintError = user && forkPrintDataRaw === null ? new Error('Failed to get ForkPrint score') : null;

  // Get profile picture URL, converting relative URLs to absolute
  // Check multiple possible locations for the picture field
  const profilePictureUrl = useMemo(() => {
    if (!profileData?.data) {
      return undefined;
    }
    
    // Check multiple possible locations for the picture
    const picture = 
      profileData.data.picture || 
      (profileData.data as any)?.user?.picture || 
      (profileData.data as any)?.user?.avatar ||
      (profileData.data as any)?.avatar;
    
    if (picture) {
      const absoluteUrl = getAbsoluteImageUrl(picture);
      return absoluteUrl;
    }
    
    return undefined;
  }, [profileData?.data]);


  const { 
    getRewardsPoints, 
    getNutritionProgress, 
    getMonthlyOverview, 
    getWeeklySummary,
    isLoading: analyticsLoading 
  } = useAnalytics();

  const [noshPointsData, setNoshPointsData] = useState<any>(null);
  const [caloriesProgressData, setCaloriesProgressData] = useState<any>(null);
  const [monthlyOverviewData, setMonthlyOverviewData] = useState<any>(null);
  const [weeklySummaryData, setWeeklySummaryData] = useState<any>(null);
  
  const [noshPointsLoading, setNoshPointsLoading] = useState(false);
  const [caloriesProgressLoading, setCaloriesProgressLoading] = useState(false);
  const [monthlyOverviewLoading, setMonthlyOverviewLoading] = useState(false);
  const [weeklySummaryLoading, setWeeklySummaryLoading] = useState(false);

  const [noshPointsError, setNoshPointsError] = useState<any>(null);
  const [caloriesProgressError, setCaloriesProgressError] = useState<any>(null);
  const [monthlyOverviewError, setMonthlyOverviewError] = useState<any>(null);
  const [weeklySummaryError, setWeeklySummaryError] = useState<any>(null);

  // Load analytics data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadAnalyticsData();
    }
  }, [isAuthenticated]);

  const loadAnalyticsData = useCallback(async () => {
    // Load all analytics data in parallel
    const loadPromises = [
      (async () => {
        try {
          setNoshPointsLoading(true);
          setNoshPointsError(null);
          const result = await getRewardsPoints();
          if (result.success) {
            setNoshPointsData({ success: true, data: result.data });
          }
        } catch (error) {
          setNoshPointsError(error);
        } finally {
          setNoshPointsLoading(false);
        }
      })(),
      (async () => {
        try {
          setCaloriesProgressLoading(true);
          setCaloriesProgressError(null);
          const result = await getNutritionProgress();
          if (result.success) {
            setCaloriesProgressData({ success: true, data: result.data });
          }
        } catch (error) {
          setCaloriesProgressError(error);
        } finally {
          setCaloriesProgressLoading(false);
        }
      })(),
      (async () => {
        try {
          setMonthlyOverviewLoading(true);
          setMonthlyOverviewError(null);
          const result = await getMonthlyOverview();
          if (result.success) {
            setMonthlyOverviewData({ success: true, data: result.data });
          }
        } catch (error) {
          setMonthlyOverviewError(error);
        } finally {
          setMonthlyOverviewLoading(false);
        }
      })(),
      (async () => {
        try {
          setWeeklySummaryLoading(true);
          setWeeklySummaryError(null);
          const result = await getWeeklySummary();
          if (result.success) {
            setWeeklySummaryData({ success: true, data: result.data });
          }
        } catch (error) {
          setWeeklySummaryError(error);
        } finally {
          setWeeklySummaryLoading(false);
        }
      })(),
    ];

    await Promise.all(loadPromises);
  }, [getRewardsPoints, getNutritionProgress, getMonthlyOverview, getWeeklySummary]);

  const refetchNoshPoints = useCallback(() => {
    (async () => {
      try {
        setNoshPointsLoading(true);
        setNoshPointsError(null);
        const result = await getRewardsPoints();
        if (result.success) {
          setNoshPointsData({ success: true, data: result.data });
        }
      } catch (error) {
        setNoshPointsError(error);
      } finally {
        setNoshPointsLoading(false);
      }
    })();
  }, [getRewardsPoints]);

  const refetchCaloriesProgress = useCallback(() => {
    (async () => {
      try {
        setCaloriesProgressLoading(true);
        setCaloriesProgressError(null);
        const result = await getNutritionProgress();
        if (result.success) {
          setCaloriesProgressData({ success: true, data: result.data });
        }
      } catch (error) {
        setCaloriesProgressError(error);
      } finally {
        setCaloriesProgressLoading(false);
      }
    })();
  }, [getNutritionProgress]);

  const refetchMonthlyOverview = useCallback(() => {
    (async () => {
      try {
        setMonthlyOverviewLoading(true);
        setMonthlyOverviewError(null);
        const result = await getMonthlyOverview();
        if (result.success) {
          setMonthlyOverviewData({ success: true, data: result.data });
        }
      } catch (error) {
        setMonthlyOverviewError(error);
      } finally {
        setMonthlyOverviewLoading(false);
      }
    })();
  }, [getMonthlyOverview]);

  const refetchWeeklySummary = useCallback(() => {
    (async () => {
      try {
        setWeeklySummaryLoading(true);
        setWeeklySummaryError(null);
        const result = await getWeeklySummary();
        if (result.success) {
          setWeeklySummaryData({ success: true, data: result.data });
        }
      } catch (error) {
        setWeeklySummaryError(error);
      } finally {
        setWeeklySummaryLoading(false);
      }
    })();
  }, [getWeeklySummary]);
  
  // Simplified state management
  const isAnimating = useRef(false);
  
  // Animation values
  const headerOpacity = useSharedValue(0);
  const scoreScale = useSharedValue(0.8);
  const cardsTranslateY = useSharedValue(50);
  const cardsOpacity = useSharedValue(0);
  const braggingCardsTranslateY = useSharedValue(50);
  const braggingCardsOpacity = useSharedValue(0);
  
  // Sheet animation values - persistent sheet using height (like BottomSearchDrawer)
  const sheetHeight = useSharedValue(SHEET_COLLAPSED_HEIGHT); // Start collapsed (always visible)
  const currentSnapPoint = useSharedValue<'collapsed' | 'expanded'>('collapsed');
  const gestureStartHeight = useSharedValue(SHEET_COLLAPSED_HEIGHT);

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
  
  // Sheet animated styles - height-based like BottomSearchDrawer
  const sheetAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    const safeHeight = isFinite(sheetHeight.value) && sheetHeight.value >= 0 
      ? sheetHeight.value 
      : SHEET_COLLAPSED_HEIGHT;
    return {
      height: safeHeight,
    };
  });
  
  const sheetBackgroundAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    const height = sheetHeight.value;
    const safeHeight = isFinite(height) && height >= 0 ? height : SHEET_COLLAPSED_HEIGHT;
    // Calculate progress from collapsed to expanded
    const progress = (safeHeight - SHEET_COLLAPSED_HEIGHT) / (SHEET_EXPANDED_HEIGHT - SHEET_COLLAPSED_HEIGHT);
    const clampedProgress = Math.min(Math.max(progress, 0), 1);
    const opacity = 0.1 + (clampedProgress * 0.8);
    return {
      backgroundColor: `rgba(255, 255, 255, ${opacity})`,
    };
  });

  // Determine if sheet is collapsed (for conditional rendering)
  const isCollapsed = useDerivedValue(() => {
    return sheetHeight.value <= SHEET_COLLAPSED_HEIGHT + 20;
  });

  // Handlebar style - always visible
  const handlebarStyle = useAnimatedStyle(() => {
    'worklet';
    const width = interpolate(
      sheetHeight.value,
      [SHEET_COLLAPSED_HEIGHT, SHEET_EXPANDED_HEIGHT],
      [36, 48],
      Extrapolate.CLAMP
    );
    return {
      width,
      height: 4,
      borderRadius: 2,
      backgroundColor: 'rgba(255, 255, 255, 0.6)',
    };
  });

  // Header opacity - fade in when expanded
  const headerOpacityStyle = useAnimatedStyle(() => {
    'worklet';
    const progress = (sheetHeight.value - SHEET_COLLAPSED_HEIGHT) / (SHEET_EXPANDED_HEIGHT - SHEET_COLLAPSED_HEIGHT);
    const clampedProgress = Math.min(Math.max(progress, 0), 1);
    const opacity = interpolate(
      clampedProgress,
      [0, 0.3],
      [0, 1],
      Extrapolate.CLAMP
    );
    return {
      opacity,
      height: opacity > 0 ? 'auto' : 0,
    };
  });



  // Safe scroll to function - removed unused function

  // Sheet gesture handler - height-based like BottomSearchDrawer
  const springConfig = { damping: 50, stiffness: 400, mass: 0.8 };
  
  const sheetGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      // Store initial height when gesture starts
      gestureStartHeight.value = sheetHeight.value;
    })
    .onUpdate((event) => {
      'worklet';
      // Safeguard against invalid translation values
      // event.translationY: negative = dragging up (expand), positive = dragging down (collapse)
      // Dragging up decreases height (expands), dragging down increases height (collapses)
      const safeTranslationY = isFinite(event.translationY) ? event.translationY : 0;
      const startHeight = gestureStartHeight.value;
      // Dragging up (negative translationY) expands sheet (decreases height from start)
      // Dragging down (positive translationY) collapses sheet (increases height toward collapsed)
      const heightDelta = -safeTranslationY; // Negative translation = expand
      const newHeight = Math.max(
        SHEET_COLLAPSED_HEIGHT, 
        Math.min(SHEET_EXPANDED_HEIGHT, startHeight + heightDelta)
      );
      sheetHeight.value = newHeight;
    })
    .onEnd((event) => {
      'worklet';
      // Safeguard against invalid velocity values
      const safeVelocityY = isFinite(event.velocityY) ? event.velocityY : 0;
      const currentHeight = isFinite(sheetHeight.value) ? sheetHeight.value : SHEET_COLLAPSED_HEIGHT;
      const heightDelta = currentHeight - SHEET_COLLAPSED_HEIGHT;
      const hasSignificantVelocity = Math.abs(safeVelocityY) > VELOCITY_THRESHOLD;
      
      // Determine target snap point
      let targetHeight: number;
      let targetSnap: 'collapsed' | 'expanded';
      
      if (hasSignificantVelocity) {
        // Use velocity to determine direction
        if (safeVelocityY < 0) {
          // Swiping up - expand
          targetHeight = SHEET_EXPANDED_HEIGHT;
          targetSnap = 'expanded';
      } else {
          // Swiping down - collapse
          targetHeight = SHEET_COLLAPSED_HEIGHT;
          targetSnap = 'collapsed';
        }
      } else {
        // Use position to determine snap point
        const midPoint = (SHEET_COLLAPSED_HEIGHT + SHEET_EXPANDED_HEIGHT) / 2;
        if (currentHeight > midPoint || heightDelta > SHEET_SNAP_POINT) {
          targetHeight = SHEET_EXPANDED_HEIGHT;
          targetSnap = 'expanded';
        } else {
          targetHeight = SHEET_COLLAPSED_HEIGHT;
          targetSnap = 'collapsed';
        }
      }
      
      currentSnapPoint.value = targetSnap;
      sheetHeight.value = withSpring(targetHeight, springConfig);
      
      if (targetSnap === 'expanded') {
        runOnJS(safeHapticFeedback)(Haptics.ImpactFeedbackStyle.Medium);
      }
  });


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

  // Optimized data transformation - use useMemo instead of useEffect
  const braggingData = useMemo(() => {
    if (!weeklySummaryData?.success || !weeklySummaryData.data) {
      return {
        weekMeals: [],
        avgMeals: 0,
        kcalToday: 0,
        kcalYesterday: 0,
        cuisines: [],
      };
    }
      const weeklyData = weeklySummaryData.data;
    return {
        weekMeals: weeklyData.week_meals || [],
        avgMeals: weeklyData.avg_meals || 0,
        kcalToday: weeklyData.kcal_today || 0,
        kcalYesterday: weeklyData.kcal_yesterday || 0,
        cuisines: weeklyData.cuisines || [],
    };
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
    bounces: true,
    alwaysBounceVertical: true,
    removeClippedSubviews: true, // Enable view recycling
    maxToRenderPerBatch: 10, // Limit batch rendering
    windowSize: 5, // Reduce window size for better performance
  }), []);

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
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
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
                {isAuthenticated && (
                  <TouchableOpacity onPress={() => router.push('/account-details')}>
                    <Avatar 
                      size="md"
                      source={profilePictureUrl ? { uri: profilePictureUrl } : undefined}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>

            {/* ForkPrint Score and Tastemaker Section */}
            <Animated.View style={scoreAnimatedStyle}>
              <View style={styles.scoreSectionContainer}>
                <QueryStateWrapper
                  isLoading={!isAuthenticated || forkPrintLoading}
                  error={forkPrintError}
                  isEmpty={!extractForkPrintScoreData(forkPrintData)}
                  errorTitle="Unable to Load ForkPrint Score"
                  errorSubtitle="Failed to load your ForkPrint score. Please try again."
                  onRetry={() => {
                    // Query will automatically refetch when dependencies change
                    // Force a refresh by navigating away and back, or just reload
                    if (user) {
                      // The useQuery hook will automatically refetch
                      // This is a no-op since convex queries are reactive
                    }
                  }}
                >
                  {(() => {
                    const scoreData = extractForkPrintScoreData(forkPrintData);
                    if (!scoreData) return null;
                    
                          return (
                            <>
                              <View style={styles.scoreRow}>
                                <View style={styles.scoreContent}>
                            <Text style={styles.scoreLabel}>Score</Text>
                                  <ForkPrintImage />
                            <Text style={styles.scoreValue}>{scoreData.score}</Text>
                                </View>
                              </View>
                              
                              <View style={styles.mascotContainer}>
                                <Mascot 
                                  emotion="happy" 
                                  size={280}
                                  style={styles.mascotImage}
                                />
                                <ThemedText style={styles.mascotStatus}>
                            {scoreData.status}
                                </ThemedText>
                                <ThemedText style={styles.mascotSubtext}>
                            {scoreData.pointsToNext} Points to {scoreData.nextLevel}
                                </ThemedText>
                              </View>
                            </>
                          );
                    })()}
                </QueryStateWrapper>
                  </View>
                </Animated.View>

            {/* Data Cards */}
            <Animated.View style={cardsAnimatedStyle}>
              <View style={styles.dataCardsContainer}>
                <QueryStateWrapper
                  isLoading={!isAuthenticated || caloriesProgressLoading || noshPointsLoading}
                  error={caloriesProgressError || noshPointsError}
                  isEmpty={!caloriesProgressData?.data || !noshPointsData?.data}
                  errorTitle="Unable to Load Progress Data"
                  errorSubtitle="Failed to load calories and Nosh Points progress. Please try again."
                  onRetry={() => {
                            refetchCaloriesProgress();
                            refetchNoshPoints();
                        }}
                >
                      <CaloriesNoshPointsCards 
                        caloriesProgress={caloriesProgressData?.data?.progress_percentage ?? 0}
                        noshPointsProgress={noshPointsData?.data?.progress_percentage ?? 0}
                        availableCoins={noshPointsData?.data?.available_points}
                      />
                </QueryStateWrapper>
                  </View>
                </Animated.View>

            {/* KPI Cards */}
            <Animated.View style={cardsAnimatedStyle}>
              <View style={styles.kpiCardsContainer}>
                <QueryStateWrapper
                  isLoading={!isAuthenticated || monthlyOverviewLoading}
                  error={monthlyOverviewError}
                  isEmpty={!monthlyOverviewData?.data}
                  errorTitle="Unable to Load Monthly Overview"
                  errorSubtitle="Failed to load your monthly statistics. Please try again."
                  onRetry={() => refetchMonthlyOverview()}
                >
                      <KPICards
                        mealsLogged={monthlyOverviewData?.data?.meals?.count?.toString()}
                        caloriesTracked={monthlyOverviewData?.data?.calories?.tracked?.toString()}
                        streakDays={monthlyOverviewData?.data?.streak?.current?.toString()}
                      />
                </QueryStateWrapper>
                  </View>
                </Animated.View>

            {/* Extra bottom padding for proper scrolling */}
            <View style={styles.bottomPadding} />
          </Animated.ScrollView>

          {/* Bragging Cards Section - Sheet (Positioned absolutely at bottom) */}
            <GestureDetector gesture={sheetGesture}>
            <Animated.View style={[styles.sheetContainer, sheetAnimatedStyle]}>
                <Animated.View style={[styles.sheetContent, sheetBackgroundAnimatedStyle]}>
                  <>
                    {/* Handlebar - Always visible */}
                    <View style={styles.handlebarContainer}>
                      <Animated.View style={handlebarStyle} />
                    </View>

                    {/* Header - Only visible when expanded */}
                    <Animated.View style={[styles.sheetHeader, headerOpacityStyle]}>
                        <Text style={styles.sheetTitle}>
                          Your Food Stats
                        </Text>
                        <TouchableOpacity onPress={refreshBraggingData} activeOpacity={0.7}>
                          <Text style={styles.sheetRefresh}>
                            Refresh
                          </Text>
                        </TouchableOpacity>
                    </Animated.View>
                      
                    <ScrollView
                      style={styles.sheetScrollView}
                      contentContainerStyle={styles.sheetScrollContent}
                      showsVerticalScrollIndicator={false}
                      nestedScrollEnabled={true}
                    >
                      <QueryStateWrapper
                        isLoading={weeklySummaryLoading}
                        error={weeklySummaryError}
                        isEmpty={(braggingData.weekMeals?.length ?? 0) === 0 && (braggingData.cuisines?.length ?? 0) === 0}
                        errorTitle="Unable to Load Weekly Summary"
                        errorSubtitle="Failed to load your weekly food statistics. Please try again."
                        onRetry={() => refetchWeeklySummary()}
                      >
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
                      </QueryStateWrapper>
                    </ScrollView>
                  </>
                </Animated.View>
              </Animated.View>
            </GestureDetector>

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
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 20,
    overflow: 'hidden',
  },
  sheetContent: {
    marginHorizontal: 0,
    marginBottom: 0,
    marginTop: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    paddingTop: 12,
    flex: 1,
    overflow: 'hidden',
  },
  handlebarContainer: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  sheetScrollView: {
    flex: 1,
  },
  sheetScrollContent: {
    paddingBottom: 20,
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
    color: '#094327', // Cribnosh green
    fontFamily: 'Mukta',
  },
  sheetRefresh: {
    fontSize: 14,
    color: '#094327', // Cribnosh green
    opacity: 0.8,
    fontFamily: 'Mukta',
  },
  bottomPadding: {
    height: 200,
  },
  notLoggedInIndicator: {
    position: 'absolute',
    bottom: 140,
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