import { Input } from '@/components/ui/Input';
import ScatteredGroupMembers from '@/components/ui/ScatteredGroupMembers';
import { router } from 'expo-router';

import { ChevronDown, Contact, SearchIcon, X } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Image, SafeAreaView, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Mock data for friends
const friends = [
  { id: '1', name: 'Sandy Wilder Cheng', avatar: require('../../assets/images/demo/avatar-1.png') },
  { id: '2', name: 'Kevin Leong', avatar: require('../../assets/images/demo/avatar-2.png') },
  { id: '3', name: 'Greg Apodaca', avatar: require('../../assets/images/demo/avatar-3.png') },
  { id: '4', name: 'Juliana Mejia', avatar: require('../../assets/images/demo/avatar-4.png') },
];

// Mock data for scattered group members
const groupMembers = [
  { name: 'Sandy', avatarUri: require('../../assets/images/demo/avatar-1.png'), top: 0, left: 0, status: 'Selected', isDone: true },
  { name: 'Kevin', avatarUri: require('../../assets/images/demo/avatar-2.png'), top: 50, left: 50, status: 'Selected', isDone: true },
  { name: 'Greg', avatarUri: require('../../assets/images/demo/avatar-3.png'), top: 100, left: 100, status: 'Available', isDone: false },
  { name: 'Juliana', avatarUri: require('../../assets/images/demo/avatar-4.png'), top: 150, left: 150, status: 'Available', isDone: false },
];

export default function ChooseFriends() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [showStickySearch, setShowStickySearch] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleBack = () => {
    router.back();
  };

  const handleShare = async () => {
    // if (selectedFriends.length === 0) {
    //   Alert.alert(
    //     'No Friends Selected',
    //     'Please select at least one friend to share with.',
    //     [{ text: 'OK' }]
    //   );
    //   return;
    // }

    try {
      // Generate a unique share link for the treat
      const selectedFriendNames = selectedFriends.map(id => 
        friends.find(friend => friend.id === id)?.name
      ).filter(Boolean).join(', ');
      
      const shareMessage = `Hey ${selectedFriendNames}! 🎉\n\nI'm treating you to a meal on Cribnosh! Use this link to order:\n\nhttps://cribnosh.app/treat/${Date.now()}\n\nEnjoy your meal! 🍽️`;
      console.log(shareMessage);
      // Use React Native's built-in Share API
      const result = await Share.share({
        message: shareMessage,
        title: 'Share Your Treat',
      });

      if (result.action === Share.sharedAction) {
        // Content was shared successfully
        console.log('Content shared successfully');
      } else if (result.action === Share.dismissedAction) {
        // Share dialog was dismissed
        console.log('Share dialog dismissed');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert(
        'Share Failed',
        'There was an error sharing your treat. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

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
                placeholder="Search for friends & family to invite..."
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
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ChevronDown color="#E6FFE8" size={20} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
              <Text style={styles.shareText}>
                {selectedFriends.length > 0 ? `Share ${getSelectedCountText()}` : 'Share'}
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

      {/* Takeout box image - positioned better */}
      <View style={styles.imageContainer}>
        <Image
          source={require('../../assets/images/on-your-account-image-01.png')}
          style={styles.takeoutImage}
          resizeMode="contain"
        />
      </View>
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
    minHeight: '100%',
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
    paddingBottom: 150,
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
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FF3B30',
    lineHeight: 52,
    marginBottom: 16,
    textShadowColor: '#fff',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
    textAlign: 'left',
  },
  description: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 24,
    marginBottom: 32,
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
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: -5,
    paddingBottom: 30,
  },
  takeoutImage: {
    width: 180,
    height: 180,
    opacity: 0.8,
  },
});
