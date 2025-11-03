import GroupTotalSpendCard from '@/components/GroupTotalSpendCard';
import { Mascot } from '@/components/Mascot';
import { SwipeButton } from '@/components/SwipeButton';
import { Avatar } from '@/components/ui/Avatar';
import { GroupMealSelection } from '@/components/ui/GroupMealSelection';
import { Input } from '@/components/ui/Input';
import ScatteredGroupMembers from '@/components/ui/ScatteredGroupMembers';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { ChevronLeft, SearchIcon, X } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const avatars = [
    { uri: require('@/assets/images/demo/avatar-1.png') },
    { uri: require('@/assets/images/demo/avatar-2.png') },
    { uri: require('@/assets/images/demo/avatar-3.png') },
    { uri: require('@/assets/images/demo/avatar-4.png') },
    { uri: require('@/assets/images/demo/avatar-5.png') },
]

const groupMembers = [
  { name: 'Fola', avatarUri: require('@/assets/images/demo/avatar-1.png'), top: 0, left: 0, status: 'Contributing £3', isDone: false },
  { name: 'Josh', avatarUri: require('@/assets/images/demo/avatar-2.png'), top: 50, left: 50, status: 'Selecting meal', isDone: true },
  { name: 'Sarah', avatarUri: require('@/assets/images/demo/avatar-3.png'), top: 100, left: 100, status: 'Browsing menu', isDone: false },
  { name: 'Mike', avatarUri: require('@/assets/images/demo/avatar-4.png'), top: 150, left: 150, status: 'Contributing £5', isDone: true },
  { name: 'Emma', avatarUri: require('@/assets/images/demo/avatar-5.png'), top: 200, left: 200, status: 'Adding sides', isDone: false },
  { name: 'Alex', avatarUri: require('@/assets/images/demo/avatar-5.png'), top: 250, left: 250, status: 'Ready to order', isDone: true },
];

// Mock data for users that can be invited
const availableUsers = [
  { id: '1', name: 'Alice Johnson', avatarUri: require('@/assets/images/demo/avatar-1.png'), mutualFriends: 3 },
  { id: '2', name: 'Bob Smith', avatarUri: require('@/assets/images/demo/avatar-2.png'), mutualFriends: 5 },
  { id: '3', name: 'Carol Davis', avatarUri: require('@/assets/images/demo/avatar-3.png'), mutualFriends: 2 },
  { id: '4', name: 'David Wilson', avatarUri: require('@/assets/images/demo/avatar-4.png'), mutualFriends: 7 },
  { id: '5', name: 'Eva Brown', avatarUri: require('@/assets/images/demo/avatar-5.png'), mutualFriends: 4 },
  { id: '6', name: 'Frank Miller', avatarUri: require('@/assets/images/demo/avatar-1.png'), mutualFriends: 1 },
  { id: '7', name: 'Grace Lee', avatarUri: require('@/assets/images/demo/avatar-2.png'), mutualFriends: 6 },
  { id: '8', name: 'Henry Taylor', avatarUri: require('@/assets/images/demo/avatar-3.png'), mutualFriends: 3 },
];

