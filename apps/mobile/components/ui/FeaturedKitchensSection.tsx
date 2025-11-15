import { useAuthContext } from '@/contexts/AuthContext';
import { useChefs } from '@/hooks/useChefs';
import { Image } from 'expo-image';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { showError } from '../../lib/GlobalToastManager';
import { FeaturedKitchensSectionSkeleton } from './FeaturedKitchensSectionSkeleton';
import { KitchenRating } from './KitchenRating';
import { SkeletonWithTimeout } from './SkeletonWithTimeout';

interface Kitchen {
  id: string;
  name: string;
  cuisine: string;
  sentiment: 'bussing' | 'mid' | 'notIt' | 'fire' | 'slaps' | 'decent' | 'meh' | 'trash' | 'elite' | 'solid' | 'average' | 'skip';
  deliveryTime: string;
  distance: string;
  image: any;
  isLive?: boolean;
  liveViewers?: number;
}

interface FeaturedKitchensSectionProps {
  kitchens?: Kitchen[];
  onKitchenPress?: (kitchen: Kitchen) => void;
  onSeeAllPress?: () => void;
  title?: string;
  showTitle?: boolean;
  isLoading?: boolean;
  useBackend?: boolean;
  hasInitialLoadCompleted?: boolean;
}

export const FeaturedKitchensSection: React.FC<FeaturedKitchensSectionProps> = ({
  kitchens: propKitchens,
  onKitchenPress,
  onSeeAllPress,
  title,
  showTitle = true,
  isLoading: propIsLoading = false,
  useBackend = true,
  hasInitialLoadCompleted = false,
}) => {
  const { isAuthenticated } = useAuthContext();
  const { getFeaturedKitchens } = useChefs();

  const [featuredKitchensData, setFeaturedKitchensData] = useState<any>(null);
  const [backendLoading, setBackendLoading] = useState(false);
  const [backendError, setBackendError] = useState<any>(null);

  // Load featured kitchens
  useEffect(() => {
    if (useBackend && isAuthenticated) {
      const loadFeaturedKitchens = async () => {
        try {
          setBackendLoading(true);
          setBackendError(null);
          const result = await getFeaturedKitchens({ limit: 20 });
          if (result.success) {
            setFeaturedKitchensData({ success: true, data: result.data });
          }
        } catch (error: any) {
          setBackendError(error);
        } finally {
          setBackendLoading(false);
        }
      };
      loadFeaturedKitchens();
    } else {
      setFeaturedKitchensData(null);
    }
  }, [useBackend, isAuthenticated, getFeaturedKitchens]);

  // Transform API data to component format
  const transformKitchenData = useCallback((apiKitchen: any): Kitchen | null => {
    if (!apiKitchen) return null;

    // Ensure sentiment type matches component interface
    const validSentiments: Kitchen['sentiment'][] = [
      'bussing', 'mid', 'notIt', 'fire', 'slaps', 'decent', 
      'meh', 'trash', 'elite', 'solid', 'average', 'skip'
    ];
    const sentiment = validSentiments.includes(apiKitchen.sentiment as Kitchen['sentiment'])
      ? apiKitchen.sentiment as Kitchen['sentiment']
      : 'average';

    // Default kitchen image if null
    const imageUrl = apiKitchen.image_url || 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop';

    return {
      id: apiKitchen.id,
      name: apiKitchen.name || 'Unknown Kitchen',
      cuisine: apiKitchen.cuisine || 'Various',
      sentiment,
      deliveryTime: apiKitchen.delivery_time || '25-30 min',
      distance: apiKitchen.distance || 'N/A',
      image: { uri: imageUrl },
      isLive: apiKitchen.is_live || false,
      liveViewers: apiKitchen.live_viewers || undefined,
    };
  }, []);

  // Process kitchens data
  const kitchens: Kitchen[] = useMemo(() => {
    // If propKitchens provided (even if empty), use them (for filtered view)
    // This allows empty arrays to be respected when filtering
    if (propKitchens !== undefined) {
      return propKitchens;
    }

    // Otherwise, use backend data if available
    if (useBackend && featuredKitchensData?.success && featuredKitchensData.data?.kitchens) {
      const apiKitchens = featuredKitchensData.data.kitchens;
      const transformedKitchens = apiKitchens
        .map(transformKitchenData)
        .filter((kitchen): kitchen is Kitchen => kitchen !== null);
      return transformedKitchens;
    }

    // Fallback to empty array
    return [];
  }, [propKitchens, featuredKitchensData, useBackend, transformKitchenData]);

  // Error state is shown in UI - no toast needed

  // Determine loading state
  const isLoading = propIsLoading || (useBackend && backendLoading && isAuthenticated);
  
  // Only show skeleton during initial load, never after initial load is complete
  if (isLoading && useBackend && !hasInitialLoadCompleted) {
    return (
      <SkeletonWithTimeout isLoading={isLoading}>
        <FeaturedKitchensSectionSkeleton itemCount={4} />
      </SkeletonWithTimeout>
    );
  }
  
  const renderKitchenCard = (kitchen: Kitchen, index: number) => (
    <TouchableOpacity
      key={kitchen.id}
      style={{
        width: 160,
        marginRight: 12,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
      }}
      onPress={() => onKitchenPress?.(kitchen)}
      activeOpacity={0.8}
    >
      {/* Kitchen Image */}
      <View style={{ position: 'relative' }}>
        <Image
          source={kitchen.image}
          style={{
            width: '100%',
            height: 100,
            resizeMode: 'cover',
          }}
        />
        
        {/* Live Badge */}
        {kitchen.isLive && (
          <View style={{
            position: 'absolute',
            top: 8,
            left: 8,
            backgroundColor: '#ef4444',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
          }}>
            <View style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: '#ffffff',
            }} />
            <Text style={{
              color: '#ffffff',
              fontSize: 10,
              fontWeight: '600',
            }}>
              LIVE
            </Text>
          </View>
        )}
        
        {/* Kitchen Sentiment Badge */}
        <View style={{
          position: 'absolute',
          top: 8,
          right: 8,
        }}>
          <KitchenRating 
            sentiment={kitchen.sentiment} 
            size="small" 
            compact={kitchen.isLive}
          />
        </View>
      </View>
      
      {/* Kitchen Info */}
      <View style={{ padding: 12 }}>
        <Text style={{
          color: '#1a1a1a',
          fontSize: 14,
          fontWeight: '600',
          marginBottom: 2,
          lineHeight: 18,
        }}>
          {kitchen.name}
        </Text>
        <Text style={{
          color: '#666666',
          fontSize: 12,
          fontWeight: '400',
          marginBottom: 8,
          lineHeight: 16,
        }}>
          {kitchen.cuisine}
        </Text>
        
        {/* Delivery Info */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}>
          <Text style={{
            color: '#666666',
            fontSize: 11,
            fontWeight: '500',
          }}>
            {kitchen.deliveryTime}
          </Text>
          <Text style={{
            color: '#666666',
            fontSize: 11,
            fontWeight: '500',
          }}>
            {kitchen.distance}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Hide section if no kitchens (don't show empty state)
  if (kitchens.length === 0) {
    return null;
  }

  // Don't show "See All" button inside drawers - only on main screen
  const shouldShowSeeAll = showTitle && onSeeAllPress;

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
            {title || 'Featured Kitchens'}
          </Text>
          
          {shouldShowSeeAll && (
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
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 12,
          gap: 12,
        }}
      >
        {kitchens.map(renderKitchenCard)}
      </ScrollView>
    </View>
  );
}; 