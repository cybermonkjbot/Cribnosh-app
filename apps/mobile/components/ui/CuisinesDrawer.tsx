import { useAuthContext } from '@/contexts/AuthContext';
import { useCategoryDrawerSearch } from '@/hooks/useCategoryDrawerSearch';
import { showError } from '@/lib/GlobalToastManager';
import { useGetCuisinesQuery } from '@/store/customerApi';
import { Image } from 'expo-image';
import React, { useMemo } from 'react';
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
  const { isAuthenticated } = useAuthContext();

  // Fetch cuisines from API if not provided via props
  const {
    data: cuisinesData,
    error: cuisinesError,
  } = useGetCuisinesQuery(
    { page: 1, limit: 50 },
    {
      skip: !isAuthenticated || cuisines.length > 0, // Skip if props provided
    }
  );

  // Transform API data to Cuisine format
  const apiCuisines: Cuisine[] = useMemo(() => {
    if (cuisinesData?.success && cuisinesData.data && Array.isArray(cuisinesData.data)) {
      return cuisinesData.data.map((cuisine: any) => ({
        id: cuisine.id || cuisine._id || '',
        name: cuisine.name || 'Unknown Cuisine',
        image: cuisine.image_url || cuisine.image || 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=80&h=80&fit=crop',
      }));
    }
    return [];
  }, [cuisinesData]);

  // Handle errors
  React.useEffect(() => {
    if (cuisinesError && isAuthenticated) {
      showError('Failed to load cuisines', 'Please try again');
    }
  }, [cuisinesError, isAuthenticated]);

  // Use props if provided, otherwise use API data, otherwise empty array
  const baseCuisines = useMemo(() => {
    if (cuisines.length > 0) {
      return cuisines;
    }
    if (apiCuisines.length > 0) {
      return apiCuisines;
    }
    return []; // Return empty array instead of mock data
  }, [cuisines, apiCuisines]);

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

