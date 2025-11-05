import { Ionicons } from '@expo/vector-icons'; // Added Ionicons import
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useMemo } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useGetUsualDinnerItemsQuery, useGetColleagueConnectionsQuery, useGetPlayToWinHistoryQuery } from '@/store/customerApi';
import { useAuthContext } from '@/contexts/AuthContext';
import { showError } from '../../lib/GlobalToastManager';
import {
  getPlayToWinData,
  getUsualDinnerData,
  UserBehavior
} from '../../utils/hiddenSections';
import { UsualDinnerSectionSkeleton } from './UsualDinnerSectionSkeleton';
import { UsualDinnerSectionEmpty } from './UsualDinnerSectionEmpty';
import { PlayToWinSectionSkeleton } from './PlayToWinSectionSkeleton';
import { PlayToWinSectionEmpty } from './PlayToWinSectionEmpty';

interface UsualDinnerItem {
  dish_id: string;
  name: string;
  price: number;
  image_url?: string;
  kitchen_name: string;
  kitchen_id: string;
  order_count: number;
  last_ordered_at: number;
  avg_rating?: number;
}

// Usual Dinner Section Component
export function UsualDinnerSection({ userBehavior }: { userBehavior: UserBehavior }) {
  const { isAuthenticated } = useAuthContext();
  
  // Fetch usual dinner items from API
  const {
    data: dinnerItemsData,
    isLoading: dinnerItemsLoading,
    error: dinnerItemsError,
  } = useGetUsualDinnerItemsQuery(
    { limit: 6 },
    {
      skip: !isAuthenticated,
    }
  );

  // Transform API data to component format
  const dinnerItems: UsualDinnerItem[] = useMemo(() => {
    if (dinnerItemsData?.success && dinnerItemsData.data?.items && dinnerItemsData.data.items.length > 0) {
      return dinnerItemsData.data.items;
    }
    // Fallback to userBehavior data if API fails or no data
    if (userBehavior.usualDinnerItems && userBehavior.usualDinnerItems.length > 0) {
      const fallbackData = getUsualDinnerData(userBehavior);
      return fallbackData.items.map((itemName: string, index: number) => ({
        dish_id: `fallback-${index}`,
        name: itemName,
        price: 0,
        kitchen_name: 'Unknown Kitchen',
        kitchen_id: '',
        order_count: 1,
        last_ordered_at: Date.now(),
      }));
    }
    return [];
  }, [dinnerItemsData, userBehavior]);

  // Handle errors
  React.useEffect(() => {
    if (dinnerItemsError && isAuthenticated) {
      showError('Failed to load dinner favorites', 'Please try again');
    }
  }, [dinnerItemsError, isAuthenticated]);
  
  const handleItemPress = useCallback((item: UsualDinnerItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('Selected usual dinner item:', item);
    // Navigate to meal details
    if (item.dish_id) {
      router.push({
        pathname: '/meal-details',
        params: { mealId: item.dish_id },
      });
    } else if (item.kitchen_id) {
      router.push({
        pathname: '/kitchen',
        params: { kitchenId: item.kitchen_id },
      });
    }
  }, [router]);

  // Show skeleton while loading
  if (dinnerItemsLoading && isAuthenticated) {
    return <UsualDinnerSectionSkeleton itemCount={4} />;
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
export function PlayToWinSection({ userBehavior }: { userBehavior: UserBehavior }) {
  const { isAuthenticated } = useAuthContext();
  
  // Fetch colleague connections and game history from API
  const {
    data: colleaguesData,
    isLoading: colleaguesLoading,
    error: colleaguesError,
  } = useGetColleagueConnectionsQuery(
    undefined,
    {
      skip: !isAuthenticated,
    }
  );

  const {
    data: playToWinHistoryData,
    isLoading: playToWinHistoryLoading,
    error: playToWinHistoryError,
  } = useGetPlayToWinHistoryQuery(
    undefined,
    {
      skip: !isAuthenticated,
    }
  );

  // Combine API data with userBehavior fallback
  const data = useMemo(() => {
    const baseData = getPlayToWinData(userBehavior);
    
    // Override with API data if available
    if (colleaguesData?.success && colleaguesData.data) {
      baseData.colleagueConnections = colleaguesData.data.colleagueCount;
    }
    
    if (playToWinHistoryData?.success && playToWinHistoryData.data) {
      baseData.playHistory = {
        gamesPlayed: playToWinHistoryData.data.gamesPlayed,
        gamesWon: playToWinHistoryData.data.gamesWon,
        lastPlayed: playToWinHistoryData.data.lastPlayed
          ? new Date(playToWinHistoryData.data.lastPlayed)
          : undefined,
      };
    }
    
    return baseData;
  }, [userBehavior, colleaguesData, playToWinHistoryData]);

  // Handle errors
  React.useEffect(() => {
    if (colleaguesError && isAuthenticated) {
      showError('Failed to load colleague connections', 'Please try again');
    }
    if (playToWinHistoryError && isAuthenticated) {
      showError('Failed to load game history', 'Please try again');
    }
  }, [colleaguesError, playToWinHistoryError, isAuthenticated]);
  
  const handleStartGame = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log('Starting play to win game');
    // Navigate to game creation screen
    router.push('/play-to-win/create');
  }, [router]);

  const handleInviteColleagues = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('Inviting colleagues');
    // Navigate to colleague invitation screen
    router.push('/play-to-win/invite');
  }, [router]);

  // Show skeleton while loading
  if ((colleaguesLoading || playToWinHistoryLoading) && isAuthenticated) {
    return <PlayToWinSectionSkeleton />;
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
export function HiddenSections({ userBehavior }: { userBehavior: UserBehavior }) {
  return (
    <View>
      <UsualDinnerSection userBehavior={userBehavior} />
      <PlayToWinSection userBehavior={userBehavior} />
    </View>
  );
} 