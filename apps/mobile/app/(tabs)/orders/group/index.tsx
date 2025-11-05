import GroupTotalSpendCard from '@/components/GroupTotalSpendCard';
import { Mascot } from '@/components/Mascot';
import { SwipeButton } from '@/components/SwipeButton';
import { Avatar } from '@/components/ui/Avatar';
import { GroupMealSelection } from '@/components/ui/GroupMealSelection';
import { Input } from '@/components/ui/Input';
import ScatteredGroupMembers from '@/components/ui/ScatteredGroupMembers';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { ChevronLeft, SearchIcon, X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  useGetGroupOrderQuery, 
  useGetGroupOrderStatusQuery,
  useGetUserConnectionsQuery,
  useMarkSelectionsReadyMutation,
  useStartSelectionPhaseMutation,
  useCreateConnectionMutation,
} from '@/store/customerApi';
import { useAuthState } from '@/hooks/useAuthState';
import { GroupOrder, GroupOrderParticipant } from '@/types/customer';

export default function GroupOrdersScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ group_order_id?: string }>();
  const { user } = useAuthState();
  const groupOrderId = params.group_order_id || '';
  
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showStickySearch, setShowStickySearch] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  // API Queries
  const { 
    data: groupOrderData, 
    isLoading: isLoadingGroupOrder,
    error: groupOrderError,
    refetch: refetchGroupOrder 
  } = useGetGroupOrderQuery(groupOrderId, {
    skip: !groupOrderId,
    pollingInterval: 5000, // Poll every 5 seconds for real-time updates
  });
  
  const { 
    data: statusData,
    isLoading: isLoadingStatus 
  } = useGetGroupOrderStatusQuery(groupOrderId, {
    skip: !groupOrderId,
    pollingInterval: 5000,
  });
  
  const { 
    data: connectionsData,
    isLoading: isLoadingConnections 
  } = useGetUserConnectionsQuery(undefined, {
    skip: !searchQuery, // Only fetch when searching
  });
  
  // Mutations
  const [markSelectionsReady, { isLoading: isMarkingReady }] = useMarkSelectionsReadyMutation();
  const [startSelectionPhase, { isLoading: isStartingPhase }] = useStartSelectionPhaseMutation();
  const [createConnection] = useCreateConnectionMutation();
  
  const groupOrder = groupOrderData?.data;
  const status = statusData?.data;

  // Map participants to ScatteredGroupMembers format
  const groupMembers = useMemo(() => {
    if (!groupOrder?.participants) return [];
    const selectionPhase = status?.selection_phase || groupOrder.selection_phase || 'budgeting';
    
    return groupOrder.participants.map((participant: GroupOrderParticipant) => {
      let statusText = '';
      const isCurrentUser = participant.user_id === user?.user_id;
      
      if (selectionPhase === 'budgeting') {
        if (participant.budget_contribution > 0) {
          statusText = `Contributing £${participant.budget_contribution.toFixed(2)}`;
        } else {
          statusText = 'Chip in to budget';
        }
      } else if (selectionPhase === 'selecting') {
        if (participant.selection_status === 'ready') {
          statusText = 'Ready';
        } else if (participant.order_items && participant.order_items.length > 0) {
          statusText = 'Selecting meal';
        } else {
          statusText = 'Select meal';
        }
      } else if (selectionPhase === 'ready') {
        statusText = participant.selection_status === 'ready' ? 'Ready' : 'Not ready';
      }
      
      return {
        name: isCurrentUser ? 'You' : participant.user_name,
        avatarUri: participant.avatar_url || { uri: '' },
        user_id: participant.user_id,
        status: statusText,
        isDone: participant.selection_status === 'ready',
        budget_contribution: participant.budget_contribution,
        order_items: participant.order_items || [],
        selection_status: participant.selection_status,
      };
    });
  }, [groupOrder?.participants, groupOrder?.selection_phase, status?.selection_phase, user?.user_id]);
  
  // Get avatars for budget card
  const avatars = useMemo(() => {
    if (!groupOrder?.participants) return [];
    return groupOrder.participants.slice(0, 5).map((p: GroupOrderParticipant) => ({
      uri: p.avatar_url || '',
      user_id: p.user_id,
    }));
  }, [groupOrder?.participants]);
  
  // Get current participant's selection count
  const currentParticipant = useMemo(() => {
    if (!groupOrder?.participants || !user?.user_id) return null;
    return groupOrder.participants.find((p: GroupOrderParticipant) => p.user_id === user.user_id);
  }, [groupOrder?.participants, user?.user_id]);
  
  const selectionCount = currentParticipant?.order_items?.length || 0;
  
  // Filter connections by search query
  const filteredUsers = useMemo(() => {
    if (!connectionsData?.data || !searchQuery) return [];
    const query = searchQuery.toLowerCase();
    return connectionsData.data.filter(conn => 
      conn.user_name.toLowerCase().includes(query)
    );
  }, [connectionsData?.data, searchQuery]);
  
  const handleNavigate = () => {
    // Close any active modals before navigating
    setShowShareModal(false);
    setIsGeneratingLink(false);
    if (groupOrderId) {
      router.push({
        pathname: '/orders/group/details',
        params: { group_order_id: groupOrderId },
      });
    }
  };
  
  const handleNavigateToMealSelection = () => {
    if (groupOrderId) {
      router.push({
        pathname: '/orders/group/select-meal',
        params: { group_order_id: groupOrderId },
      });
    }
  };
  
  const handleNavigateToParticipantSelections = (participantUserId: string) => {
    if (groupOrderId) {
      router.push({
        pathname: '/orders/group/[participant_id]/selections',
        params: { 
          group_order_id: groupOrderId,
          participant_id: participantUserId,
        },
      });
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetchGroupOrder().finally(() => {
      setRefreshKey(prev => prev + 1);
      setRefreshing(false);
    });
  }, [refetchGroupOrder]);

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
    if (!groupOrder?.share_link) {
      Alert.alert('Error', 'Share link not available');
      return;
    }
    
    setShowShareModal(true);
    setIsGeneratingLink(true);
    
    try {
      // Use the actual share link from the group order
      const groupOrderLink = groupOrder.share_link || `https://cribnosh.app/group-order/${groupOrderId}`;
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(groupOrderLink, {
          mimeType: 'text/plain',
          dialogTitle: 'Invite friends to join your group order',
        });
      }
      
      setIsGeneratingLink(false);
      setShowShareModal(false);
    } catch (error) {
      console.error('Error sharing:', error);
      setIsGeneratingLink(false);
      setShowShareModal(false);
      Alert.alert('Error', 'Failed to share link');
    }
  };
  
  const handleSwipeToComplete = async () => {
    if (!groupOrderId) return;
    
    try {
      await markSelectionsReady(groupOrderId).unwrap();
      // Success - UI will update via cache invalidation
    } catch (error: any) {
      Alert.alert('Error', error?.data?.message || 'Failed to mark selections as ready');
    }
  };
  
  const handleStartSelectionPhase = async () => {
    if (!groupOrderId) return;
    
    Alert.alert(
      'Start Selection Phase',
      'Are you sure you want to start the selection phase? Participants can now select their meals.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: async () => {
            try {
              await startSelectionPhase(groupOrderId).unwrap();
              // Success - UI will update via cache invalidation
            } catch (error: any) {
              Alert.alert('Error', error?.data?.message || 'Failed to start selection phase');
            }
          },
        },
      ]
    );
  };
  
  const handleInviteSelectedUsers = async () => {
    if (selectedUsers.length === 0) {
      handleInvitePress();
      return;
    }
    
    // Create connections for selected users
    try {
      await Promise.all(
        selectedUsers.map(userId => 
          createConnection({
            connected_user_id: userId,
            connection_type: 'friend',
          }).unwrap()
        )
      );
      
      // Then share the group order link
      handleInvitePress();
      setSelectedUsers([]);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to invite users');
    }
  };

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
    return selectedUsers.length.toString();
  };
  
  // Show loading state
  if (isLoadingGroupOrder && !groupOrder) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E6FFE8" />
          <Text style={styles.loadingText}>Loading group order...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  // Show error state
  if (groupOrderError && !groupOrder) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load group order</Text>
          <TouchableOpacity onPress={() => refetchGroupOrder()} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  if (!groupOrder) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Group order not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  const isCreator = groupOrder.created_by === user?.user_id;
  const selectionPhase = status?.selection_phase || groupOrder.selection_phase || 'budgeting';
  const showStartSelectionButton = isCreator && selectionPhase === 'budgeting';
  const showSwipeButton = selectionPhase === 'selecting' || selectionPhase === 'ready';
  const showMealSelectionButton = selectionPhase === 'selecting' || selectionPhase === 'ready';
  const totalBudget = groupOrder.total_budget || groupOrder.initial_budget || 0;

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
            <TouchableOpacity onPress={handleInviteSelectedUsers} style={styles.inviteButton}>
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
            <Text style={styles.title}>
              {groupOrder.title || 'Group Order'}
            </Text>
            <View style={{ marginTop: 20 }}>
              <Input
                placeholder="Search friends..."
                leftIcon={<SearchIcon color="#E6FFE8" />}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={handleSearchFocus}
              />
            </View>
            
            {/* Creator Controls */}
            {showStartSelectionButton && (
              <View style={{ marginTop: 20 }}>
                <TouchableOpacity 
                  onPress={handleStartSelectionPhase}
                  style={styles.startSelectionButton}
                  disabled={isStartingPhase}
                >
                  {isStartingPhase ? (
                    <ActivityIndicator size="small" color="#E6FFE8" />
                  ) : (
                    <Text style={styles.startSelectionButtonText}>
                      Start Selection Phase
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Search Results - Always visible when searching */}
        {searchQuery && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.searchResultsTitle}>
              {isLoadingConnections ? 'Searching...' : 
               filteredUsers.length > 0 ? `Found ${filteredUsers.length} people` : 'No results found'}
            </Text>
            {!isLoadingConnections && filteredUsers.map((conn) => (
              <View key={conn.user_id} style={styles.userResultItem}>
                <TouchableOpacity 
                  style={styles.userResultContent}
                  onPress={() => toggleUserSelection(conn.user_id)}
                >
                  <View style={styles.userAvatarContainer}>
                    <Avatar 
                      source={{ uri: '' }} 
                      size="sm" 
                      initials={conn.user_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    />
                    <View style={styles.selectionIndicator}>
                      {selectedUsers.includes(conn.user_id) ? (
                        <View style={styles.selectedCircle}>
                          <Text style={styles.checkmark}>✓</Text>
                        </View>
                      ) : (
                        <View style={styles.unselectedCircle} />
                      )}
                    </View>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{conn.user_name}</Text>
                    <Text style={styles.mutualFriends}>
                      {conn.connection_type} • {conn.source}
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
          onParticipantPress={handleNavigateToParticipantSelections}
        />

      </ScrollView>
      
      <View style={styles.floatingButtons}>
        <GroupTotalSpendCard 
          amount={totalBudget.toFixed(2)} 
          avatars={avatars}
          onPress={() => {
            if (groupOrderId) {
              router.push({
                pathname: '/orders/group/details',
                params: { group_order_id: groupOrderId },
              });
            }
          }}
        />
        {showSwipeButton && (
          <SwipeButton 
            onSwipeSuccess={handleSwipeToComplete}
            disabled={!currentParticipant || currentParticipant.order_items.length === 0 || isMarkingReady}
          />
        )}
        {showMealSelectionButton && (
          <GroupMealSelection 
            quantity={selectionCount} 
            onPress={handleNavigateToMealSelection}
          />
        )}
        {selectionPhase === 'budgeting' && (
          <TouchableOpacity 
            style={styles.chipInButton}
            onPress={handleNavigate}
          >
            <Text style={styles.chipInButtonText}>Chip in to budget</Text>
          </TouchableOpacity>
        )}
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    loadingText: {
        color: '#E6FFE8',
        fontSize: 16,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        gap: 16,
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 16,
        textAlign: 'center',
    },
    retryButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#E6FFE8',
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#094327',
        fontSize: 16,
        fontWeight: '600',
    },
    startSelectionButton: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#FF3B30',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    startSelectionButtonText: {
        color: '#E6FFE8',
        fontSize: 16,
        fontWeight: '600',
    },
    chipInButton: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#094327',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chipInButtonText: {
        color: '#E6FFE8',
        fontSize: 16,
        fontWeight: '600',
    },
});
