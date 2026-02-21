import { useFollowCreator } from '@/hooks/useFollowCreator';
import { useFoodCreators } from '@/hooks/useFoodCreators';
import { useTopPosition } from '@/utils/positioning';
import { BlurView } from 'expo-blur';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Circle, Path, Svg } from 'react-native-svg';
import { Mascot } from '../Mascot';
import { AIChatDrawer } from './AIChatDrawer';
import { BackgroundElements } from './FoodCreatorScreen/BackgroundElements';
import { FoodCreatorBottomSheet } from './FoodCreatorScreen/FoodCreatorBottomSheet';
import { FoodCreatorIntroCard } from './FoodCreatorScreen/FoodCreatorIntroCard';
import { GeneratingSuggestionsLoader } from './GeneratingSuggestionsLoader';
import { NoshHeavenPlayer } from './NoshHeavenPlayer';

const { width, height } = Dimensions.get('window');

interface FoodCreatorScreenProps {
  foodCreatorName?: string;
  cuisine?: string;
  rating?: string;
  deliveryTime?: string;
  cartItems?: number;
  distance?: string;
  foodCreatorId?: string;
  foodcreatorId?: string;
  onCartPress?: () => void;
  onHeartPress?: () => void;
  onSearchPress?: () => void;
  onClose?: () => void;
  onMealPress?: (meal: any) => void;
}