export default function GroupOrdersScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showStickySearch, setShowStickySearch] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const handleNavigate = () => {
    // Close any active modals before navigating
    setShowShareModal(false);
    setIsGeneratingLink(false);
    router.push('/orders/group/details');
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate a brief loading state
    setTimeout(() => {
      setRefreshKey(prev => prev + 1);
      setRefreshing(false);
    }, 500);
  }, []);

  const handleScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    
    // Only handle scroll-based sticky search if:
    // 1. User is not actively searching (searchQuery is empty)
    // 2. Sticky search is not manually activated
    if (searchQuery === '' && !showStickySearch) {
      // Show sticky search when user scrolls past the title area (approximately 200px)
      // Hide sticky search when user scrolls back to top
      setShowStickySearch(scrollY > 200);
    }
  };

  const handleInvitePress = async () => {
    setShowShareModal(true);
    setIsGeneratingLink(true);
    
    // Simulate generating the share link
    setTimeout(async () => {
      setIsGeneratingLink(false);
      
      // Generate a unique group order link
      const groupOrderLink = `https://cribnosh.app/group-order/${Date.now()}`;
      
      try {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(groupOrderLink, {
            mimeType: 'text/plain',
            dialogTitle: 'Invite friends to join your group order',
          });
        }
      } catch (error) {
        console.error('Error sharing:', error);
      }
      
      setShowShareModal(false);
    }, 2000); // 2 second delay to show the loading state
  };

  const filteredUsers = availableUsers.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearchFocus = () => {
    setShowStickySearch(true);
    // Reset scroll position to top to ensure smooth transition
    // This prevents scroll conflicts with the sticky search
  };

  const resetSearchState = () => {
    setShowStickySearch(false);
    setSearchQuery('');
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const getSelectedCountText = () => {
    if (selectedUsers.length === 0) return '';
    if (selectedUsers.length === 1) return selectedUsers.length.toString();
    if (selectedUsers.length === 2) return selectedUsers.length.toString();
    return selectedUsers.length.toString();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Sticky Header */}
      <View style={styles.stickyHeader}>
        {showStickySearch ? (
          <View style={styles.stickySearchContainer}>
            <View style={styles.stickySearchHeader}>
              <TouchableOpacity 
                onPress={resetSearchState}
                style={styles.closeSearchButton}
              >
                <X color="#E6FFE8" size={18} />
              </TouchableOpacity>
              <Input
                placeholder="Search friends..."
                leftIcon={<SearchIcon color="#E6FFE8" />}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={handleSearchFocus}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        ) : (
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ChevronLeft color="#E6FFE8" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleInvitePress} style={styles.inviteButton}>
              <Text style={styles.inviteButtonText}>
                {selectedUsers.length > 0 ? `Invite ${getSelectedCountText()}` : 'Invite'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#E6FFE8"
            colors={["#E6FFE8"]}
          />
        }
      >
        {!showStickySearch && (
          <View>
            <Text 
            style={styles.title}
            >
                Josh and friend&apos;s party order
            </Text>
            <View style={{ marginTop: 20 }}>
                <Input
                 placeholder="Search friends..."
                   leftIcon={<SearchIcon color="#E6FFE8"  />}
                   value={searchQuery}
                   onChangeText={setSearchQuery}
                   onFocus={handleSearchFocus}
                  />
            </View>

          </View>
        )}

        {/* Search Results - Always visible when searching */}
        {searchQuery && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.searchResultsTitle}>
              {filteredUsers.length > 0 ? `Found ${filteredUsers.length} people` : 'No results found'}
            </Text>
            {filteredUsers.map((user) => (
              <View key={user.id} style={styles.userResultItem}>
                <TouchableOpacity 
                  style={styles.userResultContent}
                  onPress={() => toggleUserSelection(user.id)}
                >
                  <View style={styles.userAvatarContainer}>
                    <Avatar source={{ uri: user.avatarUri }} size="sm" />
                    <View style={styles.selectionIndicator}>
                      {selectedUsers.includes(user.id) ? (
                        <View style={styles.selectedCircle}>
                          <Text style={styles.checkmark}>✓</Text>
                        </View>
                      ) : (
                        <View style={styles.unselectedCircle} />
                      )}
                    </View>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.mutualFriends}>
                      {user.mutualFriends} mutual friends
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <ScatteredGroupMembers 
          members={groupMembers} 
          refreshKey={refreshKey}
        />

      </ScrollView>
      
      <View style={styles.floatingButtons}>
        <GroupTotalSpendCard amount="3000" avatars={avatars} />
        <SwipeButton onSwipeSuccess={() => console.log('yes')} />
        <GroupMealSelection quantity={4} onPress={handleNavigate} />
      </View>

      {/* Full Screen Loading Modal */}
      <Modal
        visible={showShareModal}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {isGeneratingLink ? (
              <>
                {/* Skeleton Loading */}
                <View style={styles.skeletonContainer}>
                  {/* Title Skeleton */}
                  <View style={styles.skeletonTitle} />
                  
                  {/* Subtitle Skeleton */}
                  <View style={styles.skeletonSubtitle} />
                  
                  {/* Progress Steps Skeleton */}
                  <View style={styles.skeletonSteps}>
                    <View style={styles.skeletonStep}>
                      <View style={styles.skeletonStepIcon} />
                      <View style={styles.skeletonStepText} />
                    </View>
                    <View style={styles.skeletonStep}>
                      <View style={styles.skeletonStepIcon} />
                      <View style={styles.skeletonStepText} />
                    </View>
                    <View style={styles.skeletonStep}>
                      <View style={styles.skeletonStepIcon} />
                      <View style={styles.skeletonStepText} />
                    </View>
                  </View>
                </View>
                
                <Text style={styles.modalTitle}>Creating Your Invite Link</Text>
                <Text style={styles.modalSubtitle}>
                  We&apos;re generating a unique link that your friends can use to join this group order
                </Text>
              </>
            ) : (
              <>
                {/* Success Mascot */}
                <View style={styles.successMascotContainer}>
                  <Mascot emotion="excited" size={200} />
                </View>
                
                <Text style={styles.modalSubtitle}>
                  Your unique group order link has been created successfully
                </Text>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#02120A',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    stickyHeader: {
        paddingHorizontal: 12,
        paddingTop: 10,
        paddingBottom: 16,
        backgroundColor: '#02120A',
        zIndex: 1000,
    },
    stickySearchContainer: {
        width: '100%',
    },
    stickySearchHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    closeSearchButton: {
        width: 40,
        height: 48,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(230, 255, 232, 0.1)',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    backButton: {
        padding: 8,
        borderRadius: 8,
    },
    inviteButton: {
        padding: 8,
        borderRadius: 8,
    },
    inviteButtonText: {
        color: '#E6FFE8',
        fontSize: 16,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: '#02120A',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        flex: 1,
        width: '100%',
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 120,
    },
    spinner: {
        marginBottom: 24,
    },
    modalTitle: {
        color: '#E6FFE8',
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16,
    },
    modalSubtitle: {
        color: '#EAEAEA',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 12,
        lineHeight: 22,
    },
    modalInfo: {
        color: '#E6FFE8',
        fontSize: 14,
        textAlign: 'center',
        fontStyle: 'italic',
        opacity: 0.8,
    },
    loadingIconContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    loadingIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(230, 255, 232, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 2,
        borderColor: 'rgba(230, 255, 232, 0.3)',
    },
    loadingIconInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(230, 255, 232, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(230, 255, 232, 0.2)',
    },
    loadingIconText: {
        fontSize: 40,
    },
    loadingDots: {
        flexDirection: 'row',
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#E6FFE8',
        opacity: 0.6,
    },
    dot1: {
        opacity: 1,
    },
    dot2: {
        opacity: 0.8,
    },
    dot3: {
        opacity: 0.6,
    },
    progressSteps: {
        marginTop: 24,
        gap: 16,
    },
    step: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    stepIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepCompleted: {
        backgroundColor: '#10B981',
    },
    stepActive: {
        backgroundColor: '#E6FFE8',
    },
    stepPending: {
        backgroundColor: 'rgba(230, 255, 232, 0.2)',
        borderWidth: 1,
        borderColor: 'rgba(230, 255, 232, 0.4)',
    },
    stepCheck: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
    stepNumber: {
        color: '#E6FFE8',
        fontSize: 12,
        fontWeight: 'bold',
    },
    stepText: {
        color: '#EAEAEA',
        fontSize: 14,
        flex: 1,
    },
    successMascotContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    successIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    successIconInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.4)',
    },
    successCheckmark: {
        width: 24,
        height: 24,
        borderLeftWidth: 3,
        borderBottomWidth: 3,
        borderColor: '#10B981',
        transform: [{ rotate: '-45deg' }],
        marginTop: -2,
        marginLeft: 2,
    },
    linkPreview: {
        backgroundColor: 'rgba(230, 255, 232, 0.1)',
        borderRadius: 12,
        padding: 16,
        marginTop: 20,
        borderWidth: 1,
        borderColor: 'rgba(230, 255, 232, 0.2)',
        width: '100%',
    },
    linkPreviewText: {
        color: '#E6FFE8',
        fontSize: 14,
        textAlign: 'center',
        fontFamily: 'monospace',
    },
    skeletonContainer: {
        marginBottom: 60,
        gap: 24,
        width: '100%',
        maxWidth: 400,
    },
    skeletonTitle: {
        height: 32,
        backgroundColor: 'rgba(230, 255, 232, 0.1)',
        borderRadius: 16,
        width: '70%',
        alignSelf: 'center',
    },
    skeletonSubtitle: {
        height: 20,
        backgroundColor: 'rgba(230, 255, 232, 0.08)',
        borderRadius: 10,
        width: '85%',
        alignSelf: 'center',
    },
    skeletonSteps: {
        gap: 16,
        marginTop: 8,
    },
    skeletonStep: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    skeletonStepIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(230, 255, 232, 0.1)',
    },
    skeletonStepText: {
        height: 14,
        backgroundColor: 'rgba(230, 255, 232, 0.08)',
        borderRadius: 7,
        flex: 1,
    },
    customSpinner: {
        width: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    spinnerDot: {
        position: 'absolute',
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#02120A',
    },
    spinnerDot1: {
        top: 2,
        left: 2,
        opacity: 0.8,
    },
    spinnerDot2: {
        top: 2,
        right: 2,
        opacity: 0.6,
    },
    spinnerDot3: {
        bottom: 2,
        left: 6,
        opacity: 0.4,
    },
    scrollContent: {
        paddingBottom: 300, // Large bottom padding to ensure content is fully scrollable above floating buttons
        overflow: 'visible', // Allow ScatteredGroupMembers to overflow properly
    },
    title: {
        fontSize: 35,
        fontWeight: 'bold',
        color: '#FFFFFF',
        lineHeight: 52,
        marginBottom: 10,
        marginTop: 20,
        textShadowColor: '#FF3B30',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 0,
        textAlign: 'left',
    },
    floatingButtons: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#02120A',
        paddingVertical: 16,
        paddingHorizontal: 20,
        paddingTop: 24,
        gap: 12,
    },
    searchResultsTitle: {
        color: '#E6FFE8',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 16,
    },
    userResultItem: {
        marginBottom: 12,
    },
    userResultContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: 'rgba(230, 255, 232, 0.05)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(230, 255, 232, 0.1)',
    },
    userAvatarContainer: {
        position: 'relative',
        marginRight: 12,
    },
    selectionIndicator: {
        position: 'absolute',
        top: -4,
        right: -4,
    },
    selectedCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#10B981',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#02120A',
    },
    checkmark: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    unselectedCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: 'rgba(230, 255, 232, 0.3)',
        backgroundColor: 'transparent',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        color: '#E6FFE8',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    mutualFriends: {
        color: '#EAEAEA',
        fontSize: 14,
        opacity: 0.8,
    },
});
