import React, { useState } from 'react';
import { Image, ImageBackground, StyleSheet, Text, View } from 'react-native';
import OnTheStoveBottomSheet from '../OnTheStoveBottomSheet';
import { CribnoshLiveHeader } from './CribnoshLiveHeader';
import LoveThisButton from './LoveThisButton';

const LiveScreenView: React.FC = () => {
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
    ingredients: ['Premium Basmati Rice', 'Fresh Tomatoes', 'Bell Peppers', 'Red Onions', 'Secret Spice Blend'],
    cookingTime: '25 minutes',
    chefBio: 'Chef Minnie brings 15+ years of authentic Nigerian cooking experience. Every dish tells a story of tradition and love.',
    liveViewers: 127,
  };
  const safeMealData = mealData ?? mealData;

  return (
   <ImageBackground
      source={require('../../assets/images/KitchenLive-01.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <View>
        <CribnoshLiveHeader
          avatarSource={'https://fhfhfhhf'}
          kitchenTitle="Mimi"
          viewers={303}
          onCancel={() => {}}
        />
      </View>
        {/* 🔥 Fixed Love Button */}
        <LoveThisButton style={styles.loveButton} />

      <OnTheStoveBottomSheet
        isVisible={true}
        onToggleVisibility={toggleBottomSheet}
        onShareLive={handleShareLive}
        onTreatSomeone={handleTreatSomeone}
        // mealData={safeMealData}
      />
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  
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
   loveButton: {
    position: 'absolute',
    top: 255,   // stays pinned at the top
    left: 20,
    right: 20,
    zIndex: 10,
  },
});

export default LiveScreenView;
