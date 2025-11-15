import { useAuthContext } from '@/contexts/AuthContext';
import { useCategoryDrawerSearch } from '@/hooks/useCategoryDrawerSearch';
import { useCuisines } from '@/hooks/useCuisines';
import { showError } from '@/lib/GlobalToastManager';
import { Image } from 'expo-image';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  const { getCuisines } = useCuisines();
  const [cuisinesData, setCuisinesData] = useState<any>(null);
  const [cuisinesError, setCuisinesError] = useState<any>(null);

  // Load cuisines from API if not provided via props
  useEffect(() => {
    if (isAuthenticated && cuisines.length === 0) {
      const loadCuisines = async () => {
        try {
          const result = await getCuisines(1, 50);
          if (result.success) {
            // Transform to match expected format
            // result.data is already an array of cuisines from the hook
            setCuisinesData({
              success: true,
              data: result.data.map((cuisine: any) => ({
                id: cuisine.id || cuisine._id || `cuisine-${cuisine.name}`,
                name: cuisine.name,
                image_url: cuisine.image_url || cuisine.image || null,
              })),
            });
          }
        } catch (error: any) {
          setCuisinesError(error);
        }
      };
      loadCuisines();
    }
  }, [isAuthenticated, cuisines.length, getCuisines]);

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

  // Error state is shown in UI - no toast needed

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

