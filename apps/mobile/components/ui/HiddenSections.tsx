import { Ionicons } from '@expo/vector-icons'; // Added Ionicons import
import * as Haptics from 'expo-haptics';
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
          paddingLeft: 12, // Changed from paddingHorizontal to paddingLeft only
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
                backgroundColor: '#F59E0B', // Changed to Cribnosh golden/orange color for prep time
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