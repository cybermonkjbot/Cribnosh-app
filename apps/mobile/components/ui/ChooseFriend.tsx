import { EmptyState } from "@/components/ui/EmptyState";
import { Entypo } from "@expo/vector-icons";
import { SearchIcon, X } from "lucide-react-native";
import { useMemo, useState, useEffect, useCallback } from "react";
import { getConvexClient, getSessionToken } from "@/lib/convexClient";
import { api } from "@/convex/_generated/api";
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View, Share, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthContext } from "../../contexts/AuthContext";
import GroupOrderMember from "../GroupOrderMember";
import { Avatar } from "./Avatar";
import { Input } from "./Input";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/lib/ToastContext";
import * as Clipboard from 'expo-clipboard';

interface Item {
  items: any;
  type: string;
}

interface Box {
  avatarUri: any;
  name: string;
}

interface ChooseFriendModal {
  isOpen: boolean;
  onClick: () => void;
}

export default function ChooseFriend({ isOpen, onClick }: ChooseFriendModal) {
  const { isAuthenticated } = useAuthContext();
  const { getCart } = useCart();
  const { showError, showSuccess, showInfo } = useToast();
  const [showStickySearch, setShowStickySearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [connectionsData, setConnectionsData] = useState<any>(null);
  const [isSharing, setIsSharing] = useState(false);
  
  // Fetch real connections/friends from Convex
  const fetchConnections = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const convex = getConvexClient();
      const sessionToken = await getSessionToken();

      if (!sessionToken) {
        return;
      }

      const result = await convex.action(api.actions.users.customerGetConnections, {
        sessionToken,
      });

      if (result.success === false) {
        console.error('Error fetching connections:', result.error);
        return;
      }

      // Transform to match expected format
      setConnectionsData({
        success: true,
        data: result.connections || [],
      });
    } catch (error: any) {
      console.error('Error fetching connections:', error);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchConnections();
    }
  }, [isAuthenticated, fetchConnections]);

  // Transform API connections to friend format
  const availableFriends = useMemo(() => {
    if (connectionsData?.success && connectionsData.data && Array.isArray(connectionsData.data)) {
      return connectionsData.data.map((connection: any) => ({
        id: connection.user_id || connection._id || '',
        name: connection.user_name || connection.name || 'Unknown User',
        avatarUri: connection.avatar_url || connection.picture || undefined, // No fallback - use default avatar component
        mutualFriends: connection.mutual_connections || 0,
      }));
    }
    return []; // Return empty array if no connections
  }, [connectionsData]);

  // Default display items for normal state (first 5 items in grid layout)
  const defaultItems = useMemo(() => availableFriends.slice(0, 5), [availableFriends]);

  // Generate rows for grid layout
  const rows: Item[] = useMemo(() => {
    const generatedRows: Item[] = [];
    let i = 0;
    while (i < defaultItems.length) {
      // Odd row (3 items)
      generatedRows.push({ 
        items: defaultItems.slice(i, i + 3).map(f => ({ avatarUri: f.avatarUri, name: f.name })), 
        type: "odd" 
      });
      i += 3;
      // Even row (2 items)
      if (i < defaultItems.length) {
        generatedRows.push({ 
          items: defaultItems.slice(i, i + 2).map(f => ({ avatarUri: f.avatarUri, name: f.name })), 
          type: "even" 
        });
        i += 2;
      }
    }
    return generatedRows;
  }, [defaultItems]);


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
  };

  const handleShare = useCallback(async () => {
    // Check if friends are selected
    if (selectedUsers.length === 0) {
      showError('No friends selected', 'Please select at least one friend to share with');
      return;
    }

    if (!isAuthenticated) {
      showError('Authentication required', 'Please sign in to share payment links');
      return;
    }

    try {
      setIsSharing(true);
      showInfo('Preparing share link', 'Creating your payment link...');

      const convex = getConvexClient();
      const sessionToken = await getSessionToken();

      if (!sessionToken) {
        throw new Error('Not authenticated');
      }

      // Get cart to calculate total
      let cartTotal = 0;
      try {
        const cartResult = await getCart();
        if (cartResult.success && cartResult.data?.items) {
          cartTotal = cartResult.data.items.reduce((sum: number, item: any) => {
            return sum + (item.price || 0) * (item.quantity || 1);
          }, 0);
        }
      } catch (error) {
        console.warn('Could not fetch cart, using default budget:', error);
      }

      // Create a custom order for sharing
      const customOrderResult = await convex.action(api.actions.orders.customerCreateCustomOrder, {
        sessionToken,
        requirements: 'Payment link for friend to pay',
        serving_size: 2,
        desired_delivery_time: new Date().toISOString(),
        budget: cartTotal > 0 ? Math.round(cartTotal * 100) : undefined, // Convert to pence if cart total exists
      });

      if (!customOrderResult.success || !customOrderResult.custom_order?._id) {
        throw new Error(customOrderResult.error || 'Failed to create custom order');
      }

      const orderId = customOrderResult.custom_order._id;

      // Generate share link
      const linkResult = await convex.action(api.actions.orders.customerGenerateSharedOrderLink, {
        sessionToken,
        order_id: orderId,
      });

      if (!linkResult.success || !linkResult.shareLink) {
        throw new Error(linkResult.error || 'Failed to generate share link');
      }

      const shareLink = linkResult.shareLink;

      // Get selected friend names for the message
      const selectedFriendNames = selectedUsers
        .map(userId => {
          const friend = availableFriends.find(f => f.id === userId);
          return friend?.name;
        })
        .filter(Boolean)
        .join(', ');

      // Create share message
      const shareMessage = selectedFriendNames
        ? `Hey ${selectedFriendNames}! 👋\n\nI'd like you to help pay for this order. Use this link to complete the payment:\n\n${shareLink}`
        : `Hey! 👋\n\nI'd like you to help pay for this order. Use this link to complete the payment:\n\n${shareLink}`;

      // Open native share sheet
      try {
        const result = await Share.share({
          message: shareMessage,
          title: 'Share Payment Link',
        });

        if (result.action === Share.sharedAction) {
          showSuccess('Link shared!', 'The payment link has been shared successfully');
          // Close modal after successful share
          setTimeout(() => {
            onClick();
          }, 1500);
        } else if (result.action === Share.dismissedAction) {
          // User dismissed share sheet - copy to clipboard as fallback
          await Clipboard.setStringAsync(shareLink);
          showInfo('Link copied', 'The payment link has been copied to your clipboard');
        }
      } catch (shareError: any) {
        // If share fails, copy to clipboard
        console.error('Share error:', shareError);
        await Clipboard.setStringAsync(shareLink);
        showInfo('Link copied', 'The payment link has been copied to your clipboard');
      }
    } catch (error: any) {
      console.error('Error sharing payment link:', error);
      showError('Failed to share', error?.message || 'Please try again later');
    } finally {
      setIsSharing(false);
    }
  }, [selectedUsers, isAuthenticated, availableFriends, getCart, showError, showSuccess, showInfo, onClick]);
  
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
            <Pressable 
              onPress={handleShare}
              disabled={isSharing || selectedUsers.length === 0}
              style={[isSharing || selectedUsers.length === 0 ? styles.shareButtonDisabled : null]}
            >
              {isSharing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={[styles.shareButton, selectedUsers.length === 0 && styles.shareButtonDisabled]}>
                  {selectedUsers.length > 0 ? `Share (${selectedUsers.length})` : 'Share'}
                </Text>
              )}
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
              We&apos;ll send the link straight to your selection
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

        {/* Default Friends List or Empty State - Show when not searching */}
        {!searchQuery && (
          <>
            {availableFriends.length === 0 ? (
              <View style={styles.emptyStateWrapper}>
                <EmptyState
                  title="You have no friends"
                  subtitle="Add friends to share payments and split costs together"
                  icon="people-outline"
                  titleColor="#E6FFE8"
                  subtitleColor="#EAEAEA"
                  iconColor="#E6FFE8"
                />
              </View>
            ) : (
              <View style={{ marginTop: 20 }}>
                {availableFriends.map((friend) => (
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
                        {friend.mutualFriends > 0 && (
                          <Text style={styles.mutualFriends}>
                            {friend.mutualFriends} mutual friends
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
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
  shareButtonDisabled: {
    opacity: 0.5,
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
