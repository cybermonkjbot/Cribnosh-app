// Core MapView component using expo-maps with fallback for Expo Go
import { FoodCreatorMarker, MapRegion, MapViewProps } from '@/types/maps';
import { MapPin } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { MapMarker } from './MapMarker';

// Try to import expo-maps, fallback if not available
let ExpoMap: any = null;
let ExpoMarker: any = null;
let isMapsAvailable = false;

try {
  const expoMaps = require('expo-maps');
  ExpoMap = expoMaps.Map;
  ExpoMarker = expoMaps.Marker;
  isMapsAvailable = true;
} catch (error) {
  // expo-maps not available (e.g., in Expo Go)
  isMapsAvailable = false;
}

export function MapView({
  foodCreators,
  initialRegion,
  onMarkerPress,
  showUserLocation = true,
  style,
}: MapViewProps) {
  const colorScheme = useColorScheme();
  const mapRef = useRef<any>(null);
  const [mapRegion, setMapRegion] = useState<MapRegion | undefined>(initialRegion);

  // Default region if none provided
  const defaultRegion: MapRegion = {
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const currentRegion = mapRegion || initialRegion || defaultRegion;

  // Handle marker press
  // Handle marker press
  const handleMarkerPress = (foodCreator: FoodCreatorMarker) => {
    onMarkerPress?.(foodCreator);
  };

  // Handle map region change
  const handleRegionChange = (region: MapRegion) => {
    setMapRegion(region);
  };

  // Focus on a specific food creator
  const focusOnFoodCreator = (foodCreator: FoodCreatorMarker) => {
    if (mapRef.current && foodCreator.location && isMapsAvailable) {
      const region: MapRegion = {
        latitude: foodCreator.location.latitude,
        longitude: foodCreator.location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      mapRef.current.setCamera({
        center: {
          latitude: foodCreator.location.latitude,
          longitude: foodCreator.location.longitude,
        },
        zoom: 15,
      });
    }
  };

  // Expose focusOnFoodCreator method to parent components
  useEffect(() => {
    if (mapRef.current) {
      (mapRef.current as any).focusOnFoodCreator = focusOnFoodCreator;
    }
  }, []);

  // Fallback UI when maps are not available (e.g., Expo Go)
  if (!isMapsAvailable) {
    // Check if this is a delivery tracking scenario (has "Your Location" or "On the way" markers)
    const isDeliveryTracking = foodCreators.some(
      foodCreator => foodCreator.foodCreator_name === 'Your Location' || foodCreator.cuisine === 'On the way' || foodCreator.cuisine === 'Destination'
    );

    if (isDeliveryTracking) {
      // Better fallback for delivery tracking
      return (
        <View style={[styles.container, style, styles.fallbackContainer]}>
          <View style={[
            styles.fallbackContent,
            { backgroundColor: '#02120A' }
          ]}>
            <MapPin size={48} color="#E6FFE8" />
            <Text style={styles.fallbackTitleDelivery}>
              Real-time tracking unavailable
            </Text>
            <Text style={styles.fallbackSubtitleDelivery}>
              Your order is on the way. Check back soon for live updates.
            </Text>

            {/* Delivery Status Cards */}
            <View style={styles.deliveryStatusContainer}>
              {foodCreators.map((foodCreator) => {
                if (foodCreator.foodCreator_name === 'Your Location' || foodCreator.cuisine === 'Destination') {
                  return (
                    <View key={foodCreator.id} style={styles.deliveryStatusCard}>
                      <View style={styles.deliveryStatusIcon}>
                        <MapPin size={20} color="#094327" />
                      </View>
                      <View style={styles.deliveryStatusText}>
                        <Text style={styles.deliveryStatusTitle}>Your Location</Text>
                        <Text style={styles.deliveryStatusSubtitle}>Delivery destination</Text>
                      </View>
                    </View>
                  );
                }
                if (foodCreator.cuisine === 'On the way') {
                  return (
                    <View key={foodCreator.id} style={styles.deliveryStatusCard}>
                      <View style={styles.deliveryStatusIcon}>
                        <MapPin size={20} color="#FF3B30" />
                      </View>
                      <View style={styles.deliveryStatusText}>
                        <Text style={styles.deliveryStatusTitle}>{foodCreator.foodCreator_name}</Text>
                        <Text style={styles.deliveryStatusSubtitle}>
                          {foodCreator.delivery_time || 'On the way'}
                        </Text>
                      </View>
                    </View>
                  );
                }
                return null;
              })}
            </View>
          </View>
        </View>
      );
    }

    // Original fallback for regular chef list
    return (
      <View style={[styles.container, style, styles.fallbackContainer]}>
        <View style={[
          styles.fallbackContent,
          { backgroundColor: Colors[colorScheme as keyof typeof Colors].background }
        ]}>
          <MapPin size={48} color="#999" />
          <Text style={[
            styles.fallbackTitle,
            { color: Colors[colorScheme as keyof typeof Colors].text }
          ]}>
            Maps Not Available
          </Text>
          <Text style={[
            styles.fallbackSubtitle,
            { color: Colors[colorScheme as keyof typeof Colors].text }
          ]}>
            Maps require a development build. Showing food creator list instead.
          </Text>
          <FlatList
            data={foodCreators}
            keyExtractor={(item) => item.id}
            renderItem={({ item: foodCreator }) => (
              <TouchableOpacity
                style={[
                  styles.fallbackFoodCreatorItem,
                  {
                    backgroundColor: Colors[colorScheme as keyof typeof Colors].background,
                    borderColor: '#E0E0E0'
                  }
                ]}
                onPress={() => handleMarkerPress(foodCreator)}
              >
                <MapMarker
                  foodCreator={foodCreator}
                  onPress={() => handleMarkerPress(foodCreator)}
                />
                {foodCreator.location && (
                  <View style={styles.locationContainer}>
                    <MapPin size={12} color="#666" />
                    <Text style={[
                      styles.locationText,
                      { color: Colors[colorScheme as keyof typeof Colors].text }
                    ]}>
                      {foodCreator.location.latitude.toFixed(4)}, {foodCreator.location.longitude.toFixed(4)}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.fallbackList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={[
                  styles.emptyText,
                  { color: Colors[colorScheme as keyof typeof Colors].text }
                ]}>
                  No food creators available
                </Text>
              </View>
            }
          />
        </View>
      </View>
    );
  }

  // Regular map view when expo-maps is available
  if (!ExpoMap || !ExpoMarker) {
    // Fallback if map components are null
    return (
      <View style={[styles.container, style, styles.fallbackContainer]}>
        <View style={[
          styles.fallbackContent,
          { backgroundColor: Colors[colorScheme as keyof typeof Colors].background }
        ]}>
          <MapPin size={48} color="#999" />
          <Text style={[
            styles.fallbackTitle,
            { color: Colors[colorScheme as keyof typeof Colors].text }
          ]}>
            Map Loading...
          </Text>
          <Text style={[
            styles.fallbackSubtitle,
            { color: Colors[colorScheme as keyof typeof Colors].text }
          ]}>
            Initializing map view
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <ExpoMap
        ref={mapRef}
        style={styles.map}
        initialRegion={currentRegion}
        onRegionChange={handleRegionChange}
        showsUserLocation={showUserLocation}
        showsMyLocationButton={showUserLocation}
        showsCompass={true}
        showsScale={true}
        mapType="standard"
        // Dark mode support
        userInterfaceStyle={colorScheme === 'dark' ? 'dark' : 'light'}
      >
        {foodCreators.map((foodCreator) => {
          if (!foodCreator.location) return null;

          return (
            <ExpoMarker
              key={foodCreator.id}
              coordinate={{
                latitude: foodCreator.location.latitude,
                longitude: foodCreator.location.longitude,
              }}
              onPress={() => handleMarkerPress(foodCreator)}
              title={foodCreator.foodCreator_name}
              subtitle={`${foodCreator.cuisine} • ${foodCreator.delivery_time}`}
            >
              <MapMarker
                foodCreator={foodCreator}
                onPress={() => handleMarkerPress(foodCreator)}
              />
            </ExpoMarker>
          );
        })}
      </ExpoMap>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  fallbackContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackContent: {
    flex: 1,
    width: '100%',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  fallbackSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.7,
  },
  fallbackList: {
    width: '100%',
    paddingHorizontal: 16,
  },
  fallbackFoodCreatorItem: {
    padding: 12,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    opacity: 0.6,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.6,
  },
  fallbackTitleDelivery: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: '#E6FFE8',
    textAlign: 'center',
  },
  fallbackSubtitleDelivery: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
    color: '#C0DCC0',
    opacity: 0.9,
  },
  deliveryStatusContainer: {
    width: '100%',
    gap: 16,
    paddingHorizontal: 20,
  },
  deliveryStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(230, 255, 232, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(230, 255, 232, 0.2)',
  },
  deliveryStatusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E6FFE8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  deliveryStatusText: {
    flex: 1,
  },
  deliveryStatusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E6FFE8',
    marginBottom: 4,
  },
  deliveryStatusSubtitle: {
    fontSize: 14,
    color: '#C0DCC0',
  },
});

export default MapView;
