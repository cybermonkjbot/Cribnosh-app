import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import OnTheStoveBottomSheet from '../OnTheStoveBottomSheet';
import { CribnoshLiveHeader } from './CribnoshLiveHeader';

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
      <View>
        <View>
           <CribnoshLiveHeader avatarSource={'https://fhfhfhhf'} kitchenTitle='Mimi' viewers={303} onCancel={() => {}} />
        </View>
        <OnTheStoveBottomSheet
          isVisible={true}
          onToggleVisibility={toggleBottomSheet}
          onShareLive={handleShareLive}
          onTreatSomeone={handleTreatSomeone}
          
          // mealData={safeMealData}
        />     
      </View>

      {/* Toggle Button */}
      {/* <Pressable style={styles.toggleButton} onPress={toggleBottomSheet}>
        <Text style={styles.toggleButtonText}>
          {isBottomSheetVisible ? 'Hide' : 'Show'} On The Stove
        </Text>
      </Pressable> */}

      {/* OnTheStove Bottom Sheet */}
      
    </View>
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
});

export default LiveScreenView;
