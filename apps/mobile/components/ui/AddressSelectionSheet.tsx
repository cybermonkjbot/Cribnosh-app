import { BottomSheetBase } from '@/components/BottomSheetBase';
import { useRegionAvailability } from '@/hooks/useRegionAvailability';
import { useUserLocation } from '@/hooks/useUserLocation';
import { CustomerAddress } from '@/types/customer';
import * as SecureStore from 'expo-secure-store';
import { Edit, MapPin, Plus, Search, Trash2, X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getConvexClient, getSessionToken } from '@/lib/convexClient';
import { api } from '@/convex/_generated/api';
import { useAuthContext } from '@/contexts/AuthContext';
import {
    Alert,
    Dimensions,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { calculateDistance } from '../../utils/appleMapsService';
import { AddressFormModal } from './AddressFormModal';
import { RegionAvailabilityModal } from './RegionAvailabilityModal';

// Custom SVG icons from settings screen
const houseIconSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M3 10L10 3L17 10V17C17 17.5523 16.5523 18 16 18H4C3.44772 18 3 17.5523 3 17V10Z" fill="#707070"/>
  <rect x="7" y="12" width="6" height="6" fill="#707070"/>
</svg>`;

const briefcaseIconSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M9.99984 10.0001H10.0082M13.3332 5.00008V3.33341C13.3332 2.89139 13.1576 2.46746 12.845 2.1549C12.5325 1.84234 12.1085 1.66675 11.6665 1.66675H8.33317C7.89114 1.66675 7.46722 1.84234 7.15466 2.1549C6.8421 2.46746 6.6665 2.89139 6.6665 3.33341V5.00008M18.3332 10.8334C15.8605 12.4659 12.9628 13.3362 9.99984 13.3362C7.03688 13.3362 4.13918 12.4659 1.6665 10.8334M3.33317 5.00008H16.6665C17.587 5.00008 18.3332 5.74627 18.3332 6.66675V15.0001C18.3332 15.9206 17.587 16.6667 16.6665 16.6667H3.33317C2.4127 16.6667 1.6665 15.9206 1.6665 15.0001V6.66675C1.6665 5.74627 2.4127 5.00008 3.33317 5.00008Z" stroke="#707070" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Helper function to replace color in SVG
const replaceSVGColor = (svg: string, color: string): string => {
  return svg.replace(/#707070/g, color);
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SNAP_POINTS = {
  COLLAPSED: 400,
  HALF: SCREEN_HEIGHT * 0.65,
  EXPANDED: SCREEN_HEIGHT * 0.9,
};

export interface AddressSelectionSheetProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectAddress: (address: CustomerAddress) => void;
  selectedAddress?: CustomerAddress;
  addressLabel?: 'home' | 'work' | 'custom'; // Indicates which address type we're setting
  mode?: 'add' | 'select'; // 'add' for adding new address, 'select' for selecting existing
}

interface SavedAddress extends CustomerAddress {
  id: string;
  label: 'home' | 'work' | 'custom';
  labelName?: string; // Custom label name
  lastUsed?: number;
}

interface RecentAddress extends CustomerAddress {
  id: string;
  label?: string;
  lastUsed: number;
}

export function AddressSelectionSheet({
  isVisible,
  onClose,
  onSelectAddress,
  selectedAddress,
  addressLabel,
  mode = 'add', // Default to 'add' for backward compatibility
}: AddressSelectionSheetProps) {
  const colorScheme = useColorScheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);
  const [formMode, setFormMode] = useState<'home' | 'work' | 'custom'>('custom');

  // Get user location for distance calculation
  const locationState = useUserLocation();
  const userLocation = locationState.location;
  const { isAuthenticated } = useAuthContext();

  // Profile state
  const [profileData, setProfileData] = useState<any>(null);

  // Fetch profile data from Convex
  const fetchProfile = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const convex = getConvexClient();
      const sessionToken = await getSessionToken();

      if (!sessionToken) {
        return;
      }

      const result = await convex.action(api.actions.users.customerGetProfile, {
        sessionToken,
      });

      if (result.success === false) {
        return;
      }

      // Transform to match expected format
      setProfileData({
        data: {
          ...result.user,
        },
      });
    } catch (error: any) {
      console.error('Error fetching profile:', error);
    }
  }, [isAuthenticated]);

  // Fetch profile when sheet opens
  useEffect(() => {
    if (isVisible && isAuthenticated) {
      fetchProfile();
    }
  }, [isVisible, isAuthenticated, fetchProfile]);

  // Regional availability check
  const { checkAddress } = useRegionAvailability();
  const [showRegionModal, setShowRegionModal] = useState(false);

  // Load custom addresses from SecureStore
  const [customAddresses, setCustomAddresses] = useState<SavedAddress[]>([]);

  // Load custom addresses on mount
  useEffect(() => {
    const loadCustomAddresses = async () => {
      try {
        const stored = await SecureStore.getItemAsync('custom_addresses');
        if (stored) {
          const parsed = JSON.parse(stored);
          setCustomAddresses(parsed);
        }
      } catch (error) {
        console.error('Failed to load custom addresses:', error);
      }
    };
    if (isVisible) {
      loadCustomAddresses();
    }
  }, [isVisible]);

  // Save custom addresses to SecureStore
  const saveCustomAddresses = useCallback(async (addresses: SavedAddress[]) => {
    try {
      await SecureStore.setItemAsync('custom_addresses', JSON.stringify(addresses));
    } catch (error) {
      console.error('Failed to save custom addresses:', error);
    }
  }, []);

  // Extract saved addresses from profile (home and work, not custom)
  const savedAddresses = useMemo<SavedAddress[]>(() => {
    const addresses: SavedAddress[] = [];
    const profile = profileData?.data;

    if (profile?.address) {
      // Main address (could be home)
      addresses.push({
        id: 'home',
        label: 'home',
        ...profile.address,
      });
    }
    
    return addresses;
  }, [profileData]);

  // Recent addresses (from SecureStore or recent orders)
  const [recentAddresses, setRecentAddresses] = useState<RecentAddress[]>([]);

  // Load recent addresses from SecureStore on mount
  useEffect(() => {
    const loadRecentAddresses = async () => {
      try {
        const stored = await SecureStore.getItemAsync('recent_addresses');
        if (stored) {
          const parsed = JSON.parse(stored);
          setRecentAddresses(parsed);
        }
      } catch (error) {
        console.error('Failed to load recent addresses:', error);
      }
    };
    if (isVisible) {
      loadRecentAddresses();
    }
  }, [isVisible]);

  // Save recent addresses to SecureStore
  const saveRecentAddresses = useCallback(async (addresses: RecentAddress[]) => {
    try {
      await SecureStore.setItemAsync('recent_addresses', JSON.stringify(addresses));
    } catch (error) {
      console.error('Failed to save recent addresses:', error);
    }
  }, []);

  // Filter addresses based on search
  const filteredSavedAddresses = useMemo(() => {
    if (!searchQuery.trim()) return savedAddresses;
    
    const query = searchQuery.toLowerCase();
    return savedAddresses.filter(addr => {
      const fullAddress = `${addr.street} ${addr.city} ${addr.state} ${addr.postal_code}`.toLowerCase();
      return fullAddress.includes(query);
    });
  }, [savedAddresses, searchQuery]);

  const filteredRecentAddresses = useMemo(() => {
    if (!searchQuery.trim()) return recentAddresses;
    
    const query = searchQuery.toLowerCase();
    return recentAddresses.filter(addr => {
      const fullAddress = `${addr.street} ${addr.city} ${addr.state} ${addr.postal_code}`.toLowerCase();
      return fullAddress.includes(query);
    });
  }, [recentAddresses, searchQuery]);

  // Calculate distance for address
  const getDistance = useCallback((address: CustomerAddress): string | null => {
    if (!userLocation || !address.coordinates) return null;
    
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      address.coordinates.latitude,
      address.coordinates.longitude
    );
    
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    }
    return `${distance.toFixed(1)} mi`;
  }, [userLocation]);

  // Handle address selection
  const handleSelectAddress = useCallback((address: CustomerAddress) => {
    // Check regional availability
    const isSupported = checkAddress(address);
    
    if (!isSupported) {
      // Show region availability modal
      setShowRegionModal(true);
      return;
    }

    // Add to recent addresses
    const recentAddress: RecentAddress = {
      ...address,
      id: `recent-${Date.now()}`,
      lastUsed: Date.now(),
    };
    
    setRecentAddresses(prev => {
      const filtered = prev.filter(a => 
        a.street !== address.street || 
        a.city !== address.city
      );
      const updated = [recentAddress, ...filtered].slice(0, 10); // Keep last 10
      saveRecentAddresses(updated);
      return updated;
    });

    // Call the callback with the selected address
    onSelectAddress(address);
    onClose();
  }, [onSelectAddress, onClose, saveRecentAddresses, checkAddress]);

  // Handle add address
  const handleAddAddress = useCallback((label: 'home' | 'work' | 'custom') => {
    setEditingAddress(null);
    setFormMode(label);
    setShowAddressForm(true);
  }, []);

  // Handle save address from form
  const handleSaveAddress = useCallback(async (address: CustomerAddress & { labelName?: string }) => {
    try {
      if (formMode === 'custom') {
        // Save as custom address
        const newCustomAddress: SavedAddress = {
          ...address,
          id: editingAddress?.id || `custom-${Date.now()}`,
          label: 'custom',
          labelName: address.labelName || 'Custom Address',
        };

        if (editingAddress) {
          // Update existing custom address
          const updated = customAddresses.map(a => 
            a.id === editingAddress.id ? newCustomAddress : a
          );
          setCustomAddresses(updated);
          await saveCustomAddresses(updated);
        } else {
          // Add new custom address
          const updated = [...customAddresses, newCustomAddress];
          setCustomAddresses(updated);
          await saveCustomAddresses(updated);
        }

        setShowAddressForm(false);
        setEditingAddress(null);
      } else {
        // For home/work, save to profile via callback
        onSelectAddress(address);
        setShowAddressForm(false);
        setEditingAddress(null);
      }
    } catch (error) {
      console.error('Error saving address:', error);
      Alert.alert('Error', 'Failed to save address. Please try again.');
    }
  }, [formMode, editingAddress, customAddresses, onSelectAddress, saveCustomAddresses]);

  // Handle edit address
  const handleEditAddress = useCallback((address: SavedAddress) => {
    setEditingAddress(address);
    setFormMode(address.label);
    setShowAddressForm(true);
  }, []);

  // Handle delete custom address
  const handleDeleteAddress = useCallback(async (addressId: string) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updated = customAddresses.filter(a => a.id !== addressId);
            setCustomAddresses(updated);
            await saveCustomAddresses(updated);
          },
        },
      ]
    );
  }, [customAddresses, saveCustomAddresses]);

  // Snap points for bottom sheet
  const snapPoints = useMemo(() => {
    const collapsedPercentage = Math.round((SNAP_POINTS.COLLAPSED / SCREEN_HEIGHT) * 100);
    const halfPercentage = Math.round((SNAP_POINTS.HALF / SCREEN_HEIGHT) * 100);
    const expandedPercentage = Math.round((SNAP_POINTS.EXPANDED / SCREEN_HEIGHT) * 100);
    return [`${collapsedPercentage}%`, `${halfPercentage}%`, `${expandedPercentage}%`];
  }, []);

  // Render saved address item
  const renderSavedAddress = useCallback(({ item }: { item: SavedAddress }) => {
    const isSelected = selectedAddress?.street === item.street && 
                      selectedAddress?.city === item.city;
    const distance = getDistance(item);
    const labelName = item.label === 'home' ? 'Home' : 
                     item.label === 'work' ? 'Work' : 
                     item.labelName || 'Custom';
    const isCustom = item.label === 'custom';

    return (
      <View
        style={[
          styles.addressItem,
          isSelected && styles.addressItemSelected,
          { backgroundColor: Colors[colorScheme as keyof typeof Colors].background }
        ]}
      >
        <TouchableOpacity
          style={styles.addressItemContent}
          onPress={() => handleSelectAddress(item)}
          activeOpacity={0.7}
        >
          <View style={styles.addressIconContainer}>
            {item.label === 'home' ? (
              <SvgXml xml={replaceSVGColor(houseIconSVG, '#10B981')} width={20} height={20} />
            ) : item.label === 'work' ? (
              <SvgXml xml={replaceSVGColor(briefcaseIconSVG, '#3B82F6')} width={20} height={20} />
            ) : (
              <MapPin size={20} color="#6B7280" />
            )}
          </View>
          <View style={styles.addressInfo}>
            <Text style={styles.addressText}>
              {item.street}
            </Text>
            <Text style={styles.addressSubtext}>
              {item.city}, {item.state} {item.postal_code}
            </Text>
            {distance && (
              <Text style={[styles.addressDistance, { color: '#6B7280' }]}>
                {distance}
              </Text>
            )}
          </View>
        </TouchableOpacity>
        {isCustom && (
          <View style={styles.addressActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEditAddress(item)}
            >
              <Edit size={18} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeleteAddress(item.id)}
            >
              <Trash2 size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }, [selectedAddress, handleSelectAddress, getDistance, colorScheme, handleEditAddress, handleDeleteAddress]);

  // Render places section - simplified and focused
  const renderPlacesSection = () => {
    // Check if user has any saved addresses
    const hasAnyAddresses = filteredSavedAddresses.length > 0 || customAddresses.length > 0 || filteredRecentAddresses.length > 0;
    
    return (
      <View style={styles.placesSection}>
        <View style={styles.placesGrid}>
        {/* Home Place */}
        <TouchableOpacity
          style={styles.placeCard}
          onPress={() => handleAddAddress('home')}
        >
          <View style={[styles.placeIcon, { backgroundColor: '#10B981' }]}>
            <SvgXml xml={replaceSVGColor(houseIconSVG, '#FFFFFF')} width={24} height={24} />
          </View>
          <Text style={styles.placeLabel}>Home</Text>
          {savedAddresses.find(a => a.label === 'home') && (
            <Text style={styles.placeDistance}>
              {getDistance(savedAddresses.find(a => a.label === 'home')!) || ''}
            </Text>
          )}
        </TouchableOpacity>

        {/* Work Place */}
        <TouchableOpacity
          style={styles.placeCard}
          onPress={() => handleAddAddress('work')}
        >
          <View style={[styles.placeIcon, { backgroundColor: '#3B82F6' }]}>
            <SvgXml xml={replaceSVGColor(briefcaseIconSVG, '#FFFFFF')} width={24} height={24} />
          </View>
          <Text style={styles.placeLabel}>Work</Text>
          {savedAddresses.find(a => a.label === 'work') && (
            <Text style={styles.placeDistance}>
              {getDistance(savedAddresses.find(a => a.label === 'work')!) || ''}
            </Text>
          )}
        </TouchableOpacity>

        {/* Add Custom Place */}
        <TouchableOpacity
          style={styles.placeCard}
          onPress={() => handleAddAddress('custom')}
        >
          <View style={[styles.placeIcon, { backgroundColor: '#F8F9FA' }]}>
            <Plus size={24} color="#6B7280" />
          </View>
          <Text style={styles.placeLabel}>Custom</Text>
        </TouchableOpacity>
      </View>
    </View>
    );
  };

  if (!isVisible) return null;

  return (
    <BottomSheetBase
      snapPoints={snapPoints}
      index={0}
      onChange={(index) => {
        if (index === -1) {
          onClose();
        }
      }}
      backgroundStyle={{ backgroundColor: '#FAFFFA' }}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {mode === 'select' 
              ? 'Select address'
              : addressLabel === 'home' 
                ? 'Add home address' 
                : addressLabel === 'work' 
                  ? 'Add work address' 
                  : 'Add address'}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#333333" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInput}>
            <Search size={20} color="#6B7280" />
            <TextInput
              style={styles.searchTextInput}
              placeholder={mode === 'select' ? 'Enter a new address' : 'Search addresses'}
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Content */}
        <FlatList
          data={[]}
          renderItem={() => null}
          ListHeaderComponent={
            <>
              {/* Places Section - Only show in 'add' mode */}
              {mode === 'add' && !searchQuery && renderPlacesSection()}

              {/* All Saved Addresses - Combined and simplified */}
              {(filteredSavedAddresses.length > 0 || customAddresses.length > 0 || filteredRecentAddresses.length > 0) && (
                <View style={styles.section}>
                  <FlatList
                    data={[
                      ...filteredSavedAddresses,
                      ...customAddresses.filter(addr => {
                        if (!searchQuery.trim()) return true;
                        const query = searchQuery.toLowerCase();
                        const fullAddress = `${addr.street} ${addr.city} ${addr.state} ${addr.postal_code}`.toLowerCase();
                        return fullAddress.includes(query) || (addr.labelName?.toLowerCase().includes(query));
                      }),
                      ...filteredRecentAddresses.map(addr => ({
                        ...addr,
                        label: (addr.label || 'custom') as 'home' | 'work' | 'custom',
                      })),
                    ] as SavedAddress[]}
                    renderItem={renderSavedAddress}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false}
                  />
                </View>
              )}

              {/* Empty State */}
              {filteredSavedAddresses.length === 0 && 
               customAddresses.length === 0 &&
               filteredRecentAddresses.length === 0 && 
               !searchQuery && (
                <View style={styles.emptyState}>
                  <MapPin size={48} color="#9CA3AF" />
                  <Text style={styles.emptyStateText}>
                    {mode === 'select' ? 'No saved addresses' : 'No saved addresses yet'}
                  </Text>
                  <Text style={styles.emptyStateSubtext}>
                    {mode === 'select' 
                      ? 'Enter a new address above or add one from your profile'
                      : 'Choose an address type above to get started'}
                  </Text>
                </View>
              )}

              {/* Search Results Empty */}
              {searchQuery && 
               filteredSavedAddresses.length === 0 && 
               customAddresses.length === 0 &&
               filteredRecentAddresses.length === 0 && (
                <View style={styles.emptyState}>
                  <Search size={48} color="#9CA3AF" />
                  <Text style={styles.emptyStateText}>No results found</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Try a different search term
                  </Text>
                </View>
              )}
            </>
          }
          style={styles.list}
          showsVerticalScrollIndicator={false          }
        />
      </View>

      {/* Address Form Modal */}
      <AddressFormModal
        isVisible={showAddressForm}
        onClose={() => {
          setShowAddressForm(false);
          setEditingAddress(null);
        }}
        onSave={handleSaveAddress}
        initialAddress={editingAddress || undefined}
        label={formMode}
      />

      {/* Region Availability Modal */}
      <RegionAvailabilityModal
        isVisible={showRegionModal}
        onClose={() => setShowRegionModal(false)}
      />
    </BottomSheetBase>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFFFA',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
    marginBottom: 16,
  },
  headerTitle: {
    fontFamily: 'Archivo',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 28,
    color: '#333333',
    flex: 1,
    textAlign: 'left',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  searchContainer: {
    marginBottom: 24,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    backgroundColor: '#FFFFFF',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchTextInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
  },
  list: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Archivo',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 28,
    color: '#333333',
    marginBottom: 16,
  },
  placesSection: {
    marginBottom: 24,
  },
  placesSectionTitle: {
    fontFamily: 'Archivo',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 28,
    color: '#333333',
    marginBottom: 20,
  },
  placesGrid: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-start',
  },
  placeCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 20,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    minWidth: 100,
  },
  placeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  placeLabel: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#333333',
    marginBottom: 4,
  },
  placeDistance: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 16,
    color: '#6B7280',
  },
  addressItem: {
    borderRadius: 12,
    marginBottom: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  addressItemSelected: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addressItemContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: '#F8F9FA',
  },
  addressInfo: {
    flex: 1,
  },
  addressLabel: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 24,
    color: '#333333',
    marginBottom: 4,
  },
  addressText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 15,
    lineHeight: 22,
    color: '#111827',
    marginBottom: 4,
  },
  addressSubtext: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    marginBottom: 2,
  },
  addressDistance: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  selectedIndicator: {
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3B82F6',
  },
  addressActions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
    marginTop: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyStateText: {
    fontFamily: 'Archivo',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    textAlign: 'center',
  },
});

