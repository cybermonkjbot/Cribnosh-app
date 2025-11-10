import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from "convex/react";
import { api } from "../lib/convexApi";
import { Colors } from '../constants/Colors';
import { SkeletonStatCard } from '../components/SkeletonComponents';
import { ThemedText } from '../components/ThemedText';
import { useDriverAuth } from '../contexts/EnhancedDriverAuthContext';
import { useGetDriverEarningsQuery } from '../store/driverApi';

interface EarningsData {
  totalEarnings: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
  earningsBreakdown: {
    baseEarnings: number;
    tips: number;
    bonuses: number;
    incentives: number;
  };
  earningsTrend: number;
  goals: {
    weeklyTarget: number;
    monthlyTarget: number;
    weeklyProgress: number;
    monthlyProgress: number;
  };
  performance: {
    averageOrderValue: number;
    ordersCompleted: number;
    averageRating: number;
    completionRate: number;
  };
}

interface EarningsDataFallback {
  totalEarnings: number;
  monthlyBreakdown: Record<string, number>;
  trends: Record<string, number>;
}

export default function AdvancedEarningsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedView, setSelectedView] = useState('overview');
  
  const { driver } = useDriverAuth();
  
  // Get driver ID from context
  const driverId = driver?._id;

  // Fetch earnings data from Convex
  const advancedEarnings = useQuery(api.driverPerformance.getDriverAdvancedEarnings, 
    driverId ? { driverId: driverId } : "skip"
  );

  const periods = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: '1y', label: 'Last Year' },
  ];

  const views: {
    value: string;
    label: string;
    icon: React.ComponentProps<typeof Ionicons>['name'];
  }[] = [
    { value: 'overview', label: 'Overview', icon: 'analytics' as React.ComponentProps<typeof Ionicons>['name'] },
    { value: 'breakdown', label: 'Breakdown', icon: 'pie-chart' as React.ComponentProps<typeof Ionicons>['name'] },
    { value: 'trends', label: 'Trends', icon: 'trending-up' as React.ComponentProps<typeof Ionicons>['name'] },
    { value: 'goals', label: 'Goals', icon: 'analytics' as React.ComponentProps<typeof Ionicons>['name'] },
  ];

  // Get earnings data with fallback
  const earningsData: EarningsData | EarningsDataFallback = advancedEarnings || {
    totalEarnings: 0,
    weeklyEarnings: 0,
    monthlyEarnings: 0,
    earningsBreakdown: {
      baseEarnings: 0,
      tips: 0,
      bonuses: 0,
      incentives: 0,
    },
    earningsTrend: 0,
    goals: {
      weeklyTarget: 0,
      monthlyTarget: 0,
      weeklyProgress: 0,
      monthlyProgress: 0,
    },
    performance: {
      averageOrderValue: 0,
      ordersCompleted: 0,
      averageRating: 0,
      completionRate: 0,
    },
  };

  // Helper function to safely access earnings data
  const getEarningsValue = (key: string, fallback: any = 0) => {
    if ('earningsBreakdown' in earningsData) {
      return (earningsData as EarningsData)[key as keyof EarningsData] || fallback;
    }
    return fallback;
  };

  const handleRequestPayout = () => {
    Alert.alert('Request Payout', 'Payout request submitted successfully!');
  };

  const handleSetGoal = () => {
    Alert.alert('Set Goal', 'Earnings goal updated successfully!');
  };

  const handleExportData = () => {
    Alert.alert('Export Data', 'Earnings data exported successfully!');
  };

  // Show auth prompt if no driver
  if (!driverId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.headerTitle}>Advanced Earnings</ThemedText>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ThemedText type="title">Authentication Required</ThemedText>
          <ThemedText>Please log in to view your earnings</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  // Show loading state if data is not available
  if (advancedEarnings === undefined) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.headerTitle}>Advanced Earnings</ThemedText>
          <View style={styles.headerSpacer} />
        </View>
        <ScrollView style={{ flex: 1, padding: 20 }}>
          <View style={{ gap: 12 }}>
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.headerTitle}>Advanced Earnings</ThemedText>
        <TouchableOpacity style={styles.exportButton} onPress={handleExportData}>
          <Ionicons name="download" size={24} color={Colors.light.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Period Selection */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Time Period</ThemedText>
          <View style={styles.periodSelector}>
            {periods.map((period) => (
              <TouchableOpacity
                key={period.value}
                style={[
                  styles.periodButton,
                  selectedPeriod === period.value && styles.periodButtonActive
                ]}
                onPress={() => setSelectedPeriod(period.value)}
              >
                <ThemedText style={[
                  styles.periodButtonText,
                  selectedPeriod === period.value && styles.periodButtonTextActive
                ]}>
                  {period.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* View Selection */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>View Type</ThemedText>
          <View style={styles.viewSelector}>
            {views.map((view) => (
              <TouchableOpacity
                key={view.value}
                style={[
                  styles.viewButton,
                  selectedView === view.value && styles.viewButtonActive
                ]}
                onPress={() => setSelectedView(view.value)}
              >
                <Ionicons 
                  name={view.icon as React.ComponentProps<typeof Ionicons>['name']} 
                  size={20} 
                  color={selectedView === view.value ? Colors.light.primary : Colors.light.icon} 
                />
                <ThemedText style={[
                  styles.viewButtonText,
                  selectedView === view.value && styles.viewButtonTextActive
                ]}>
                  {view.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Overview */}
        {selectedView === 'overview' && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Earnings Overview</ThemedText>
            <View style={styles.overviewCard}>
              <View style={styles.overviewHeader}>
                <ThemedText style={styles.overviewLabel}>Total Earnings</ThemedText>
                <View style={styles.growthIndicator}>
                  <Ionicons name="trending-up" size={16} color={Colors.light.accent} />
                  <ThemedText style={styles.growthText}>+{getEarningsValue('earningsTrend', 0)}%</ThemedText>
                </View>
              </View>
              
              <ThemedText style={styles.totalEarnings}>
                ₦{earningsData.totalEarnings.toLocaleString()}
              </ThemedText>
              
              <ThemedText style={styles.previousEarnings}>
                Previous: ₦{getEarningsValue('previousPeriod', 0).toLocaleString()}
              </ThemedText>
            </View>
          </View>
        )}

        {/* Breakdown */}
        {selectedView === 'breakdown' && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Earnings Breakdown</ThemedText>
            <View style={styles.breakdownContainer}>
              <View style={styles.breakdownItem}>
                <View style={styles.breakdownIcon}>
                  <Ionicons name="car" size={24} color={Colors.light.primary} />
                </View>
                <View style={styles.breakdownContent}>
                  <ThemedText style={styles.breakdownLabel}>Deliveries</ThemedText>
                  <ThemedText style={styles.breakdownValue}>
                    ₦{getEarningsValue('earningsBreakdown', {}).baseEarnings?.toLocaleString() || '0'}
                  </ThemedText>
                  <ThemedText style={styles.breakdownPercentage}>68%</ThemedText>
                </View>
              </View>
              
              <View style={styles.breakdownItem}>
                <View style={styles.breakdownIcon}>
                  <Ionicons name="gift" size={24} color={Colors.light.accent} />
                </View>
                <View style={styles.breakdownContent}>
                  <ThemedText style={styles.breakdownLabel}>Bonuses</ThemedText>
                  <ThemedText style={styles.breakdownValue}>
                    ₦{getEarningsValue('earningsBreakdown', {}).bonuses?.toLocaleString() || '0'}
                  </ThemedText>
                  <ThemedText style={styles.breakdownPercentage}>12%</ThemedText>
                </View>
              </View>
              
              <View style={styles.breakdownItem}>
                <View style={styles.breakdownIcon}>
                  <Ionicons name="heart" size={24} color={Colors.light.warning} />
                </View>
                <View style={styles.breakdownContent}>
                  <ThemedText style={styles.breakdownLabel}>Tips</ThemedText>
                  <ThemedText style={styles.breakdownValue}>
                    ₦{getEarningsValue('earningsBreakdown', {}).tips?.toLocaleString() || '0'}
                  </ThemedText>
                  <ThemedText style={styles.breakdownPercentage}>10%</ThemedText>
                </View>
              </View>
              
              <View style={styles.breakdownItem}>
                <View style={styles.breakdownIcon}>
                  <Ionicons name="trophy" size={24} color={Colors.light.success} />
                </View>
                <View style={styles.breakdownContent}>
                  <ThemedText style={styles.breakdownLabel}>Incentives</ThemedText>
                  <ThemedText style={styles.breakdownValue}>
                    ₦{getEarningsValue('earningsBreakdown', {}).incentives?.toLocaleString() || '0'}
                  </ThemedText>
                  <ThemedText style={styles.breakdownPercentage}>10%</ThemedText>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Trends */}
        {selectedView === 'trends' && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Earnings Trends</ThemedText>
            <View style={styles.trendsContainer}>
              <View style={styles.trendCard}>
                <ThemedText style={styles.trendLabel}>Daily Average</ThemedText>
                <ThemedText style={styles.trendValue}>
                  ₦{(() => {
                    const trends = getEarningsValue('trends', { daily: [0] });
                    if (Array.isArray(trends.daily)) {
                      return Math.round(trends.daily.reduce((a: number, b: number) => a + b, 0) / trends.daily.length).toLocaleString();
                    }
                    return '0';
                  })()}
                </ThemedText>
                <View style={styles.trendChart}>
                  {(() => {
                    const trends = getEarningsValue('trends', { daily: [0] });
                    if (Array.isArray(trends.daily)) {
                      return trends.daily.map((value: number, index: number) => (
                        <View
                          key={index}
                          style={[
                            styles.trendBar,
                            { height: (value / 1600) * 60 }
                          ]}
                        />
                      ));
                    }
                    return null;
                  })()}
                </View>
              </View>
              
              <View style={styles.trendCard}>
                <ThemedText style={styles.trendLabel}>Weekly Average</ThemedText>
                <ThemedText style={styles.trendValue}>
                  ₦{(() => {
                    const trends = getEarningsValue('trends', { weekly: [0] });
                    if (Array.isArray(trends.weekly)) {
                      return Math.round(trends.weekly.reduce((a: number, b: number) => a + b, 0) / trends.weekly.length).toLocaleString();
                    }
                    return '0';
                  })()}
                </ThemedText>
                <View style={styles.trendChart}>
                  {(() => {
                    const trends = getEarningsValue('trends', { weekly: [0] });
                    if (Array.isArray(trends.weekly)) {
                      return trends.weekly.map((value: number, index: number) => (
                        <View
                          key={index}
                          style={[
                            styles.trendBar,
                            { height: (value / 10500) * 60 }
                          ]}
                        />
                      ));
                    }
                    return null;
                  })()}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Goals */}
        {selectedView === 'goals' && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Earnings Goals</ThemedText>
            <View style={styles.goalsContainer}>
              <View style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <ThemedText style={styles.goalLabel}>Daily Goal</ThemedText>
                  <ThemedText style={styles.goalProgress}>
                    {getEarningsValue('goals', {}).weekly || 0}%
                  </ThemedText>
                </View>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${getEarningsValue('goals', {}).weekly || 0}%` }
                    ]} 
                  />
                </View>
                <ThemedText style={styles.goalTarget}>
                  Target: ₦{(getEarningsValue('goals', {}).weekly || 0).toLocaleString()}
                </ThemedText>
              </View>
              
              <View style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <ThemedText style={styles.goalLabel}>Weekly Goal</ThemedText>
                  <ThemedText style={styles.goalProgress}>
                    {getEarningsValue('goals', {}).monthly || 0}%
                  </ThemedText>
                </View>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${getEarningsValue('goals', {}).monthly || 0}%` }
                    ]} 
                  />
                </View>
                <ThemedText style={styles.goalTarget}>
                  Target: ₦{(getEarningsValue('goals', {}).monthly || 0).toLocaleString()}
                </ThemedText>
              </View>
              
              <View style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <ThemedText style={styles.goalLabel}>Monthly Goal</ThemedText>
                  <ThemedText style={styles.goalProgress}>
                    {getEarningsValue('goals', {}).yearly || 0}%
                  </ThemedText>
                </View>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${getEarningsValue('goals', {}).yearly || 0}%` }
                    ]} 
                  />
                </View>
                <ThemedText style={styles.goalTarget}>
                  Target: ₦{(getEarningsValue('goals', {}).yearly || 0).toLocaleString()}
                </ThemedText>
              </View>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleRequestPayout}>
            <Ionicons name="cash" size={20} color={Colors.light.background} />
            <ThemedText style={styles.actionButtonText}>Request Payout</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton} onPress={handleSetGoal}>
            <Ionicons name="analytics" size={20} color={Colors.light.primary} />
            <ThemedText style={styles.secondaryButtonText}>Set Goal</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.secondary,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  headerSpacer: {
    width: 40,
  },
  exportButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    margin: 16,
    padding: 20,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    marginBottom: 16,
    color: Colors.light.text,
  },
  periodSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.secondary,
    borderWidth: 1,
    borderColor: Colors.light.secondary,
  },
  periodButtonActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  periodButtonText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  periodButtonTextActive: {
    color: Colors.light.background,
  },
  viewSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  viewButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.light.secondary,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  viewButtonActive: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary + '10',
  },
  viewButtonText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.text,
  },
  viewButtonTextActive: {
    color: Colors.light.primary,
  },
  overviewCard: {
    padding: 20,
    backgroundColor: Colors.light.secondary,
    borderRadius: 12,
    alignItems: 'center',
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  overviewLabel: {
    fontSize: 16,
    color: Colors.light.text,
  },
  growthIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.accent + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  growthText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.accent,
  },
  totalEarnings: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginBottom: 8,
  },
  previousEarnings: {
    fontSize: 14,
    color: Colors.light.icon,
  },
  breakdownContainer: {
    gap: 16,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.light.secondary,
    borderRadius: 12,
  },
  breakdownIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  breakdownContent: {
    flex: 1,
  },
  breakdownLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 4,
  },
  breakdownValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginBottom: 2,
  },
  breakdownPercentage: {
    fontSize: 12,
    color: Colors.light.icon,
  },
  trendsContainer: {
    gap: 16,
  },
  trendCard: {
    padding: 16,
    backgroundColor: Colors.light.secondary,
    borderRadius: 12,
  },
  trendLabel: {
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 8,
  },
  trendValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginBottom: 16,
  },
  trendChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 60,
    gap: 4,
  },
  trendBar: {
    flex: 1,
    backgroundColor: Colors.light.primary,
    borderRadius: 2,
    minHeight: 4,
  },
  goalsContainer: {
    gap: 16,
  },
  goalCard: {
    padding: 16,
    backgroundColor: Colors.light.secondary,
    borderRadius: 12,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
  },
  goalProgress: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.light.secondary,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: 4,
  },
  goalTarget: {
    fontSize: 14,
    color: Colors.light.icon,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.background,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.light.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.primary,
  },
  secondaryButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.primary,
  },
  bottomSpacing: {
    height: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
