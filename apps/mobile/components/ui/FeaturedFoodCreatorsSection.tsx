import { useAuthContext } from '@/contexts/AuthContext';
import { useFoodCreators } from '@/hooks/useFoodCreators';
import { Image } from 'expo-image';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { FeaturedFoodCreatorsSectionSkeleton } from './FeaturedFoodCreatorsSectionSkeleton';
import { FoodCreatorRating } from './FoodCreatorRating';
import { SkeletonWithTimeout } from './SkeletonWithTimeout';

interface FoodCreator {
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

interface FeaturedFoodCreatorsSectionProps {
  foodCreators?: FoodCreator[];
  onFoodCreatorPress?: (foodCreator: FoodCreator) => void;
  onSeeAllPress?: () => void;
  title?: string;
  showTitle?: boolean;
  isLoading?: boolean;
  useBackend?: boolean;
  hasInitialLoadCompleted?: boolean;
  isFirstSection?: boolean;
}

const FeaturedFoodCreatorsSectionComponent: React.FC<FeaturedFoodCreatorsSectionProps> = ({
  foodCreators: propFoodCreators,
  onFoodCreatorPress,
  onSeeAllPress,
  title,
  showTitle = true,
  isLoading: propIsLoading = false,
  useBackend = true,
  hasInitialLoadCompleted = false,
  isFirstSection = false,
}) => {
  const { isAuthenticated } = useAuthContext();
  const { getFeaturedFoodCreators } = useFoodCreators();

  const [featuredFoodCreatorsData, setFeaturedFoodCreatorsData] = useState<any>(null);
  const [backendLoading, setBackendLoading] = useState(false);
  const [backendError, setBackendError] = useState<any>(null);

  // Load featured foodCreators
  useEffect(() => {
    if (useBackend && isAuthenticated) {
      const loadFeaturedFoodCreators = async () => {
        try {
          setBackendLoading(true);
          setBackendError(null);
          const result = await getFeaturedFoodCreators({ limit: 20 });
          if (result.success) {
            setFeaturedFoodCreatorsData({ success: true, data: result.data });
          }
        } catch (error: any) {
          setBackendError(error);
        } finally {
          setBackendLoading(false);
        }
      };
      loadFeaturedFoodCreators();
    } else {
      setFeaturedFoodCreatorsData(null);
    }
  }, [useBackend, isAuthenticated, getFeaturedFoodCreators]);

  // Transform API data to component format
  const transformFoodCreatorData = useCallback((apiFoodCreator: any): FoodCreator | null => {
    if (!apiFoodCreator) return null;

    // Ensure sentiment type matches component interface
    const validSentiments: FoodCreator['sentiment'][] = [
      'bussing', 'mid', 'notIt', 'fire', 'slaps', 'decent', 
      'meh', 'trash', 'elite', 'solid', 'average', 'skip'
    ];
    const sentiment = validSentiments.includes(apiFoodCreator.sentiment as FoodCreator['sentiment'])
      ? apiFoodCreator.sentiment as FoodCreator['sentiment']
      : 'average';

    // Default foodCreator image if null
    const imageUrl = apiFoodCreator.image_url || 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop';

    return {
      id: apiFoodCreator.id,
      name: apiFoodCreator.name || 'Unknown FoodCreator',
      cuisine: apiFoodCreator.cuisine || 'Various',
      sentiment,
      deliveryTime: apiFoodCreator.deliveryTime || apiFoodCreator.delivery_time || null, // Use backend-calculated delivery time
      distance: apiFoodCreator.distance || 'N/A',
      image: { uri: imageUrl },
      isLive: apiFoodCreator.is_live || false,
      liveViewers: apiFoodCreator.live_viewers || undefined,
    };
  }, []);

  // Process foodCreators data
  const foodCreators: FoodCreator[] = useMemo(() => {
    // If propFoodCreators provided (even if empty), use them (for filtered view)
    // This allows empty arrays to be respected when filtering
    if (propFoodCreators !== undefined) {
      return propFoodCreators;
    }

    // Otherwise, use backend data if available
    if (useBackend && featuredFoodCreatorsData?.success && featuredFoodCreatorsData.data?.foodCreators) {
      const apiFoodCreators = featuredFoodCreatorsData.data.foodCreators;
      const transformedFoodCreators = apiFoodCreators
        .map(transformFoodCreatorData)
        .filter((foodCreator): foodCreator is FoodCreator => foodCreator !== null);
      return transformedFoodCreators;
    }

    // Fallback to empty array
    return [];
  }, [propFoodCreators, featuredFoodCreatorsData, useBackend, transformFoodCreatorData]);

  // Error state is shown in UI - no toast needed

  // Determine loading state
  const isLoading = propIsLoading || (useBackend && backendLoading && isAuthenticated);
  
  // Only show skeleton during initial load, never after initial load is complete
  if (isLoading && useBackend && !hasInitialLoadCompleted) {
    return (
      <SkeletonWithTimeout isLoading={isLoading}>
        <FeaturedFoodCreatorsSectionSkeleton itemCount={4} />
      </SkeletonWithTimeout>
    );
  }
  
  const renderFoodCreatorCard = (foodCreator: FoodCreator, index: number) => (
    <TouchableOpacity
      key={foodCreator.id}
      style={{
        width: 160,
        marginRight: 12,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
      }}
      onPress={() => onFoodCreatorPress?.(foodCreator)}
      activeOpacity={0.8}
    >
      {/* FoodCreator Image */}
      <View style={{ position: 'relative' }}>
        <Image
          source={foodCreator.image}
          style={{
            width: '100%',
            height: 100,
            resizeMode: 'cover',
          }}
        />
        
        {/* Live Badge */}
        {foodCreator.isLive && (
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
        
        {/* FoodCreator Sentiment Badge */}
        <View style={{
          position: 'absolute',
          top: 8,
          right: 8,
        }}>
          <FoodCreatorRating 
            sentiment={foodCreator.sentiment} 
            size="small" 
            compact={foodCreator.isLive}
          />
        </View>
      </View>
      
      {/* FoodCreator Info */}
      <View style={{ padding: 12 }}>
        <Text style={{
          color: '#1a1a1a',
          fontSize: 14,
          fontWeight: '600',
          marginBottom: 2,
          lineHeight: 18,
        }}>
          {foodCreator.name}
        </Text>
        <Text style={{
          color: '#666666',
          fontSize: 12,
          fontWeight: '400',
          marginBottom: 8,
          lineHeight: 16,
        }}>
          {foodCreator.cuisine}
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
            {foodCreator.deliveryTime}
          </Text>
          <Text style={{
            color: '#666666',
            fontSize: 11,
            fontWeight: '500',
          }}>
            {foodCreator.distance}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Hide section if no foodCreators (don't show empty state)
  if (foodCreators.length === 0) {
    return null;
  }

  // Don't show "See All" button inside drawers - only on main screen
  const shouldShowSeeAll = showTitle && onSeeAllPress;

  return (
    <View style={{ marginBottom: 24, paddingTop: isFirstSection ? 15 : 0 }}>
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
            {title || 'Featured FoodCreators'}
          </Text>
          
          {shouldShowSeeAll && (
            <TouchableOpacity onPress={onSeeAllPress} hitSlop={12}>
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
        {foodCreators.map(renderFoodCreatorCard)}
      </ScrollView>
    </View>
  );
};

export const FeaturedFoodCreatorsSection = React.memo(FeaturedFoodCreatorsSectionComponent); 