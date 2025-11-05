import AmountInput from '@/components/AmountInput';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Search as SearchIcon } from 'lucide-react-native';
import { useState, useMemo } from 'react';
import { 
  ActivityIndicator, 
  Alert, 
  FlatList,
  Image,
  ScrollView, 
  StyleSheet, 
  Text, 
  TextInput,
  TouchableOpacity, 
  View 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  useCreateGroupOrderMutation, 
  useGetNearbyChefsQuery,
  useSearchChefsQuery 
} from '@/store/customerApi';
import { useAuthState } from '@/hooks/useAuthState';
import { useUserLocation } from '@/hooks/useUserLocation';
import { CustomerAddress, Chef } from '@/types/customer';

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
  
  const [createGroupOrder, { isLoading: isCreating }] = useCreateGroupOrderMutation();
  
  // Fetch nearby chefs
  const { 
    data: nearbyChefsData, 
    isLoading: isLoadingNearbyChefs 
  } = useGetNearbyChefsQuery(
    {
      latitude: userLocation?.latitude || 0,
      longitude: userLocation?.longitude || 0,
      radius: 5,
      limit: 20,
      page: 1,
    },
    {
      skip: !showChefSelection || !userLocation || !!searchQuery,
    }
  );
  
  // Search chefs
  const { 
    data: searchChefsData, 
    isLoading: isLoadingSearchChefs 
  } = useSearchChefsQuery(
    { q: searchQuery, limit: 20 },
    {
      skip: !showChefSelection || !searchQuery || searchQuery.length < 2,
    }
  );
  
  const chefId = selectedChef?.chef_id || '';
  const restaurantName = selectedChef?.restaurant_name || '';
  
  // Get chefs list (from search or nearby)
  const chefs = useMemo(() => {
    if (searchQuery && searchChefsData?.data?.chefs) {
      return searchChefsData.data.chefs;
    }
    if (nearbyChefsData?.data?.chefs) {
      return nearbyChefsData.data.chefs;
    }
    return [];
  }, [searchQuery, searchChefsData, nearbyChefsData]);
  
  const isLoadingChefs = isLoadingNearbyChefs || isLoadingSearchChefs;
  
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
        delivery_address: deliveryAddress,
        delivery_time: deliveryTime || undefined,
        expires_in_hours: expiresHours,
      }).unwrap();
      
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
      const errorMessage = 
        error?.data?.error?.message ||
        error?.data?.message ||
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
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft color="#E6FFE8" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Restaurant</Text>
        </View>
        
        {/* Search Input */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <SearchIcon size={20} color="#E6FFE8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for restaurants..."
              placeholderTextColor="#999"
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
              <Text style={styles.loadingText}>Loading restaurants...</Text>
            </View>
          ) : chefs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery ? 'No restaurants found' : 'No restaurants nearby'}
              </Text>
              {!searchQuery && (
                <Text style={styles.emptySubtext}>
                  Try searching for a restaurant name
                </Text>
              )}
            </View>
          ) : (
            <FlatList
              data={chefs}
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
                  <ChevronLeft 
                    size={20} 
                    color="#E6FFE8" 
                    style={styles.chevron}
                  />
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft color="#E6FFE8" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Group Order</Text>
      </View>
      
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Restaurant Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoCardHeader}>
            <Text style={styles.infoLabel}>Restaurant</Text>
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
    backgroundColor: '#02120A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    color: '#E6FFE8',
    fontSize: 20,
    fontWeight: '600',
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(230, 255, 232, 0.1)',
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(230, 255, 232, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(230, 255, 232, 0.2)',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: '#E6FFE8',
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  clearButtonText: {
    color: '#E6FFE8',
    fontSize: 16,
    fontWeight: '600',
  },
  chefsListContainer: {
    flex: 1,
  },
  chefsListContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  loadingText: {
    color: '#E6FFE8',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    color: '#E6FFE8',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#EAEAEA',
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
  },
  chefCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(230, 255, 232, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(230, 255, 232, 0.2)',
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
    color: '#E6FFE8',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  chefCuisine: {
    color: '#EAEAEA',
    fontSize: 14,
    marginBottom: 4,
    opacity: 0.8,
  },
  chefDeliveryTime: {
    color: '#EAEAEA',
    fontSize: 12,
    opacity: 0.6,
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

