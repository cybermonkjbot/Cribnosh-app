import React from 'react';
import { StyleSheet, TouchableOpacity, View, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { Colors } from '../constants/Colors';
import { PersistentBottomSheet } from './PersistentBottomSheet';

interface VehicleType {
  _id: string;
  name: string;
  description?: string;
}

interface VehicleTypePickerSheetProps {
  visible: boolean;
  onClose: () => void;
  types: VehicleType[] | undefined | null;
  selectedTypeId?: string | null;
  onSelect: (typeId: string, typeName: string) => void;
}

export function VehicleTypePickerSheet({ 
  visible, 
  onClose, 
  types, 
  selectedTypeId, 
  onSelect 
}: VehicleTypePickerSheetProps) {
  return (
    <PersistentBottomSheet
      visible={visible}
      onClose={onClose}
      title="Select Vehicle Type"
      height="60%"
    >
      <ThemedView style={styles.container}>
        <FlatList
          data={(Array.isArray(types) ? types : []) as VehicleType[]}
          keyExtractor={(item) => item._id}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => {
            const isSelected = item._id === selectedTypeId;

            return (
              <TouchableOpacity
                style={[styles.typeRow, isSelected && styles.typeRowSelected]}
                onPress={() => {
                  onSelect(item._id, item.name);
                  onClose();
                }}
                accessibilityRole="button"
                accessibilityLabel={`Select ${item.name} vehicle type`}
              >
                <View style={styles.icon}>
                  <Ionicons name="car-outline" size={20} color={Colors.light.primary} />
                </View>
                <View style={styles.typeInfo}>
                  <ThemedText type="defaultSemiBold" style={styles.typeTitle}>
                    {item.name}
                  </ThemedText>
                  {item.description && (
                    <ThemedText style={styles.typeSubtitle}>{item.description}</ThemedText>
                  )}
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={22} color={Colors.light.primary} />
                )}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Ionicons name="car-outline" size={32} color={Colors.light.icon} />
              <ThemedText style={styles.emptyText}>No vehicle types found</ThemedText>
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
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.secondary,
  },
  typeRowSelected: {
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
  typeInfo: {
    flex: 1,
  },
  typeTitle: {
    color: Colors.light.text,
  },
  typeSubtitle: {
    color: Colors.light.icon,
    marginTop: 2,
    fontSize: 14,
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

