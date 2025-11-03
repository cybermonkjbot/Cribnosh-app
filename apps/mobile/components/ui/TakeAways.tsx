import { useAddToCartMutation, useGetTakeawayItemsQuery } from '@/store/customerApi';
import { Image } from 'expo-image';
import React, { useCallback, useMemo } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useAuthContext } from '../../contexts/AuthContext';
import { showError, showSuccess, showWarning } from '../../lib/GlobalToastManager';
import { navigateToSignIn } from '../../utils/signInNavigationGuard';
import { TakeAwaysEmpty } from './TakeAwaysEmpty';
import { TakeAwaysSkeleton } from './TakeAwaysSkeleton';

interface TakeAwayItem {
  id: string;
  name: string;
  description: string;
  price: string;
  image: string;
}

interface TakeAwaysProps {
  onOpenDrawer?: () => void;
  useBackend?: boolean;
}

export function TakeAways({ onOpenDrawer, useBackend = true }: TakeAwaysProps) {
  const [addToCart, { isLoading: isAddingToCart }] = useAddToCartMutation();
  const { isAuthenticated } = useAuthContext();

  // Backend API integration
  const {
    data: takeawayData,
    isLoading: backendLoading,
    error: backendError,
  } = useGetTakeawayItemsQuery(
    { limit: 20, page: 1 },
    {
      skip: !useBackend || !isAuthenticated,
    }
  );

  // Transform API data to component format
  const transformTakeawayItem = useCallback((apiItem: any): TakeAwayItem | null => {
    if (!apiItem) return null;

    // Handle different response structures
    const item = apiItem.dish || apiItem.meal || apiItem;
    
    return {
      id: item._id || item.id || '',
      name: item.name || 'Unknown Item',
      description: item.description || '',
      price: item.price ? `£${(item.price / 100).toFixed(2)}` : '£0.00',
      image: item.image_url || item.image || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=180&h=120&fit=crop',
    };
  }, []);

  // Process takeaway items data
  const takeAwayItems: TakeAwayItem[] = useMemo(() => {
    if (!useBackend || !takeawayData?.success || !takeawayData.data) {
      return [];
    }

    // SearchResponse.data is an array of SearchResult
    const items = Array.isArray(takeawayData.data) ? takeawayData.data : [];
    
    const transformedItems = items
      .map((item: any) => transformTakeawayItem(item))
      .filter((item): item is TakeAwayItem => item !== null);
    
    return transformedItems;
  }, [takeawayData, useBackend, transformTakeawayItem]);

  // Handle errors
  React.useEffect(() => {
    if (backendError && isAuthenticated) {
      showError('Failed to load takeaway items', 'Please try again');
    }
  }, [backendError, isAuthenticated]);

  // Show skeleton while loading
  if (useBackend && backendLoading) {
    return <TakeAwaysSkeleton itemCount={3} />;
  }

  // Show empty state if no items
  if (takeAwayItems.length === 0) {
    return <TakeAwaysEmpty />;
  }

  const handleAddToCart = async (item: TakeAwayItem) => {
    // Check authentication
    if (!isAuthenticated) {
      showWarning(
        "Authentication Required",
        "Please sign in to add items to cart"
      );
      navigateToSignIn();
      return;
    }

    try {
      const result = await addToCart({
        dish_id: item.id,
        quantity: 1,
        special_instructions: undefined,
      }).unwrap();

      if (result.success) {
        showSuccess("Added to Cart!", `${item.name} added successfully`);
      }
    } catch (err: any) {
      const errorMessage = err?.data?.error?.message || err?.message || 'Failed to add item to cart';
      showError("Failed to add item to cart", errorMessage);
    }
  };

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
          Take aways
        </Text>
        <TouchableOpacity onPress={onOpenDrawer}>
          <Text style={{ fontSize: 16, color: '#666' }}>→</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 16 }} // Changed from paddingHorizontal to paddingLeft only
      >
        {takeAwayItems.map((item, index) => (
          <View
            key={item.id}
            style={{ 
              width: 180,
              backgroundColor: '#fff',
              borderRadius: 16,
              overflow: 'hidden',
              marginRight: index < takeAwayItems.length - 1 ? 12 : 0,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3
            }}
          >
            <Image
              source={{ uri: item.image }}
              style={{ width: 180, height: 100 }}
              contentFit="cover"
            />
            
            <View style={{ padding: 12 }}>
              <Text style={{ 
                fontSize: 14, 
                fontWeight: 'bold', 
                color: '#000',
                marginBottom: 4
              }}>
                {item.name}
              </Text>
              
              <Text style={{ 
                fontSize: 11, 
                color: '#6b7280',
                marginBottom: 12,
                lineHeight: 14
              }}>
                {item.description}
              </Text>
              
              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}>
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: 'bold', 
                  color: '#ef4444' 
                }}>
                  {item.price}
                </Text>
                
                <TouchableOpacity 
                  style={{ 
                    width: 28, 
                    height: 28, 
                    borderRadius: 14,
                    backgroundColor: '#ef4444',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: isAddingToCart ? 0.6 : 1,
                  }}
                  onPress={() => handleAddToCart(item)}
                  disabled={isAddingToCart}
                  activeOpacity={0.8}
                >
                  <Text style={{ 
                    color: '#fff', 
                    fontSize: 16, 
                    fontWeight: 'bold' 
                  }}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
} 