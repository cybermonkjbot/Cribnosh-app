import { useAuthContext } from '@/contexts/AuthContext';
import { useGetCuisineCategoriesQuery } from '@/store/customerApi';
import { Image } from 'expo-image';
import React, { useCallback, useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { showError } from '../../lib/GlobalToastManager';
import { CuisineCategoriesSectionEmpty } from './CuisineCategoriesSectionEmpty';
import { CuisineCategoriesSectionSkeleton } from './CuisineCategoriesSectionSkeleton';

interface Cuisine {
  id: string;
  name: string;
  image: any;
  restaurantCount: number;
  isActive?: boolean;
}

interface CuisineCategoriesSectionProps {
  cuisines?: Cuisine[];
  onCuisinePress?: (cuisine: Cuisine) => void;
  onSeeAllPress?: () => void;
  showTitle?: boolean;
  isLoading?: boolean;
  useBackend?: boolean;
}

export const CuisineCategoriesSection: React.FC<CuisineCategoriesSectionProps> = ({
  cuisines: propCuisines,
  onCuisinePress,
  onSeeAllPress,
  showTitle = true,
  isLoading: propIsLoading = false,
  useBackend = true,
}) => {
  const { isAuthenticated } = useAuthContext();

  // Backend API integration
  const {
    data: categoriesData,
    isLoading: backendLoading,
    error: backendError,
  } = useGetCuisineCategoriesQuery(
    undefined,
    {
      skip: !useBackend || !isAuthenticated,
    }
  );

  // Transform API data to component format
  const transformCuisineData = useCallback((apiCategory: any): Cuisine | null => {
    if (!apiCategory) return null;

    // Default cuisine images mapping
    const defaultCuisineImages: Record<string, string> = {
      'italian': 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&h=400&fit=crop',
      'indian': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=400&fit=crop',
      'chinese': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=400&fit=crop',
      'nigerian': 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&h=400&fit=crop',
      'mexican': 'https://images.unsplash.com/photo-1565299585323-38174c3d1e3d?w=400&h=400&fit=crop',
      'japanese': 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=400&fit=crop',
    };

    const cuisineNameLower = apiCategory.name.toLowerCase();
    const imageUrl = apiCategory.image_url || defaultCuisineImages[cuisineNameLower] || 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop';

    return {
      id: apiCategory.id || cuisineNameLower,
      name: apiCategory.name,
      image: { uri: imageUrl },
      restaurantCount: apiCategory.kitchen_count || 0,
      isActive: apiCategory.is_active ?? true,
    };
  }, []);

  // Process cuisines data
  const cuisines: Cuisine[] = useMemo(() => {
    // If propCuisines provided, use them (for filtered view)
    if (propCuisines && propCuisines.length > 0) {
      return propCuisines;
    }

    // Otherwise, use backend data if available
    if (useBackend && categoriesData?.success && categoriesData.data?.categories) {
      const categories = categoriesData.data.categories;
      const transformedCuisines = categories
        .map(transformCuisineData)
        .filter((cuisine): cuisine is Cuisine => cuisine !== null);
      return transformedCuisines;
    }

    // Fallback to empty array
    return [];
  }, [propCuisines, categoriesData, useBackend, transformCuisineData]);

  // Handle errors
  React.useEffect(() => {
    if (backendError && isAuthenticated) {
      showError('Failed to load cuisine categories', 'Please try again');
    }
  }, [backendError, isAuthenticated]);

  // Determine loading state
  const isLoading = propIsLoading || (useBackend && backendLoading && isAuthenticated);
  const renderCuisineCard = (cuisine: Cuisine, index: number) => (
    <TouchableOpacity
      key={cuisine.id}
      style={{
        width: '48%',
        aspectRatio: 1,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: cuisine.isActive 
          ? 'rgba(239, 68, 68, 0.1)' 
          : 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: cuisine.isActive 
          ? 'rgba(239, 68, 68, 0.3)' 
          : 'rgba(255, 255, 255, 0.15)',
        marginBottom: 12,
      }}
      onPress={() => onCuisinePress?.(cuisine)}
      activeOpacity={0.8}
    >
      {/* Cuisine Image */}
      <View style={{ 
        flex: 1,
        position: 'relative',
      }}>
        <Image
          source={cuisine.image}
          style={{
            width: '100%',
            height: '100%',
            resizeMode: 'cover',
          }}
        />
        
        {/* Overlay */}
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
        }} />
        
        {/* Content */}
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: 12,
        }}>
          <Text style={{
            color: '#ffffff',
            fontSize: 16,
            fontWeight: '700',
            marginBottom: 4,
            textShadowColor: 'rgba(0, 0, 0, 0.8)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2,
          }}>
            {cuisine.name}
          </Text>
          
          <Text style={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: 12,
            fontWeight: '500',
            textShadowColor: 'rgba(0, 0, 0, 0.8)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2,
          }}>
            {cuisine.restaurantCount} Kitchens
          </Text>
        </View>
        
        {/* Active Indicator */}
        {cuisine.isActive && (
          <View style={{
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: '#ef4444',
            width: 8,
            height: 8,
            borderRadius: 4,
          }} />
        )}
      </View>
    </TouchableOpacity>
  );

  // Show skeleton while loading
  if (isLoading && useBackend) {
    return <CuisineCategoriesSectionSkeleton itemCount={4} />;
  }

  // Hide section if no cuisines (don't show empty state)
  if (cuisines.length === 0) {
    return null;
  }

  return (
    <View style={{ marginBottom: 24 }}>
      {showTitle && (
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          paddingHorizontal: 12,
        }}>
          <Text style={{
            color: '#1a1a1a',
            fontSize: 20,
            fontWeight: '700',
            lineHeight: 24,
          }}>
            Cuisine Categories
          </Text>
          
          {onSeeAllPress && (
            <TouchableOpacity onPress={onSeeAllPress}>
              <Text style={{
                color: '#ef4444',
                fontSize: 14,
                fontWeight: '600',
              }}>
                See All
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      
      {/* Grid Layout */}
      <View style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
      }}>
        {cuisines.map(renderCuisineCard)}
      </View>
    </View>
  );
}; 