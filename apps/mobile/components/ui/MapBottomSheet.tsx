// MapBottomSheet component following existing patterns
import { FoodCreatorMarker, MapBottomSheetProps } from '@/types/maps';
import { Clock, MapPin, Navigation, Search, Star, Users } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Dimensions, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { useUserLocation } from '../../hooks/useUserLocation';
import { getDirections, searchFoodCreatorsByLocation } from '../../utils/appleMapsService';
import { BottomSheetBase } from '../BottomSheetBase';
import { MapView } from './MapView';

// Screen dimensions and snap point constants (following OnTheStoveBottomSheet pattern)
const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DRAWER_HEIGHT = Math.min(SCREEN_HEIGHT * 0.85, 600); // Max 85% of screen or 600px
const COLLAPSED_HEIGHT = 200; // Collapsed height for chef list
const HALF_HEIGHT = SCREEN_HEIGHT * 0.5; // Half screen height

// Snap points represent the visible height of the drawer
const SNAP_POINTS = {
  COLLAPSED: COLLAPSED_HEIGHT,
  HALF: HALF_HEIGHT,
  EXPANDED: DRAWER_HEIGHT
};

// Memoized Chef Item Component (moved outside for better performance)
interface FoodCreatorItemProps {
  foodCreator: FoodCreatorMarker;
  onPress: (foodCreator: FoodCreatorMarker) => void;
  onGetDirections: (foodCreator: FoodCreatorMarker) => void;
  colorScheme: 'light' | 'dark';
}

