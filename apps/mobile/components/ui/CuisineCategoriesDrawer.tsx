import { useCategoryDrawerSearch } from '@/hooks/useCategoryDrawerSearch';
import { Image } from 'expo-image';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CategoryFullDrawer } from './CategoryFullDrawer';

interface Cuisine {
  id: string;
  name: string;
  image: any;
  restaurantCount: number;
  isActive?: boolean;
}

interface CuisineCategoriesDrawerProps {
  onBack: () => void;
  cuisines?: Cuisine[];
  onCuisinePress?: (cuisine: Cuisine) => void;
}

export function CuisineCategoriesDrawer({
  onBack,
  cuisines = [],
  onCuisinePress
}: CuisineCategoriesDrawerProps) {
  // Use cuisines from props (which come from API in MainScreen)
  // Return empty array if no cuisines provided instead of mock data
  const baseCuisines = cuisines.length > 0 ? cuisines : [];

  // Search functionality with debouncing
  const { setSearchQuery, filteredItems: displayCuisines } = useCategoryDrawerSearch({
    items: baseCuisines,
    searchFields: ['name'],
  });

  const renderCuisineCard = (cuisine: Cuisine) => (
    <TouchableOpacity
      key={cuisine.id}
      style={styles.cuisineCard}
      onPress={() => onCuisinePress?.(cuisine)}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        <Image
          source={cuisine.image}
          style={styles.image}
          contentFit="cover"
        />
        
        <View style={styles.overlay} />
        
        <View style={styles.content}>
          <Text style={styles.cuisineName}>{cuisine.name}</Text>
          <Text style={styles.restaurantCount}>
            {cuisine.restaurantCount} Kitchens
          </Text>
        </View>
        
        {cuisine.isActive && (
          <View style={styles.activeIndicator} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <CategoryFullDrawer
      categoryName="Cuisine Categories"
      categoryDescription="Explore all cuisine types available in your area"
      onBack={onBack}
      showTabs={false}
      onSearch={setSearchQuery}
      searchPlaceholder="Search cuisines..."
      backButtonInSearchBar={true}
    >
      <ScrollView 
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.grid}>
          {displayCuisines.map(renderCuisineCard)}
        </View>
      </ScrollView>
    </CategoryFullDrawer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  cuisineCard: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  cuisineName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  restaurantCount: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  activeIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF3B30',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

