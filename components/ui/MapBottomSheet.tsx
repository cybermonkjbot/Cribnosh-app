// MapBottomSheet component following existing patterns
import { Clock, MapPin, Navigation, Search, Star, Users } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Dimensions, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ChefMarker, MapBottomSheetProps } from '../../app/types/maps';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { useUserLocation } from '../../hooks/useUserLocation';
import { getDirections, searchChefsByLocation } from '../../utils/appleMapsService';
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

export function MapBottomSheet({
  isVisible,
  onToggleVisibility,
  chefs,
  onChefSelect,
  onGetDirections,
  userLocation,
}: MapBottomSheetProps) {
  const colorScheme = useColorScheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentSnapPoint, setCurrentSnapPoint] = useState(0);
  const [selectedChef, setSelectedChef] = useState<ChefMarker | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ChefMarker[]>([]);
  const [isLoadingChefs, setIsLoadingChefs] = useState(false);
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
    
    if (index === 2) {
      setIsExpanded(true);
    } else if (index === 1) {
      setIsExpanded(false);
    } else if (index === 0) {
      setIsExpanded(false);
    }
    
    if (index === -1) {
      onToggleVisibility();
    }
  }, [onToggleVisibility]);

  // Handle chef selection
  const handleChefSelect = useCallback((chef: ChefMarker) => {
    setSelectedChef(chef);
    onChefSelect?.(chef);
  }, [onChefSelect]);

  // Handle search
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Use the new searchChefsByLocation API
      const searchResult = await searchChefsByLocation(
        query,
        currentUserLocation || { latitude: 37.7749, longitude: -122.4194 },
        5, // 5km radius
        undefined, // no specific cuisine filter
        20 // limit to 20 results
      );
      
      setSearchResults(searchResult.chefs);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Search Error', 'Failed to search for locations. Please try again.');
    } finally {
      setIsSearching(false);
    }
  }, [currentUserLocation]);

  // Handle get directions
  const handleGetDirections = useCallback(async (chef: ChefMarker) => {
    if (!currentUserLocation || !chef.location) {
      Alert.alert('Location Required', 'Please enable location services to get directions.');
      return;
    }

    try {
      const directions = await getDirections(currentUserLocation, chef.location, 'driving');
      
      if (directions.success) {
        const route = directions.data.routes[0];
        Alert.alert(
          'Directions',
          `Distance: ${route.distance.text}\nDuration: ${route.duration.text}`,
          [
            { text: 'OK' },
            { text: 'Open Maps', onPress: () => onGetDirections?.(chef) }
          ]
        );
      }
    } catch (error) {
      console.error('Directions error:', error);
      Alert.alert('Directions Error', 'Failed to get directions. Please try again.');
    }
  }, [currentUserLocation, onGetDirections]);

  // Calculate distance between two coordinates
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Render chef item
  const renderChefItem = ({ item: chef }: { item: ChefMarker }) => (
    <TouchableOpacity
      style={[
        styles.chefItem,
        { backgroundColor: Colors[colorScheme as keyof typeof Colors].background }
      ]}
      onPress={() => handleChefSelect(chef)}
    >
      <View style={styles.chefItemContent}>
        <View style={styles.chefInfo}>
          <Text style={[
            styles.chefName,
            { color: Colors[colorScheme as keyof typeof Colors].text }
          ]}>
            {chef.kitchen_name}
          </Text>
          <Text style={styles.chefCuisine}>{chef.cuisine}</Text>
          <View style={styles.chefStats}>
            <View style={styles.statItem}>
              <Star size={12} color="#FFD700" />
              <Text style={styles.statText}>{chef.rating}</Text>
            </View>
            <View style={styles.statItem}>
              <Clock size={12} color="#666" />
              <Text style={styles.statText}>{chef.delivery_time}</Text>
            </View>
            {chef.is_live && (
              <View style={styles.statItem}>
                <Users size={12} color="#FF0000" />
                <Text style={styles.statText}>{chef.live_viewers}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.chefActions}>
          <Text style={styles.distanceText}>{chef.distance}</Text>
          <TouchableOpacity
            style={styles.directionsButton}
            onPress={() => handleGetDirections(chef)}
          >
            <Navigation size={16} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render content based on snap point
  const renderContent = () => {
    if (currentSnapPoint === 2) {
      // Expanded - show full map
      return (
        <View style={styles.expandedContent}>
          <MapView
            chefs={chefs}
            onMarkerPress={handleChefSelect}
            showUserLocation={true}
            style={styles.mapContainer}
          />
          {selectedChef && (
            <View style={[
              styles.selectedChefCard,
              { backgroundColor: Colors[colorScheme as keyof typeof Colors].background }
            ]}>
              <Text style={[
                styles.selectedChefName,
                { color: Colors[colorScheme as keyof typeof Colors].text }
              ]}>
                {selectedChef.kitchen_name}
              </Text>
              <Text style={styles.selectedChefCuisine}>{selectedChef.cuisine}</Text>
              <TouchableOpacity
                style={styles.getDirectionsButton}
                onPress={() => handleGetDirections(selectedChef)}
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
                <Text style={styles.loadingText}>Searching...</Text>
              </View>
            )}
          </View>

          {/* Chef List */}
          {isLoadingChefs ? (
            <View style={styles.loadingState}>
              <Text style={[
                styles.loadingText,
                { color: Colors[colorScheme as keyof typeof Colors].text }
              ]}>
                Loading chefs...
              </Text>
            </View>
          ) : chefLoadError ? (
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
              data={searchResults.length > 0 ? searchResults : chefs}
              renderItem={renderChefItem}
              keyExtractor={(item) => item.id}
              style={styles.chefList}
              showsVerticalScrollIndicator={false}
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
  loadingText: {
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
  selectedChefCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedChefName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  selectedChefCuisine: {
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
