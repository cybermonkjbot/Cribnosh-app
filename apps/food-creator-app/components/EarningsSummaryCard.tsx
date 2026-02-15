import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowRight, PoundSterling } from 'lucide-react-native';

interface EarningsSummaryCardProps {
  totalEarnings: number; // in pence
  availableBalance: number; // in pence
  pendingPayouts: number; // in pence
  onViewDetails?: () => void;
}

export function EarningsSummaryCard({
  totalEarnings,
  availableBalance,
  pendingPayouts,
  onViewDetails,
}: EarningsSummaryCardProps) {
  const formatCurrency = (amountInPence: number) => {
    return `£${(amountInPence / 100).toFixed(2)}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
          <View style={styles.headerLeft}>
          <PoundSterling size={20} color="#094327" />
          <Text style={styles.title}>Earnings</Text>
        </View>
        {onViewDetails && (
          <TouchableOpacity
            onPress={onViewDetails}
            style={styles.viewDetailsButton}
            activeOpacity={0.7}
          >
            <Text style={styles.viewDetailsText}>View Details</Text>
            <ArrowRight size={16} color="#094327" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.metricsContainer}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Total Earnings</Text>
          <Text style={styles.metricValue}>{formatCurrency(totalEarnings)}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Available Balance</Text>
          <Text style={[styles.metricValue, styles.availableBalance]}>
            {formatCurrency(availableBalance)}
          </Text>
        </View>

        {pendingPayouts > 0 && (
          <>
            <View style={styles.divider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Pending Payouts</Text>
              <Text style={[styles.metricValue, styles.pendingPayouts]}>
                {formatCurrency(pendingPayouts)}
              </Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Archivo',
    color: '#094327',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
    color: '#094327',
  },
  metricsContainer: {
    gap: 12,
  },
  metricItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '400',
    fontFamily: 'Inter',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter',
    color: '#094327',
  },
  availableBalance: {
    color: '#0B9E58',
  },
  pendingPayouts: {
    color: '#FF6B35',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
});

