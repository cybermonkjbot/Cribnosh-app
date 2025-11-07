import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useCategoryDrawerSearch } from '@/hooks/useCategoryDrawerSearch';
import { CategoryFullDrawer } from './CategoryFullDrawer';
import { FeaturedKitchensSection } from './FeaturedKitchensSection';

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
}

export function FeaturedKitchensDrawer({
  onBack,
  kitchens = [],
  onKitchenPress
}: FeaturedKitchensDrawerProps) {
  // Enhanced default kitchens with more realistic data
  const defaultKitchens: Kitchen[] = [
    {
      id: '1',
      name: 'Amara\'s Kitchen',
      cuisine: 'Nigerian',
      sentiment: 'elite',
      deliveryTime: '25 min',
      distance: '0.8 mi',
      image: { uri: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&h=300&fit=crop' },
      isLive: true,
      liveViewers: 156,
    },
    {
      id: '2',
      name: 'Bangkok Bites',
      cuisine: 'Thai',
      sentiment: 'fire',
      deliveryTime: '30 min',
      distance: '1.2 mi',
      image: { uri: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop' },
      isLive: false,
    },
    {
      id: '3',
      name: 'Marrakech Delights',
      cuisine: 'Moroccan',
      sentiment: 'slaps',
      deliveryTime: '35 min',
      distance: '1.5 mi',
      image: { uri: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop' },
      isLive: true,
      liveViewers: 89,
    },
    {
      id: '4',
      name: 'Seoul Street',
      cuisine: 'Korean',
      sentiment: 'solid',
      deliveryTime: '28 min',
      distance: '1.0 mi',
      image: { uri: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop' },
      isLive: false,
    },
    {
      id: '5',
      name: 'Nonna\'s Table',
      cuisine: 'Italian',
      sentiment: 'bussing',
      deliveryTime: '32 min',
      distance: '1.3 mi',
      image: { uri: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop' },
      isLive: false,
    },
    {
      id: '6',
      name: 'Tokyo Dreams',
      cuisine: 'Japanese',
      sentiment: 'decent',
      deliveryTime: '22 min',
      distance: '0.6 mi',
      image: { uri: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop' },
      isLive: true,
      liveViewers: 234,
    },
    {
      id: '7',
      name: 'Mumbai Spice',
      cuisine: 'Indian',
      sentiment: 'average',
      deliveryTime: '40 min',
      distance: '1.8 mi',
      image: { uri: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop' },
      isLive: false,
    },
    {
      id: '8',
      name: 'Parisian Bistro',
      cuisine: 'French',
      sentiment: 'mid',
      deliveryTime: '45 min',
      distance: '2.1 mi',
      image: { uri: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop' },
      isLive: true,
      liveViewers: 67,
    },
  ];

  const baseKitchens = kitchens.length > 0 ? kitchens : defaultKitchens;

  // Search functionality with debouncing
  const { setSearchQuery, filteredItems: displayKitchens } = useCategoryDrawerSearch({
    items: baseKitchens,
    searchFields: ['name', 'cuisine'],
  });

  // Enhanced filter chips for kitchen categories
  const filterChips = [
    { id: 'all', label: 'All', icon: 'grid' },
    { id: 'live', label: 'Live', icon: 'radio' },
    { id: 'elite', label: 'Elite', icon: 'star' },
    { id: 'quick', label: 'Quick', icon: 'flash' },
    { id: 'nearby', label: 'Nearby', icon: 'location' },
    { id: 'trending', label: 'Trending', icon: 'flame' },
  ];

  return (
    <CategoryFullDrawer
      categoryName="Featured Kitchens"
      categoryDescription="Discover exceptional home kitchens with authentic flavors and live cooking experiences"
      onBack={onBack}
      filterChips={filterChips}
      activeFilters={[]}
      onSearch={setSearchQuery}
      searchPlaceholder="Search kitchens by name or cuisine..."
      backButtonInSearchBar={true}
    >
      <View style={styles.content}>
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <FeaturedKitchensSection
            kitchens={displayKitchens}
            onKitchenPress={onKitchenPress}
            showTitle={false}
            onSeeAllPress={undefined}
          />
        </ScrollView>
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
  },
}); 