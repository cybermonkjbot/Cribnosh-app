import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface OrderAgainSectionEmptyProps {
  onBrowseAll?: () => void;
}

export const OrderAgainSectionEmpty: React.FC<OrderAgainSectionEmptyProps> = ({
  onBrowseAll,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="receipt-outline" size={32} color="#9CA3AF" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>No Previous Orders</Text>
        <Text style={styles.subtitle}>We will prioritize things you eat more on this section</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 20,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#9CA3AF20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#11181C',
    marginBottom: 4,
    textAlign: 'left',
  },
  subtitle: {
    fontSize: 14,
    color: '#687076',
    lineHeight: 20,
    textAlign: 'left',
  },
});

