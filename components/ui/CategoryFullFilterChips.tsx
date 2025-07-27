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
                  size={12}
                  color="#094327"
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
    marginBottom: 20,
  },
  scrollContent: {
    paddingHorizontal: 0,
    gap: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 29,
    gap: 6,
  },
  chipActive: {
    backgroundColor: 'rgba(9, 67, 39, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(9, 67, 39, 0.3)',
  },
  chipIcon: {
    marginRight: 2,
  },
  chipText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#094327',
    lineHeight: 22,
    letterSpacing: 0.03,
    textAlign: 'center',
  },
  chipTextActive: {
    color: '#094327',
  },
}); 