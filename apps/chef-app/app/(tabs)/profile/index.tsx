import { ContentGrid, ContentItem } from '@/components/ContentGrid';
import { ContentTabs, ContentTabType } from '@/components/ContentTabs';
import { ProfileHeader } from '@/components/ProfileHeader';
import { ProfileMenu } from '@/components/ProfileMenu';
import { CameraModalScreen } from '@/components/ui/CameraModalScreen';
import { CreateMealModal } from '@/components/ui/CreateMealModal';
import { CreateRecipeModal } from '@/components/ui/CreateRecipeModal';
import { FloatingActionButton } from '@/components/ui/FloatingActionButton';
import { useChefAuth } from '@/contexts/ChefAuthContext';
import { api } from '@/convex/_generated/api';
import { useToast } from '@/lib/ToastContext';
import { useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { CheckCircle, Circle } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Image, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChefProfileScreen() {
  const { chef, sessionToken } = useChefAuth();
  const router = useRouter();
  const { showSuccess } = useToast();
  const [activeTab, setActiveTab] = useState<ContentTabType>('all');
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [autoShowLiveStreamSetup, setAutoShowLiveStreamSetup] = useState(false);
  const [isRecipeModalVisible, setIsRecipeModalVisible] = useState(false);
  const [isMealModalVisible, setIsMealModalVisible] = useState(false);
  const [isStoryModalVisible, setIsStoryModalVisible] = useState(false);

  // Get all chef content
  const contentData = useQuery(
    api.queries.chefs.getAllChefContent,
    chef?._id && sessionToken
      ? {
        chefId: chef._id,
        sessionToken,
        limit: 100,
      }
      : 'skip'
  );

  // Get reviews count for chef (from meals reviews)
  const reviewsCount = useMemo(() => {
    // For now, we'll use a placeholder - in a real implementation,
    // you'd query reviews filtered by chef_id
    // This would require a new query or using existing analytics
    return undefined; // Will be implemented when review query is available
  }, []);

  // Get kitchen ID for chef
  const kitchenId = useQuery(
    api.queries.kitchens.getKitchenByChefId,
    chef?._id
      ? { chefId: chef._id }
      : 'skip'
  );

  // Get kitchen details to get kitchen name
  const kitchenDetails = useQuery(
    api.queries.kitchens.getKitchenDetails,
    kitchenId
      ? { kitchenId }
      : 'skip'
  );

  // Get kitchen name from kitchen details or onboarding draft
  const kitchenName = useMemo(() => {
    if (kitchenDetails?.kitchenName) {
      return kitchenDetails.kitchenName;
    }
    // Fallback to onboarding draft kitchen name
    if (chef?.onboardingDraft?.kitchenName) {
      return chef.onboardingDraft.kitchenName;
    }
    return undefined;
  }, [kitchenDetails, chef?.onboardingDraft]);

  // Get likes count for chef
  const likesCount = useQuery(
    api.queries.userFavorites.getChefLikesCount,
    chef?._id ? { chefId: chef._id } : 'skip'
  );

  // Get completed orders count (servings) for chef
  const servingsCount = useQuery(
    api.queries.orders.getChefCompletedOrdersCount,
    chef?._id && sessionToken
      ? { chefId: chef._id.toString(), sessionToken }
      : chef?._id
        ? { chefId: chef._id.toString() }
        : 'skip'
  );

  // Get the last livestream (most recent one)
  const lastLiveSession = useMemo(() => {
    if (!contentData || !contentData.liveSessions || contentData.liveSessions.length === 0) {
      return null;
    }
    // Sort by creation time (newest first) and get the first one
    const sorted = [...contentData.liveSessions].sort((a, b) => b.createdAt - a.createdAt);
    return sorted[0];
  }, [contentData]);

  // Transform content data into ContentItem format
  const allContentItems = useMemo(() => {
    if (!contentData) return [];

    const items: ContentItem[] = [];

    // Add recipes
    contentData.recipes.forEach((recipe: any) => {
      items.push({
        id: recipe.id,
        type: 'recipe',
        title: recipe.title,
        thumbnail: recipe.thumbnail,
        createdAt: recipe.createdAt,
      });
    });

    // Don't add live sessions to the grid - we'll show them separately
    // Only add the last one if not on 'live' tab
    if (activeTab !== 'live') {
      if (lastLiveSession) {
        items.push({
          id: lastLiveSession.id,
          type: 'live',
          title: lastLiveSession.title,
          thumbnail: lastLiveSession.thumbnail,
          createdAt: lastLiveSession.createdAt,
        });
      }
    }

    // Add videos
    contentData.videos.forEach((video: any) => {
      items.push({
        id: video.id,
        type: 'video',
        title: video.title,
        thumbnail: video.thumbnail,
        duration: video.duration,
        views: video.views,
        createdAt: video.createdAt,
      });
    });

    // Add meals
    contentData.meals.forEach((meal: any) => {
      items.push({
        id: meal.id,
        type: 'meal',
        title: meal.title,
        thumbnail: meal.thumbnail,
        createdAt: meal.createdAt,
      });
    });

    // Sort by creation time (newest first)
    return items.sort((a, b) => b.createdAt - a.createdAt);
  }, [contentData, activeTab, lastLiveSession]);

  // Filter content by active tab
  const filteredContent = useMemo(() => {
    if (activeTab === 'all') {
      return allContentItems;
    }
    return allContentItems.filter((item) => {
      switch (activeTab) {
        case 'recipes':
          return item.type === 'recipe';
        case 'live':
          // Don't show live items in grid when on live tab - we show them separately
          return false;
        case 'videos':
          return item.type === 'video';
        case 'meals':
          return item.type === 'meal';
        default:
          return true;
      }
    });
  }, [allContentItems, activeTab]);

  const handleItemPress = (item: ContentItem) => {
    // Navigate to appropriate detail screen based on content type
    switch (item.type) {
      case 'recipe':
        router.push(`/(tabs)/chef/content/recipes/${item.id}`);
        break;
      case 'live':
        // Live sessions are managed through the camera, no detail screen needed
        setAutoShowLiveStreamSetup(true);
        setIsCameraVisible(true);
        break;
      case 'video':
        router.push(`/(tabs)/chef/content/videos/${item.id}` as any);
        break;
      case 'meal':
        router.push(`/(tabs)/chef/meals/${item.id}` as any);
        break;
    }
  };

  const handleContinueStream = () => {
    if (lastLiveSession) {
      // Navigate to the live stream screen with the session ID
      router.push(`/(tabs)/chef/live/${lastLiveSession.id}`);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // The queries will automatically refresh
    setTimeout(() => setRefreshing(false), 1000);
  };


  if (!chef) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const stats = {
    likes: likesCount ?? 0,
    servings: servingsCount ?? 0,
  };

  // Generate handle from name (lowercase, replace spaces with underscores)
  const handle = chef.name?.toLowerCase().replace(/\s+/g, '_') || 'chef';

  const isVerified = chef.verificationStatus === 'verified';
  const rating = chef.rating || 0;

  // Calculate profile completion
  const profileCompletion = useMemo(() => {
    const fields = {
      name: !!chef.name,
      bio: !!chef.bio && chef.bio.length > 0,
      specialties: !!chef.specialties && chef.specialties.length > 0,
      location: !!chef.location?.city,
      profileImage: !!(chef.image || chef.profileImage),
    };

    const completedCount = Object.values(fields).filter(Boolean).length;
    const totalFields = Object.keys(fields).length;
    const percentage = Math.round((completedCount / totalFields) * 100);

    return {
      percentage,
      completedCount,
      totalFields,
      fields,
    };
  }, [chef]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Profile Completion Indicator */}
        {profileCompletion.percentage < 100 && (
          <View style={styles.completionCard}>
            <View style={styles.completionHeader}>
              <Text style={styles.completionTitle}>Profile Completion</Text>
              <Text style={styles.completionPercentage}>{profileCompletion.percentage}%</Text>
            </View>
            <View style={styles.completionBar}>
              <View
                style={[
                  styles.completionBarFill,
                  { width: `${profileCompletion.percentage}%` }
                ]}
              />
            </View>
            <View style={styles.completionFields}>
              {Object.entries(profileCompletion.fields).map(([key, completed]) => (
                <View key={key} style={styles.completionField}>
                  {completed ? (
                    <CheckCircle size={16} color="#10B981" />
                  ) : (
                    <Circle size={16} color="#9CA3AF" />
                  )}
                  <Text style={[
                    styles.completionFieldText,
                    !completed && styles.completionFieldTextIncomplete
                  ]}>
                    {key === 'name' ? 'Name' :
                      key === 'bio' ? 'Bio' :
                        key === 'specialties' ? 'Specialties' :
                          key === 'location' ? 'Location' :
                            key === 'profileImage' ? 'Profile Image' : key}
                  </Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={styles.editProfileButton}
              onPress={() => router.push('/personal-info')}
            >
              <Text style={styles.editProfileButtonText}>Complete Profile</Text>
            </TouchableOpacity>
          </View>
        )}

        <ProfileHeader
          name={chef.name || 'Chef'}
          handle={handle}
          profileImage={chef.image || chef.profileImage}
          kitchenName={kitchenName}
          stats={stats}
          rating={rating}
          reviewCount={reviewsCount}
          isVerified={isVerified}
          specialties={chef.specialties}
          fsaRating={chef.fsaRating}
          onMenu={() => setIsMenuVisible(true)}
        />

        <ContentTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          counts={
            contentData
              ? {
                all: allContentItems.length,
                recipes: contentData.stats.recipes,
                live: contentData.stats.liveSessions,
                videos: contentData.stats.videos,
                meals: contentData.stats.meals,
              }
              : undefined
          }
        />

        {contentData === undefined ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#065f46" />
            <Text style={styles.loadingText}>Loading content...</Text>
          </View>
        ) : activeTab === 'live' ? (
          // Show last livestream with continue button when on live tab
          lastLiveSession ? (
            <View style={styles.lastLiveContainer}>
              <TouchableOpacity
                style={styles.lastLiveCard}
                onPress={handleContinueStream}
                activeOpacity={0.8}
              >
                <View style={styles.lastLiveThumbnailContainer}>
                  {lastLiveSession.thumbnail ? (
                    <Image
                      source={{ uri: lastLiveSession.thumbnail }}
                      style={styles.lastLiveThumbnail}
                    />
                  ) : (
                    <View style={styles.lastLivePlaceholder}>
                      <Text style={styles.lastLivePlaceholderText}>
                        {lastLiveSession.title?.charAt(0).toUpperCase() || 'L'}
                      </Text>
                    </View>
                  )}
                  <View style={styles.lastLiveBadge}>
                    <View style={styles.lastLiveDot} />
                    <Text style={styles.lastLiveBadgeText}>LIVE</Text>
                  </View>
                </View>
                <View style={styles.lastLiveContent}>
                  <Text style={styles.lastLiveTitle} numberOfLines={2}>
                    {lastLiveSession.title || 'Untitled Stream'}
                  </Text>
                  <TouchableOpacity
                    style={styles.continueButton}
                    onPress={handleContinueStream}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.continueButtonText}>Continue Stream</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>No Live Streams Yet</Text>
              <Text style={styles.emptyStateText}>
                Start your first live stream to connect with your audience!
              </Text>
              <TouchableOpacity
                style={styles.startStreamButton}
                onPress={() => {
                  setAutoShowLiveStreamSetup(true);
                  setIsCameraVisible(true);
                }}
              >
                <Text style={styles.startStreamButtonText}>Start Live Stream</Text>
              </TouchableOpacity>
            </View>
          )
        ) : filteredContent.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No Content Yet</Text>
            <Text style={styles.emptyStateText}>
              {activeTab === 'all'
                ? 'Start creating recipes, videos, live sessions, or meals to see them here!'
                : `You haven't created any ${activeTab} yet.`}
            </Text>
          </View>
        ) : (
          <ContentGrid items={filteredContent} onItemPress={handleItemPress} />
        )}
      </ScrollView>

      <ProfileMenu
        isVisible={isMenuVisible}
        onClose={() => setIsMenuVisible(false)}
        onEditProfile={() => router.push('/personal-info')}
        onAccountSettings={() => router.push('/account-details')}
        onPayoutSettings={() => router.push('/payout-settings')}
        onViewEarnings={() => router.push('/(tabs)/earnings')}
      />

      {/* Camera Modal for Live Streaming */}
      <Modal
        visible={isCameraVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => {
          setIsCameraVisible(false);
          setAutoShowLiveStreamSetup(false);
        }}
        statusBarTranslucent={true}
        hardwareAccelerated={true}
      >
        <CameraModalScreen
          onClose={() => {
            setIsCameraVisible(false);
            setAutoShowLiveStreamSetup(false);
          }}
          onStartLiveStream={(sessionId) => {
            setIsCameraVisible(false);
            setAutoShowLiveStreamSetup(false);
            showSuccess('Live Session Started', 'Your live session has been created successfully!');
          }}
          autoShowLiveStreamSetup={autoShowLiveStreamSetup}
        />
      </Modal>

      {/* Recipe Creation Modal */}
      <CreateRecipeModal
        isVisible={isRecipeModalVisible}
        onClose={() => setIsRecipeModalVisible(false)}
      />

      {/* Meal Creation Modal */}
      <CreateMealModal
        isVisible={isMealModalVisible}
        onClose={() => setIsMealModalVisible(false)}
      />

      {/* Floating Action Button */}
      <FloatingActionButton
        bottomPosition={2}
        onCameraPress={() => {
          setAutoShowLiveStreamSetup(false);
          setIsCameraVisible(true);
        }}
        onRecipePress={() => {
          setIsRecipeModalVisible(true);
        }}
        onLiveStreamPress={() => {
          setAutoShowLiveStreamSetup(true);
          setIsCameraVisible(true);
        }}
        onStoryPress={() => {
          setIsStoryModalVisible(true);
        }}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFFFA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Archivo',
    color: '#065f46',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter',
    textAlign: 'center',
    lineHeight: 20,
  },
  completionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  completionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter',
  },
  completionPercentage: {
    fontSize: 16,
    fontWeight: '700',
    color: '#094327',
    fontFamily: 'Inter',
  },
  completionBar: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  completionBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  completionFields: {
    gap: 8,
    marginBottom: 12,
  },
  completionField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  completionFieldText: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'Inter',
  },
  completionFieldTextIncomplete: {
    color: '#9CA3AF',
  },
  editProfileButton: {
    backgroundColor: '#094327',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  editProfileButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  lastLiveContainer: {
    padding: 16,
  },
  lastLiveCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  lastLiveThumbnailContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    position: 'relative',
    backgroundColor: '#F5F5F5',
  },
  lastLiveThumbnail: {
    width: '100%',
    height: '100%',
  },
  lastLivePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lastLivePlaceholderText: {
    fontSize: 48,
    fontWeight: '600',
    color: '#999',
  },
  lastLiveBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF0000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  lastLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    marginRight: 4,
  },
  lastLiveBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  lastLiveContent: {
    padding: 16,
  },
  lastLiveTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter',
    marginBottom: 12,
  },
  continueButton: {
    backgroundColor: '#094327',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  startStreamButton: {
    backgroundColor: '#094327',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 16,
  },
  startStreamButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
});
