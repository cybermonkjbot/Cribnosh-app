import * as Haptics from 'expo-haptics';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import {
  getPlayToWinData,
  getUsualDinnerData,
  UserBehavior
} from '../../utils/hiddenSections';

// Usual Dinner Section Component
export function UsualDinnerSection({ userBehavior }: { userBehavior: UserBehavior }) {
  const data = getUsualDinnerData(userBehavior);
  
  const handleItemPress = (item: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('Selected usual dinner item:', item);
    // Handle item selection
  };

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
          {data.title}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 12,
          gap: 12,
        }}
      >
        {data.items.map((item, index) => (
          <TouchableOpacity
            key={index}
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
              <View style={{
                position: 'absolute',
                top: 6,
                right: 6,
                backgroundColor: '#ef4444',
                borderRadius: 12,
                paddingHorizontal: 6,
                paddingVertical: 2,
                flexDirection: 'row',
                alignItems: 'center'
              }}>
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600', marginRight: 2 }}>
                  Usual
                </Text>
                <Text style={{ fontSize: 8 }}>⭐</Text>
              </View>
            </View>
            
            <Text style={{ 
              fontSize: 12, 
              fontWeight: '500', 
              color: '#000',
              marginBottom: 4 
            }} numberOfLines={1}>
              {item}
            </Text>
            <Text style={{ 
              fontSize: 14, 
              fontWeight: 'bold', 
              color: '#000' 
            }}>
              Order again
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// Play to Win Section Component
export function PlayToWinSection({ userBehavior }: { userBehavior: UserBehavior }) {
  const data = getPlayToWinData(userBehavior);
  
  const handleStartGame = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log('Starting play to win game');
    // Handle game start
  };

  const handleInviteColleagues = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('Inviting colleagues');
    // Handle colleague invitation
  };

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
          {data.title}
        </Text>
      </View>

      <View style={{ paddingHorizontal: 12 }}>
        <View
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 16,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.15)',
          }}
        >
          <View style={{ padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: '#ef4444',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}>
                <Text style={{ color: '#ffffff', fontSize: 20, fontWeight: '600' }}>
                  🎮
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  color: '#1a1a1a',
                  fontSize: 16,
                  fontWeight: '700',
                  marginBottom: 2,
                  lineHeight: 20,
                }}>
                  Free Lunch Game
                </Text>
                <Text style={{
                  color: '#666666',
                  fontSize: 13,
                  fontWeight: '400',
                }}>
                  {data.colleagueConnections} colleagues available
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={handleStartGame}
                style={{
                  flex: 1,
                  backgroundColor: '#ef4444',
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: 'center',
                }}
                activeOpacity={0.8}
              >
                <Text style={{
                  color: '#ffffff',
                  fontSize: 14,
                  fontWeight: '600',
                }}>
                  Start Game
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleInviteColleagues}
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#ef4444',
                }}
                activeOpacity={0.8}
              >
                <Text style={{
                  color: '#ef4444',
                  fontSize: 14,
                  fontWeight: '600',
                }}>
                  Invite More
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ 
              marginTop: 12, 
              paddingTop: 12, 
              borderTopWidth: 1, 
              borderTopColor: 'rgba(255, 255, 255, 0.15)' 
            }}>
              <Text style={{
                color: '#666666',
                fontSize: 12,
                textAlign: 'center',
                fontWeight: '400',
              }}>
                All items are £{data.freeAmount} • Max {data.maxParticipants} players
              </Text>
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