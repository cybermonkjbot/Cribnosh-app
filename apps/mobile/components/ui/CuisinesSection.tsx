import { Image } from 'expo-image';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useCuisines } from '@/hooks/useCuisines';
import { useAuthContext } from '../../contexts/AuthContext';
import { showError } from '../../lib/GlobalToastManager';
import { CuisinesSectionEmpty } from './CuisinesSectionEmpty';
import { CuisinesSectionSkeleton } from './CuisinesSectionSkeleton';
import { SkeletonWithTimeout } from './SkeletonWithTimeout';

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
  hasInitialLoadCompleted?: boolean;
}

export function CuisinesSection({ 
  cuisines: propCuisines,
  onCuisinePress, 
  onSeeAllPress,
  useBackend = true,
  hasInitialLoadCompleted = false,
}: CuisinesSectionProps) {
  const { isAuthenticated } = useAuthContext();
  const { getCuisines, isLoading: backendLoading } = useCuisines();
  const [cuisinesData, setCuisinesData] = useState<any>(null);
  const [backendError, setBackendError] = useState<any>(null);

  // Fetch cuisines from backend when needed
  useEffect(() => {
    if (useBackend && isAuthenticated && !propCuisines) {
      loadCuisines();
    }
  }, [useBackend, isAuthenticated]);

  const loadCuisines = useCallback(async () => {
    try {
      setBackendError(null);
      const result = await getCuisines(1, 20);
      if (result.success) {
        setCuisinesData(result);
      }
    } catch (error) {
      setBackendError(error);
      // Error state is shown in UI - no toast needed
    }
  }, [getCuisines, isAuthenticated]);

  // Transform API data to component format
  const transformCuisineData = useCallback((apiCuisine: any): Cuisine | null => {
    if (!apiCuisine) return null;

    // Handle case where cuisines are returned as strings
    if (typeof apiCuisine === 'string') {
      return {
        id: apiCuisine,
        name: apiCuisine,
        image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=80&h=80&fit=crop',
      };
    }

    return {
      id: apiCuisine.id || apiCuisine.name || '',
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

  // Only show skeleton during initial load, never after initial load is complete
  if (useBackend && backendLoading && !propCuisines && !hasInitialLoadCompleted) {
    return (
      <SkeletonWithTimeout isLoading={backendLoading}>
        <CuisinesSectionSkeleton itemCount={3} />
      </SkeletonWithTimeout>
    );
  }

  // Hide section if no cuisines (don't show empty state)
  if (cuisines.length === 0) {
    return null;
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