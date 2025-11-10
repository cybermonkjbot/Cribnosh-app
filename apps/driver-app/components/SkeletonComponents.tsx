import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/Colors';

/**
 * Skeleton loader components to replace old shared package components
 */

interface SkeletonBoxProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

const SkeletonBox: React.FC<SkeletonBoxProps> = ({ 
  width = '100%', 
  height = 20, 
  borderRadius = 8,
  style 
}) => {
  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: Colors.light.secondary,
        },
        style,
      ]}
    />
  );
};

/**
 * SkeletonOrderCard - Simple card skeleton for order listings
 */
export const SkeletonOrderCard: React.FC = () => {
  return (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <SkeletonBox width={40} height={40} borderRadius={20} />
        <View style={styles.orderHeaderContent}>
          <SkeletonBox width={120} height={16} style={styles.marginBottom} />
          <SkeletonBox width={80} height={12} />
        </View>
        <SkeletonBox width={60} height={12} />
      </View>
      
      <View style={styles.orderDetails}>
        <SkeletonBox width="100%" height={14} style={styles.marginBottom} />
        <SkeletonBox width="90%" height={14} style={styles.marginBottom} />
        <SkeletonBox width="80%" height={14} />
      </View>
      
      <View style={styles.orderFooter}>
        <SkeletonBox width={100} height={18} />
        <SkeletonBox width={80} height={32} borderRadius={8} />
      </View>
    </View>
  );
};

/**
 * SkeletonStatCard - Simple card skeleton for statistics
 */
export const SkeletonStatCard: React.FC = () => {
  return (
    <View style={styles.statCard}>
      <SkeletonBox width={100} height={14} style={styles.marginBottom} />
      <SkeletonBox width={150} height={28} style={styles.marginBottom} />
      <View style={styles.statRow}>
        <View style={styles.statItem}>
          <SkeletonBox width={80} height={12} style={styles.marginBottom} />
          <SkeletonBox width={60} height={16} />
        </View>
        <View style={styles.statItem}>
          <SkeletonBox width={80} height={12} style={styles.marginBottom} />
          <SkeletonBox width={60} height={16} />
        </View>
      </View>
    </View>
  );
};

/**
 * SkeletonListItem - Simple list item skeleton
 */
export const SkeletonListItem: React.FC = () => {
  return (
    <View style={styles.listItem}>
      <SkeletonBox width={40} height={40} borderRadius={20} />
      <View style={styles.listItemContent}>
        <SkeletonBox width={150} height={16} style={styles.marginBottom} />
        <SkeletonBox width={100} height={12} />
      </View>
      <SkeletonBox width={20} height={20} borderRadius={10} />
    </View>
  );
};

/**
 * SkeletonLoader - Generic skeleton loader with activity indicator
 */
export const SkeletonLoader: React.FC<{ message?: string }> = ({ message }) => {
  return (
    <View style={styles.loaderContainer}>
      <ActivityIndicator size="large" color={Colors.light.primary} />
      {message && (
        <View style={styles.loaderMessage}>
          <SkeletonBox width={200} height={14} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  orderCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderHeaderContent: {
    flex: 1,
    marginLeft: 12,
  },
  orderDetails: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingTop: 12,
    marginTop: 12,
    marginBottom: 12,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingTop: 12,
    marginTop: 12,
  },
  statCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingTop: 12,
    marginTop: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  listItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loaderMessage: {
    marginTop: 16,
  },
  marginBottom: {
    marginBottom: 8,
  },
});

