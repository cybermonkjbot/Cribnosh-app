import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useChefAuth } from '@/contexts/ChefAuthContext';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { ArrowLeft, Wallet } from 'lucide-react-native';
import { BlurEffect } from '@/utils/blurEffects';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  runOnJS,
  useDerivedValue,
} from 'react-native-reanimated';

type TimeRange = '7d' | '30d' | '90d';

export default function EarningsScreen() {
  const { chef, sessionToken } = useChefAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');

  const analytics = useQuery(
    api.queries.analytics.getChefAnalytics,
    chef?._id
      ? { chefId: chef._id, timeRange }
      : 'skip'
  ) as any;

  const formatAmount = (amount: number) => {
    return `£${(amount / 100).toFixed(2)}`;
  };

  const formatGrowth = (growth: number) => {
    const sign = growth >= 0 ? '+' : '';
    return `${sign}${growth.toFixed(1)}%`;
  };

  // Process daily revenue data for chart
  const dailyRevenueData = useMemo(() => {
    if (!analytics?.dailyOrders || analytics.dailyOrders.length === 0) {
      return { dailyRevenues: [], averageRevenue: 0, maxRevenue: 0 };
    }

    const dailyRevenues = analytics.dailyOrders.map((day: any) => day.revenue || 0);
    const totalRevenue = dailyRevenues.reduce((sum: number, rev: number) => sum + rev, 0);
    const averageRevenue = dailyRevenues.length > 0 ? totalRevenue / dailyRevenues.length : 0;
    const maxRevenue = Math.max(...dailyRevenues, averageRevenue);

    return { dailyRevenues, averageRevenue, maxRevenue };
  }, [analytics?.dailyOrders]);

  // Get day labels based on time range
  const getDayLabels = () => {
    const labels = [];
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const count = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    
    if (count === 7) {
      return days;
    } else {
      // For longer ranges, show abbreviated dates
      const today = new Date();
      for (let i = count - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        labels.push(date.getDate().toString());
      }
      return labels;
    }
  };

  if (!chef) {
    return (
      <GradientBackground>
        <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
          <ActivityIndicator size="large" color="#0B9E58" />
          <Text style={styles.loadingText}>Loading earnings...</Text>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 20 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#094327" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Earnings</Text>
          </View>
          <TouchableOpacity
            style={styles.headerTransactionsButton}
            onPress={() => router.push('/(tabs)/earnings/transactions')}
            activeOpacity={0.8}
          >
            <Text style={styles.headerTransactionsButtonText}>Transactions</Text>
          </TouchableOpacity>
        </View>

        {/* Time Range Selector */}
        <View style={styles.timeRangeContainer}>
          <TouchableOpacity
            onPress={() => setTimeRange('7d')}
            style={[
              styles.timeRangeButton,
              timeRange === '7d' && styles.timeRangeButtonActive
            ]}
          >
            <Text
              style={[
                styles.timeRangeText,
                timeRange === '7d' && styles.timeRangeTextActive
              ]}
            >
              7 Days
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTimeRange('30d')}
            style={[
              styles.timeRangeButton,
              timeRange === '30d' && styles.timeRangeButtonActive
            ]}
          >
            <Text
              style={[
                styles.timeRangeText,
                timeRange === '30d' && styles.timeRangeTextActive
              ]}
            >
              30 Days
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTimeRange('90d')}
            style={[
              styles.timeRangeButton,
              timeRange === '90d' && styles.timeRangeButtonActive
            ]}
          >
            <Text
              style={[
                styles.timeRangeText,
                timeRange === '90d' && styles.timeRangeTextActive
              ]}
            >
              90 Days
            </Text>
          </TouchableOpacity>
        </View>

        {/* Total Revenue Card */}
        <View style={styles.revenueCard}>
          <Text style={styles.revenueLabel}>Total Revenue</Text>
          <Text style={styles.revenueAmount}>
            {analytics ? formatAmount(analytics.totalRevenue || 0) : '£0.00'}
          </Text>
          {analytics && analytics.revenueGrowth !== undefined && (
            <Text style={styles.growthText}>
              {formatGrowth(analytics.revenueGrowth || 0)} from previous period
            </Text>
          )}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {/* Total Orders Card */}
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{analytics?.totalOrders || 0}</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
            {analytics && analytics.orderGrowth !== undefined && (
              <Text style={styles.statGrowthText}>
                {formatGrowth(analytics.orderGrowth || 0)}
              </Text>
            )}
          </View>

          {/* Average Rating Card */}
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {analytics?.averageRating ? analytics.averageRating.toFixed(1) : '0.0'}
            </Text>
            <Text style={styles.statLabel}>Average Rating</Text>
            <Text style={styles.statSubtext}>
              {analytics?.totalReviews || 0} reviews
            </Text>
          </View>
        </View>

        {/* Daily Revenue Section */}
        {analytics?.dailyOrders && analytics.dailyOrders.length > 0 && (
          <DailyRevenueChart
            dailyRevenues={dailyRevenueData.dailyRevenues}
            averageRevenue={dailyRevenueData.averageRevenue}
            maxRevenue={dailyRevenueData.maxRevenue}
            dayLabels={getDayLabels()}
            formatAmount={formatAmount}
          />
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.actionButtonsContainer, { bottom: insets.bottom + 20 }]}>
        <TouchableOpacity
          style={styles.viewTaxesButton}
          onPress={() => router.push('/(tabs)/earnings/taxes')}
          activeOpacity={0.8}
        >
          <Text style={styles.viewTaxesButtonText}>Tax Info</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.floatingPayoutButton}
          onPress={() => router.push('/payout-settings')}
          activeOpacity={0.8}
        >
          <BlurEffect
            intensity={20}
            tint="light"
            useGradient={true}
            backgroundColor="rgba(255, 59, 48, 0.75)"
            style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, { zIndex: 0 }]}
          />
          <View style={styles.payoutButtonContent}>
            <Wallet size={18} color="#FFFFFF" />
            <Text style={styles.payoutButtonText}>Payout</Text>
          </View>
        </TouchableOpacity>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    width: 40,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#031D11',
  },
  headerTransactionsButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTransactionsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#094327',
    fontFamily: 'Inter',
  },
  timeRangeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeRangeButtonActive: {
    backgroundColor: '#094327',
  },
  timeRangeText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  timeRangeTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  revenueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  revenueLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    fontFamily: 'Inter',
    fontWeight: '400',
  },
  revenueAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#094327',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  growthText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter',
    fontWeight: '400',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#094327',
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
    fontFamily: 'Inter',
    fontWeight: '400',
  },
  statSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Inter',
    fontWeight: '400',
  },
  statGrowthText: {
    fontSize: 12,
    color: '#0B9E58',
    fontWeight: '600',
    fontFamily: 'Inter',
    marginTop: 4,
  },
  dailyRevenueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#094327',
    marginBottom: 16,
    fontFamily: 'Archivo',
  },
  actionButtonsContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    gap: 12,
    zIndex: 999,
    alignItems: 'center',
  },
  viewTaxesButton: {
    flex: 1,
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  viewTaxesButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#094327',
    fontFamily: 'Inter',
  },
  floatingPayoutButton: {
    height: 40,
    minWidth: 100,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 59, 48, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    flexDirection: 'row',
    gap: 8,
  },
  payoutButtonContent: {
    position: 'relative',
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  payoutButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
});

