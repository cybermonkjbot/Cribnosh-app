import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, StyleSheet, TextInput, View } from 'react-native';
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
  showTabs?: boolean;
  showSearch?: boolean;
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
  children,
  showTabs = true,
  showSearch = true
}: CategoryFullDrawerProps) {
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Sticky Search Bar Only */}
        {showSearch && (
          <View style={styles.stickySearch}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={17} color="rgba(60, 60, 67, 0.6)" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder={searchPlaceholder}
                placeholderTextColor="rgba(60, 60, 67, 0.6)"
                onChangeText={onSearch}
              />
            </View>
          </View>
        )}
        
        {/* Scrollable Content Section (includes header and filter chips) */}
        <View style={styles.scrollableContent}>
          <CategoryFullContent>
            <View style={styles.contentPadding}>
              <CategoryFullHeader
                categoryName={categoryName}
                categoryDescription={categoryDescription}
                onBack={onBack}
                selectedSegment={selectedSegment}
                onSegmentChange={onSegmentChange}
                showTabs={showTabs}
              />
              
              {filterChips.length > 0 && (
                <CategoryFullFilterChips
                  chips={filterChips}
                  activeFilters={activeFilters}
                  onFilterChange={onFilterChange}
                />
              )}
              
              {children}
            </View>
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  safeArea: {
    flex: 1,
  },
  stickySearch: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FAFFFA',
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    color: '#1F2937',
    lineHeight: 20,
    letterSpacing: -0.01,
  },
  scrollableContent: {
    flex: 1,
  },
  contentPadding: {
    paddingHorizontal: 20,
  },
}); 