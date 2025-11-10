import React from 'react';
import { StyleSheet, TouchableOpacity, View, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { Colors } from '../constants/Colors';
import { PersistentBottomSheet } from './PersistentBottomSheet';

interface VehicleYearPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  years: number[] | undefined | null;
  selectedYear?: string | null;
  onSelect: (year: string) => void;
}

export function VehicleYearPickerSheet({ 
  visible, 
  onClose, 
  years, 
  selectedYear, 
  onSelect 
}: VehicleYearPickerSheetProps) {
  // Years are already sorted in descending order (newest first) from the query
  const sortedYears = Array.isArray(years) ? years : [];

  return (
    <PersistentBottomSheet
      visible={visible}
      onClose={onClose}
      title="Select Vehicle Year"
      height="60%"
    >
      <ThemedView style={styles.container}>
        <FlatList
          data={sortedYears}
          keyExtractor={(item) => item.toString()}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => {
            const yearString = item.toString();
            const isSelected = yearString === selectedYear;

            return (
              <TouchableOpacity
                style={[styles.yearRow, isSelected && styles.yearRowSelected]}
                onPress={() => {
                  onSelect(yearString);
                  onClose();
                }}
                accessibilityRole="button"
                accessibilityLabel={`Select year ${item}`}
              >
                <View style={styles.icon}>
                  <Ionicons name="calendar-outline" size={20} color={Colors.light.primary} />
                </View>
                <View style={styles.yearInfo}>
                  <ThemedText type="defaultSemiBold" style={styles.yearTitle}>
                    {item}
                  </ThemedText>
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={22} color={Colors.light.primary} />
                )}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={32} color={Colors.light.icon} />
              <ThemedText style={styles.emptyText}>No vehicle years found</ThemedText>
            </View>
          )}
        />
      </ThemedView>
    </PersistentBottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.secondary,
  },
  yearRowSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.surface,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  yearInfo: {
    flex: 1,
  },
  yearTitle: {
    color: Colors.light.text,
    fontSize: 18,
  },
  separator: {
    height: 12,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    marginTop: 8,
    color: Colors.light.icon,
  },
});

