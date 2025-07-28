import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface FilterChip {
  id: string;
  label: string;
  icon?: string;
}

interface CategoryFullFilterChipsProps {
  chips: FilterChip[];
  activeFilters: string[];
  onFilterChange?: (filterId: string) => void;
}

export function CategoryFullFilterChips({
  chips,
  activeFilters = [],
  onFilterChange
}: CategoryFullFilterChipsProps) {
  const handleFilterPress = (filterId: string) => {
    onFilterChange?.(filterId);
  };

  const getIconName = (icon?: string) => {
    switch (icon) {
      case 'vegan':
        return 'leaf';
      case 'spicy':
        return 'flame';
      case 'keto':
        return 'egg';
      case 'gluten-free':
        return 'nutrition';
      case 'quick':
        return 'flash';
      case 'healthy':
        return 'heart';
      case 'popular':
        return 'star';
      case 'all':
        return 'grid';
      default:
        return undefined;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {chips.map((chip) => {
          const isActive = activeFilters.includes(chip.id);
          const iconName = getIconName(chip.icon);
          
          return (
            <TouchableOpacity
              key={chip.id}
              style={isActive ? [styles.chip, styles.chipActive] : styles.chip}
              onPress={() => handleFilterPress(chip.id)}
              activeOpacity={0.7}
            >
              {iconName && (
                <Ionicons
                  name={iconName as any}
                  size={14}
                  color={isActive ? '#FFFFFF' : '#6B7280'}
                  style={styles.chipIcon}
                />
              )}
              <Text style={isActive ? [styles.chipText, styles.chipTextActive] : styles.chipText}>
                {chip.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  scrollContent: {
    paddingHorizontal: 0,
    gap: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 36,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: {
    backgroundColor: '#FF3B30',
    borderColor: '#FF3B30',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  chipIcon: {
    marginRight: 2,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    lineHeight: 18,
    letterSpacing: -0.01,
    textAlign: 'center',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
}); 