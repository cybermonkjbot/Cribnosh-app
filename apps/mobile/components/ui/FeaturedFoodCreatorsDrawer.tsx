import { useCategoryDrawerSearch } from '@/hooks/useCategoryDrawerSearch';
import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { CategoryFullDrawer } from './CategoryFullDrawer';
import { EmptyState } from './EmptyState';
import { FeaturedFoodCreatorsSection } from './FeaturedFoodCreatorsSection';
import { FeaturedFoodCreatorsSectionSkeleton } from './FeaturedFoodCreatorsSectionSkeleton';
import { QueryStateWrapper } from './QueryStateWrapper';

interface FoodCreator {
  id: string;
  name: string;
  cuisine: string;
  sentiment: 'bussing' | 'mid' | 'notIt' | 'fire' | 'slaps' | 'decent' | 'meh' | 'trash' | 'elite' | 'solid' | 'average' | 'skip';
  deliveryTime: string;
  distance: string;
  image: any;
  isLive?: boolean;
  liveViewers?: number;
}

interface FeaturedFoodCreatorsDrawerProps {
  onBack: () => void;
  foodCreators?: FoodCreator[];
  onFoodCreatorPress?: (foodCreator: FoodCreator) => void;
  isLoading?: boolean;
  error?: unknown;
}

