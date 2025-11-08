import { useCategoryDrawerSearch } from '@/hooks/useCategoryDrawerSearch';
import { Image } from 'expo-image';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CategoryFullDrawer } from './CategoryFullDrawer';

interface Cuisine {
  id: string;
  name: string;
  image: string;
}

interface CuisinesDrawerProps {
  onBack: () => void;
  cuisines?: Cuisine[];
  onCuisinePress?: (cuisine: Cuisine) => void;
}

export function CuisinesDrawer({
  onBack,
  cuisines = [],
  onCuisinePress
}: CuisinesDrawerProps) {
  const defaultCuisines: Cuisine[] = [
    {
      id: '1',
      name: 'Italian',
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=80&h=80&fit=crop',
    },
    {
      id: '2',
      name: 'Mexican',
      image: 'https://images.unsplash.com/photo-1565958911770-bed387754dfa?w=80&h=80&fit=crop',
    },
    {
      id: '3',
      name: 'French',
      image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=80&h=80&fit=crop',
    },
    {
      id: '4',
      name: 'Japanese',
      image: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=80&h=80&fit=crop',
    },
    {
      id: '5',
      name: 'Indian',
      image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=80&h=80&fit=crop',
    },
    {
      id: '6',
      name: 'Thai',
      image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=80&h=80&fit=crop',
    },
    {
      id: '7',
      name: 'Chinese',
      image: 'https://images.unsplash.com/photo-1565958911770-bed387754dfa?w=80&h=80&fit=crop',
    },
    {
      id: '8',
      name: 'Mediterranean',
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=80&h=80&fit=crop',
    },
  ];

  const baseCuisines = cuisines.length > 0 ? cuisines : defaultCuisines;

  // Search functionality with debouncing
  const { setSearchQuery, filteredItems: displayCuisines } = useCategoryDrawerSearch({
    items: baseCuisines,
    searchFields: ['name'],
  });

  const renderCuisineCard = (cuisine: Cuisine, index: number) => (
    <TouchableOpacity
      key={cuisine.id}
      style={styles.cuisineCard}
      onPress={() => onCuisinePress?.(cuisine)}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: cuisine.image }}
          style={styles.image}
          contentFit="cover"
        />
      </View>
      <Text style={styles.cuisineName}>{cuisine.name}</Text>
    </TouchableOpacity>
  );

  return (
    <CategoryFullDrawer
      categoryName="Cuisines"
      categoryDescription="Browse all available cuisines and discover new flavors"
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
          {displayCuisines.map((cuisine, index) => renderCuisineCard(cuisine, index))}
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
    justifyContent: 'flex-start',
    gap: 16,
  },
  cuisineCard: {
    width: '30%',
    alignItems: 'center',
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  cuisineName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#094327',
    textAlign: 'center',
  },
});

