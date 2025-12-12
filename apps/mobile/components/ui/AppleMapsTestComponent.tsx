// Test component to verify Apple Maps API integration
import { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChefMarker } from '@/types/maps';
import * as AppleMapsService from '../../utils/appleMapsService';

export function AppleMapsTestComponent() {
  const [chefs, setChefs] = useState<ChefMarker[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Test coordinates (San Francisco)
  const testLocation = { latitude: 37.7749, longitude: -122.4194 };

  const testNearbyChefs = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await getNearbyChefs(
        testLocation.latitude,
        testLocation.longitude,
        5, // 5km radius
        10, // limit to 10 chefs
        1 // first page
      );
      
      setChefs(result.chefs);
      Alert.alert('Success', `Loaded ${result.chefs.length} chefs`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      Alert.alert('Error', `Failed to load chefs: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testSearchChefs = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await searchChefsByLocation(
        'restaurants near Union Square',
        testLocation,
        3, // 3km radius
        undefined, // no cuisine filter
        5 // limit to 5 results
      );
      
      setChefs(result.chefs);
      Alert.alert('Success', `Found ${result.chefs.length} restaurants`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      Alert.alert('Error', `Search failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testDirections = async () => {
    if (chefs.length === 0) {
      Alert.alert('No Chefs', 'Please load chefs first');
      return;
    }

    try {
      const chef = chefs[0];
      if (!chef.location) {
        Alert.alert('No Location', 'Selected chef has no location data');
        return;
      }

      const directions = await getDirections(testLocation, chef.location, 'driving');
      
      if (directions.success) {
        const route = directions.data.routes[0];
        Alert.alert(
          'Directions Success',
          `To ${chef.kitchen_name}:\nDistance: ${route.distance.text}\nDuration: ${route.duration.text}`
        );
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('Error', `Directions failed: ${errorMessage}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Apple Maps API Test</Text>
      
      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={testNearbyChefs}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Loading...' : 'Test Nearby Chefs'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={testSearchChefs}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Searching...' : 'Test Search Chefs'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={testDirections}
        disabled={isLoading || chefs.length === 0}
      >
        <Text style={styles.buttonText}>Test Directions</Text>
      </TouchableOpacity>

      {error && (
        <Text style={styles.errorText}>Error: {error}</Text>
      )}

      <Text style={styles.resultsText}>
        Results: {chefs.length} chefs loaded
      </Text>

      {chefs.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Loaded Chefs:</Text>
          {chefs.slice(0, 3).map((chef) => (
            <Text key={chef.id} style={styles.chefText}>
              • {chef.kitchen_name} ({chef.cuisine}) - {chef.distance}
            </Text>
          ))}
          {chefs.length > 3 && (
            <Text style={styles.chefText}>... and {chefs.length - 3} more</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
  resultsText: {
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
    fontWeight: '600',
  },
  resultsContainer: {
    marginTop: 15,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  chefText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#333',
  },
});

export default AppleMapsTestComponent;
