// Core MapView component using expo-maps
import { Map, Marker } from 'expo-maps';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ChefMarker, MapRegion, MapViewProps } from '../../app/types/maps';
import { useColorScheme } from '../../hooks/useColorScheme';
import { MapMarker } from './MapMarker';

export function MapView({
  chefs,
  initialRegion,
  onMarkerPress,
  showUserLocation = true,
  style,
}: MapViewProps) {
  const colorScheme = useColorScheme();
  const mapRef = useRef<Map>(null);
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
    if (mapRef.current && chef.location) {
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

  return (
    <View style={[styles.container, style]}>
      <Map
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
            <Marker
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
            </Marker>
          );
        })}
      </Map>
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
});

export default MapView;