const FoodCreatorItem = React.memo(({ 
  foodCreator, 
  onPress, 
  onGetDirections,
  colorScheme: itemColorScheme
}: FoodCreatorItemProps) => {
  const itemStyles = {
    chefItem: {
      borderRadius: 12,
      marginVertical: 4,
      padding: 16,
      borderWidth: 1,
      borderColor: '#E0E0E0',
    },
    chefItemContent: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
    },
    chefInfo: {
      flex: 1,
    },
    chefName: {
      fontSize: 16,
      fontWeight: '600' as const,
      marginBottom: 4,
    },
    chefCuisine: {
      fontSize: 14,
      color: '#666',
      marginBottom: 8,
    },
    chefStats: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    statItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginRight: 12,
    },
    statText: {
      fontSize: 12,
      color: '#666',
      marginLeft: 4,
    },
    chefActions: {
      alignItems: 'center' as const,
    },
    distanceText: {
      fontSize: 12,
      color: '#666',
      marginBottom: 8,
    },
    directionsButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: '#F0F0F0',
    },
  };

  return (
    <TouchableOpacity
      style={[
        itemStyles.chefItem,
        { backgroundColor: Colors[itemColorScheme as keyof typeof Colors].background }
      ]}
      onPress={() => onPress(foodCreator)}
    >
      <View style={itemStyles.chefItemContent}>
        <View style={itemStyles.chefInfo}>
          <Text style={[
            itemStyles.chefName,
            { color: Colors[itemColorScheme as keyof typeof Colors].text }
          ]}>
            {foodCreator.kitchen_name}
          </Text>
          <Text style={itemStyles.chefCuisine}>{foodCreator.cuisine}</Text>
          <View style={itemStyles.chefStats}>
            <View style={itemStyles.statItem}>
              <Star size={12} color="#FFD700" />
              <Text style={itemStyles.statText}>{foodCreator.rating}</Text>
            </View>
            <View style={itemStyles.statItem}>
              <Clock size={12} color="#666" />
              <Text style={itemStyles.statText}>{foodCreator.delivery_time}</Text>
            </View>
            {foodCreator.is_live && (
              <View style={itemStyles.statItem}>
                <Users size={12} color="#FF0000" />
                <Text style={itemStyles.statText}>{foodCreator.live_viewers}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={itemStyles.chefActions}>
          <Text style={itemStyles.distanceText}>{foodCreator.distance}</Text>
          <TouchableOpacity
            style={itemStyles.directionsButton}
            onPress={() => onGetDirections(foodCreator)}
          >
            <Navigation size={16} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
});
FoodCreatorItem.displayName = 'FoodCreatorItem';

export function MapBottomSheet({ 
  isVisible,
  onToggleVisibility,
  foodCreators,
  onFoodCreatorSelect,
  onGetDirections,
  userLocation,
}: MapBottomSheetProps) {
  const colorScheme = useColorScheme();
  const [currentSnapPoint, setCurrentSnapPoint] = useState(0);
  const [selectedFoodCreator, setSelectedFoodCreator] = useState<FoodCreatorMarker | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<FoodCreatorMarker[]>([]);
  const [chefLoadError, setChefLoadError] = useState<string | null>(null);
  
  // Location hook
  const locationState = useUserLocation();
  const currentUserLocation = userLocation || locationState.location;

  // Fixed snap points - always provide collapsed, half, and expanded states
  const snapPoints = useMemo(() => {
    const collapsedPercentage = Math.round((SNAP_POINTS.COLLAPSED / SCREEN_HEIGHT) * 100);
    const halfPercentage = Math.round((SNAP_POINTS.HALF / SCREEN_HEIGHT) * 100);
    const expandedPercentage = Math.round((SNAP_POINTS.EXPANDED / SCREEN_HEIGHT) * 100);
    return [`${collapsedPercentage}%`, `${halfPercentage}%`, `${expandedPercentage}%`];
  }, []);

  // Handle sheet changes
  const handleSheetChanges = useCallback((index: number) => {
    setCurrentSnapPoint(index);
    
    if (index === -1) {
      onToggleVisibility();
    }
  }, [onToggleVisibility]);

  // Handle chef selection
  const handleFoodCreatorSelect = useCallback((foodCreator: FoodCreatorMarker) => {
    setSelectedFoodCreator(foodCreator);
    onFoodCreatorSelect?.(foodCreator);
  }, [onFoodCreatorSelect]);

  // Handle search
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    // Don't search if user location is not available
    if (!currentUserLocation) {
      setIsSearching(false);
      setSearchError("Please enable location services to search for kitchens.");
      return;
    }

    setIsSearching(true);
    try {
      // Use the new searchFoodCreatorsByLocation API
      const searchResult = await searchFoodCreatorsByLocation(
        query,
        currentUserLocation,
        5, // 5km radius
        undefined, // no specific cuisine filter
        20 // limit to 20 results
      );
      
      setSearchResults(searchResult.foodCreators);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Search Error', 'Failed to search for locations. Please try again.');
    } finally {
      setIsSearching(false);
    }
  }, [currentUserLocation]);

  // Handle get directions
  const handleGetDirections = useCallback(async (foodCreator: FoodCreatorMarker) => {
    if (!currentUserLocation || !foodCreator.location) {
      Alert.alert('Location Required', 'Please enable location services to get directions.');
      return;
    }

    try {
      const directions = await getDirections(currentUserLocation, foodCreator.location, 'driving');
      
      if (directions.success) {
        const route = directions.data.routes[0];
        Alert.alert(
          'Directions',
          `Distance: ${route.distance.text}\nDuration: ${route.duration.text}`,
          [
            { text: 'OK' },
            { text: 'Open Maps', onPress: () => onGetDirections?.(foodCreator) }
          ]
        );
      }
    } catch (error) {
      console.error('Directions error:', error);
      Alert.alert('Directions Error', 'Failed to get directions. Please try again.');
    }
  }, [currentUserLocation, onGetDirections]);

  // Memoize safe colorScheme value
  const safeColorScheme = useMemo(() => (colorScheme || 'light') as 'light' | 'dark', [colorScheme]);

  // Render chef item wrapper
  const renderFoodCreatorItem = useCallback(({ item: foodCreator }: { item: FoodCreatorMarker }) => (
    <FoodCreatorItem
      foodCreator={foodCreator}
      onPress={handleFoodCreatorSelect}
      onGetDirections={handleGetDirections}
      colorScheme={safeColorScheme}
    />
  ), [handleFoodCreatorSelect, handleGetDirections, safeColorScheme]);

  // Memoized keyExtractor
  const keyExtractor = useCallback((item: FoodCreatorMarker) => item.id, []);

  // Chef list data (memoized)
  const chefListData = useMemo(() => {
    return searchResults.length > 0 ? searchResults : foodCreators;
  }, [searchResults, chefs]);

  // Render content based on snap point
  const renderContent = () => {
    if (currentSnapPoint === 2) {
      // Expanded - show full map
      return (
        <View style={styles.expandedContent}>
          <MapView
            foodCreators={foodCreators}
            onMarkerPress={handleFoodCreatorSelect}
            showUserLocation={true}
            style={styles.mapContainer}
          />
          {selectedFoodCreator && (
            <View style={[
              styles.selectedFoodCreatorCard,
              { backgroundColor: Colors[colorScheme as keyof typeof Colors].background }
            ]}>
              <Text style={[
                styles.selectedFoodCreatorName,
                { color: Colors[colorScheme as keyof typeof Colors].text }
              ]}>
                {selectedFoodCreator.kitchen_name}
              </Text>
              <Text style={styles.selectedFoodCreatorCuisine}>{selectedFoodCreator.cuisine}</Text>
              <TouchableOpacity
                style={styles.getDirectionsButton}
                onPress={() => handleGetDirections(selectedFoodCreator)}
              >
                <Navigation size={16} color="white" />
                <Text style={styles.getDirectionsText}>Get Directions</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      );
    } else {
      // Collapsed or half - show search and chef list
      return (
        <View style={styles.collapsedContent}>
          {/* Search Bar */}
          <View style={[
            styles.searchContainer,
            { backgroundColor: Colors[colorScheme as keyof typeof Colors].background }
          ]}>
            <Search size={20} color="#666" />
            <TextInput
              style={[
                styles.searchInput,
                { color: Colors[colorScheme as keyof typeof Colors].text }
              ]}
              placeholder="Search for restaurants or addresses..."
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => handleSearch(searchQuery)}
            />
            {isSearching && (
              <View style={styles.loadingIndicator}>
                <Text style={styles.loadingIndicatorText}>Searching...</Text>
              </View>
            )}
          </View>

          {/* Chef List */}
          {chefLoadError ? (
            <View style={styles.errorState}>
              <Text style={[
                styles.errorText,
                { color: Colors[colorScheme as keyof typeof Colors].text }
              ]}>
                {chefLoadError}
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  setChefLoadError(null);
                  // Trigger reload by toggling visibility
                  onToggleVisibility();
                }}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={chefListData}
              renderItem={renderFoodCreatorItem}
              keyExtractor={keyExtractor}
              style={styles.chefList}
              showsVerticalScrollIndicator={false}
              removeClippedSubviews={true}
              maxToRenderPerBatch={10}
              windowSize={5}
              initialNumToRender={10}
              updateCellsBatchingPeriod={50}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <MapPin size={48} color="#666" />
                  <Text style={[
                    styles.emptyStateText,
                    { color: Colors[colorScheme as keyof typeof Colors].text }
                  ]}>
                    {searchQuery ? 'No restaurants found' : 'No chefs nearby'}
                  </Text>
                </View>
              }
            />
          )}
        </View>
      );
    }
  };

  if (!isVisible) return null;

  return (
    <BottomSheetBase
      snapPoints={snapPoints}
      index={1} // Start at half height
      onChange={handleSheetChanges}
      enablePanDownToClose={true}
    >
      {renderContent()}
    </BottomSheetBase>
  );
}

const styles = StyleSheet.create({
  expandedContent: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    borderRadius: 12,
  },
  collapsedContent: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  loadingIndicator: {
    marginLeft: 8,
  },
  loadingIndicatorText: {
    fontSize: 12,
    color: '#666',
  },
  chefList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  chefItem: {
    borderRadius: 12,
    marginVertical: 4,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  chefItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chefInfo: {
    flex: 1,
  },
  chefName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  chefCuisine: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  chefStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  statText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  chefActions: {
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  directionsButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  selectedFoodCreatorCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedFoodCreatorName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  selectedFoodCreatorCuisine: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  getDirectionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  getDirectionsText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
  errorState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MapBottomSheet;
