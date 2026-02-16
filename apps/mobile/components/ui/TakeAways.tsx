import { useCart } from '@/hooks/useCart';
import { useMeals } from '@/hooks/useMeals';
import { Image } from 'expo-image';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useAuthContext } from '../../contexts/AuthContext';
import { showError, showSuccess, showWarning } from '../../lib/GlobalToastManager';
import { navigateToSignIn } from '../../utils/signInNavigationGuard';
import { SkeletonWithTimeout } from './SkeletonWithTimeout';
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
  hasInitialLoadCompleted?: boolean;
  isFirstSection?: boolean;
}

function TakeAwaysComponent({ onOpenDrawer, useBackend = true, hasInitialLoadCompleted = false, isFirstSection = false }: TakeAwaysProps) {
  const { addToCart } = useCart();
  const { getTakeawayItems } = useMeals();
  const { isAuthenticated, token, checkTokenExpiration, refreshAuthState } = useAuthContext();
  const [takeawayData, setTakeawayData] = useState<any>(null);
  const [backendLoading, setBackendLoading] = useState(false);
  const [backendError, setBackendError] = useState<any>(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Load takeaway items
  useEffect(() => {
    if (useBackend && isAuthenticated) {
      const loadTakeawayItems = async () => {
        setBackendLoading(true);
        setBackendError(null);
        try {
          const result = await getTakeawayItems(20, 1);
          if (result?.success) {
            setTakeawayData({ success: true, data: result.data });
          }
        } catch (error) {
          setBackendError(error);
        } finally {
          setBackendLoading(false);
        }
      };
      loadTakeawayItems();
    }
  }, [useBackend, isAuthenticated, getTakeawayItems]);

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
      .filter((item: TakeAwayItem | null): item is TakeAwayItem => item !== null);

    return transformedItems;
  }, [takeawayData, useBackend, transformTakeawayItem]);

  // Error state is shown in UI - no toast needed

  // Only show skeleton during initial load, never after initial load is complete
  if (useBackend && backendLoading && !hasInitialLoadCompleted) {
    return (
      <SkeletonWithTimeout isLoading={backendLoading}>
        <TakeAwaysSkeleton itemCount={3} />
      </SkeletonWithTimeout>
    );
  }

  // Hide section if no items (don't show empty state)
  if (takeAwayItems.length === 0) {
    return null;
  }

  const handleAddToCart = async (item: TakeAwayItem) => {
    // Check authentication and token validity
    if (!isAuthenticated || !token) {
      showWarning(
        "Authentication Required",
        "Please sign in to add items to cart"
      );
      navigateToSignIn();
      return;
    }

    // Check if token is expired and refresh auth state if needed
    const isExpired = checkTokenExpiration();
    if (isExpired) {
      // Refresh auth state to update isAuthenticated
      await refreshAuthState();
    }

    setIsAddingToCart(true);
    try {
      // Extract price from string format "£X.XX" or number
      const priceValue = typeof item.price === 'string'
        ? parseFloat(item.price.replace('£', '')) * 100
        : item.price;

      await addToCart(item.id, 1);
      showSuccess("Added to Cart", `${item.name} added to your cart`);
    } catch (error: any) {
      showError("Failed to Add", error?.message || "Could not add item to cart");
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <View style={{ paddingVertical: 20, paddingTop: isFirstSection ? 35 : 20 }}>
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

export const TakeAways = React.memo(TakeAwaysComponent); 