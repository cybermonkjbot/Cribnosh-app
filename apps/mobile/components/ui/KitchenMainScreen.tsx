import { useChefs } from '@/hooks/useChefs';
import { useTopPosition } from '@/utils/positioning';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Circle, Path, Svg } from 'react-native-svg';
import { Mascot } from '../Mascot';
import { BackgroundElements } from './KitchenMainScreen/BackgroundElements';
import { FoodIllustrations } from './KitchenMainScreen/FoodIllustrations';
import { KitchenBottomSheet } from './KitchenMainScreen/KitchenBottomSheet';
import { KitchenIntroCard } from './KitchenMainScreen/KitchenIntroCard';

const { width, height } = Dimensions.get('window');

interface KitchenMainScreenProps {
  kitchenName?: string;
  cuisine?: string;
  rating?: string;
  deliveryTime?: string;
  cartItems?: number;
  distance?: string;
  kitchenId?: string;
  foodcreatorId?: string;
  onCartPress?: () => void;
  onHeartPress?: () => void;
  onSearchPress?: () => void;
  onClose?: () => void;
  onMealPress?: (meal: any) => void;
}

export const KitchenMainScreen: React.FC<KitchenMainScreenProps> = ({
  kitchenName: propKitchenName,
  cuisine = "Nigerian",
  deliveryTime = "30-45 Mins",
  cartItems = 2,
  distance = "0.8 km",
  kitchenId,
  foodcreatorId,
  onCartPress,
  onHeartPress,
  onSearchPress,
  onClose,
  onMealPress,
}) => {
  const router = useRouter();
  const topPosition = useTopPosition(20);
  const playIconScale = useSharedValue(1);
  const { getKitchenDetails, getKitchenFeaturedVideo } = useChefs();
  const [kitchenDetails, setKitchenDetails] = useState<any>(null);
  const [featuredVideoData, setFeaturedVideoData] = useState<any>(null);
  const [isLoadingKitchenDetails, setIsLoadingKitchenDetails] = useState(false);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);

  // Fetch kitchen details if kitchenId is provided
  useEffect(() => {
    if (kitchenId) {
      const loadKitchenDetails = async () => {
        setIsLoadingKitchenDetails(true);
        try {
          const details = await getKitchenDetails(kitchenId);
          if (details) {
            setKitchenDetails({ data: details });
          }
        } catch (error) {
          // Error already handled in hook
        } finally {
          setIsLoadingKitchenDetails(false);
        }
      };
      loadKitchenDetails();
    }
  }, [kitchenId, getKitchenDetails]);

  // Fetch featured video if kitchenId is available
  useEffect(() => {
    if (kitchenId) {
      const loadFeaturedVideo = async () => {
        setIsLoadingVideo(true);
        try {
          const video = await getKitchenFeaturedVideo(kitchenId);
          if (video) {
            setFeaturedVideoData({ data: video });
          }
        } catch (error) {
          // Error already handled in hook
        } finally {
          setIsLoadingVideo(false);
        }
      };
      loadFeaturedVideo();
    }
  }, [kitchenId, getKitchenFeaturedVideo]);

  // Extract kitchen name from API response
  const apiKitchenName = kitchenDetails?.data?.kitchenName;

  // Use fetched kitchen name from API
  // If kitchenId is provided, always prioritize API data over prop
  // Never use "Amara's Kitchen" prop when we have a kitchenId
  const isDemoName = propKitchenName === "Amara's Kitchen";
  const kitchenName = kitchenId 
    ? (apiKitchenName || (!isDemoName && propKitchenName) || (isLoadingKitchenDetails ? undefined : "Kitchen"))
    : (propKitchenName || "Amara's Kitchen");

  // Continuous play icon animation
  useEffect(() => {
    // Start repeating animation: scale from 1 to 1.1 and back
    playIconScale.value = withRepeat(
      withTiming(1.1, { duration: 1500 }),
      -1, // infinite repeat
      true // reverse: scale back from 1.1 to 1
    );
  }, [playIconScale]);

  const playIconAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: playIconScale.value }],
    };
  });

  const handlePlayPress = () => {
    console.log('Play button pressed', {
      kitchenId,
      foodcreatorId,
      isLoadingVideo,
      hasVideoData: !!featuredVideoData,
      videoData: featuredVideoData,
      videoError,
    });

    if (!kitchenId || !foodcreatorId) {
      console.warn('Kitchen ID or Food Creator ID missing', { kitchenId, foodcreatorId });
      return;
    }

    // The API response structure from ResponseFactory.success():
    // { success: true, data: { _id: ..., ... }, message: "..." }
    // RTK Query wraps this as: { data: { success: true, data: {...}, message: "..." } }
    // So we need to access: featuredVideoData?.data?.data?._id
    // However, some endpoints might unwrap automatically, so check both paths
    const videoData = featuredVideoData?.data?.data || featuredVideoData?.data;
    const videoId = videoData?._id;

    console.log('Video data extraction:', {
      rawData: featuredVideoData,
      dataPath1: featuredVideoData?.data,
      dataPath2: featuredVideoData?.data?.data,
      videoData,
      videoId,
    });

    if (videoId) {
      console.log('Navigating to video page:', {
        pathname: '/foodcreator/[foodcreatorId]/kitchen/[kitchenId]/video/[videoId]',
        params: {
          foodcreatorId,
          kitchenId,
          videoId,
        },
      });
      
      try {
        router.push({
          pathname: '/foodcreator/[foodcreatorId]/kitchen/[kitchenId]/video/[videoId]',
          params: {
            foodcreatorId: String(foodcreatorId),
            kitchenId: String(kitchenId),
            videoId: String(videoId),
          },
        });
        console.log('Navigation triggered successfully');
      } catch (error) {
        console.error('Navigation error:', error);
      }
    } else if (videoError) {
      console.error('Error loading featured video:', videoError);
      // Could show an error toast here
    } else if (!isLoadingVideo) {
      // Video not found or not available
      console.warn('Featured video not available for this kitchen', {
        featuredVideoData,
        videoData,
        checkedPaths: {
          path1: featuredVideoData?.data?._id,
          path2: featuredVideoData?.data?.data?._id,
        },
      });
    } else {
      console.log('Still loading video data...');
    }
  };

  return (
    <View style={styles.container}>
      {/* Background with blur */}
      <View style={styles.background}>
        <BackgroundElements />
        <FoodIllustrations />
        
        {/* Blur overlay */}
        <BlurView intensity={82.5} tint="light" style={styles.blurOverlay} />
      </View>

      {/* Header Container with Kitchen Info Card and Close Button */}
      <View style={[styles.headerContainer, { top: topPosition }]}>
        {/* Kitchen Intro Card */}
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 16, 
          paddingHorizontal: 16 
        }}>
          <KitchenIntroCard 
            kitchenName={kitchenName}
            cuisine={cuisine}
          />
        </View>

        {/* Close button */}
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={onClose} 
          activeOpacity={0.8}
        >
          <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
            <Path
              d="M15 5L5 15M5 5L15 15"
              stroke="#4C3F59"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet */}
      <KitchenBottomSheet
        deliveryTime={deliveryTime}
        cartItems={cartItems}
        kitchenName={kitchenName}
        distance={distance}
        kitchenId={kitchenId}
        onCartPress={onCartPress}
        onHeartPress={onHeartPress}
        onSearchSubmit={(query) => console.log('Search submitted:', query)}
        onMealPress={onMealPress}
      />

      {/* Floating Play Button */}
      <TouchableOpacity 
        style={styles.floatingPlayButton} 
        onPress={handlePlayPress} 
        activeOpacity={0.8}
        disabled={
          isLoadingVideo || 
          !kitchenId || 
          !foodcreatorId || 
          !(featuredVideoData?.data?.data?._id || featuredVideoData?.data?._id)
        }
      >
        <BlurView
          intensity={60}
          tint="light"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 50,
          }}
        />
        {isLoadingVideo ? (
          <ActivityIndicator size="small" color="#094327" />
        ) : (
          <Animated.View style={[
            { position: 'absolute' },
            playIconAnimatedStyle
          ]}>
            <Svg width={36} height={36} viewBox="0 0 36 36" fill="none">
              <Circle cx="18" cy="18" r="18" fill="rgba(76, 63, 89, 0.3)" stroke="rgba(255, 255, 255, 0.6)" strokeWidth="1" />
              <Path d="M15 12 L27 18 L15 24 Z" fill="#094327" />
            </Svg>
          </Animated.View>
        )}
      </TouchableOpacity>

      {/* Mascot */}
      <View style={styles.mascotContainer}>
        <Mascot emotion="excited" size={320} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF599',
  },
  background: {
    position: 'absolute',
    width: width,
    height: height,
    left: 0,
    top: 0,
  },
  blurOverlay: {
    position: 'absolute',
    width: width,
    height: height,
    left: 0,
    top: 0,
    backgroundColor: 'rgba(250, 250, 250, 0.75)',
  },
  headerContainer: {
    position: 'absolute',
    width: width,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 100,
  },
  introCardContainer: {
    flex: 1,
    marginRight: 16,
  },
  closeButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  floatingPlayButton: {
    position: 'absolute',
    bottom: height * 0.6,
    right: 20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    zIndex: 9998, // High z-index, but below bottom sheet (9999)
  },
  mascotContainer: {
    position: 'absolute',
    bottom: height * 0.5,
    left: 20,
    zIndex: 50,
  },
});

export default KitchenMainScreen; 