// Test component to verify Apple Maps API integration
import { FoodCreatorMarker } from '@/types/maps';
import { getDirections, getNearbyFoodCreators, searchFoodCreatorsByLocation } from '@/utils/appleMapsService';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function AppleMapsTestComponent() {
  const [foodCreators, setFoodCreators] = useState<FoodCreatorMarker[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Test coordinates (San Francisco)
  const testLocation = { latitude: 37.7749, longitude: -122.4194 };

  const testNearbyFoodCreators = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getNearbyFoodCreators(
        testLocation.latitude,
        testLocation.longitude,
        5, // 5km radius
        10, // limit to 10 food creators
        1 // first page
      );

      setFoodCreators(result.foodCreators);
      Alert.alert('Success', `Loaded ${result.foodCreators.length} food creators`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      Alert.alert('Error', `Failed to load food creators: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testSearchFoodCreators = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await searchFoodCreatorsByLocation(
        'restaurants near Union Square',
        testLocation,
        3, // 3km radius
        undefined, // no cuisine filter
        5 // limit to 5 results
      );

      setFoodCreators(result.foodCreators);
      Alert.alert('Success', `Found ${result.foodCreators.length} restaurants`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      Alert.alert('Error', `Search failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testDirections = async () => {
    if (foodCreators.length === 0) {
      Alert.alert('No Food Creators', 'Please load food creators first');
      return;
    }

    try {
      const foodCreator = foodCreators[0];
      if (!foodCreator.location) {
        Alert.alert('No Location', 'Selected food creator has no location data');
        return;
      }

      const directions = await getDirections(testLocation, foodCreator.location, 'driving');

      if (directions.success) {
        const route = directions.data.routes[0];
        Alert.alert(
          'Directions Success',
          `To ${foodCreator.foodCreator_name}:\nDistance: ${route.distance.text}\nDuration: ${route.duration.text}`
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
        onPress={testNearbyFoodCreators}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Loading...' : 'Test Nearby Food Creators'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={testSearchFoodCreators}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Searching...' : 'Test Search Food Creators'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={testDirections}
        disabled={isLoading || foodCreators.length === 0}
      >
        <Text style={styles.buttonText}>Test Directions</Text>
      </TouchableOpacity>

      {error && (
        <Text style={styles.errorText}>Error: {error}</Text>
      )}

      <Text style={styles.resultsText}>
        Results: {foodCreators.length} food creators loaded
      </Text>

      {foodCreators.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Loaded Food Creators:</Text>
          {foodCreators.slice(0, 3).map((foodCreator) => (
            <Text key={foodCreator.id} style={styles.foodCreatorText}>
              • {foodCreator.foodCreator_name} ({foodCreator.cuisine}) - {foodCreator.distance}
            </Text>
          ))}
          {foodCreators.length > 3 && (
            <Text style={styles.resultsText}>... and {foodCreators.length - 3} more</Text>
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
  foodCreatorText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#333',
  },
});

export default AppleMapsTestComponent;
