import { useAuthContext } from '@/contexts/AuthContext';
import { useConnections } from '@/hooks/useConnections';
import { useOrders } from '@/hooks/useOrders';
import { Ionicons } from '@expo/vector-icons'; // Added Ionicons import
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import {
  getPlayToWinData,
  UserBehavior
} from '../../utils/hiddenSections';
import { PlayToWinSectionSkeleton } from './PlayToWinSectionSkeleton';
import { SkeletonWithTimeout } from './SkeletonWithTimeout';
import { UsualDinnerSectionSkeleton } from './UsualDinnerSectionSkeleton';

interface UsualDinnerItem {
  dish_id: string;
  name: string;
  price: number;
  image_url?: string;
  foodCreator_name: string;
  foodCreator_id: string;
  order_count: number;
  last_ordered_at: number;
  avg_rating?: number;
}

// Usual Dinner Section Component
export function UsualDinnerSection({
  userBehavior,
  hasInitialLoadCompleted = false,
}: {
  userBehavior: UserBehavior;
  hasInitialLoadCompleted?: boolean;
}) {
  const { isAuthenticated } = useAuthContext();
  const router = useRouter();
  const { getUsualDinnerItems } = useOrders();
  const [dinnerItemsData, setDinnerItemsData] = useState<any>(null);
  const [dinnerItemsLoading, setDinnerItemsLoading] = useState(false);
  const [dinnerItemsError, setDinnerItemsError] = useState<any>(null);

  // Load usual dinner items
  useEffect(() => {
    if (isAuthenticated) {
      const loadDinnerItems = async () => {
        try {
          setDinnerItemsLoading(true);
          setDinnerItemsError(null);
          const result = await getUsualDinnerItems(6);
          if (result && result.success) {
            setDinnerItemsData({ success: true, data: result });
          }
        } catch (error: any) {
          setDinnerItemsError(error);
        } finally {
          setDinnerItemsLoading(false);
        }
      };
      loadDinnerItems();
    }
  }, [isAuthenticated, getUsualDinnerItems]);

  // Transform API data to component format - only use API data
  const dinnerItems: UsualDinnerItem[] = useMemo(() => {
    if (dinnerItemsData?.success && dinnerItemsData.data?.items && dinnerItemsData.data.items.length > 0) {
      return dinnerItemsData.data.items;
    }
    // Also check if items are directly in data
    if (dinnerItemsData?.items && Array.isArray(dinnerItemsData.items) && dinnerItemsData.items.length > 0) {
      return dinnerItemsData.items;
    }
    // No fallback - return empty array if API has no data
    return [];
  }, [dinnerItemsData]);

  // Error state is shown in UI - no toast needed

  const handleItemPress = useCallback((item: UsualDinnerItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('Selected usual dinner item:', item);
    // Navigate to meal details
    if (item.dish_id) {
      router.push({
        pathname: '/meal-details' as any,
        params: { mealId: item.dish_id },
      });
    } else if (item.foodCreator_id) {
      router.push({
        pathname: '/foodCreator' as any,
        params: { foodCreatorId: item.foodCreator_id },
      });
    }
  }, [router]);

  // Only show skeleton during initial load, never after initial load is complete
  if (dinnerItemsLoading && isAuthenticated && !hasInitialLoadCompleted) {
    return (
      <SkeletonWithTimeout isLoading={dinnerItemsLoading}>
        <UsualDinnerSectionSkeleton itemCount={4} />
      </SkeletonWithTimeout>
    );
  }

  // Hide section if no items (don't show empty state)
  if (dinnerItems.length === 0) {
    return null;
  }

  return (
    <View style={{ marginBottom: 24 }}>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 12,
      }}>
        <Text style={{
          color: '#1a1a1a',
          fontSize: 20,
          fontWeight: '700',
          lineHeight: 24,
        }}>
          Your Dinner Favourites
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingLeft: 12,
          gap: 12,
        }}
      >
        {dinnerItems.map((item) => (
          <TouchableOpacity
            key={item.dish_id}
            onPress={() => handleItemPress(item)}
            style={{
              width: 120,
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3,
            }}
            activeOpacity={0.8}
          >
            <View style={{ position: 'relative', marginBottom: 8 }}>
              {item.image_url ? (
                <Image
                  source={{ uri: item.image_url }}
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: 12,
                  }}
                  contentFit="cover"
                />
              ) : (
                <View style={{
                  width: 96,
                  height: 96,
                  borderRadius: 12,
                  backgroundColor: '#f5f5f5',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 24 }}>🍽️</Text>
                </View>
              )}
              <View style={{
                position: 'absolute',
                top: 6,
                right: 6,
                backgroundColor: '#F59E0B',
                borderRadius: 12,
                paddingHorizontal: 6,
                paddingVertical: 2,
                flexDirection: 'row',
                alignItems: 'center'
              }}>
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600', marginRight: 2 }}>
                  15m
                </Text>
                <Ionicons name="time-outline" size={8} color="#ffffff" />
              </View>
            </View>

            <Text style={{
              fontSize: 12,
              fontWeight: '500',
              color: '#000',
              marginBottom: 4
            }} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={{
              fontSize: 14,
              fontWeight: 'bold',
              color: '#000'
            }}>
              £{(item.price / 100).toFixed(2)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// Play to Win Section Component
export function PlayToWinSection({
  userBehavior,
  hasInitialLoadCompleted = false,
}: {
  userBehavior: UserBehavior;
  hasInitialLoadCompleted?: boolean;
}) {
  const { isAuthenticated } = useAuthContext();
  const router = useRouter();
  const { getConnections } = useConnections();
  const [colleaguesData, setColleaguesData] = useState<any>(null);
  const [colleaguesLoading, setColleaguesLoading] = useState(false);
  const [colleaguesError, setColleaguesError] = useState<any>(null);
  const [playToWinHistoryData, setPlayToWinHistoryData] = useState<any>(null);

  // Load colleague connections
  useEffect(() => {
    if (isAuthenticated) {
      const loadColleagues = async () => {
        try {
          setColleaguesLoading(true);
          setColleaguesError(null);
          const result = await getConnections();
          if (result && result.success) {
            // Filter for colleague connections
            const colleagues = (result.data || []).filter((conn: any) =>
              conn.connection_type === 'colleague'
            );
            setColleaguesData({
              success: true,
              data: {
                colleagueCount: colleagues.length,
                colleagues: colleagues
              }
            });
          }
        } catch (error: any) {
          setColleaguesError(error);
        } finally {
          setColleaguesLoading(false);
        }
      };
      loadColleagues();
    }
  }, [isAuthenticated, getConnections]);

  // Use play to win history from userBehavior prop
  useEffect(() => {
    if (userBehavior?.playToWinHistory) {
      setPlayToWinHistoryData({
        success: true,
        data: {
          gamesPlayed: userBehavior.playToWinHistory.gamesPlayed || 0,
          gamesWon: userBehavior.playToWinHistory.gamesWon || 0,
          lastPlayed: userBehavior.playToWinHistory.lastPlayed?.getTime() || null,
        },
      });
    }
  }, [userBehavior]);

  // Combine API data with userBehavior fallback
  const data = useMemo(() => {
    const baseData = getPlayToWinData(userBehavior);

    // Override with API data if available
    if (colleaguesData?.success && colleaguesData.data) {
      baseData.colleagueConnections = colleaguesData.data.colleagueCount || userBehavior.colleagueConnections || 0;
    } else if (userBehavior.colleagueConnections) {
      baseData.colleagueConnections = userBehavior.colleagueConnections;
    }

    if (playToWinHistoryData?.success && playToWinHistoryData.data) {
      baseData.playHistory = {
        gamesPlayed: playToWinHistoryData.data.gamesPlayed || 0,
        gamesWon: playToWinHistoryData.data.gamesWon || 0,
        lastPlayed: playToWinHistoryData.data.lastPlayed
          ? new Date(playToWinHistoryData.data.lastPlayed)
          : undefined,
      };
    } else if (userBehavior.playToWinHistory) {
      baseData.playHistory = {
        gamesPlayed: userBehavior.playToWinHistory.gamesPlayed || 0,
        gamesWon: userBehavior.playToWinHistory.gamesWon || 0,
        lastPlayed: userBehavior.playToWinHistory.lastPlayed,
      };
    }

    return baseData;
  }, [userBehavior, colleaguesData, playToWinHistoryData]);

  // Handle errors
  // Error states are shown in UI - no toasts needed

  const handleStartGame = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log('Starting play to win game');
    // Navigate to game creation screen
    router.push('/play-to-win/create' as any);
  }, [router]);

  const handleInviteColleagues = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('Inviting colleagues');
    // Navigate to colleague invitation screen
    router.push('/play-to-win/invite' as any);
  }, [router]);

  // Only show skeleton during initial load, never after initial load is complete
  if (colleaguesLoading && isAuthenticated && !hasInitialLoadCompleted) {
    return (
      <SkeletonWithTimeout isLoading={colleaguesLoading}>
        <PlayToWinSectionSkeleton />
      </SkeletonWithTimeout>
    );
  }

  // Hide section if no colleagues available (don't show empty state)
  if ((colleaguesData?.success && colleaguesData.data?.colleagueCount === 0) ||
    (data.colleagueConnections === 0 && isAuthenticated)) {
    return null;
  }

  return (
    <View style={{ marginBottom: 24 }}>
      <View style={{ paddingHorizontal: 12 }}>
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: '#E5E7EB',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          <View style={{ padding: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
              <View style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: '#FF3B30', // Cribnosh red
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 16,
                shadowColor: '#FF3B30',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}>
                <Ionicons name="game-controller" size={24} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  color: '#1a1a1a',
                  fontSize: 18,
                  fontWeight: '700',
                  marginBottom: 4,
                  lineHeight: 22,
                }}>
                  Free Lunch Game
                </Text>
                <Text style={{
                  color: '#6B7280',
                  fontSize: 14,
                  fontWeight: '500',
                }}>
                  {data.colleagueConnections} colleagues available
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
              <TouchableOpacity
                onPress={handleStartGame}
                style={{
                  flex: 1,
                  backgroundColor: '#FF3B30', // Cribnosh red
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: 'center',
                  shadowColor: '#FF3B30',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 3,
                }}
                activeOpacity={0.8}
              >
                <Text style={{
                  color: '#ffffff',
                  fontSize: 15,
                  fontWeight: '600',
                }}>
                  Start Game
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleInviteColleagues}
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(255, 59, 48, 0.1)',
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#FF3B30',
                }}
                activeOpacity={0.8}
              >
                <Text style={{
                  color: '#FF3B30',
                  fontSize: 15,
                  fontWeight: '600',
                }}>
                  Invite More
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{
              paddingTop: 16,
              borderTopWidth: 1,
              borderTopColor: '#F3F4F6',
              alignItems: 'center',
            }}>
              <View style={{
                backgroundColor: '#F0FDF4',
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderWidth: 1,
                borderColor: '#D1FAE5',
              }}>
                <Text style={{
                  color: '#065F46',
                  fontSize: 12,
                  fontWeight: '600',
                  textAlign: 'center',
                }}>
                  All items are £{data.freeAmount} • Max {data.maxParticipants} players
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

// Main Hidden Sections Component
export function HiddenSections({
  userBehavior,
  hasInitialLoadCompleted = false,
  isFirstSection = false,
}: {
  userBehavior: UserBehavior;
  hasInitialLoadCompleted?: boolean;
  isFirstSection?: boolean;
}) {
  return (
    <View style={{ paddingTop: isFirstSection ? 15 : 0 }}>
      <UsualDinnerSection
        userBehavior={userBehavior}
        hasInitialLoadCompleted={hasInitialLoadCompleted}
      />
      <PlayToWinSection
        userBehavior={userBehavior}
        hasInitialLoadCompleted={hasInitialLoadCompleted}
      />
    </View>
  );
} 