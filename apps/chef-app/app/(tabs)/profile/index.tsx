import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useChefAuth } from '@/contexts/ChefAuthContext';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { ProfileHeader } from '@/components/ProfileHeader';
import { ContentTabs, ContentTabType } from '@/components/ContentTabs';
import { ContentGrid, ContentItem } from '@/components/ContentGrid';
import { ProfileMenu } from '@/components/ProfileMenu';
import { CameraModalScreen } from '@/components/ui/CameraModalScreen';
import { CreateRecipeModal } from '@/components/ui/CreateRecipeModal';
import { CreateMealModal } from '@/components/ui/CreateMealModal';
import { CreateStoryModal } from '@/components/ui/CreateStoryModal';
import { FloatingActionButton } from '@/components/ui/FloatingActionButton';
import { useToast } from '@/lib/ToastContext';
import { Eye, CheckCircle, Circle } from 'lucide-react-native';

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
  const [showPreview, setShowPreview] = useState(false);

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

  // Transform content data into ContentItem format
  const allContentItems = useMemo(() => {
    if (!contentData) return [];

    const items: ContentItem[] = [];

    // Add recipes
    contentData.recipes.forEach((recipe) => {
      items.push({
        id: recipe.id,
        type: 'recipe',
        title: recipe.title,
        thumbnail: recipe.thumbnail,
        createdAt: recipe.createdAt,
      });
    });

    // Add live sessions
    contentData.liveSessions.forEach((session) => {
      items.push({
        id: session.id,
        type: 'live',
        title: session.title,
        thumbnail: session.thumbnail,
        createdAt: session.createdAt,
      });
    });

    // Add videos
    contentData.videos.forEach((video) => {
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
    contentData.meals.forEach((meal) => {
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
  }, [contentData]);

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
          return item.type === 'live';
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
        router.push(`/(tabs)/chef/content/videos/${item.id}`);
        break;
      case 'meal':
        router.push(`/(tabs)/chef/meals/${item.id}`);
        break;
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

        <View style={styles.profileHeaderContainer}>
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
            onMenu={() => setIsMenuVisible(true)}
          />
          <TouchableOpacity
            style={styles.previewButton}
            onPress={() => setShowPreview(true)}
          >
            <Eye size={18} color="#094327" />
            <Text style={styles.previewButtonText}>Preview</Text>
          </TouchableOpacity>
        </View>

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

      {/* Profile Preview Modal */}
      <Modal
        visible={showPreview}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPreview(false)}
      >
        <SafeAreaView style={styles.previewContainer}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle}>Profile Preview</Text>
            <TouchableOpacity onPress={() => setShowPreview(false)}>
              <Text style={styles.previewClose}>Close</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.previewContent}>
            <Text style={styles.previewHint}>
              This is how your profile appears to customers
            </Text>
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
              onMenu={() => {}}
            />
            {chef.bio && (
              <View style={styles.previewSection}>
                <Text style={styles.previewSectionTitle}>About</Text>
                <Text style={styles.previewBio}>{chef.bio}</Text>
              </View>
            )}
            {chef.specialties && chef.specialties.length > 0 && (
              <View style={styles.previewSection}>
                <Text style={styles.previewSectionTitle}>Specialties</Text>
                <View style={styles.previewSpecialties}>
                  {chef.specialties.map((specialty, index) => (
                    <View key={index} style={styles.previewSpecialtyChip}>
                      <Text style={styles.previewSpecialtyText}>{specialty}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            {chef.location?.city && (
              <View style={styles.previewSection}>
                <Text style={styles.previewSectionTitle}>Location</Text>
                <Text style={styles.previewLocation}>{chef.location.city}</Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  profileHeaderContainer: {
    position: 'relative',
  },
  previewButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    zIndex: 10,
  },
  previewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#094327',
    fontFamily: 'Inter',
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
  previewContainer: {
    flex: 1,
    backgroundColor: '#FAFFFA',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter',
  },
  previewClose: {
    fontSize: 16,
    fontWeight: '600',
    color: '#094327',
    fontFamily: 'Inter',
  },
  previewContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  previewHint: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  previewSection: {
    marginTop: 24,
    marginBottom: 16,
  },
  previewSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter',
    marginBottom: 12,
  },
  previewBio: {
    fontSize: 16,
    color: '#374151',
    fontFamily: 'Inter',
    lineHeight: 24,
  },
  previewSpecialties: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  previewSpecialtyChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  previewSpecialtyText: {
    fontSize: 14,
    color: '#094327',
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  previewLocation: {
    fontSize: 16,
    color: '#374151',
    fontFamily: 'Inter',
  },
});
