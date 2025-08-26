import React, { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

const OnTheStoveExample: React.FC = () => {
  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);

  const toggleBottomSheet = () => {
    setIsBottomSheetVisible(!isBottomSheetVisible);
  };

  const handleShareLive = () => {
    console.log('Share live pressed');
    // Add your share functionality here
  };

  const handleTreatSomeone = () => {
    console.log('Treat someone pressed');
    // Add your treat someone functionality here
  };

  const mealData = {
    title: 'Nigerian Jollof',
    price: '£ 16',
    imageSource: require('../../assets/images/cribnoshpackaging.png'),
    description: 'Watch Chef Minnie craft authentic Nigerian Jollof Rice live! Fresh tomatoes, aromatic spices, and perfectly seasoned rice - order now before it\'s ready.',
    kitchenName: 'Minnies Kitchen',
  };

  return (
    <View style={styles.container}>
      {/* Background image that covers the whole screen */}
      <Image
        source={require('../../assets/images/KitchenLive-01.png')}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          position: 'absolute',
          top: 0,
        }}
        resizeMode="cover"
        
      />

      {/* Toggle Button */}
      {/* <Pressable style={styles.toggleButton} onPress={toggleBottomSheet}>
        <Text style={styles.toggleButtonText}>
          {isBottomSheetVisible ? 'Hide' : 'Show'} On The Stove
        </Text>
      </Pressable> */}

      {/* OnTheStove Bottom Sheet */}
      {/* <OnTheStoveBottomSheet
        isVisible={isBottomSheetVisible}
        onToggleVisibility={toggleBottomSheet}
        onShareLive={handleShareLive}
        onTreatSomeone={handleTreatSomeone}
        mealData={mealData}
      /> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'red',
  },
  toggleButton: {
    backgroundColor: '#094327',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  toggleButtonText: {
    color: '#E6FFE8',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OnTheStoveExample;
