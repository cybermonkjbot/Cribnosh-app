import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
  backButtonInSearchBar?: boolean; // Show back button as icon in search bar instead of header
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
  showTabs = false,
  showSearch = true,
  backButtonInSearchBar = false
}: CategoryFullDrawerProps) {
  // Memoize filter chips rendering
  const filterChipsComponent = useMemo(() => {
    if (filterChips.length === 0) return null;
    return (
      <CategoryFullFilterChips
        chips={filterChips}
        activeFilters={activeFilters}
        onFilterChange={onFilterChange}
      />
    );
  }, [filterChips, activeFilters, onFilterChange]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Sticky Search Bar Only */}
        {showSearch && (
          <View style={styles.stickySearch}>
            <View style={styles.searchBarRow}>
              {backButtonInSearchBar && (
                <TouchableOpacity 
                  onPress={onBack}
                  style={styles.backIconButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="chevron-back" size={24} color="#094327" />
                </TouchableOpacity>
              )}
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
          </View>
        )}
        
        {/* Scrollable Content Section (includes header and filter chips) */}
        <View style={styles.scrollableContent}>
          <CategoryFullContent>
            <View style={styles.contentPadding}>
              {!backButtonInSearchBar && (
                <CategoryFullHeader
                  categoryName={categoryName}
                  categoryDescription={categoryDescription}
                  onBack={onBack}
                  selectedSegment={selectedSegment}
                  onSegmentChange={onSegmentChange}
                  showTabs={showTabs}
                />
              )}
              {backButtonInSearchBar && (
                <View style={styles.headerOnly}>
                  <Text style={styles.categoryNameOnly}>{categoryName}</Text>
                  {categoryDescription && (
                    <Text style={styles.categoryDescriptionOnly}>{categoryDescription}</Text>
                  )}
                </View>
              )}
              
              {filterChipsComponent}
              
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FAFFFA',
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backIconButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchContainer: {
    flex: 1,
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
  headerOnly: {
    paddingTop: 20,
    paddingBottom: 16,
  },
  categoryNameOnly: {
    fontSize: 28,
    fontWeight: '700',
    color: '#094327',
    lineHeight: 32,
    letterSpacing: -0.02,
    marginBottom: 4,
  },
  categoryDescriptionOnly: {
    fontSize: 16,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 22,
    letterSpacing: -0.01,
  },
  scrollableContent: {
    flex: 1,
  },
  contentPadding: {
    paddingHorizontal: 16,
  },
}); 