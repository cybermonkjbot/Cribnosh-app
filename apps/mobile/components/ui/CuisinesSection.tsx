import { Image } from 'expo-image';
import React, { useCallback, useMemo } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useGetCuisinesQuery } from '@/store/customerApi';
import { useAuthContext } from '../../contexts/AuthContext';
import { showError } from '../../lib/GlobalToastManager';
import { CuisinesSectionEmpty } from './CuisinesSectionEmpty';
import { CuisinesSectionSkeleton } from './CuisinesSectionSkeleton';

interface Cuisine {
  id: string;
  name: string;
  image: string;
}

interface CuisinesSectionProps {
  cuisines?: Cuisine[];
  onCuisinePress?: (cuisine: Cuisine) => void;
  onSeeAllPress?: () => void;
  useBackend?: boolean;
}

export function CuisinesSection({ 
  cuisines: propCuisines,
  onCuisinePress, 
  onSeeAllPress,
  useBackend = true,
}: CuisinesSectionProps) {
  const { isAuthenticated } = useAuthContext();

  // Backend API integration
  const {
    data: cuisinesData,
    isLoading: backendLoading,
    error: backendError,
  } = useGetCuisinesQuery(
    { page: 1, limit: 20 },
    {
      skip: !useBackend || !isAuthenticated,
    }
  );

  // Transform API data to component format
  const transformCuisineData = useCallback((apiCuisine: any): Cuisine | null => {
    if (!apiCuisine) return null;

    return {
      id: apiCuisine.id || '',
      name: apiCuisine.name || 'Unknown Cuisine',
      image: apiCuisine.image_url || apiCuisine.image || 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=80&h=80&fit=crop',
    };
  }, []);

  // Process cuisines data
  const cuisines: Cuisine[] = useMemo(() => {
    // If propCuisines provided, use them (for filtered view)
    if (propCuisines && propCuisines.length > 0) {
      return propCuisines;
    }

    // Otherwise, use backend data if available
    if (useBackend && cuisinesData?.success && cuisinesData.data) {
      const cuisinesArray = Array.isArray(cuisinesData.data) ? cuisinesData.data : [];
      const transformedCuisines = cuisinesArray
        .map(transformCuisineData)
        .filter((cuisine): cuisine is Cuisine => cuisine !== null);
      return transformedCuisines;
    }

    // Fallback to empty array
    return [];
  }, [propCuisines, cuisinesData, useBackend, transformCuisineData]);

  // Handle errors
  React.useEffect(() => {
    if (backendError && isAuthenticated) {
      showError('Failed to load cuisines', 'Please try again');
    }
  }, [backendError, isAuthenticated]);

  // Show skeleton while loading
  if (useBackend && backendLoading) {
    return <CuisinesSectionSkeleton itemCount={3} />;
  }

  // Show empty state if no cuisines
  if (cuisines.length === 0) {
    return <CuisinesSectionEmpty />;
  }
  return (
    <View style={{ paddingVertical: 20 }}>
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 16, 
        paddingHorizontal: 16 
      }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#000' }}>
          Cuisines
        </Text>
        <TouchableOpacity onPress={onSeeAllPress}>
          <Text style={{ fontSize: 16, color: '#666' }}>→</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 20 }} // Changed from paddingHorizontal to paddingLeft only
      >
        {cuisines.map((cuisine, index) => (
          <TouchableOpacity
            key={cuisine.id}
            style={{ 
              alignItems: 'center',
              marginRight: index < cuisines.length - 1 ? 24 : 0 
            }}
            onPress={() => onCuisinePress?.(cuisine)}
            activeOpacity={0.8}
          >
            <View style={{ 
              width: 64, 
              height: 64, 
              borderRadius: 32, 
              overflow: 'hidden', 
              backgroundColor: '#f3f4f6',
              marginBottom: 8
            }}>
              <Image
                source={{ uri: cuisine.image }}
                style={{ width: 64, height: 64 }}
                contentFit="cover"
              />
            </View>
            <Text style={{ 
              fontSize: 12, 
              fontWeight: '500', 
              color: '#000',
              textAlign: 'center' 
            }}>
              {cuisine.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
} 