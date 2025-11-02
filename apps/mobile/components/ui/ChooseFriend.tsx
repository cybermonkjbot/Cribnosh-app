import { EmptyState } from "@/components/ui/EmptyState";
import { Entypo } from "@expo/vector-icons";
import { SearchIcon, X } from "lucide-react-native";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar } from "./Avatar";
import GroupOrderMember from "../GroupOrderMember";
import { Input } from "./Input";
import LinkModal from "./LinkModal";

interface ChooseFriend {
  isVisible: boolean;
  onClose: () => void;
}

// Mock data for friends that can be selected
const availableFriends = [
  { id: '1', name: 'Alice Johnson', avatarUri: require('@/assets/images/demo/avatar-1.png'), mutualFriends: 3 },
  { id: '2', name: 'Bob Smith', avatarUri: require('@/assets/images/demo/avatar-2.png'), mutualFriends: 5 },
  { id: '3', name: 'Carol Davis', avatarUri: require('@/assets/images/demo/avatar-3.png'), mutualFriends: 2 },
  { id: '4', name: 'David Wilson', avatarUri: require('@/assets/images/demo/avatar-4.png'), mutualFriends: 7 },
  { id: '5', name: 'Eva Brown', avatarUri: require('@/assets/images/demo/avatar-5.png'), mutualFriends: 4 },
  { id: '6', name: 'Frank Miller', avatarUri: require('@/assets/images/demo/avatar-1.png'), mutualFriends: 1 },
  { id: '7', name: 'Grace Lee', avatarUri: require('@/assets/images/demo/avatar-2.png'), mutualFriends: 6 },
  { id: '8', name: 'Henry Taylor', avatarUri: require('@/assets/images/demo/avatar-3.png'), mutualFriends: 3 },
];

// Default display items for normal state (first 5 items in grid layout)
const defaultItems = availableFriends.slice(0, 5);

interface Item {
  items: any;
  type: string;
}

interface Box {
  avatarUri: any;
  name: string;
}

const rows: Item[] = [];
let i = 0;

while (i < defaultItems.length) {
  // Odd row (3 items)
  rows.push({ items: defaultItems.slice(i, i + 3).map(f => ({ avatarUri: f.avatarUri, name: f.name })), type: "odd" });
  i += 3;

  // Even row (2 items)
  if (i < defaultItems.length) {
    rows.push({ items: defaultItems.slice(i, i + 2).map(f => ({ avatarUri: f.avatarUri, name: f.name })), type: "even" });
    i += 2;
  }
}

interface Modal {
  isOpen: boolean;
  onClick: () => void;
}

export default function ChooseFriend({ isOpen, onClick }: Modal) {
  const [linkModal, setLinkModal] = useState(false);
  const [showStickySearch, setShowStickySearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  if (!isOpen) return null;

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

  const filteredFriends = availableFriends.filter(friend => 
    friend.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFriendPress = (friendId: string) => {
    toggleUserSelection(friendId);
    // Open link modal when a friend is selected
    if (!selectedUsers.includes(friendId)) {
      setLinkModal(true);
    }
  };
  
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
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
            <Pressable onPress={onClick}>
              <Entypo name="chevron-down" size={24} color="#ffffff" />
            </Pressable>
            <Pressable>
              <Text style={styles.shareButton}>
                Share
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {!showStickySearch && (
          <View style={styles.content}>
            <Text style={styles.title}>
              Choose a friend to pay
            </Text>
            <Text style={styles.subtitle}>
              We'll send the link straight to your selection
            </Text>
            
            <View style={{ marginTop: 20 }}>
              <Input
                placeholder="Search friends and Family"
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
            {filteredFriends.length > 0 ? (
              <>
                <Text style={styles.searchResultsTitle}>
                  Found {filteredFriends.length} people
                </Text>
                {filteredFriends.map((friend) => (
              <View key={friend.id} style={styles.userResultItem}>
                <TouchableOpacity 
                  style={styles.userResultContent}
                  onPress={() => handleFriendPress(friend.id)}
                >
                  <View style={styles.userAvatarContainer}>
                    <Avatar source={friend.avatarUri} size="sm" />
                    <View style={styles.selectionIndicator}>
                      {selectedUsers.includes(friend.id) ? (
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
                    <Text style={styles.mutualFriends}>
                      {friend.mutualFriends} mutual friends
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
                ))}
              </>
            ) : (
              <View style={styles.emptyStateWrapper}>
                <EmptyState
                  title="No friends found"
                  subtitle="Try a different search term or invite friends to join"
                  icon="people-outline"
                  titleColor="#E6FFE8"
                  subtitleColor="#EAEAEA"
                  iconColor="#E6FFE8"
                />
              </View>
            )}
          </View>
        )}

        {/* Default Friends List - Show when not searching */}
        {!searchQuery && (
          <View style={styles.friendsContainer}>
            {rows.map((row, index) => (
              <View
                key={index}
                style={[
                  styles.row,
                  row.type === "even" ? styles.rowEven : styles.rowOdd,
                ]}
              >
                {row.items.map((item: Box, idx: number) => (
                  <Pressable onPress={() => {
                    const friend = defaultItems.find(f => f.name === item.name);
                    if (friend) {
                      handleFriendPress(friend.id);
                    }
                  }} key={idx}>
                    <GroupOrderMember
                      avatarUri={item.avatarUri}
                      name={item.name}
                    />
                  </Pressable>
                ))}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      
      <LinkModal isOpen={linkModal} onClick={() => setLinkModal(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#02120A', // bg-[#02120A]
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
  shareButton: {
    fontSize: 18, // text-lg
    fontWeight: '500', // font-medium
    textAlign: 'center', // text-center
    color: '#FFFFFF', // text-white
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  scrollContent: {
    paddingBottom: 40, // pb-10 for scroll spacing
  },
  content: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF', // text-white
    fontSize: 48, // text-[48px]
    fontWeight: '600', // font-semibold
    marginBottom: 12, // mb-3
  },
  subtitle: {
    color: '#FFFFFF', // text-white
    fontSize: 24, // text-2xl
    marginBottom: 20, // mb-5
  },
  friendsContainer: {
    marginTop: 20, // mt-5
  },
  row: {
    flexDirection: 'row', // flex-row
    marginBottom: 16, // mb-4
    justifyContent: 'space-between', // justify-between
  },
  rowOdd: {
    paddingHorizontal: 0, // px-0
  },
  rowEven: {
    paddingHorizontal: '8%', // px-[8%]
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
  emptyStateWrapper: {
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
});
