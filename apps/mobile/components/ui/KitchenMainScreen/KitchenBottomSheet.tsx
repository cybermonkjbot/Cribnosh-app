import { useChefs } from '@/hooks/useChefs';
import BottomSheet, { BottomSheetBackdrop, BottomSheetBackdropProps, BottomSheetView } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { Users } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import SearchArea from '../../SearchArea';
import { CartButton } from '../CartButton';
import { KitchenBottomSheetContent } from './KitchenBottomSheetContent';
import { KitchenBottomSheetHeader } from './KitchenBottomSheetHeader';

interface KitchenBottomSheetProps {
  deliveryTime: string;
  cartItems: number;
  kitchenName?: string;
  distance?: string;
  kitchenId?: string;
  onCartPress?: () => void;
  onHeartPress?: () => void;
  onSearchPress?: () => void;
  onSearchSubmit?: (query: string) => void;
  onMealPress?: (meal: any) => void;
}

export const KitchenBottomSheet: React.FC<KitchenBottomSheetProps> = ({
  deliveryTime,
  cartItems,
  kitchenName: propKitchenName,
  distance = "0.8 km",
  kitchenId,
  onCartPress,
  onHeartPress,
  onSearchPress,
  onSearchSubmit,
  onMealPress,
}) => {
  const router = useRouter();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const contentScrollRef = useRef<ScrollView>(null);
  const searchInputRef = useRef<TextInput>(null);
  const [currentSnapPoint, setCurrentSnapPoint] = useState(0);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { getKitchenDetails } = useChefs();
  const [kitchenDetails, setKitchenDetails] = useState<any>(null);

  // Load kitchen details
  useEffect(() => {
    if (kitchenId) {
      const loadKitchenDetails = async () => {
        try {
          const details = await getKitchenDetails(kitchenId);
          if (details) {
            setKitchenDetails({ data: details });
          }
        } catch (error) {
          // Error already handled in hook
        }
      };
      loadKitchenDetails();
    }
  }, [kitchenId, getKitchenDetails]);

  // Extract kitchen name from API response
  const apiKitchenName = kitchenDetails?.data?.kitchenName;

  // Use fetched kitchen name from API
  // If kitchenId is provided, prioritize API data and don't use demo name from prop
  // Only use prop if it's not the demo name "Amara's Kitchen"
  const isDemoName = propKitchenName === "Amara's Kitchen";
  const kitchenName = kitchenId 
    ? (apiKitchenName || (!isDemoName && propKitchenName) || "Amara's Kitchen")
    : (propKitchenName || "Amara's Kitchen");

  const snapPoints = ['57%', '90%'];
  const isExpanded = currentSnapPoint === 1;

  const handleSheetChanges = (index: number) => {
    setCurrentSnapPoint(index);
    if (index === 0 && contentScrollRef.current) {
      contentScrollRef.current.scrollTo({ y: 0, animated: true });
    }
  };

  const handleSearchPress = () => {
    setIsSearchMode(true);
    setSearchQuery('');
    bottomSheetRef.current?.snapToIndex(1);
    setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  const handleSearchSubmit = (query: string) => {
    const trimmed = query.trim();
    if (trimmed) {
      onSearchSubmit?.(trimmed);
      setIsSearchMode(false);
      setSearchQuery('');
    }
  };

  const handleSearchCancel = () => {
    setIsSearchMode(false);
    setSearchQuery('');
    searchInputRef.current?.blur();
  };
  
  const handleCreateGroupOrder = () => {
    if (!kitchenId || !kitchenName) {
      return;
    }
    
    // Navigate to create group order screen with chef_id and restaurant_name
    router.push({
      pathname: '/orders/group/create',
      params: {
        chef_id: kitchenId,
        restaurant_name: kitchenName,
      },
    });
  };

  const renderBackdrop = (props: BottomSheetBackdropProps) => (
    <BottomSheetBackdrop
      {...props}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
      opacity={0.3}
    />
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose={false}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.bottomSheetBackground}
      containerStyle={styles.container}
      handleStyle={styles.handleStyle}
    >
      <BottomSheetView style={styles.content}>
        {isSearchMode ? (
          // Search Mode Interface
          <View style={styles.searchContainer}>
            {/* Search Header */}
            <View style={styles.searchHeader}>
              <TouchableOpacity onPress={handleSearchCancel} style={styles.cancelButton}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
            
            {/* Search Input */}
            <View style={styles.searchInputContainer}>
              <SearchArea 
                ref={searchInputRef}
                value={searchQuery}
                onChange={setSearchQuery}
                returnKeyType="search"
                placeholder="Search for dishes, ingredients..."
                onSubmitEditing={() => handleSearchSubmit(searchQuery)}
                autoFocus={true}
                editable={true}
              />
            </View>
            
            {/* Search Results - Content component handles displaying search results */}
            <KitchenBottomSheetContent 
              ref={contentScrollRef}
              isExpanded={true}
              deliveryTime={deliveryTime}
              kitchenId={kitchenId}
              kitchenName={kitchenName}
              searchQuery={searchQuery}
              onMealPress={onMealPress}
            />
          </View>
        ) : (
          // Normal Content Interface
          <>
            {/* Header */}
            <KitchenBottomSheetHeader
              deliveryTime={deliveryTime}
              kitchenName={kitchenName}
              currentSnapPoint={currentSnapPoint}
              distance={distance}
              kitchenId={kitchenId}
              onHeartPress={onHeartPress}
              onSearchPress={handleSearchPress}
            />
            
            {/* Content */}
            <KitchenBottomSheetContent 
              ref={contentScrollRef}
              isExpanded={isExpanded}
              onScrollAttempt={() => !isExpanded && bottomSheetRef.current?.snapToIndex(1)}
              deliveryTime={deliveryTime}
              kitchenId={kitchenId}
              kitchenName={kitchenName}
              searchQuery={isSearchMode ? searchQuery : undefined}
              onMealPress={onMealPress}
            />
          </>
        )}
        
        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          {/* Create Group Order Button */}
          <TouchableOpacity
            style={styles.createGroupOrderButton}
            onPress={handleCreateGroupOrder}
            activeOpacity={0.8}
          >
            <Users size={20} color="#E6FFE8" />
            <Text style={styles.createGroupOrderText}>Create Group Order</Text>
          </TouchableOpacity>
          
          {/* Cart Button */}
          <CartButton
            quantity={cartItems}
            onPress={onCartPress ?? (() => {})}
            variant="view"
            position="relative"
            bottom={0}
            left={0}
            right={0}
            showIcon={true}
          />
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    zIndex: 9999, // Highest z-index to ensure it's above everything
  },
  content: {
    flex: 1,
  },
  bottomSheetBackground: {
    backgroundColor: '#02120A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#EDEDED',
  },
  handleStyle: {
    display: 'none', // Hide the handle bar
  },
  searchContainer: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 10, // Reduced horizontal padding for search mode
  },
  searchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cancelButton: {
    padding: 5,
  },
  cancelText: {
    color: '#EDEDED',
    fontSize: 16,
  },
  searchInputContainer: {
    marginTop: 15,
    marginBottom: 10,
  },
  searchResultsContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: -100,
    paddingTop: 185,
  },
  searchResultsText: {
    color: '#888888',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  mascotContainer: {
    marginBottom: 20,
  },
  actionButtonsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    gap: 12,
  },
  createGroupOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B30',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  createGroupOrderText: {
    color: '#E6FFE8',
    fontSize: 16,
    fontWeight: '600',
  },
}); 