import BottomSheet, { BottomSheetBackdrop, BottomSheetBackdropProps, BottomSheetView } from '@gorhom/bottom-sheet';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Mascot } from '../../Mascot';
import SearchArea from '../../SearchArea';
import { CartButton } from '../CartButton';
import { KitchenBottomSheetContent } from './KitchenBottomSheetContent';
import { KitchenBottomSheetHeader } from './KitchenBottomSheetHeader';

const { width, height } = Dimensions.get('window');

interface KitchenBottomSheetProps {
  deliveryTime: string;
  cartItems: number;
  kitchenName?: string;
  distance?: string;
  onCartPress?: () => void;
  onHeartPress?: () => void;
  onSearchPress?: () => void;
  onSearchSubmit?: (query: string) => void;
}

export const KitchenBottomSheet: React.FC<KitchenBottomSheetProps> = ({
  deliveryTime,
  cartItems,
  kitchenName = "Amara's Kitchen",
  distance = "0.8 km",
  onCartPress,
  onHeartPress,
  onSearchPress,
  onSearchSubmit,
}) => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const contentScrollRef = useRef<ScrollView>(null);
  const searchInputRef = useRef<TextInput>(null);
  const [currentSnapPoint, setCurrentSnapPoint] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Snap points - initial height is 57% of screen height
  const snapPoints = useMemo(() => ['57%', '90%'], []);

  // Callbacks
  const handleSheetChanges = useCallback((index: number) => {
    console.log('Sheet index changed to:', index);
    setCurrentSnapPoint(index);
    setIsExpanded(index === 1);
    
    // Reset scroll view when returning to resting state
    if (index === 0 && contentScrollRef.current) {
      contentScrollRef.current.scrollTo({ y: 0, animated: true });
    }
  }, []);

  // Handle scroll attempt in collapsed state
  const handleScrollAttempt = useCallback(() => {
    if (currentSnapPoint === 0 && !isExpanded) {
      // Expand to full height when user tries to scroll in collapsed state
      bottomSheetRef.current?.snapToIndex(1);
    }
  }, [currentSnapPoint, isExpanded]);

  // Handle search icon press
  const handleSearchPress = useCallback(() => {
    setIsSearchMode(true);
    setSearchQuery('');
    // Expand to full height to accommodate keyboard
    bottomSheetRef.current?.snapToIndex(1);
    // Focus the search input after a short delay to ensure it's rendered
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  }, []);

  // Handle search submit
  const handleSearchSubmit = useCallback((query: string) => {
    if (query.trim()) {
      onSearchSubmit?.(query.trim());
      setIsSearchMode(false);
      setSearchQuery('');
    }
  }, [onSearchSubmit]);

  // Handle search cancel
  const handleSearchCancel = useCallback(() => {
    setIsSearchMode(false);
    setSearchQuery('');
    searchInputRef.current?.blur();
  }, []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.3}
      />
    ),
    []
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
            
            {/* Search Results Placeholder */}
            <View style={styles.searchResultsContainer}>
              <View style={styles.mascotContainer}>
                <Mascot emotion="excited" size={120} />
              </View>
              <Text style={styles.searchResultsText}>
                {searchQuery.trim() ? 'Search results will appear here...' : `Start typing to search ${kitchenName}`}
              </Text>
            </View>
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
              onHeartPress={onHeartPress}
              onSearchPress={handleSearchPress}
            />
            
            {/* Content */}
            <KitchenBottomSheetContent 
              ref={contentScrollRef}
              isExpanded={isExpanded}
              onScrollAttempt={handleScrollAttempt}
              deliveryTime={deliveryTime}
            />
          </>
        )}
        
        {/* Cart Button */}
        <CartButton
          quantity={cartItems}
          onPress={onCartPress || (() => {})}
          variant="view"
          position="absolute"
          showIcon={true}
        />
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
    backgroundColor: '#02120A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
    padding: 20,
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
}); 