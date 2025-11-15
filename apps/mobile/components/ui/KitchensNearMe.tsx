import { useChefs } from '@/hooks/useChefs';
import { Image } from 'expo-image';
import { MapPin } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useAuthContext } from '../../contexts/AuthContext';
import { useUserLocation } from '../../hooks/useUserLocation';
import { showError } from '../../lib/GlobalToastManager';
import { KitchensNearMeSkeleton } from './KitchensNearMeSkeleton';
import { SkeletonWithTimeout } from './SkeletonWithTimeout';

interface Kitchen {
  id: string;
  name: string;
  description: string;
  distance: string;
  image: string;
  isVerified?: boolean;
}

interface KitchensNearMeProps {
  onKitchenPress?: (kitchen: Kitchen) => void;
  onMapPress?: () => void;
  useBackend?: boolean;
}

export function KitchensNearMe({ 
  onKitchenPress, 
  onMapPress,
  useBackend = true,
}: KitchensNearMeProps) {
  const { isAuthenticated } = useAuthContext();
  const locationState = useUserLocation();
  const { getNearbyChefs } = useChefs();

  const [nearbyChefsData, setNearbyChefsData] = useState<any>(null);
  const [backendLoading, setBackendLoading] = useState(false);
  const [backendError, setBackendError] = useState<any>(null);

  // Load nearby chefs
  useEffect(() => {
    if (useBackend && isAuthenticated && locationState.location?.latitude && locationState.location?.longitude) {
      const loadNearbyChefs = async () => {
        try {
          setBackendLoading(true);
          setBackendError(null);
          const result = await getNearbyChefs({
            latitude: locationState.location!.latitude,
            longitude: locationState.location!.longitude,
            radius: 5,
            limit: 10,
            page: 1,
          });
          if (result.success) {
            setNearbyChefsData({ success: true, data: result.data });
          }
        } catch (error: any) {
          setBackendError(error);
        } finally {
          setBackendLoading(false);
        }
      };
      loadNearbyChefs();
    } else {
      setNearbyChefsData(null);
    }
  }, [useBackend, isAuthenticated, locationState.location?.latitude, locationState.location?.longitude, getNearbyChefs]);

  // Transform API data to component format
  const transformKitchenData = useCallback((apiChef: any): Kitchen | null => {
    if (!apiChef) return null;

    // Format distance
    const distanceKm = apiChef.distance || 0;
    const distanceText = distanceKm < 1 
      ? `${Math.round(distanceKm * 1000)}m away from you`
      : `${distanceKm.toFixed(1)}km away from you`;

    // Get cuisine as description
    const description = apiChef.cuisine || 'Various cuisines available';

    return {
      id: apiChef.id || '',
      name: apiChef.name || 'Unknown Kitchen',
      description,
      distance: distanceText,
      image: apiChef.image_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face',
      isVerified: apiChef.rating ? apiChef.rating >= 4.0 : false, // Verified if high rating
    };
  }, []);

  // Process kitchens data
  const kitchens: Kitchen[] = useMemo(() => {
    if (!useBackend || !nearbyChefsData?.success || !nearbyChefsData.data?.chefs) {
      return [];
    }

    const transformedKitchens = nearbyChefsData.data.chefs
      .map(transformKitchenData)
      .filter((kitchen): kitchen is Kitchen => kitchen !== null);
    
    return transformedKitchens;
  }, [nearbyChefsData, useBackend, transformKitchenData]);

  // Error state is shown in UI - no toast needed

  // Show skeleton while loading
  if (useBackend && backendLoading) {
    return (
      <SkeletonWithTimeout isLoading={backendLoading}>
        <KitchensNearMeSkeleton itemCount={2} />
      </SkeletonWithTimeout>
    );
  }

  // Hide section if no kitchens (don't show empty state)
  if (kitchens.length === 0) {
    return null;
  }
  return (
    <View style={{ paddingVertical: 20, paddingHorizontal: 16 }}>
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 16 
      }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#000' }}>
          Kitchens near me
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
        {kitchens.map((kitchen, index) => (
          <TouchableOpacity
            key={kitchen.id}
            style={{ 
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: 16,
              marginBottom: index < kitchens.length - 1 ? 12 : 0,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3
            }}
            onPress={() => onKitchenPress?.(kitchen)}
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
                  source={{ uri: kitchen.image }}
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
                    {kitchen.name}
                  </Text>
                  {kitchen.isVerified && (
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
                  {kitchen.description}
                </Text>
                <Text style={{ 
                  fontSize: 12, 
                  color: '#999' 
                }}>
                  {kitchen.distance}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
} 