// Daily Revenue Chart Component
interface DailyRevenueChartProps {
  dailyRevenues: number[];
  averageRevenue: number;
  maxRevenue: number;
  dayLabels: string[];
  formatAmount: (amount: number) => string;
}

const DailyRevenueChart: React.FC<DailyRevenueChartProps> = ({
  dailyRevenues,
  averageRevenue,
  maxRevenue,
  dayLabels,
  formatAmount,
}) => {
  const barsProgress = useSharedValue(0);
  const averageLineProgress = useSharedValue(0);
  const [barsProgressState, setBarsProgressState] = useState(0);
  const [averageLineProgressState, setAverageLineProgressState] = useState(0);

  useDerivedValue(() => {
    runOnJS(setBarsProgressState)(barsProgress.value);
  }, [barsProgress]);

  useDerivedValue(() => {
    runOnJS(setAverageLineProgressState)(averageLineProgress.value);
  }, [averageLineProgress]);

  useEffect(() => {
    barsProgress.value = withDelay(200, withTiming(1, { duration: 800 }));
    averageLineProgress.value = withDelay(400, withTiming(1, { duration: 400 }));
  }, []);

  const barHeight = (value: number) => {
    if (maxRevenue === 0) return 0;
    return (value / maxRevenue) * 60; // Max bar height of 60
  };

  // For longer ranges, show fewer bars (sample the data)
  const displayData = useMemo(() => {
    if (dailyRevenues.length <= 7) {
      return dailyRevenues;
    }
    // Sample data for 30d and 90d - show every nth day
    const step = Math.ceil(dailyRevenues.length / 7);
    const sampled = [];
    for (let i = 0; i < dailyRevenues.length; i += step) {
      sampled.push(dailyRevenues[i]);
    }
    return sampled.slice(0, 7);
  }, [dailyRevenues]);

  const displayLabels = useMemo(() => {
    if (dayLabels.length <= 7) {
      return dayLabels;
    }
    // Sample labels to match sampled data
    const step = Math.ceil(dayLabels.length / 7);
    const sampled = [];
    for (let i = 0; i < dayLabels.length; i += step) {
      sampled.push(dayLabels[i]);
    }
    return sampled.slice(0, 7);
  }, [dayLabels]);

  return (
    <View style={chartStyles.container}>
      <Text style={chartStyles.title}>Daily Revenue</Text>
      
      <View style={chartStyles.separator} />

      <View style={chartStyles.chartSection}>
        {/* Average Display */}
        <View style={chartStyles.averageContainer}>
          <Text style={chartStyles.averageLabel}>Daily Average</Text>
          <Text style={chartStyles.averageValue}>
            {formatAmount(averageRevenue)}
          </Text>
        </View>

        {/* Bar Chart */}
        <View style={chartStyles.chartContainer}>
          <View style={chartStyles.chart}>
            {/* Daily Bars */}
            <View style={chartStyles.barsContainer}>
              {displayData.map((revenue, index) => {
                const animatedHeight = maxRevenue > 0 
                  ? barHeight(revenue) * barsProgressState 
                  : 0;
                return (
                  <Animated.View
                    key={index}
                    style={[
                      chartStyles.bar,
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
            {maxRevenue > 0 && (
              <Animated.View
                style={[
                  chartStyles.averageLine,
                  {
                    width: `${averageLineProgressState * 100}%`,
                    bottom: `${(barHeight(averageRevenue) / 60) * 100}%`,
                  }
                ]}
              />
            )}
          </View>

          {/* Day Labels */}
          <View style={chartStyles.dayLabels}>
            {displayLabels.map((label, index) => (
              <Text key={index} style={chartStyles.dayLabel}>
                {label}
              </Text>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

const chartStyles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#094327',
    marginBottom: 16,
    fontFamily: 'Archivo',
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
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
    color: '#6B7280',
    marginBottom: 4,
    fontFamily: 'Inter',
    fontWeight: '400',
  },
  averageValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#094327',
    fontFamily: 'Inter',
  },
  chartContainer: {
    flex: 1,
  },
  chart: {
    height: 80,
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
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginHorizontal: 2,
    minHeight: 2,
  },
  averageLine: {
    position: 'absolute',
    left: 4,
    right: 4,
    height: 2,
    backgroundColor: '#0B9E58',
    zIndex: 1,
  },
  dayLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  dayLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    width: 20,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
});
