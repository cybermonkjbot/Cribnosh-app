import { useCategoryDrawerSearch } from '@/hooks/useCategoryDrawerSearch';
import { ScrollView, StyleSheet, View } from 'react-native';
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
  // Use kitchens from props (which come from API in MainScreen)
  // Return empty array if no kitchens provided instead of mock data
  const baseKitchens = kitchens.length > 0 ? kitchens : [];

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