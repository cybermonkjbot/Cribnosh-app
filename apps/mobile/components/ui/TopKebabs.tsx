import { useGetTopKebabsQuery } from '@/store/customerApi';
import { Image } from 'expo-image';
import React, { useCallback, useMemo } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useAuthContext } from '../../contexts/AuthContext';
import { showError } from '../../lib/GlobalToastManager';
import { TopKebabsEmpty } from './TopKebabsEmpty';
import { TopKebabsSkeleton } from './TopKebabsSkeleton';

interface Kebab {
  id: string;
  name: string;
  image: string;
}

interface TopKebabsProps {
  onOpenDrawer?: () => void;
  useBackend?: boolean;
  onKebabPress?: (kebab: Kebab) => void;
}

export function TopKebabs({ onOpenDrawer, useBackend = true, onKebabPress }: TopKebabsProps) {
  const { isAuthenticated } = useAuthContext();

  // Backend API integration
  const {
    data: kebabsData,
    isLoading: backendLoading,
    error: backendError,
  } = useGetTopKebabsQuery(
    { limit: 20, page: 1 },
    {
      skip: !useBackend || !isAuthenticated,
    }
  );

  // Transform API data to component format
  // TopKebabs shows cuisines/kitchens, not individual meals
  const transformKebabData = useCallback((apiItem: any): Kebab | null => {
    if (!apiItem) return null;

    // Handle different response structures - could be chef/kitchen or meal
    const item = apiItem.chef || apiItem.kitchen || apiItem.dish || apiItem.meal || apiItem;
    
    // Extract cuisine name from item
    const cuisineName = item.cuisine || item.specialties?.[0] || item.name || 'Unknown';
    
    return {
      id: item._id || item.id || '',
      name: cuisineName,
      image: item.image_url || item.image || 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=80&h=80&fit=crop',
    };
  }, []);

  // Process kebabs data
  const kebabs: Kebab[] = useMemo(() => {
    if (!useBackend || !kebabsData?.success || !kebabsData.data) {
      return [];
    }

    // SearchResponse.data is an array of SearchResult
    const items = Array.isArray(kebabsData.data) ? kebabsData.data : [];
    
    // Get unique cuisines from items
    const cuisineMap = new Map<string, Kebab>();
    
    items.forEach((item: any) => {
      const kebab = transformKebabData(item);
      if (kebab && !cuisineMap.has(kebab.name)) {
        cuisineMap.set(kebab.name, kebab);
      }
    });
    
    return Array.from(cuisineMap.values()).slice(0, 10); // Limit to 10 unique cuisines
  }, [kebabsData, useBackend, transformKebabData]);

  // Handle errors
  React.useEffect(() => {
    if (backendError && isAuthenticated) {
      showError('Failed to load top kebabs', 'Please try again');
    }
  }, [backendError, isAuthenticated]);

  // Show skeleton while loading
  if (useBackend && backendLoading) {
    return <TopKebabsSkeleton itemCount={3} />;
  }

  // Hide section if no kebabs (don't show empty state)
  if (kebabs.length === 0) {
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
          From Top Kebabs
        </Text>
        <TouchableOpacity onPress={onOpenDrawer}>
          <Text style={{ fontSize: 16, color: '#666' }}>→</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 20 }} // Changed from paddingHorizontal to paddingLeft only
      >
        {kebabs.map((kebab, index) => (
          <TouchableOpacity
            key={kebab.id}
            style={{ 
              alignItems: 'center',
              marginRight: index < kebabs.length - 1 ? 24 : 0 
            }}
            onPress={() => onKebabPress?.(kebab)}
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
                source={{ uri: kebab.image }}
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
              {kebab.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
} 