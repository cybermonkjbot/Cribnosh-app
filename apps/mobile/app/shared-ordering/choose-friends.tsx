import { Mascot } from '@/components/Mascot';
import { Input } from '@/components/ui/Input';
import ScatteredGroupMembers from '@/components/ui/ScatteredGroupMembers';
import { SharedOrderingHeader } from '@/components/ui/SharedOrderingHeader';
import { useAuthContext } from '@/contexts/AuthContext';
import { useGetUserConnectionsQuery } from '@/store/customerApi';
import { useRouter } from 'expo-router';
import { SearchIcon, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChooseFriends() {
  const router = useRouter();
  const { isAuthenticated } = useAuthContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [showStickySearch, setShowStickySearch] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [buttonPressed, setButtonPressed] = useState(false);

  // Fetch real connections/friends from API
  const {
    data: connectionsData,
    isLoading: isLoadingConnections,
  } = useGetUserConnectionsQuery(undefined, {
    skip: !isAuthenticated,
  });

  // Transform API connections to friend format
  const friends = useMemo(() => {
    if (connectionsData?.success && connectionsData.data && Array.isArray(connectionsData.data)) {
      return connectionsData.data.map((connection: any) => ({
        id: connection.user_id || connection._id || '',
        name: connection.user_name || connection.name || 'Unknown User',
        avatar: connection.avatar_url || connection.picture || undefined, // No fallback - use default avatar component
      }));
    }
    return []; // Return empty array if no connections
  }, [connectionsData]);

  // Create group members from selected friends (for display purposes)
  const groupMembers = useMemo(() => {
    if (selectedFriends.length === 0) return [];
    
    return selectedFriends.map((friendId, index) => {
      const friend = friends.find(f => f.id === friendId);
      if (!friend) return null;
      
      return {
        name: friend.name,
        avatarUri: friend.avatar,
        top: (index % 3) * 50,
        left: (index % 2) * 50,
        status: 'Invited',
        isDone: false,
      };
    }).filter((member): member is NonNullable<typeof member> => member !== null);
  }, [selectedFriends, friends]);

  const handleBack = () => {
    router.back();
  };
  
  const handleNavigate = () => {
    console.log('Share button pressed - attempting navigation...');
    setButtonPressed(true);
    // Close any active modals before navigating
    setShowShareModal(false);
    setIsGeneratingLink(false);
    
    try {
      console.log('Navigating to /shared-link...');
      // Try different navigation methods
      router.navigate('/shared-link');
      console.log('Navigation command sent successfully');
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback: try replace
      try {
        console.log('Trying replace as fallback...');
        router.replace('/shared-link');
      } catch (replaceError) {
        console.error('Replace also failed:', replaceError);
        // Final fallback: try push
        try {
          console.log('Trying push as final fallback...');
          router.push('/shared-link');
        } catch (pushError) {
          console.error('All navigation methods failed:', pushError);
        }
      }
    }
  };



  const handleSearchFocus = () => {
    setShowStickySearch(true);
  };

  const resetSearchState = () => {
    setShowStickySearch(false);
    setSearchQuery('');
  };

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
    // Trigger refresh for ScatteredGroupMembers
    setRefreshKey(prev => prev + 1);
  };

  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSelectedCountText = () => {
    if (selectedFriends.length === 0) return '';
    if (selectedFriends.length === 1) return selectedFriends.length.toString();
    if (selectedFriends.length === 3) return selectedFriends.length.toString();
    
    if (selectedFriends.length === 2) return selectedFriends.length.toString();
    return selectedFriends.length.toString();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <SharedOrderingHeader
        onBack={handleBack}
        onAction={handleNavigate}
        actionText={selectedFriends.length > 0 ? `Share ${getSelectedCountText()}` : 'Share'}
        backIcon="down"
        position="relative"
        style={styles.header}
      />
      
      {showStickySearch && (
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
      )}

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {!showStickySearch && (
          <View>
            <Text style={styles.title}>
              Chose friends
            </Text>

            <Text style={styles.description}>
              We&apos;ll send the treat straight to your selection.
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
          </View>
        )}

        {/* Search Results - Always visible when searching */}
        {searchQuery && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.searchResultsTitle}>
              {filteredFriends.length > 0 ? `Found ${filteredFriends.length} people` : 'No results found'}
            </Text>
            {filteredFriends.map((friend) => (
              <View key={friend.id} style={styles.userResultItem}>
                <TouchableOpacity 
                  style={styles.userResultContent}
                  onPress={() => toggleFriendSelection(friend.id)}
                >
                  <View style={styles.userAvatarContainer}>
                    <Image source={friend.avatar} style={styles.avatar} />
                    <View style={styles.selectionIndicator}>
                      {selectedFriends.includes(friend.id) ? (
                        <View style={styles.selectedCircle}>
                          <Text style={styles.checkmark}>✓</Text>
                        </View>
                      ) : (
                        <View style={styles.unselectedCircle} />
                      )}
                    </View>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{friend.name}</Text>
                  </View>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* ScatteredGroupMembers with proper spacing */}
        <View style={styles.scatteredMembersContainer}>
          <ScatteredGroupMembers 
            members={groupMembers} 
            refreshKey={refreshKey}
          />
        </View>
      </ScrollView>

      {/* Full Screen Loading Modal */}
      <Modal
        visible={showShareModal}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setShowShareModal(false)}
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
                
                <Text style={styles.modalTitle}>Creating Your Treat Link</Text>
                <Text style={styles.modalSubtitle}>
                  We&apos;re generating a unique link that your friends can use to claim their treat
                </Text>
              </>
            ) : (
              <>
                {/* Success Mascot */}
                <View style={styles.successMascotContainer}>
                  <Mascot emotion="excited" size={200} />
                </View>
                
                <Text style={styles.modalSubtitle}>
                  Your treat link has been created successfully and shared with your friends!
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
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 12,
  },
  stickySearchContainer: {
    width: '100%',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 16,
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 50,
  },
  scatteredMembersContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    minHeight: 300,
    maxHeight: 400,
  },
  title: {
    fontSize: 35,
    fontWeight: 'bold',
    color: '#FF3B30',
    lineHeight: 52,
    marginBottom: 10,
    marginTop: 20,
    textShadowColor: '#fff',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
    textAlign: 'left',
  },
  description: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 24,
    marginBottom: 5,
    textAlign: 'left',
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
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  imageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  takeoutImage: {
    width: '100%',
    height: '100%',
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
  successMascotContainer: {
    alignItems: 'center',
    marginBottom: 24,
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
});
