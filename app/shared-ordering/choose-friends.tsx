import { Mascot } from '@/components/Mascot';
import { Input } from '@/components/ui/Input';
import ScatteredGroupMembers from '@/components/ui/ScatteredGroupMembers';
import { useRouter } from 'expo-router';

import { ChevronDown, SearchIcon, X } from 'lucide-react-native';
import { useState } from 'react';
import { Image, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Mock data for friends
const friends = [
  { id: '1', name: 'Sandy Wilder Cheng', avatar: require('../../assets/images/demo/avatar-1.png') },
  { id: '2', name: 'Kevin Leong', avatar: require('../../assets/images/demo/avatar-2.png') },
  { id: '3', name: 'Greg Apodaca', avatar: require('../../assets/images/demo/avatar-3.png') },
  { id: '4', name: 'Juliana Mejia', avatar: require('../../assets/images/demo/avatar-4.png') },
];

// Mock data for scattered group members
const groupMembers = [
  { name: 'Fola', avatarUri: require('@/assets/images/demo/avatar-1.png'), top: 0, left: 0, status: 'Contributing £3', isDone: false },
  { name: 'Josh', avatarUri: require('@/assets/images/demo/avatar-2.png'), top: 50, left: 50, status: 'Selecting meal', isDone: true },
  { name: 'Favour', avatarUri: require('@/assets/images/demo/avatar-3.png'), top: 100, left: 100, status: 'Browsing menu', isDone: false },
  { name: 'Mike', avatarUri: require('@/assets/images/demo/avatar-4.png'), top: 150, left: 150, status: 'Contributing £5', isDone: true },
  { name: 'Emma', avatarUri: require('@/assets/images/demo/avatar-5.png'), top: 200, left: 200, status: 'Adding sides', isDone: false },
  { name: 'Alex', avatarUri: require('@/assets/images/demo/avatar-5.png'), top: 250, left: 250, status: 'Ready to order', isDone: true },
];

export default function ChooseFriends() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [showStickySearch, setShowStickySearch] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  const handleBack = () => {
    router.back();
  };
  
  const handleNavigate = () => {
    // Close any active modals before navigating
    setShowShareModal(false);
    setIsGeneratingLink(false);
    router.push('/shared-link');
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
    if (selectedFriends.length === 2) return selectedFriends.length.toString();
    return selectedFriends.length.toString();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Full-screen background image */}
      <View style={styles.imageContainer}>
        <Image
          source={require('../../assets/images/on-your-account-image-01.png')}
          style={styles.takeoutImage}
          resizeMode="cover"
        />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ChevronDown color="#E6FFE8" size={20} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleNavigate}
            style={styles.shareButton}
            activeOpacity={0.7}
          >
            <Text style={styles.shareText}>
              {selectedFriends.length > 0 ? `Share ${getSelectedCountText()}` : 'Share'}
            </Text>
          </TouchableOpacity>
        </View>
        
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
                placeholder="Search for friends & family to invite..."
                leftIcon={<SearchIcon color="#E6FFE8" />}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={handleSearchFocus}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        )}
      </View>

      <ScrollView 
        style={styles.content}
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
                placeholder="Search for friends & family to invite..."
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
  content: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 20,
    zIndex: 10,
  },
  header: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: 'transparent',
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
  shareButton: {
    padding: 8,
    borderRadius: 8,
    
  
  },
  shareText: {
    color: '#E6FFE8',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContent: {
    flexGrow: 1,
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
