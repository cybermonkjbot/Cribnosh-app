import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkeletonStatCard } from '../components/SkeletonComponents';
import { ThemedText } from '../components/ThemedText';
import { Colors } from '../constants/Colors';
import { useDriverAuth } from '../contexts/EnhancedDriverAuthContext';
import { useGetDriverPerformanceAnalyticsQuery } from '../store/driverApi';

type IconName = keyof typeof Ionicons.glyphMap;

export default function PerformanceAnalyticsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('efficiency');
  
  const { driver } = useDriverAuth();
  
  // Get driver ID from context
  const driverId = driver?._id;

  // Fetch performance analytics data
  const { data: efficiencyDataResponse } = useGetDriverPerformanceAnalyticsQuery(
    { metricType: 'efficiency', period: selectedPeriod === '7d' ? '7d' : selectedPeriod === '90d' ? '90d' : '30d' },
    { skip: !driver }
  );
  const efficiencyData = efficiencyDataResponse?.data || null;

  const { data: safetyDataResponse } = useGetDriverPerformanceAnalyticsQuery(
    { metricType: 'safety', period: selectedPeriod === '7d' ? '7d' : selectedPeriod === '90d' ? '90d' : '30d' },
    { skip: !driver }
  );
  const safetyData = safetyDataResponse?.data || null;

  const { data: customerDataResponse } = useGetDriverPerformanceAnalyticsQuery(
    { metricType: 'customer', period: selectedPeriod === '7d' ? '7d' : selectedPeriod === '90d' ? '90d' : '30d' },
    { skip: !driver }
  );
  const customerData = customerDataResponse?.data || null;

  const periods = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: '1y', label: 'Last Year' },
  ];

  const metrics = [
    { value: 'efficiency', label: 'Efficiency', icon: 'speedometer' as IconName, color: Colors.light.accent },
    { value: 'safety', label: 'Safety', icon: 'shield-checkmark' as IconName, color: Colors.light.success },
    { value: 'customer', label: 'Customer Rating', icon: 'star' as IconName, color: Colors.light.warning },
    { value: 'delivery', label: 'Delivery Time', icon: 'time' as IconName, color: Colors.light.primary },
  ];

  // Get current performance data based on selected metric
  const getCurrentPerformanceData = () => {
    switch (selectedMetric) {
      case 'efficiency':
        return efficiencyData || { score: 0, trend: 0, breakdown: {} };
      case 'safety':
        return safetyData || { score: 0, trend: 0, breakdown: {} };
      case 'customer':
        return customerData || { score: 0, trend: 0, breakdown: {} };
      default:
        return { score: 0, trend: 0, breakdown: {} };
    }
  };

  const currentData = getCurrentPerformanceData();

  // Helper function to safely access performance data
  const getPerformanceValue = (key: string, fallback: any = 0) => {
    return currentData[key as keyof typeof currentData] || fallback;
  };

  const handleViewDetails = () => {
    Alert.alert('Performance Details', 'Detailed performance analysis opened!');
  };

  const handleSetGoal = () => {
    Alert.alert('Set Goal', 'Performance goal updated successfully!');
  };

  const handleShareReport = () => {
    Alert.alert('Share Report', 'Performance report shared successfully!');
  };

  // Show auth prompt if no driver
  if (!driverId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.headerTitle}>Performance Analytics</ThemedText>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ThemedText type="title">Authentication Required</ThemedText>
          <ThemedText>Please log in to view your performance analytics</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  // Show loading state if data is not available
  if (efficiencyData === undefined || safetyData === undefined || customerData === undefined) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.headerTitle}>Performance Analytics</ThemedText>
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
        <ThemedText type="title" style={styles.headerTitle}>Performance Analytics</ThemedText>
        <TouchableOpacity style={styles.shareButton} onPress={handleShareReport}>
          <Ionicons name="share" size={24} color={Colors.light.primary} />
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

        {/* Metric Selection */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Performance Metrics</ThemedText>
          <View style={styles.metricsGrid}>
            {metrics.map((metric) => (
              <TouchableOpacity
                key={metric.value}
                style={[
                  styles.metricCard,
                  selectedMetric === metric.value && styles.metricCardActive
                ]}
                onPress={() => setSelectedMetric(metric.value)}
              >
                <Ionicons 
                  name={metric.icon} 
                  size={24} 
                  color={selectedMetric === metric.value ? Colors.light.primary : metric.color} 
                />
                <ThemedText style={[
                  styles.metricLabel,
                  selectedMetric === metric.value && styles.metricLabelActive
                ]}>
                  {metric.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Main Performance Display */}
        <View style={styles.section}>
          <View style={styles.performanceCard}>
            <View style={styles.performanceHeader}>
              <ThemedText style={styles.performanceTitle}>
                {metrics.find(m => m.value === selectedMetric)?.label}
              </ThemedText>
              <View style={styles.growthIndicator}>
                <Ionicons 
                  name={getPerformanceValue('trend', 0) >= 0 ? "trending-up" : "trending-down"} 
                  size={16} 
                  color={getPerformanceValue('trend', 0) >= 0 ? Colors.light.accent : Colors.light.error} 
                />
                <ThemedText style={[
                  styles.growthText,
                  { color: getPerformanceValue('trend', 0) >= 0 ? Colors.light.accent : Colors.light.error }
                ]}>
                  {getPerformanceValue('trend', 0) >= 0 ? '+' : ''}{getPerformanceValue('trend', 0)}%
                </ThemedText>
              </View>
            </View>
            
            <ThemedText style={styles.performanceValue}>
              {selectedMetric === 'customer' ? `${getPerformanceValue('score', 0)}/5.0` : 
               selectedMetric === 'delivery' ? `${getPerformanceValue('score', 0)} min` : 
               `${getPerformanceValue('score', 0)}%`}
            </ThemedText>
            
            <ThemedText style={styles.previousValue}>
              Previous: {selectedMetric === 'customer' ? `${getPerformanceValue('overall', 0)}/5.0` : 
                        selectedMetric === 'delivery' ? `${getPerformanceValue('overall', 0)} min` : 
                        `${getPerformanceValue('overall', 0)}%`}
            </ThemedText>
          </View>
        </View>

        {/* Performance Breakdown */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Performance Breakdown</ThemedText>
          <View style={styles.breakdownContainer}>
            {currentData.breakdown && Object.entries(currentData.breakdown).map(([key, value]) => (
              <View key={key} style={styles.breakdownItem}>
                <ThemedText style={styles.breakdownLabel}>
                  {key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ')}
                </ThemedText>
                <ThemedText style={styles.breakdownValue}>
                  {selectedMetric === 'customer' ? `${value}/5.0` : 
                   selectedMetric === 'delivery' ? `${value}${key.includes('time') || key.includes('deliveries') ? ' min' : '%'}` : 
                   selectedMetric === 'safety' ? (key.includes('days') ? `${value} days` : `${value}%`) :
                   `${value}%`}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* Performance Insights */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Performance Insights</ThemedText>
          <View style={styles.insightsContainer}>
            <View style={styles.insightCard}>
              <Ionicons name="bulb" size={20} color={Colors.light.accent} />
              <View style={styles.insightContent}>
                <ThemedText style={styles.insightLabel}>Top Strength</ThemedText>
                <ThemedText style={styles.insightValue}>
                  {selectedMetric === 'efficiency' ? 'Route Optimization (95.8%)' :
                   selectedMetric === 'safety' ? 'Vehicle Condition (98.9%)' :
                   selectedMetric === 'customer' ? 'Communication (4.9/5.0)' :
                   'On-time Deliveries (96.2%)'}
                </ThemedText>
              </View>
            </View>
            
            <View style={styles.insightCard}>
              <Ionicons name="trending-up" size={20} color={Colors.light.success} />
              <View style={styles.insightContent}>
                <ThemedText style={styles.insightLabel}>Improvement Area</ThemedText>
                <ThemedText style={styles.insightValue}>
                  {selectedMetric === 'efficiency' ? 'Fuel Efficiency (92.5%)' :
                   selectedMetric === 'safety' ? 'Defensive Driving (96.5%)' :
                   selectedMetric === 'customer' ? 'Punctuality (4.7/5.0)' :
                   'Early Deliveries (15.8%)'}
                </ThemedText>
              </View>
            </View>
            
            <View style={styles.insightCard}>
              <Ionicons name="trophy" size={20} color={Colors.light.warning} />
              <View style={styles.insightContent}>
                <ThemedText style={styles.insightLabel}>Achievement</ThemedText>
                <ThemedText style={styles.insightValue}>
                  {selectedMetric === 'efficiency' ? 'Top 10% Efficiency' :
                   selectedMetric === 'safety' ? '45 Days Accident-Free' :
                   selectedMetric === 'customer' ? '4.8+ Star Rating' :
                   '12.5 Min Avg Delivery'}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        {/* Performance Goals */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Performance Goals</ThemedText>
          <View style={styles.goalsContainer}>
            <View style={styles.goalCard}>
              <View style={styles.goalHeader}>
                <ThemedText style={styles.goalLabel}>Efficiency Goal</ThemedText>
                <ThemedText style={styles.goalProgress}>94.2%</ThemedText>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '94.2%' }]} />
              </View>
              <ThemedText style={styles.goalTarget}>Target: 95%</ThemedText>
            </View>
            
            <View style={styles.goalCard}>
              <View style={styles.goalHeader}>
                <ThemedText style={styles.goalLabel}>Safety Goal</ThemedText>
                <ThemedText style={styles.goalProgress}>98.7%</ThemedText>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '98.7%' }]} />
              </View>
              <ThemedText style={styles.goalTarget}>Target: 99%</ThemedText>
            </View>
            
            <View style={styles.goalCard}>
              <View style={styles.goalHeader}>
                <ThemedText style={styles.goalLabel}>Customer Rating</ThemedText>
                <ThemedText style={styles.goalProgress}>4.8/5</ThemedText>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '96%' }]} />
              </View>
              <ThemedText style={styles.goalTarget}>Target: 5.0/5</ThemedText>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleViewDetails}>
            <Ionicons name="analytics" size={20} color={Colors.light.background} />
            <ThemedText style={styles.actionButtonText}>View Details</ThemedText>
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
  shareButton: {
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
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.light.secondary,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  metricCardActive: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary + '10',
  },
  metricLabel: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
  metricLabelActive: {
    color: Colors.light.primary,
  },
  performanceCard: {
    padding: 20,
    backgroundColor: Colors.light.secondary,
    borderRadius: 12,
    alignItems: 'center',
  },
  performanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  performanceTitle: {
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
  },
  performanceValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginBottom: 8,
  },
  previousValue: {
    fontSize: 14,
    color: Colors.light.icon,
  },
  breakdownContainer: {
    gap: 12,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.secondary,
  },
  breakdownLabel: {
    fontSize: 14,
    color: Colors.light.text,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  insightsContainer: {
    gap: 16,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.light.secondary,
    borderRadius: 12,
  },
  insightContent: {
    marginLeft: 12,
    flex: 1,
  },
  insightLabel: {
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 4,
  },
  insightValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.primary,
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
