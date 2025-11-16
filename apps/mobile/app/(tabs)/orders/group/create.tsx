import AmountInput from '@/components/AmountInput';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthState } from '@/hooks/useAuthState';
import { useGroupOrders } from '@/hooks/useGroupOrders';
import { useUserLocation } from '@/hooks/useUserLocation';
import { Chef, CustomerAddress } from '@/types/customer';
import { getConvexReactClient } from '@/lib/convexClient';
import { api } from '@/convex/_generated/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Search as SearchIcon } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

// Back arrow SVG matching profile settings style
const backArrowSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M19 12H5M12 19L5 12L12 5" stroke="#094327" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export default function CreateGroupOrderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ 
    chef_id?: string; 
    restaurant_name?: string;
  }>();
  const { user } = useAuthState();
  const { location: userLocation } = useUserLocation();
  
  // Chef selection state
  const [selectedChef, setSelectedChef] = useState<{ chef_id: string; restaurant_name: string } | null>(
    params.chef_id && params.restaurant_name 
      ? { chef_id: params.chef_id, restaurant_name: params.restaurant_name }
      : null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [showChefSelection, setShowChefSelection] = useState(!params.chef_id || !params.restaurant_name);
  
  const [initialBudget, setInitialBudget] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState<CustomerAddress | undefined>(undefined);
  const [deliveryTime, setDeliveryTime] = useState('');
  const [expiresInHours, setExpiresInHours] = useState('24');
  
  const { createGroupOrder, isLoading: isCreating } = useGroupOrders();
  
  const [kitchensData, setKitchensData] = useState<any>(null);
  const [isLoadingKitchens, setIsLoadingKitchens] = useState(false);
  
  // Fetch nearby kitchens or search kitchens using Convex queries directly
  useEffect(() => {
    if (showChefSelection && userLocation) {
      const loadKitchens = async () => {
        try {
          setIsLoadingKitchens(true);
          const convex = getConvexReactClient();
          
          let chefs: any[] = [];
          
          if (searchQuery && searchQuery.length >= 2) {
            // Search kitchens/chefs by query
            const searchResult = await convex.query(api.queries.chefs.searchChefsByQuery, {
              query: searchQuery,
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
              radiusKm: 10,
              limit: 20,
            });
            chefs = searchResult.chefs || [];
          } else {
            // Get nearby kitchens/chefs
            const nearbyResult = await convex.query(api.queries.chefs.findNearbyChefs, {
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
              maxDistanceKm: 5,
            });
            chefs = nearbyResult || [];
          }
          
          console.log('Loaded chefs:', chefs.length);
          
          // Transform to expected format
          const transformedChefs = chefs.map((chef: any) => ({
            id: chef._id,
            name: chef.kitchenName || chef.name || 'Unknown Kitchen',
            kitchen_name: chef.kitchenName || chef.name,
            cuisine: chef.specialties?.[0] || 'Other',
            image_url: chef.imageUrl || chef.image_url || chef.profileImage || null,
            delivery_time: chef.deliveryTime || null,
            distance: chef.distance || 0,
            rating: chef.rating || null,
          }));
          
          setKitchensData({ success: true, data: { chefs: transformedChefs } });
        } catch (error) {
          console.error('Failed to load kitchens:', error);
          setKitchensData({ success: false, data: { chefs: [] } });
        } finally {
          setIsLoadingKitchens(false);
        }
      };
      loadKitchens();
    } else {
      setKitchensData(null);
    }
  }, [showChefSelection, userLocation, searchQuery]);
  
  const chefId = selectedChef?.chef_id || '';
  const restaurantName = selectedChef?.restaurant_name || '';
  
  // Get kitchens list (from search results)
  const chefs = useMemo(() => {
    if (kitchensData?.data?.chefs) {
      return kitchensData.data.chefs;
    }
    return [];
  }, [kitchensData]);
  
  const isLoadingChefs = isLoadingKitchens;
  
  // Default title
  const defaultTitle = useMemo(() => {
    if (restaurantName) {
      return `Group Order from ${restaurantName}`;
    }
    return 'Group Order';
  }, [restaurantName]);
  
  // Preset budget amounts
  const presetAmounts = ['10', '20', '50', '100', 'Custom'];
  
  const handlePresetSelect = (preset: string) => {
    if (preset === 'Custom') {
      setSelectedPreset('Custom');
      setInitialBudget('');
    } else {
      setSelectedPreset(preset);
      setInitialBudget(preset);
    }
  };
  
  const handleAmountChange = (value: string) => {
    setInitialBudget(value);
    if (presetAmounts.includes(value)) {
      setSelectedPreset(value);
    } else {
      setSelectedPreset('Custom');
    }
  };
  
  const isValidBudget = () => {
    const budgetNum = parseFloat(initialBudget);
    return !isNaN(budgetNum) && budgetNum > 0;
  };
  
  const canCreate = () => {
    return chefId && restaurantName && isValidBudget() && !isCreating;
  };
  
  const handleCreate = async () => {
    if (!canCreate()) {
      if (!chefId || !restaurantName) {
        Alert.alert('Error', 'Chef and restaurant information is missing. Please go back and try again.');
        return;
      }
      if (!isValidBudget()) {
        Alert.alert('Error', 'Please enter a valid budget amount');
        return;
      }
      return;
    }
    
    const budgetNum = parseFloat(initialBudget);
    const expiresHours = parseInt(expiresInHours) || 24;
    
    try {
      const result = await createGroupOrder({
        chef_id: chefId,
        restaurant_name: restaurantName,
        initial_budget: budgetNum,
        title: title || defaultTitle,
        delivery_address: deliveryAddress ? {
          street: deliveryAddress.street || '',
          city: deliveryAddress.city || '',
          postal_code: deliveryAddress.postal_code || '',
          country: deliveryAddress.country || '',
        } : undefined,
        delivery_time: deliveryTime || undefined,
        expires_in_hours: expiresHours,
      });
      
      if (!result.success || !result.data) {
        throw new Error('Failed to create group order');
      }
      
      // Success - navigate to group order screen
      // Navigate back multiple times to clear modal context (e.g., from BottomSearchDrawer),
      // then navigate to group order to ensure clean navigation stack
      // This prevents the create screen from appearing when going back from group order
      const navigateToGroupOrder = () => {
        router.push({
          pathname: '/orders/group',
          params: { group_order_id: result.data.group_order_id },
        });
      };
      
      if (router.canGoBack()) {
        // Go back once to remove create screen
        router.back();
        // If we can still go back, we might be in a modal context (e.g., from BottomSearchDrawer)
        // Go back again to clear the modal context
        setTimeout(() => {
          if (router.canGoBack()) {
            router.back();
            // Navigate to group order after clearing modal
            setTimeout(() => {
              navigateToGroupOrder();
            }, 150);
          } else {
            // No more back navigation, navigate directly
            navigateToGroupOrder();
          }
        }, 150);
      } else {
        // Can't go back, use replace
        router.replace({
          pathname: '/orders/group',
          params: { group_order_id: result.data.group_order_id },
        });
      }
    } catch (error: any) {
      // Error already handled in hook with toast
      const errorMessage = 
        error?.message ||
        'Failed to create group order. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  };
  
  const handleChefSelect = (chef: Chef) => {
    setSelectedChef({
      chef_id: chef.id,
      restaurant_name: chef.kitchen_name || chef.name,
    });
    setShowChefSelection(false);
  };
  
  const handleBackToChefSelection = () => {
    setShowChefSelection(true);
    setSelectedChef(null);
  };
  
  // Show chef selection if no chef selected
  if (showChefSelection || !chefId || !restaurantName) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAFFFA" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <SvgXml xml={backArrowSVG} width={24} height={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Food Creator</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        {/* Search Input */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <SearchIcon size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for food creators..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
              >
                <Text style={styles.clearButtonText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {/* Chefs List */}
        <View style={styles.chefsListContainer}>
          {isLoadingChefs ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#E6FFE8" />
              <Text style={styles.loadingText}>Loading food creators...</Text>
            </View>
          ) : chefs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery ? 'No food creators found' : 'No food creators nearby'}
              </Text>
              {!searchQuery && (
                <Text style={styles.emptySubtext}>
                  Try searching for a food creator name
                </Text>
              )}
            </View>
          ) : (
            <FlatList
              data={chefs as any[]}
              keyExtractor={(item) => item.id}
              renderItem={({ item: chef }) => (
                <TouchableOpacity
                  style={styles.chefCard}
                  onPress={() => handleChefSelect(chef)}
                  activeOpacity={0.7}
                >
                  <Image
                    source={{ 
                      uri: chef.image_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face'
                    }}
                    style={styles.chefImage}
                  />
                  <View style={styles.chefInfo}>
                    <Text style={styles.chefName}>
                      {chef.kitchen_name || chef.name}
                    </Text>
                    <Text style={styles.chefCuisine}>{chef.cuisine}</Text>
                    {chef.delivery_time && (
                      <Text style={styles.chefDeliveryTime}>
                        Delivers in {chef.delivery_time}
                      </Text>
                    )}
                  </View>
                  <SvgXml xml={`<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M7 4L13 10L7 16" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`} width={20} height={20} />
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.chefsListContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFFFA" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <SvgXml xml={backArrowSVG} width={24} height={24} />
        </TouchableOpacity>
        <View style={styles.headerSpacer} />
      </View>
      
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Food Creator Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoCardHeader}>
            <Text style={styles.infoLabel}>Food Creator</Text>
            <TouchableOpacity 
              onPress={handleBackToChefSelection}
              style={styles.changeButton}
            >
              <Text style={styles.changeButtonText}>Change</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.infoValue}>{restaurantName}</Text>
        </View>
        
        {/* Initial Budget Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Initial Budget *</Text>
          <Text style={styles.sectionDescription}>
            Set the starting budget for this group order. Participants can chip in to increase it.
          </Text>
          
          <View style={styles.amountInputContainer}>
            <AmountInput 
              amount={initialBudget} 
              setAmount={handleAmountChange}
            />
          </View>
          
          {/* Preset Amount Buttons */}
          <View style={styles.presetContainer}>
            {presetAmounts.map((preset) => (
              <TouchableOpacity
                key={preset}
                style={[
                  styles.presetButton,
                  selectedPreset === preset && styles.presetButtonSelected,
                ]}
                onPress={() => handlePresetSelect(preset)}
              >
                <Text
                  style={[
                    styles.presetButtonText,
                    selectedPreset === preset && styles.presetButtonTextSelected,
                  ]}
                >
                  {preset === 'Custom' ? 'Custom' : `£${preset}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Title Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Order Title (Optional)</Text>
          <Text style={styles.sectionDescription}>
            Give your group order a name
          </Text>
          <Input
            placeholder={defaultTitle}
            value={title}
            onChangeText={setTitle}
            style={styles.textInput}
          />
        </View>
        
        {/* Delivery Time Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Delivery Time (Optional)</Text>
          <Text style={styles.sectionDescription}>
            When should this order be delivered?
          </Text>
          <Input
            placeholder="e.g., Tomorrow 6:00 PM"
            value={deliveryTime}
            onChangeText={setDeliveryTime}
            style={styles.textInput}
          />
        </View>
        
        {/* Expires In Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Expires In (Hours)</Text>
          <Text style={styles.sectionDescription}>
            How long should this group order be open for joining?
          </Text>
          <Input
            placeholder="24"
            value={expiresInHours}
            onChangeText={setExpiresInHours}
            keyboardType="numeric"
            style={styles.textInput}
          />
        </View>
      </ScrollView>
      
      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <Button
          variant="danger"
          size="lg"
          onPress={handleCreate}
          disabled={!canCreate()}
        >
          {isCreating ? (
            <ActivityIndicator size="small" color="#E6FFE8" />
          ) : (
            <Text>Create Group Order</Text>
          )}
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFFFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    backgroundColor: '#FAFFFA',
    gap: 12,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontFamily: 'Archivo',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 28,
    color: '#094327',
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    color: '#EAEAEA',
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#E6FFE8',
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#094327',
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: 'rgba(230, 255, 232, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(230, 255, 232, 0.2)',
  },
  infoLabel: {
    color: '#E6FFE8',
    fontSize: 14,
    marginBottom: 8,
    opacity: 0.8,
  },
  infoValue: {
    color: '#E6FFE8',
    fontSize: 20,
    fontWeight: '600',
  },
  section: {
    marginBottom: 32,
  },
  sectionLabel: {
    color: '#E6FFE8',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionDescription: {
    color: '#EAEAEA',
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 16,
    lineHeight: 20,
  },
  amountInputContainer: {
    marginBottom: 16,
  },
  presetContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  presetButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(230, 255, 232, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(230, 255, 232, 0.2)',
    minWidth: 80,
    alignItems: 'center',
  },
  presetButtonSelected: {
    backgroundColor: '#FF3B30',
    borderColor: '#FF3B30',
  },
  presetButtonText: {
    color: '#E6FFE8',
    fontSize: 14,
    fontWeight: '600',
  },
  presetButtonTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: 'rgba(230, 255, 232, 0.05)',
    borderColor: 'rgba(230, 255, 232, 0.2)',
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#02120A',
    paddingVertical: 16,
    paddingHorizontal: 20,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: 'rgba(230, 255, 232, 0.1)',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: '#1a1a1a',
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  clearButtonText: {
    color: '#094327',
    fontSize: 16,
    fontWeight: '600',
  },
  chefsListContainer: {
    flex: 1,
  },
  chefsListContent: {
    padding: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    gap: 20,
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    color: '#1a1a1a',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  emptySubtext: {
    color: '#6B7280',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  chefCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  chefImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  chefInfo: {
    flex: 1,
  },
  chefName: {
    color: '#1a1a1a',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  chefCuisine: {
    color: '#6B7280',
    fontSize: 14,
    marginBottom: 4,
  },
  chefDeliveryTime: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  chevron: {
    transform: [{ rotate: '180deg' }],
  },
  infoCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  changeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(230, 255, 232, 0.2)',
    borderRadius: 8,
  },
  changeButtonText: {
    color: '#E6FFE8',
    fontSize: 14,
    fontWeight: '600',
  },
});

