import BottomSheet, { BottomSheetBackdrop, BottomSheetBackdropProps, BottomSheetView } from '@gorhom/bottom-sheet';
import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Mascot } from '../../Mascot';
import SearchArea from '../../SearchArea';
import { CartButton } from '../CartButton';
import { KitchenBottomSheetContent } from './KitchenBottomSheetContent';
import { KitchenBottomSheetHeader } from './KitchenBottomSheetHeader';

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
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
              onScrollAttempt={() => !isExpanded && bottomSheetRef.current?.snapToIndex(1)}
              deliveryTime={deliveryTime}
            />
          </>
        )}
        
        {/* Cart Button */}
        <CartButton
          quantity={cartItems}
          onPress={onCartPress ?? (() => {})}
          variant="view"
          position="absolute"
          bottom={60}
          left={20}
          right={20}
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