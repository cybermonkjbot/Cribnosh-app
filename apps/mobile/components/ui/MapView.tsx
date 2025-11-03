// Core MapView component using expo-maps with fallback for Expo Go
import { useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChefMarker, MapRegion, MapViewProps } from '@/types/maps';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { MapMarker } from './MapMarker';
import { MapPin } from 'lucide-react-native';

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
  chefs,
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
  const handleMarkerPress = (chef: ChefMarker) => {
    onMarkerPress?.(chef);
  };

  // Handle map region change
  const handleRegionChange = (region: MapRegion) => {
    setMapRegion(region);
  };

  // Focus on a specific chef
  const focusOnChef = (chef: ChefMarker) => {
    if (mapRef.current && chef.location && isMapsAvailable) {
      const region: MapRegion = {
        latitude: chef.location.latitude,
        longitude: chef.location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      
      mapRef.current.setCamera({
        center: {
          latitude: chef.location.latitude,
          longitude: chef.location.longitude,
        },
        zoom: 15,
      });
    }
  };

  // Expose focusOnChef method to parent components
  useEffect(() => {
    if (mapRef.current) {
      (mapRef.current as any).focusOnChef = focusOnChef;
    }
  }, []);

  // Fallback UI when maps are not available (e.g., Expo Go)
  if (!isMapsAvailable) {
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
            Maps require a development build. Showing chef list instead.
          </Text>
          <FlatList
            data={chefs}
            keyExtractor={(item) => item.id}
            renderItem={({ item: chef }) => (
              <TouchableOpacity
                style={[
                  styles.fallbackChefItem,
                  { 
                    backgroundColor: Colors[colorScheme as keyof typeof Colors].background,
                    borderColor: '#E0E0E0'
                  }
                ]}
                onPress={() => handleMarkerPress(chef)}
              >
                <MapMarker
                  chef={chef}
                  onPress={() => handleMarkerPress(chef)}
                />
                {chef.location && (
                  <View style={styles.locationContainer}>
                    <MapPin size={12} color="#666" />
                    <Text style={[
                      styles.locationText,
                      { color: Colors[colorScheme as keyof typeof Colors].text }
                    ]}>
                      {chef.location.latitude.toFixed(4)}, {chef.location.longitude.toFixed(4)}
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
                  No chefs available
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
        {chefs.map((chef) => {
          if (!chef.location) return null;
          
          return (
            <ExpoMarker
              key={chef.id}
              coordinate={{
                latitude: chef.location.latitude,
                longitude: chef.location.longitude,
              }}
              onPress={() => handleMarkerPress(chef)}
              title={chef.kitchen_name}
              subtitle={`${chef.cuisine} • ${chef.delivery_time}`}
            >
              <MapMarker
                chef={chef}
                onPress={() => handleMarkerPress(chef)}
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
  fallbackChefItem: {
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
});

export default MapView;
