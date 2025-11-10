import React, { useState, useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View, FlatList, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { Colors } from '../constants/Colors';
import { PersistentBottomSheet } from './PersistentBottomSheet';

interface VehicleModel {
  _id: string;
  displayName: string;
  make: string;
  model: string;
}

interface VehicleModelPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  models: VehicleModel[] | undefined | null;
  selectedModelId?: string | null;
  onSelect: (modelId: string, modelName: string) => void;
}

export function VehicleModelPickerSheet({ 
  visible, 
  onClose, 
  models, 
  selectedModelId, 
  onSelect 
}: VehicleModelPickerSheetProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter models based on search query
  const filteredModels = useMemo(() => {
    const allModels = Array.isArray(models) ? models : [];
    if (!searchQuery.trim()) {
      return allModels;
    }

    const query = searchQuery.toLowerCase().trim();
    return allModels.filter((model) => {
      const displayNameMatch = model.displayName.toLowerCase().includes(query);
      const makeMatch = model.make.toLowerCase().includes(query);
      const modelMatch = model.model.toLowerCase().includes(query);
      
      return displayNameMatch || makeMatch || modelMatch;
    });
  }, [models, searchQuery]);

  // Reset search when sheet closes
  React.useEffect(() => {
    if (!visible) {
      setSearchQuery('');
    }
  }, [visible]);

  return (
    <PersistentBottomSheet
      visible={visible}
      onClose={onClose}
      title="Select Vehicle Model"
      height="70%"
    >
      <ThemedView style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={Colors.light.icon} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search vehicle models..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={Colors.light.icon}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color={Colors.light.icon} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Models List */}
        <FlatList
          data={filteredModels}
          keyExtractor={(item) => item._id}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => {
            const isSelected = item._id === selectedModelId;

            return (
              <TouchableOpacity
                style={[styles.modelRow, isSelected && styles.modelRowSelected]}
                onPress={() => {
                  onSelect(item._id, item.displayName);
                  onClose();
                }}
                accessibilityRole="button"
                accessibilityLabel={`Select ${item.displayName} vehicle model`}
              >
                <View style={styles.icon}>
                  <Ionicons name="car-sport-outline" size={20} color={Colors.light.primary} />
                </View>
                <View style={styles.modelInfo}>
                  <ThemedText type="defaultSemiBold" style={styles.modelTitle}>
                    {item.displayName}
                  </ThemedText>
                  <ThemedText style={styles.modelSubtitle}>
                    {item.make} {item.model}
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
              <Ionicons name="car-sport-outline" size={32} color={Colors.light.icon} />
              <ThemedText style={styles.emptyText}>
                {searchQuery.trim() 
                  ? `No models found for "${searchQuery}"` 
                  : 'No vehicle models found'}
              </ThemedText>
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
  searchContainer: {
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.secondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.light.secondary,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
    padding: 0,
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  modelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.secondary,
  },
  modelRowSelected: {
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
  modelInfo: {
    flex: 1,
  },
  modelTitle: {
    color: Colors.light.text,
  },
  modelSubtitle: {
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

