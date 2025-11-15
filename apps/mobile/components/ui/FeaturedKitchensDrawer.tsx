import { useCategoryDrawerSearch } from '@/hooks/useCategoryDrawerSearch';
import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { CategoryFullDrawer } from './CategoryFullDrawer';
import { EmptyState } from './EmptyState';
import { FeaturedKitchensSection } from './FeaturedKitchensSection';
import { FeaturedKitchensSectionSkeleton } from './FeaturedKitchensSectionSkeleton';
import { QueryStateWrapper } from './QueryStateWrapper';

interface Kitchen {
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

interface FeaturedKitchensDrawerProps {
  onBack: () => void;
  kitchens?: Kitchen[];
  onKitchenPress?: (kitchen: Kitchen) => void;
  isLoading?: boolean;
  error?: unknown;
}

export function FeaturedKitchensDrawer({
  onBack,
  kitchens = [],
  onKitchenPress,
  isLoading = false,
  error = null,
}: FeaturedKitchensDrawerProps) {
  const [activeFilters, setActiveFilters] = useState<string[]>(['all']);

  // Use kitchens from props (which come from API in MainScreen)
  // Return empty array if no kitchens provided instead of mock data
  const baseKitchens = kitchens.length > 0 ? kitchens : [];

  // Filter function - apply filters based on active filter chips
  const applyFilters = useCallback((items: Kitchen[]): Kitchen[] => {
    if (activeFilters.length === 0 || (activeFilters.length === 1 && activeFilters[0] === 'all')) {
      return items;
    }

    return items.filter((kitchen: Kitchen) => {
      // If "all" is active, show everything
      if (activeFilters.includes('all')) {
        return true;
      }

      // Check each active filter
      return activeFilters.some((filterId: string) => {
        switch (filterId) {
          case 'live':
            return kitchen.isLive === true;
          case 'elite':
            return kitchen.sentiment === 'elite';
          case 'quick':
            // Quick = delivery time less than 30 minutes
            const deliveryTimeMatch = kitchen.deliveryTime.match(/(\d+)/);
            if (deliveryTimeMatch) {
              const maxTime = parseInt(deliveryTimeMatch[1]);
              return maxTime <= 30;
            }
            return false;
          case 'nearby':
            // Nearby = distance less than 5km (assuming distance format like "2.5 km" or "3 km")
            const distanceMatch = kitchen.distance.match(/(\d+\.?\d*)/);
            if (distanceMatch) {
              const distance = parseFloat(distanceMatch[1]);
              return distance <= 5;
            }
            // If distance is "N/A" or can't parse, don't show in nearby
            return false;
          case 'trending':
            // Trending = high sentiment ratings (fire, bussing, slaps, elite)
            return ['fire', 'bussing', 'slaps', 'elite'].includes(kitchen.sentiment);
          default:
            return true;
        }
      });
    });
  }, [activeFilters]);

  // Apply filters to base kitchens
  const filteredByFilters = useMemo(() => applyFilters(baseKitchens), [baseKitchens, applyFilters]);

  // Search functionality with debouncing (applied after filters)
  const { searchQuery, setSearchQuery, filteredItems: displayKitchens } = useCategoryDrawerSearch({
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

  // Enhanced filter chips for kitchen categories
  const filterChips = [
    { id: 'all', label: 'All', icon: 'grid' },
    { id: 'live', label: 'Live', icon: 'radio' },
    { id: 'elite', label: 'Elite', icon: 'star' },
    { id: 'quick', label: 'Quick', icon: 'flash' },
    { id: 'nearby', label: 'Nearby', icon: 'location' },
    { id: 'trending', label: 'Trending', icon: 'flame' },
  ];

  // Determine if we should show empty state
  const hasNoKitchens = baseKitchens.length === 0 && !isLoading;
  const hasNoResults = baseKitchens.length > 0 && displayKitchens.length === 0;
  const isSearchActive = searchQuery.trim().length > 0;
  const hasActiveFilters = activeFilters.length > 0 && !(activeFilters.length === 1 && activeFilters[0] === 'all');

  return (
    <CategoryFullDrawer
      categoryName="Featured Kitchens"
      categoryDescription="Discover exceptional home kitchens with authentic flavors and live cooking experiences"
      onBack={onBack}
      filterChips={filterChips}
      activeFilters={activeFilters}
      onFilterChange={handleFilterChange}
      onSearch={setSearchQuery}
      searchPlaceholder="Search kitchens by name or cuisine..."
      backButtonInSearchBar={true}
    >
      <View style={styles.content}>
        <QueryStateWrapper
          isLoading={isLoading}
          error={error}
          isEmpty={false}
          skeleton={
            <View style={styles.skeletonContainer}>
              <FeaturedKitchensSectionSkeleton itemCount={6} />
            </View>
          }
          errorTitle="Unable to Load Kitchens"
          errorSubtitle="Failed to load featured kitchens. Please try again."
        >
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {hasNoKitchens ? (
              <View style={styles.emptyStateContainer}>
                <EmptyState
                  title="No Featured Kitchens"
                  subtitle="We couldn't find any featured kitchens at the moment. Check back soon!"
                  icon="storefront-outline"
                />
              </View>
            ) : hasNoResults ? (
              <View style={styles.emptyStateContainer}>
                <EmptyState
                  title={isSearchActive ? "No Results Found" : "No Kitchens Match Your Filters"}
                  subtitle={
                    isSearchActive
                      ? `No kitchens found matching "${searchQuery}". Try a different search term.`
                      : hasActiveFilters
                      ? "Try adjusting your filters to see more kitchens."
                      : "No kitchens available at the moment."
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
              <FeaturedKitchensSection
                kitchens={displayKitchens}
                onKitchenPress={onKitchenPress}
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