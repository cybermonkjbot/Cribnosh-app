import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface MealInfoProps {
  prepTime?: string;
  deliveryTime?: string;
}

export function MealInfo({ prepTime, deliveryTime }: MealInfoProps) {
  return (
    <View style={styles.container}>
      {/* Prep Time */}
      {prepTime && (
        <View style={styles.infoItem}>
          <Ionicons name="time-outline" size={16} color="#094327" />
          <Text style={styles.label}>Prep</Text>
          <Text style={styles.value}>{prepTime}</Text>
        </View>
      )}

      {/* Delivery Time */}
      {deliveryTime && (
        <View style={styles.infoItem}>
          <Ionicons name="bicycle-outline" size={16} color="#FF3B30" />
          <Text style={styles.label}>Delivery</Text>
          <Text style={styles.value}>{deliveryTime}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 40,
  },
  infoItem: {
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontSize: 12,
    color: '#6C757D',
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: '#094327',
    fontWeight: '600',
  },
}); 