export const FoodCreatorScreen: React.FC<FoodCreatorScreenProps> = ({
  foodCreatorName: propFoodCreatorName,
  cuisine = "Nigerian",
  deliveryTime = "30-45 Mins",
  cartItems: initialCartItems = 2,
  distance = "0.8 km",
  foodCreatorId,
  foodcreatorId,
  onCartPress,
  onHeartPress,
  onSearchPress,
  onClose,
  onMealPress,
}) => {
  const topPosition = useTopPosition(20);
  const playIconScale = useSharedValue(1);
  const { getFoodCreatorDetails, getFoodCreatorFeaturedVideo } = useFoodCreators();
  const [foodCreatorDetails, setFoodCreatorDetails] = useState<any>(null);
  const [featuredVideoData, setFeaturedVideoData] = useState<any>(null);
  const [isLoadingFoodCreatorDetails, setIsLoadingFoodCreatorDetails] = useState(false);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);
  const [cartItems, setCartItems] = useState(initialCartItems);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);

  // Derive the creator's user ID from foodCreator details (for follow/unfollow)
  const creatorUserId = foodCreatorDetails?.data?.userId as string | undefined;
  const { isFollowing, followerCount, loading: followLoading, toggle: toggleFollow } = useFollowCreator({ creatorUserId });

  const handleOpenAIChat = () => {
    setIsGeneratingSuggestions(true);
  };

  const handleCloseAIChat = () => {
    setIsChatVisible(false);
  };

  const handleGeneratingSuggestionsComplete = () => {
    setIsChatVisible(true);
    setIsGeneratingSuggestions(false);
  };

  // Fetch foodCreator details if foodCreatorId is provided
  useEffect(() => {
    if (foodCreatorId) {
      const loadFoodCreatorDetails = async () => {
        setIsLoadingFoodCreatorDetails(true);
        try {
          const details = await getFoodCreatorDetails(foodCreatorId);
          if (details) {
            setFoodCreatorDetails({ data: details });
          }
        } catch {
          // Error already handled in hook
        } finally {
          setIsLoadingFoodCreatorDetails(false);
        }
      };
      loadFoodCreatorDetails();
    }
  }, [foodCreatorId, getFoodCreatorDetails]);

  // Fetch featured video if foodCreatorId is available
  useEffect(() => {
    if (foodCreatorId) {
      const loadFeaturedVideo = async () => {
        setIsLoadingVideo(true);
        try {
          const video = await getFoodCreatorFeaturedVideo(foodCreatorId);
          if (video) {
            setFeaturedVideoData({ data: video });
          }
        } catch {
          // Error already handled in hook
        } finally {
          setIsLoadingVideo(false);
        }
      };
      loadFeaturedVideo();
    }
  }, [foodCreatorId, getFoodCreatorFeaturedVideo]);

  // Extract foodCreator name from API response
  const apiFoodCreatorName = foodCreatorDetails?.data?.foodCreatorName;

  // Use fetched foodCreator name from API
  // If foodCreatorId is provided, always prioritize API data over prop
  // Never use "Amara's Food Creator" prop when we have a foodCreatorId
  const isDemoName = propFoodCreatorName === "Amara's Food Creator";
  const foodCreatorName = foodCreatorId
    ? (apiFoodCreatorName || (!isDemoName && propFoodCreatorName) || (isLoadingFoodCreatorDetails ? undefined : "Food Creator"))
    : (propFoodCreatorName || "Amara's Food Creator");

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

  // Transform featured video data to foodCreatorIntroVideo format
  const foodCreatorIntroVideo = useMemo(() => {
    const videoData = featuredVideoData?.data?.data || featuredVideoData?.data;
    if (!videoData || !videoData.videoUrl) {
      return null;
    }

    return {
      id: videoData._id || videoData.id || 'foodCreator-intro',
      videoSource: videoData.videoUrl,
      title: videoData.title || foodCreatorName || 'FoodCreator Story',
      description: videoData.description || undefined,
      foodCreatorName: foodCreatorName || 'Food Creator',
      foodCreator: videoData.creator?.name || videoData.foodCreator?.name || videoData.foodCreator?.name || undefined,
    };
  }, [featuredVideoData, foodCreatorName]);

  const handlePlayPress = () => {
    if (isLoadingVideo) {
      return;
    }

    if (!foodCreatorIntroVideo) {
      console.warn('Featured video not available for this foodCreator');
      return;
    }

    setIsPlayerVisible(true);
  };

  const handleClosePlayer = () => {
    setIsPlayerVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Background with blur */}
      <View style={styles.background}>
        <BackgroundElements />

        {/* Blur overlay */}
        <BlurView intensity={82.5} tint="light" style={styles.blurOverlay} />
      </View>

      {/* Header Container with FoodCreator Info Card, Follow Button, and Close Button */}
      <View style={[styles.headerContainer, { top: topPosition }]}>
        {/* FoodCreator Intro Card */}
        <View style={styles.introCardWrapper}>
          <FoodCreatorIntroCard
            foodCreatorName={foodCreatorName}
            cuisine={cuisine}
          />
        </View>

        {/* Follow Button — only shown when creator userId is known */}
        {creatorUserId ? (
          <TouchableOpacity
            style={[
              styles.followButton,
              isFollowing ? styles.followButtonActive : styles.followButtonInactive,
            ]}
            onPress={toggleFollow}
            activeOpacity={0.8}
            disabled={followLoading}
          >
            {followLoading ? (
              <ActivityIndicator size="small" color={isFollowing ? '#fff' : '#4C3F59'} />
            ) : (
              <Text style={[styles.followButtonText, isFollowing ? styles.followButtonTextActive : styles.followButtonTextInactive]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            )}
            {followerCount > 0 && (
              <Text style={[styles.followerCount, isFollowing ? styles.followerCountActive : styles.followerCountInactive]}>
                {followerCount >= 1000 ? `${(followerCount / 1000).toFixed(1)}k` : followerCount}
              </Text>
            )}
          </TouchableOpacity>
        ) : null}

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

      {/* Floating Play Button - Render before bottom sheet to ensure proper z-index */}
      <TouchableOpacity
        style={styles.floatingPlayButton}
        onPress={handlePlayPress}
        activeOpacity={0.8}
        disabled={
          isLoadingVideo ||
          !foodCreatorId ||
          !foodcreatorId ||
          !(featuredVideoData?.data?.data?._id || featuredVideoData?.data?._id)
        }
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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

      {/* Bottom Sheet */}
      <FoodCreatorBottomSheet
        deliveryTime={deliveryTime}
        cartItems={cartItems}
        foodCreatorName={foodCreatorName}
        distance={distance}
        foodCreatorId={foodCreatorId}
        onCartPress={onCartPress}
        onHeartPress={onHeartPress}
        onSearchSubmit={(query) => console.log('Search submitted:', query)}
        onMealPress={onMealPress}
        onCartCountChange={(count) => setCartItems(count)}
        onOpenAIChat={handleOpenAIChat}
      />

      {/* AI Chat Components */}
      <GeneratingSuggestionsLoader
        isVisible={isGeneratingSuggestions}
        onComplete={handleGeneratingSuggestionsComplete}
      />
      <AIChatDrawer isVisible={isChatVisible} onClose={handleCloseAIChat} />

      {/* Mascot */}
      <View style={styles.mascotContainer}>
        <Mascot emotion="excited" size={320} />
      </View>

      {/* NoshHeaven Player for FoodCreator Intro Video */}
      {foodCreatorIntroVideo && (
        <NoshHeavenPlayer
          isVisible={isPlayerVisible}
          mode="foodCreatorIntro"
          foodCreatorIntroVideo={foodCreatorIntroVideo}
          onClose={handleClosePlayer}
        />
      )}
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
  introCardWrapper: {
    flex: 1,
    marginRight: 12,
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
    alignSelf: 'center',
  },
  followButton: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    alignSelf: 'center',
    minWidth: 76,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  followButtonActive: {
    backgroundColor: '#094327',
  },
  followButtonInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderColor: '#4C3F59',
  },
  followButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  followButtonTextActive: {
    color: '#fff',
  },
  followButtonTextInactive: {
    color: '#4C3F59',
  },
  followerCount: {
    fontSize: 11,
    marginTop: 1,
  },
  followerCountActive: {
    color: 'rgba(255,255,255,0.75)',
  },
  followerCountInactive: {
    color: '#7A6B8A',
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
    zIndex: 100, // Same z-index as cancel button
    pointerEvents: 'auto', // Ensure button can receive touches
  },
  mascotContainer: {
    position: 'absolute',
    bottom: height * 0.5,
    left: 20,
    zIndex: 1, // Lowest z-index, just above background
  },
});

export default FoodCreatorScreen; 