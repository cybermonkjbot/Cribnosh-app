import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CategoryFullContent } from './CategoryFullContent';
import { CategoryFullFilterChips } from './CategoryFullFilterChips';
import { CategoryFullHeader } from './CategoryFullHeader';

interface CategoryFullDrawerProps {
  categoryName: string;
  categoryDescription?: string;
  onBack: () => void;
  selectedSegment?: 'forYou' | 'all';
  onSegmentChange?: (segment: 'forYou' | 'all') => void;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  filterChips?: {
    id: string;
    label: string;
    icon?: string;
  }[];
  onFilterChange?: (filterId: string) => void;
  activeFilters?: string[];
  children?: React.ReactNode;
}

const { width, height } = Dimensions.get('window');

export function CategoryFullDrawer({
  categoryName,
  categoryDescription,
  onBack,
  selectedSegment = 'forYou',
  onSegmentChange,
  onSearch,
  searchPlaceholder = "Search Stans Kitchens",
  filterChips = [],
  onFilterChange,
  activeFilters = [],
  children
}: CategoryFullDrawerProps) {
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <CategoryFullHeader
            categoryName={categoryName}
            categoryDescription={categoryDescription}
            onBack={onBack}
            selectedSegment={selectedSegment}
            onSegmentChange={onSegmentChange}
            onSearch={onSearch}
            searchPlaceholder={searchPlaceholder}
          />
          
          <CategoryFullFilterChips
            chips={filterChips}
            activeFilters={activeFilters}
            onFilterChange={onFilterChange}
          />
          
          <CategoryFullContent>
            {children}
          </CategoryFullContent>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: width,
    height: height,
    left: 0,
    top: 0,
    backgroundColor: '#FAFFFA',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
}); 