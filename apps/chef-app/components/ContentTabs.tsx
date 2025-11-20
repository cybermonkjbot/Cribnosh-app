import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Radio, Video } from 'lucide-react-native';

export type ContentTabType = 'all' | 'recipes' | 'live' | 'videos' | 'meals';

interface ContentTabsProps {
  activeTab: ContentTabType;
  onTabChange: (tab: ContentTabType) => void;
  counts?: {
    all?: number;
    recipes?: number;
    live?: number;
    videos?: number;
    meals?: number;
  };
}

const tabs = [
  { id: 'all' as ContentTabType, label: 'All', icon: null },
  { id: 'recipes' as ContentTabType, label: 'Recipes', icon: null },
  { id: 'live' as ContentTabType, label: 'Live', icon: Radio },
  { id: 'videos' as ContentTabType, label: 'Videos', icon: Video },
  { id: 'meals' as ContentTabType, label: 'Meals', icon: null },
];

export function ContentTabs({ activeTab, onTabChange, counts }: ContentTabsProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const IconComponent = tab.icon;
          const count = counts?.[tab.id];

          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => onTabChange(tab.id)}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              activeOpacity={0.7}
            >
              {IconComponent && (
                <IconComponent
                  size={16}
                  color={isActive ? '#FFFFFF' : '#6B7280'}
                  style={styles.icon}
                />
              )}
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                {tab.label}
                {count !== undefined && ` (${count})`}
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
    backgroundColor: '#FAFFFA',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: '#094327',
    borderColor: '#094327',
  },
  icon: {
    marginRight: 0,
  },
  filterText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: 'Inter',
  },
});