export function FeaturedFoodCreatorsDrawer({
  onBack,
  foodCreators = [],
  onFoodCreatorPress,
  isLoading = false,
  error = null,
}: FeaturedFoodCreatorsDrawerProps) {
  const [activeFilters, setActiveFilters] = useState<string[]>(['all']);

  // Use foodCreators from props (which come from API in MainScreen)
  // Return empty array if no foodCreators provided instead of mock data
  const baseFoodCreators = foodCreators.length > 0 ? foodCreators : [];

  // Filter function - apply filters based on active filter chips
  const applyFilters = useCallback((items: FoodCreator[]): FoodCreator[] => {
    if (activeFilters.length === 0 || (activeFilters.length === 1 && activeFilters[0] === 'all')) {
      return items;
    }

    return items.filter((foodCreator: FoodCreator) => {
      // If "all" is active, show everything
      if (activeFilters.includes('all')) {
        return true;
      }

      // Check each active filter
      return activeFilters.some((filterId: string) => {
        switch (filterId) {
          case 'live':
            return foodCreator.isLive === true;
          case 'elite':
            return foodCreator.sentiment === 'elite';
          case 'quick':
            // Quick = delivery time less than 30 minutes
            const deliveryTimeMatch = foodCreator.deliveryTime.match(/(\d+)/);
            if (deliveryTimeMatch) {
              const maxTime = parseInt(deliveryTimeMatch[1]);
              return maxTime <= 30;
            }
            return false;
          case 'nearby':
            // Nearby = distance less than 5km (assuming distance format like "2.5 km" or "3 km")
            const distanceMatch = foodCreator.distance.match(/(\d+\.?\d*)/);
            if (distanceMatch) {
              const distance = parseFloat(distanceMatch[1]);
              return distance <= 5;
            }
            // If distance is "N/A" or can't parse, don't show in nearby
            return false;
          case 'trending':
            // Trending = high sentiment ratings (fire, bussing, slaps, elite)
            return ['fire', 'bussing', 'slaps', 'elite'].includes(foodCreator.sentiment);
          default:
            return true;
        }
      });
    });
  }, [activeFilters]);

  // Apply filters to base foodCreators
  const filteredByFilters = useMemo(() => applyFilters(baseFoodCreators), [baseFoodCreators, applyFilters]);

  // Search functionality with debouncing (applied after filters)
  const { searchQuery, setSearchQuery, filteredItems: displayFoodCreators } = useCategoryDrawerSearch({
    items: filteredByFilters,
    searchFields: ['name', 'cuisine'],
  });

  // Handle filter change
  const handleFilterChange = useCallback((filterId: string) => {
    setActiveFilters((prev: string[]) => {
      // If "all" is clicked, clear all other filters
      if (filterId === 'all') {
        return ['all'];
      }

      // Remove "all" if another filter is selected
      const withoutAll = prev.filter((id) => id !== 'all');

      // Toggle the filter
      if (withoutAll.includes(filterId)) {
        // If removing the last filter, default to "all"
        if (withoutAll.length === 1) {
          return ['all'];
        }
        return withoutAll.filter((id) => id !== filterId);
      } else {
        return [...withoutAll, filterId];
      }
    });
  }, []);

  // Enhanced filter chips for foodCreator categories
  const filterChips = [
    { id: 'all', label: 'All', icon: 'grid' },
    { id: 'live', label: 'Live', icon: 'radio' },
    { id: 'elite', label: 'Elite', icon: 'star' },
    { id: 'quick', label: 'Quick', icon: 'flash' },
    { id: 'nearby', label: 'Nearby', icon: 'location' },
    { id: 'trending', label: 'Trending', icon: 'flame' },
  ];

  // Determine if we should show empty state
  const hasNoFoodCreators = baseFoodCreators.length === 0 && !isLoading;
  const hasNoResults = baseFoodCreators.length > 0 && displayFoodCreators.length === 0;
  const isSearchActive = searchQuery.trim().length > 0;
  const hasActiveFilters = activeFilters.length > 0 && !(activeFilters.length === 1 && activeFilters[0] === 'all');

  return (
    <CategoryFullDrawer
      categoryName="Featured FoodCreators"
      categoryDescription="Discover exceptional home foodCreators with authentic flavors and live cooking experiences"
      onBack={onBack}
      filterChips={filterChips}
      activeFilters={activeFilters}
      onFilterChange={handleFilterChange}
      onSearch={setSearchQuery}
      searchPlaceholder="Search foodCreators by name or cuisine..."
      backButtonInSearchBar={true}
    >
      <View style={styles.content}>
        <QueryStateWrapper
          isLoading={isLoading}
          error={error}
          isEmpty={false}
          skeleton={
            <View style={styles.skeletonContainer}>
              <FeaturedFoodCreatorsSectionSkeleton itemCount={6} />
            </View>
          }
          errorTitle="Unable to Load FoodCreators"
          errorSubtitle="Failed to load featured foodCreators. Please try again."
        >
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {hasNoFoodCreators ? (
              <View style={styles.emptyStateContainer}>
                <EmptyState
                  title="No Featured FoodCreators"
                  subtitle="We couldn't find any featured foodCreators at the moment. Check back soon!"
                  icon="storefront-outline"
                />
              </View>
            ) : hasNoResults ? (
              <View style={styles.emptyStateContainer}>
                <EmptyState
                  title={isSearchActive ? "No Results Found" : "No FoodCreators Match Your Filters"}
                  subtitle={
                    isSearchActive
                      ? `No foodCreators found matching "${searchQuery}". Try a different search term.`
                      : hasActiveFilters
                      ? "Try adjusting your filters to see more foodCreators."
                      : "No foodCreators available at the moment."
                  }
                  icon="search-outline"
                  actionButton={
                    isSearchActive || hasActiveFilters
                      ? {
                          label: "Clear Search & Filters",
                          onPress: () => {
                            setSearchQuery('');
                            setActiveFilters(['all']);
                          },
                        }
                      : undefined
                  }
                />
              </View>
            ) : (
              <FeaturedFoodCreatorsSection
                foodCreators={displayFoodCreators}
                onFoodCreatorPress={onFoodCreatorPress}
                showTitle={false}
                onSeeAllPress={undefined}
              />
            )}
          </ScrollView>
        </QueryStateWrapper>
      </View>
    </CategoryFullDrawer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
    flexGrow: 1,
  },
  skeletonContainer: {
    paddingHorizontal: 12,
    paddingTop: 20,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
  },
}); 