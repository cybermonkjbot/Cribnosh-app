import { Image } from 'expo-image';
import React from 'react';
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
  const defaultCuisines: Cuisine[] = [
    {
      id: '1',
      name: 'Italian',
      image: { uri: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop' },
      restaurantCount: 24,
      isActive: false,
    },
    {
      id: '2',
      name: 'Mexican',
      image: { uri: 'https://images.unsplash.com/photo-1565958911770-bed387754dfa?w=400&h=400&fit=crop' },
      restaurantCount: 18,
      isActive: false,
    },
    {
      id: '3',
      name: 'French',
      image: { uri: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=400&fit=crop' },
      restaurantCount: 12,
      isActive: false,
    },
    {
      id: '4',
      name: 'Japanese',
      image: { uri: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&h=400&fit=crop' },
      restaurantCount: 15,
      isActive: false,
    },
    {
      id: '5',
      name: 'Indian',
      image: { uri: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=400&fit=crop' },
      restaurantCount: 20,
      isActive: false,
    },
    {
      id: '6',
      name: 'Thai',
      image: { uri: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&h=400&fit=crop' },
      restaurantCount: 14,
      isActive: false,
    },
  ];

  const displayCuisines = cuisines.length > 0 ? cuisines : defaultCuisines;

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
      searchPlaceholder="Search cuisines..."
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

