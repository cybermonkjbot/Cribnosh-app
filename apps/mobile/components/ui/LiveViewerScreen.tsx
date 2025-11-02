import { ChevronLeft } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Dimensions, ImageBackground, Modal, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import LiveComments from '../LiveComments';
import OnTheStoveBottomSheet from '../OnTheStoveBottomSheet';
import { CribnoshLiveHeader } from './CribnoshLiveHeader';


interface LiveViewerScreenProps {
  onClose: () => void;
}

const LiveScreenView: React.FC<LiveViewerScreenProps> = ({ onClose }) => {
  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);
  const [isBottomSheetExpanded, setIsBottomSheetExpanded] = useState(false);
  const [currentSnapPoint, setCurrentSnapPoint] = useState(0);
  const [screenHeight, setScreenHeight] = useState(Dimensions.get('window').height);

  // Sample live comments data
  const [liveComments] = useState([
    { name: 'Sarah', comment: 'This looks amazing!' },
    { name: 'Mike', comment: 'Can\'t wait to try this recipe' },
    { name: 'Emma', comment: 'The spices smell incredible!' },
    { name: 'David', comment: 'How long until it\'s ready?' },
    { name: 'Lisa', comment: 'Love watching live cooking' },
    { name: 'John', comment: 'This is my favorite dish!' },
    { name: 'Anna', comment: 'The rice looks perfect' },
    { name: 'Tom', comment: 'Wish I could smell this through the screen' },
  ]);

  // Update screen dimensions on orientation change
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenHeight(window.height);
    });

    return () => subscription?.remove();
  }, []);

  // Debug logging for bottom sheet state changes
  useEffect(() => {
    console.log('LiveViewerScreen state:', {
      isBottomSheetExpanded,
      currentSnapPoint,
      screenHeight
    });
  }, [isBottomSheetExpanded, currentSnapPoint, screenHeight]);

  // Debug logging for component mount/unmount
  useEffect(() => {
    console.log('LiveViewerScreen mounted');
    return () => {
      console.log('LiveViewerScreen unmounted');
    };
  }, []);

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

  const handleClose = () => {
    onClose();
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
    <Modal
      visible={true} // This will be controlled by the parent
      animationType="fade"
      presentationStyle="fullScreen"
      statusBarTranslucent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <StatusBar 
          hidden={true} 
          backgroundColor="transparent"
          translucent={true}
          barStyle="light-content"
        />
        <ImageBackground
          source={require('../../assets/images/KitchenLive-01.png')}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          {/* Back Button and Live Info Header */}
          <View style={styles.headerContainer}>
            <TouchableOpacity onPress={handleClose} style={styles.backButton}>
              <ChevronLeft color="#E6FFE8" size={24} />
            </TouchableOpacity>
            
            {/* Live Header Info */}
            <View style={styles.liveInfoContainer}>
              <CribnoshLiveHeader
                avatarSource={'https://fhfhfhhf'}
                kitchenTitle="Mimi"
                viewers={303}
              />
            </View>
          </View>

          {/* Live Comments - Positioned like TikTok */}
          <View style={styles.commentsContainer}>
            <LiveComments comments={liveComments} />
          </View>

          {/* Love Button is now rendered inside OnTheStoveBottomSheet */}
        </ImageBackground>

        {/* Bottom Sheet - moved outside ImageBackground for better persistence */}
        <OnTheStoveBottomSheet
          isVisible={true}
          onToggleVisibility={toggleBottomSheet}
          onShareLive={handleShareLive}
          onTreatSomeone={handleTreatSomeone}
          onExpandedChange={setIsBottomSheetExpanded}
          onSnapPointChange={setCurrentSnapPoint}
          // mealData={safeMealData}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#02120A',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  headerContainer: {
    paddingHorizontal: 10,
    paddingTop: 50,
    paddingBottom: 16,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(230, 255, 232, 0.1)',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveInfoContainer: {
    flex: 1,
    marginLeft: 16,
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
  commentsContainer: {
    position: 'absolute',
    right: 0,
    left: 0,
    bottom: 200, // Positioned above the bottom sheet
    paddingHorizontal: 16,
    zIndex: 500,
    maxHeight: 300,
  },
});

export default LiveScreenView;
