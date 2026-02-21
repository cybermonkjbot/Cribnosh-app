import { useFoodCreators } from '@/hooks/useFoodCreators';
import { Image } from 'expo-image';
import { MapPin } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useAuthContext } from '../../contexts/AuthContext';
import { useUserLocation } from '../../hooks/useUserLocation';
import { FoodCreatorsNearMeSkeleton } from './FoodCreatorsNearMeSkeleton';
import { SkeletonWithTimeout } from './SkeletonWithTimeout';

interface FoodCreator {
  id: string;
  name: string;
  description: string;
  distance: string;
  image: string;
  isVerified?: boolean;
}

interface FoodCreatorsNearMeProps {
  onFoodCreatorPress?: (foodCreator: FoodCreator) => void;
  onMapPress?: () => void;
  useBackend?: boolean;
  hasInitialLoadCompleted?: boolean;
  isFirstSection?: boolean;
}

export function FoodCreatorsNearMe({
  onFoodCreatorPress,
  onMapPress,
  useBackend = true,
  hasInitialLoadCompleted = false,
  isFirstSection = false,
}: FoodCreatorsNearMeProps) {
  const { isAuthenticated } = useAuthContext();
  const locationState = useUserLocation();
  const { getNearbyFoodCreators } = useFoodCreators();

  const [nearbyFoodCreatorsData, setNearbyFoodCreatorsData] = useState<any>(null);
  const [backendLoading, setBackendLoading] = useState(false);
  const [backendError, setBackendError] = useState<any>(null);

  // Load nearby food creators
  useEffect(() => {
    if (useBackend && isAuthenticated && locationState.location?.latitude && locationState.location?.longitude) {
      const loadNearbyFoodCreators = async () => {
        try {
          setBackendLoading(true);
          setBackendError(null);
          const result = await getNearbyFoodCreators({
            latitude: locationState.location!.latitude,
            longitude: locationState.location!.longitude,
            radius: 5,
            limit: 10,
            page: 1,
          });
          if (result.success) {
            setNearbyFoodCreatorsData({ success: true, data: result.data });
          }
        } catch (error: any) {
          setBackendError(error);
        } finally {
          setBackendLoading(false);
        }
      };
      loadNearbyFoodCreators();
    } else {
      setNearbyFoodCreatorsData(null);
    }
  }, [useBackend, isAuthenticated, locationState.location?.latitude, locationState.location?.longitude, getNearbyFoodCreators]);

  // Transform API data to component format
  const transformFoodCreatorData = useCallback((apiFoodCreator: any): FoodCreator | null => {
    if (!apiFoodCreator) return null;

    // Format distance
    const distanceKm = apiFoodCreator.distance || 0;
    const distanceText = distanceKm < 1
      ? `${Math.round(distanceKm * 1000)}m away from you`
      : `${distanceKm.toFixed(1)}km away from you`;

    // Get cuisine as description
    const description = apiFoodCreator.cuisine || 'Various cuisines available';

    return {
      id: apiFoodCreator.id || '',
      name: apiFoodCreator.name || 'Unknown FoodCreator',
      description,
      distance: distanceText,
      image: apiFoodCreator.image_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face',
      isVerified: apiFoodCreator.rating ? apiFoodCreator.rating >= 4.0 : false, // Verified if high rating
    };
  }, []);

  // Process foodCreators data
  const foodCreators: FoodCreator[] = useMemo(() => {
    if (!useBackend || !nearbyFoodCreatorsData?.success || !nearbyFoodCreatorsData.data?.foodCreators) {
      return [];
    }

    const transformedFoodCreators = nearbyFoodCreatorsData.data.foodCreators
      .map(transformFoodCreatorData)
      .filter((foodCreator: FoodCreator | null): foodCreator is FoodCreator => foodCreator !== null);

    return transformedFoodCreators;
  }, [nearbyFoodCreatorsData, useBackend, transformFoodCreatorData]);

  // Error state is shown in UI - no toast needed

  // Only show skeleton during initial load, never after initial load is complete
  if (useBackend && backendLoading && !hasInitialLoadCompleted) {
    return (
      <SkeletonWithTimeout isLoading={backendLoading}>
        <FoodCreatorsNearMeSkeleton itemCount={2} />
      </SkeletonWithTimeout>
    );
  }

  // Hide section if no foodCreators (don't show empty state)
  if (foodCreators.length === 0) {
    return null;
  }
  return (
    <View style={{ paddingVertical: 20, paddingHorizontal: 16, paddingTop: isFirstSection ? 35 : 20 }}>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
      }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#000' }}>
          FoodCreators near me
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#f3f4f6',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              marginRight: 8
            }}
            onPress={onMapPress}
            activeOpacity={0.7}
          >
            <MapPin size={16} color="#666" />
            <Text style={{ fontSize: 14, color: '#666', marginLeft: 4 }}>Map</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={{ fontSize: 16, color: '#666' }}>→</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View>
        {foodCreators.map((foodCreator, index) => (
          <TouchableOpacity
            key={foodCreator.id}
            style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: 16,
              marginBottom: index < foodCreators.length - 1 ? 12 : 0,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3
            }}
            onPress={() => onFoodCreatorPress?.(foodCreator)}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row' }}>
              <View style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                overflow: 'hidden',
                backgroundColor: '#f3f4f6',
                marginRight: 12
              }}>
                <Image
                  source={{ uri: foodCreator.image }}
                  style={{ width: 56, height: 56 }}
                  contentFit="cover"
                />
              </View>

              <View style={{ flex: 1 }}>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 4
                }}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: '#000',
                    marginRight: 6
                  }}>
                    {foodCreator.name}
                  </Text>
                  {foodCreator.isVerified && (
                    <View style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      backgroundColor: '#3b82f6',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}>
                      <Text style={{
                        color: '#fff',
                        fontSize: 10,
                        fontWeight: 'bold'
                      }}>
                        ✓
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={{
                  fontSize: 14,
                  color: '#666',
                  marginBottom: 4,
                  lineHeight: 20
                }}>
                  {foodCreator.description}
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: '#999'
                }}>
                  {foodCreator.distance}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
} 