import { useMeals } from '@/hooks/useMeals';
import { useUserLocation } from '@/hooks/useUserLocation';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useAuthContext } from '../../contexts/AuthContext';
import { SkeletonWithTimeout } from './SkeletonWithTimeout';
import { TooFreshToWasteSkeleton } from './TooFreshToWasteSkeleton';

interface FreshItem {
  id: string;
  name: string;
  cuisine: string;  
  image: string;
  expirationBadge?: string; // Badge text like "in 30 Min"
}

// Component for individual fresh item with error handling
const FreshItemCard = ({ item, index, isLast, onItemPress }: { 
  item: FreshItem; 
  index: number; 
  isLast: boolean;
  onItemPress?: (item: FreshItem) => void;
}) => {
  const [imageError, setImageError] = useState(false);
  const fallbackImage = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=120&h=160&fit=crop';
  
  return (
    <TouchableOpacity
      style={{ 
        width: 120,
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        marginRight: isLast ? 0 : 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3
      }}
      onPress={() => onItemPress?.(item)}
      activeOpacity={0.8}
    >
      <View style={{ position: 'relative' }}>
        <Image
          source={{ uri: imageError ? fallbackImage : (item.image || fallbackImage) }}
          style={{ width: 120, height: 140 }}
          contentFit="cover"
          onError={() => setImageError(true)}
        />
        
        {/* Expiration Badge */}
        {item.expirationBadge && (
          <View style={{ 
            position: 'absolute', 
            top: 8, 
            left: 8, 
            right: 8 
          }}>
            <View style={{ 
              backgroundColor: '#fff',
              borderRadius: 8,
              padding: 6,
              alignItems: 'center'
            }}>
              <Text style={{ 
                fontSize: 8, 
                fontWeight: '600', 
                color: '#000',
                textAlign: 'center',
                lineHeight: 10
              }}>
                {item.expirationBadge}
              </Text>
            </View>
          </View>
        )}
      </View>
      
      <View style={{ padding: 8 }}>
        <Text style={{ 
          fontSize: 14, 
          fontWeight: 'bold', 
          color: '#000',
          marginBottom: 2
        }}>
          {item.name}
        </Text>
        <Text style={{ 
          fontSize: 12, 
          color: '#6b7280' 
        }}>
          {item.cuisine}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

interface TooFreshToWasteProps {
  onOpenDrawer?: () => void;
  onOpenSustainability?: () => void;
  useBackend?: boolean;
  onItemPress?: (item: FreshItem) => void;
  hasInitialLoadCompleted?: boolean;
  isFirstSection?: boolean;
}

function TooFreshToWasteComponent({ 
  onOpenDrawer, 
  onOpenSustainability,
  useBackend = true,
  onItemPress,
  hasInitialLoadCompleted = false,
  isFirstSection = false,
}: TooFreshToWasteProps) {
  const { isAuthenticated } = useAuthContext();
  const locationState = useUserLocation();

  const { getTooFreshItems } = useMeals();
  const [tooFreshData, setTooFreshData] = useState<any>(null);
  const [backendLoading, setBackendLoading] = useState(false);

  // Load too fresh items
  useEffect(() => {
    if (useBackend && isAuthenticated) {
      const loadTooFreshItems = async () => {
        setBackendLoading(true);
        try {
          const result = await getTooFreshItems(20, 1, locationState.location || null);
          if (result?.success) {
            setTooFreshData({ success: true, data: result.data });
          }
        } catch (error) {
          // Error is handled by the hook, just log it
          console.error('Error loading too fresh items:', error);
        } finally {
          setBackendLoading(false);
        }
      };
      loadTooFreshItems();
    }
  }, [useBackend, isAuthenticated, getTooFreshItems, locationState.location]);

  // Transform API data to component format
  const transformFreshItem = useCallback((apiItem: unknown): FreshItem | null => {
    if (!apiItem || typeof apiItem !== 'object') return null;

    // Handle different response structures
    const item = (apiItem as any).dish || (apiItem as any).meal || apiItem;
    
    return {
      id: item._id || item.id || '',
      name: item.name || 'Unknown Item',
      cuisine: item.cuisine?.[0] || item.cuisine || 'Various',
      image: item.image_url || item.image || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=120&h=160&fit=crop',
      expirationBadge: item.expirationBadge || undefined, // Use backend-calculated expiration badge
    };
  }, []);

  // Process fresh items data
  const freshItems: FreshItem[] = useMemo(() => {
    if (!useBackend || !tooFreshData?.success || !tooFreshData.data) {
      return [];
    }

    // SearchResponse.data is an array of SearchResult
    const items = Array.isArray(tooFreshData.data) ? tooFreshData.data : [];
    
    const transformedItems: FreshItem[] = items
      .map((item: unknown) => transformFreshItem(item))
      .filter((transformedItem: FreshItem | null): transformedItem is FreshItem => transformedItem !== null);
    
    return transformedItems;
  }, [tooFreshData, useBackend, transformFreshItem]);

  // Error state is shown in UI - no toast needed

  // Only show skeleton during initial load, never after initial load is complete
  if (useBackend && backendLoading && !hasInitialLoadCompleted) {
    return (
      <SkeletonWithTimeout isLoading={backendLoading}>
        <TooFreshToWasteSkeleton itemCount={3} />
      </SkeletonWithTimeout>
    );
  }

  // Hide section if no items (don't show empty state)
  if (freshItems.length === 0) {
    return null;
  }
  return (
    <View style={{ paddingVertical: 20, paddingTop: isFirstSection ? 35 : 20 }}>
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 16, 
        paddingHorizontal: 16 
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#000' }}>
            Eco Nosh
          </Text>
          <TouchableOpacity onPress={onOpenSustainability}>
            <Ionicons name="information-circle" size={20} color="#10B981" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={onOpenDrawer}>
          <Text style={{ fontSize: 16, color: '#666' }}>→</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 20 }} // Changed from paddingHorizontal to paddingLeft only
      >
        {freshItems.map((item, index) => (
          <FreshItemCard
            key={item.id}
            item={item}
            index={index}
            isLast={index === freshItems.length - 1}
            onItemPress={onItemPress}
          />
        ))}
      </ScrollView>
    </View>
  );
}

export const TooFreshToWaste = React.memo(TooFreshToWasteComponent); 