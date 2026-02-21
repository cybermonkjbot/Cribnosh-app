import { KitchenSetupSheet } from '@/components/KitchenSetupSheet';
import { NotLoggedInNotice } from '@/components/NotLoggedInNotice';
import { OnboardingNoticeBanner } from '@/components/OnboardingNoticeBanner';
import { OnlineOfflineToggle } from '@/components/OnlineOfflineToggle';
import { CameraModalScreen } from '@/components/ui/CameraModalScreen';
import { Card } from '@/components/ui/Card';
import { CreateMealModal } from '@/components/ui/CreateMealModal';
import { CreateRecipeModal } from '@/components/ui/CreateRecipeModal';
import { CreateStoryModal } from '@/components/ui/CreateStoryModal';
import { CribNoshLogo } from '@/components/ui/CribNoshLogo';
import { EmptyState } from '@/components/ui/EmptyState';
import { FloatingActionButton } from '@/components/ui/FloatingActionButton';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { NotificationsSheet } from '@/components/ui/NotificationsSheet';
import { PremiumHeader } from '@/components/ui/PremiumHeader';
import { useFoodCreatorAuth } from '@/contexts/FoodCreatorAuthContext';
import { api } from '@/convex/_generated/api';
import { useToast } from '@/lib/ToastContext';
import { BlurEffect } from '@/utils/blurEffects';
import { useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { ArrowRight, Bell } from 'lucide-react-native';
import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

// Helper function to get order status style
const getOrderStatusStyle = (status: string) => {
  const statusLower = status.toLowerCase();
  const statusMap: Record<string, { backgroundColor: string; color: string }> = {
    pending: { backgroundColor: '#FEF3C7', color: '#92400E' },
    confirmed: { backgroundColor: '#DBEAFE', color: '#1E40AF' },
    preparing: { backgroundColor: '#E0E7FF', color: '#3730A3' },
    ready: { backgroundColor: '#D1FAE5', color: '#065F46' },
    completed: { backgroundColor: '#D1FAE5', color: '#065F46' },
    cancelled: { backgroundColor: '#FEE2E2', color: '#991B1B' },
  };
  return statusMap[statusLower] || { backgroundColor: '#F3F4F6', color: '#6B7280' };
};

export default function FoodCreatorDashboard() {
  const { foodCreator, user, sessionToken, isAuthenticated, isBasicOnboardingComplete, isOnboardingComplete } = useFoodCreatorAuth();
  const router = useRouter();
  const { showSuccess } = useToast();

  const handleSignInPress = () => {
    router.push({
      pathname: '/sign-in',
      params: { notDismissable: 'true' }
    });
  };
  const scrollY = useSharedValue(0);
  const [isHeaderSticky, setIsHeaderSticky] = React.useState(false);
  const [isCameraVisible, setIsCameraVisible] = React.useState(false);
  const [autoShowLiveStreamSetup, setAutoShowLiveStreamSetup] = React.useState(false);
  const [isRecipeModalVisible, setIsRecipeModalVisible] = React.useState(false);
  const [isStoryModalVisible, setIsStoryModalVisible] = React.useState(false);
  const [isMealModalVisible, setIsMealModalVisible] = React.useState(false);
  const [isNotificationsSheetVisible, setIsNotificationsSheetVisible] = useState(false);
  const [isSetupSheetVisible, setIsSetupSheetVisible] = useState(false);

  // Get recent orders
  const recentOrders = useQuery(
    api.queries.orders.listByFoodCreatorId,
    foodCreator?._id && sessionToken
      ? { foodCreatorId: foodCreator._id.toString(), limit: 5, sessionToken }
      : 'skip'
  );

  // Get food creator analytics for earnings
  const analytics = useQuery(
    api.queries.analytics.getFoodCreatorAnalytics,
    foodCreator?._id && sessionToken
      ? { foodCreatorId: foodCreator._id, timeRange: '30d', sessionToken }
      : 'skip'
  );

  const updateHeaderStickyState = React.useCallback((sticky: boolean) => {
    setIsHeaderSticky(sticky);
  }, []);

  const stickyHeaderOpacity = useSharedValue(0);
  const normalHeaderOpacity = useSharedValue(1);
  const isHeaderStickyShared = useSharedValue(false);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      "worklet";
      const scrollPosition = event.contentOffset.y;
      scrollY.value = scrollPosition;

      const STICKY_THRESHOLD = 100;
      const shouldBeSticky = scrollPosition > STICKY_THRESHOLD;
      const isAtTop = scrollPosition <= 2;

      if (shouldBeSticky !== isHeaderStickyShared.value) {
        isHeaderStickyShared.value = shouldBeSticky;
        runOnJS(updateHeaderStickyState)(shouldBeSticky);

        if (shouldBeSticky) {
          stickyHeaderOpacity.value = withTiming(1, { duration: 200 });
          normalHeaderOpacity.value = withTiming(0, { duration: 200 });
        } else {
          stickyHeaderOpacity.value = withTiming(0, { duration: 200 });
          normalHeaderOpacity.value = withTiming(1, { duration: 200 });
        }
      } else if (isAtTop && isHeaderStickyShared.value) {
        isHeaderStickyShared.value = false;
        runOnJS(updateHeaderStickyState)(false);
        stickyHeaderOpacity.value = withTiming(0, { duration: 200 });
        normalHeaderOpacity.value = withTiming(1, { duration: 200 });
      }
    },
  });

  // Sticky header styles
  const stickyHeaderStyle = useAnimatedStyle(() => {
    return {
      opacity: stickyHeaderOpacity.value,
    };
  });

  const normalHeaderStyle = useAnimatedStyle(() => {
    return {
      opacity: normalHeaderOpacity.value,
    };
  });

  // Logo scale animation for sticky state
  const logoScale = useSharedValue(1);
  React.useEffect(() => {
    if (isHeaderSticky) {
      logoScale.value = withTiming(0.73, { duration: 300, easing: Easing.inOut(Easing.ease) });
    } else {
      logoScale.value = withTiming(1, { duration: 300, easing: Easing.inOut(Easing.ease) });
    }
  }, [isHeaderSticky]);

  const logoAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: logoScale.value }],
    };
  });

  const welcomeAnimatedStyle = useAnimatedStyle(() => {
    const opacity = isHeaderSticky ? 0 : 1;
    return {
      opacity: withTiming(opacity, { duration: 300 }),
    };
  });


  if (!foodCreator) {
    return (
      <GradientBackground>
        <EmptyState
          title="Loading..."
          subtitle="Please wait while we load your dashboard"
          icon="receipt-outline"
        />
      </GradientBackground>
    );
  }

  // Render header content
  const renderHeaderContent = (isSticky: boolean) => (
    <>
      {/* Logo and Icons Row */}
      <View style={isSticky ? styles.logoIconsRowSticky : styles.logoIconsRow}>
        <Animated.View style={logoAnimatedStyle}>
          <CribNoshLogo size={isSticky ? 88 : 120} variant="default" />
        </Animated.View>

        <View style={styles.iconsContainer}>
          <TouchableOpacity
            onPress={() => setIsNotificationsSheetVisible(true)}
            style={styles.iconButton}
          >
            <Bell size={24} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      {!isSticky && (
        <>
          <PremiumHeader
            title="Food Creator Dashboard"
            showInfoButton={false}
          />
          <Animated.View style={welcomeAnimatedStyle}>
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>Welcome back, {foodCreator?.name || user?.name}</Text>
            </View>
          </Animated.View>
        </>
      )}
    </>
  );

  return (
    <GradientBackground>
      {/* Sticky Header - positioned above normal header */}
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            pointerEvents: isHeaderSticky ? "auto" : "none",
          },
          stickyHeaderStyle,
        ]}
      >
        <BlurEffect intensity={80} tint="light" useGradient={true} style={styles.stickyHeaderBlur}>
          <View style={styles.stickyHeaderContent}>
            {renderHeaderContent(true)}
          </View>
        </BlurEffect>
      </Animated.View>

      {/* Normal Header - positioned below sticky header */}
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 999,
            pointerEvents: !isHeaderSticky ? "auto" : "none",
          },
          normalHeaderStyle,
        ]}
      >
        {renderHeaderContent(false)}
      </Animated.View>

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Not Logged In Notice */}
        {!isAuthenticated && (
          <NotLoggedInNotice onSignInPress={handleSignInPress} />
        )}

        {/* Onboarding Notice Banner */}
        {isAuthenticated && (!isBasicOnboardingComplete || !isOnboardingComplete) && (
          <OnboardingNoticeBanner
            isBasicOnboardingComplete={isBasicOnboardingComplete}
            isOnboardingComplete={isOnboardingComplete}
            onPress={() => setIsSetupSheetVisible(true)}
          />
        )}

        {/* Online/Offline Toggle */}
        {foodCreator?._id && isAuthenticated && (
          <View style={styles.toggleContainer}>
            <OnlineOfflineToggle
              foodCreatorId={foodCreator._id}
              isOnline={foodCreator.isAvailable || false}
              sessionToken={sessionToken || undefined}
              onShowSetup={() => setIsSetupSheetVisible(true)}
            />
          </View>
        )}

        {/* Earnings Summary - Only show when authenticated */}
        {isAuthenticated && (
          <View style={styles.earningsCard}>
            <View style={styles.earningsHeader}>
              <View style={styles.earningsInfo}>
                <Text style={styles.earningsLabel}>Revenue</Text>
                <Text style={styles.earningsValue}>
                  £{analytics ? (analytics.totalRevenue / 100).toFixed(2) : '0.00'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/earnings')}
                style={styles.earningsButton}
              >
                <Text style={styles.earningsButtonText}>View Earnings</Text>
                <ArrowRight size={16} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Recent Orders - Only show when authenticated */}
        {isAuthenticated && (
          <View style={styles.ordersSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Orders</Text>
              {recentOrders && recentOrders.length > 0 && (
                <TouchableOpacity onPress={() => router.push('/(tabs)/orders')}>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              )}
            </View>
            {recentOrders && recentOrders.length > 0 ? (
              recentOrders.map((order: any) => {
                const statusStyle = getOrderStatusStyle(order.order_status || 'pending');
                return (
                  <TouchableOpacity
                    key={order._id}
                    onPress={() => router.push(`/(tabs)/orders/${order._id}`)}
                  >
                    <Card
                      style={styles.orderCard}
                    >
                      <View style={styles.orderInfo}>
                        <View style={styles.orderLeft}>
                          <Text style={styles.orderNumber}>
                            Order #{order.order_id || order.orderNumber || order._id.slice(-8)}
                          </Text>
                          <Text style={styles.orderDate}>
                            {new Date(order.createdAt || Date.now()).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Text>
                        </View>
                        <View style={[styles.orderStatusBadge, { backgroundColor: `${statusStyle.color}20` }]}>
                          <Text style={[styles.orderStatusText, { color: statusStyle.color }]}>
                            {order.order_status || 'pending'}
                          </Text>
                        </View>
                      </View>
                      {order.total_amount && (
                        <View style={styles.orderAmount}>
                          <Text style={styles.orderAmountText}>
                            £{(order.total_amount / 100).toFixed(2)}
                          </Text>
                        </View>
                      )}
                    </Card>
                  </TouchableOpacity>
                );
              })
            ) : (
              <EmptyState
                title="No recent orders"
                subtitle="You haven't received any orders yet. Start accepting orders to see them here."
                icon="receipt-outline"
                style={{ paddingVertical: 40 }}
              />
            )}
          </View>
        )}

        {/* Quick Actions - Only show when authenticated */}
        {isAuthenticated && (
          <View style={styles.quickActionsSection}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsRow}>
              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => router.push('/(tabs)/orders')}
              >
                <Text style={styles.quickActionText}>Orders</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => router.push('/(tabs)/meals')}
              >
                <Text style={styles.quickActionText}>Meals</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Animated.ScrollView>

      {/* Floating Action Button */}
      {isAuthenticated && (
        <FloatingActionButton
          bottomPosition={2}
          onCameraPress={() => {
            setAutoShowLiveStreamSetup(false);
            setIsCameraVisible(true);
          }}
          onRecipePress={() => {
            setIsRecipeModalVisible(true);
          }}
          onLiveStreamPress={() => {
            router.push('/(tabs)/food-creator/live' as any);
          }}
          onStoryPress={() => {
            setIsStoryModalVisible(true);
          }}
        />
      )}

      {/* Camera Modal for Live Streaming */}
      {isAuthenticated && (
        <Modal
          visible={isCameraVisible}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setIsCameraVisible(false)}
          statusBarTranslucent={true}
          hardwareAccelerated={true}
        >
          <CameraModalScreen
            onClose={() => {
              setIsCameraVisible(false);
              setAutoShowLiveStreamSetup(false);
            }}
            onStartLiveStream={(sessionId, liveSessionId) => {
              // Close camera and navigate to live stream screen
              setIsCameraVisible(false);
              setAutoShowLiveStreamSetup(false);
              if (liveSessionId) {
                router.push(`/(tabs)/food-creator/live/${liveSessionId}` as any);
                showSuccess('Live Session Started', 'Your live session is now live!');
              } else {
                showSuccess('Live Session Started', 'Your live session has been created successfully!');
              }
            }}
            autoShowLiveStreamSetup={autoShowLiveStreamSetup}
          />
        </Modal>
      )}

      {/* Recipe Creation Modal */}
      <CreateRecipeModal
        isVisible={isRecipeModalVisible}
        onClose={() => setIsRecipeModalVisible(false)}
      />

      {/* Story Creation Modal */}
      <CreateStoryModal
        isVisible={isStoryModalVisible}
        onClose={() => setIsStoryModalVisible(false)}
      />

      {/* Meal Creation Modal */}
      <CreateMealModal
        isVisible={isMealModalVisible}
        onClose={() => setIsMealModalVisible(false)}
      />

      {/* Notifications Sheet */}
      <NotificationsSheet
        isVisible={isNotificationsSheetVisible}
        onClose={() => setIsNotificationsSheetVisible(false)}
      />

      {/* Kitchen Setup Sheet */}
      <KitchenSetupSheet
        isVisible={isSetupSheetVisible}
        onClose={() => setIsSetupSheetVisible(false)}
      />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 160, // Fixed padding for header height (header is absolutely positioned)
    paddingBottom: 120, // Account for tab bar
  },
  logoIconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  logoIconsRowSticky: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  stickyHeaderBlur: {
    borderRadius: 0,
  },
  stickyHeaderContent: {
    paddingBottom: 12,
  },
  iconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeContainer: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  welcomeText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  toggleContainer: {
    marginBottom: 20,
  },
  earningsCard: {
    padding: 20,
    marginBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  earningsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  earningsInfo: {
    flex: 1,
  },
  earningsLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  earningsValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#031D11',
  },
  earningsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 12,
  },
  earningsButtonText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '600',
  },
  ordersSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#031D11',
  },
  viewAllText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '600',
  },
  orderCard: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  orderLeft: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#031D11',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  orderStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  orderStatusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  orderAmount: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(229, 231, 235, 0.5)',
  },
  orderAmountText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },
  quickActionsSection: {
    marginBottom: 24,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  quickActionCard: {
    flex: 1,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#031D11',
  },
});
