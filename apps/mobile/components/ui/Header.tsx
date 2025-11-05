import { useGetNotificationStatsQuery } from '@/store/customerApi';
import { useAppContext } from '@/utils/AppContext';
import { BlurEffect } from '@/utils/blurEffects';
import { getCompleteDynamicHeader } from '@/utils/dynamicHeaderMessages';
import { shadowPresets } from '@/utils/platformStyles';
import { useTopPosition } from '@/utils/positioning';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Bell, Settings } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useAuthContext } from '../../contexts/AuthContext';
import { CribNoshLogo } from './CribNoshLogo';

interface HeaderProps {
  userName?: string;
  isSticky?: boolean;
  showSubtitle?: boolean;
  onNotificationsPress?: () => void;
}

export function Header({ userName = "", isSticky = false, showSubtitle = false, onNotificationsPress }: HeaderProps) {
  const { activeHeaderTab, handleHeaderTabChange } = useAppContext();
  const router = useRouter();
  const { isAuthenticated } = useAuthContext();
  const topPosition = useTopPosition(0);
  const [dynamicMessage, setDynamicMessage] = useState(() => getCompleteDynamicHeader(userName, showSubtitle));
  
  // Get notification stats for badge count
  const { data: statsData } = useGetNotificationStatsQuery(undefined, {
    skip: !isAuthenticated || isSticky, // Only fetch in normal header state
  });
  
  const unreadCount = statsData?.data?.unread || 0;
  const showBadge = unreadCount > 0;
  
  // Animation values
  const logoScale = useSharedValue(isSticky ? 0.95 : 1);
  const greetingOpacity = useSharedValue(isSticky ? 0 : 1);
  const buttonsScale = useSharedValue(isSticky ? 0.95 : 1);
  const notificationScale = useSharedValue(isSticky ? 0.73 : 1);
  const pillSelectorScale = useSharedValue(isSticky ? 0.73 : 1);

  // Update dynamic message periodically
  useEffect(() => {
    const updateMessage = () => {
      setDynamicMessage(getCompleteDynamicHeader(userName, showSubtitle));
    };

    // Update message every 5 minutes to keep it fresh
    const interval = setInterval(updateMessage, 5 * 60 * 1000);
    
    // Also update when component mounts
    updateMessage();

    return () => clearInterval(interval);
  }, [userName, showSubtitle]);

  // React to isSticky prop changes and animate
  useAnimatedReaction(
    () => isSticky,
    (currentIsSticky) => {
      'worklet';
      const duration = 300;
      const easing = Easing.inOut(Easing.ease);

      if (currentIsSticky) {
        // Animate to sticky state - concurrent updates
        logoScale.value = withTiming(0.95, { duration, easing });
        greetingOpacity.value = withTiming(0, { duration, easing });
        buttonsScale.value = withTiming(0.95, { duration, easing });
        notificationScale.value = withTiming(0.73, { duration, easing });
        pillSelectorScale.value = withTiming(0.73, { duration, easing });
      } else {
        // Animate to normal state - concurrent updates
        logoScale.value = withTiming(1, { duration, easing });
        greetingOpacity.value = withTiming(1, { duration, easing });
        buttonsScale.value = withTiming(1, { duration, easing });
        notificationScale.value = withTiming(1, { duration, easing });
        pillSelectorScale.value = withTiming(1, { duration, easing });
      }
    },
    [isSticky]
  );

  // Animated styles
  const logoAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: logoScale.value }],
    };
  });

  const greetingAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: greetingOpacity.value,
    };
  });

  const buttonsAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonsScale.value }],
    };
  });

  const notificationAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: notificationScale.value }],
    };
  });

  const pillSelectorAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pillSelectorScale.value }],
    };
  });

  // Handle notifications press
  const handleNotificationsPress = () => {
    if (onNotificationsPress) {
      onNotificationsPress();
    }
  };

  // Handle pill selector press
  const handlePillSelectorPress = () => {
    // TODO: Implement pill selector functionality
  };

  if (isSticky) {
    // Sticky/Optimized Header State
    return (
      <BlurEffect
        intensity={80} 
        tint="light" 
        useGradient={true}
        style={{
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255, 255, 255, 0.2)',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          paddingTop: topPosition + 8,
          paddingBottom: 25,
          paddingHorizontal: 16,
          minHeight: 70,
          ...shadowPresets.lg(),
        }}
      >
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          gap: 0
        }}>
          {/* Compact Logo with Animation */}
          <Animated.View 
            style={[
              { alignItems: 'center' },
              logoAnimatedStyle
            ]}
          >
            <CribNoshLogo size={88} variant="default" />
          </Animated.View>

          {/* Right side: Tabs and Avatar grouped together */}
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center',
            gap: 4
          }}>
            {/* Compact Toggle Buttons with Animation */}
            <Animated.View 
              style={[
                { 
                  flexDirection: 'row', 
                  gap: 8,
                  alignItems: 'center',
                },
                buttonsAnimatedStyle
              ]}
            >
              <TouchableOpacity
                onPress={() => handleHeaderTabChange('for-you')}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 18,
                  backgroundColor: activeHeaderTab === 'for-you' ? '#111827' : 'rgba(255, 255, 255, 0.8)',
                  borderWidth: activeHeaderTab === 'for-you' ? 0 : 1,
                  borderColor: 'rgba(229, 231, 235, 0.5)',
                  minWidth: 70,
                  minHeight: 32,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: activeHeaderTab === 'for-you' ? '#fff' : '#374151',
                  textAlign: 'center',
                }}>
                  For you
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleHeaderTabChange('live')}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 18,
                  backgroundColor: activeHeaderTab === 'live' ? '#111827' : 'rgba(255, 255, 255, 0.8)',
                  borderWidth: activeHeaderTab === 'live' ? 0 : 1,
                  borderColor: 'rgba(229, 231, 235, 0.5)',
                  minWidth: 60,
                  minHeight: 32,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: activeHeaderTab === 'live' ? '#fff' : '#374151',
                  textAlign: 'center',
                }}>
                  Live
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </BlurEffect>
    );
  }

  // Normal Header State
  return (
    <LinearGradient
      colors={['#f5e6f0', '#f9f2e8']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ paddingTop: 60, paddingBottom: 20, paddingHorizontal: 16 }}
    >
      {/* Logo and Notifications Row with Animation */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Animated.View 
          style={[
            { alignItems: 'center' },
            logoAnimatedStyle
          ]}
        >
          <CribNoshLogo size={120} variant="default" />
        </Animated.View>
        
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity onPress={handleNotificationsPress}>
            <Animated.View 
              style={[
                { 
                  width: 44, 
                  height: 44, 
                  justifyContent: 'center',
                  alignItems: 'center',
                },
                notificationAnimatedStyle
              ]}
            >
              <View style={{ position: 'relative' }}>
                <Bell size={24} color="#374151" />
                {showBadge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            </Animated.View>
          </TouchableOpacity>

          {/* Pill Selector with Animation */}
          <TouchableOpacity onPress={handlePillSelectorPress}>
            <Animated.View 
              style={[
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 24,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: '#fff',
                  borderWidth: 1,
                  borderColor: '#e5e7eb',
                  minHeight: 44,
                  justifyContent: 'center',
                  gap: 8,
                },
                pillSelectorAnimatedStyle
              ]}
            >
              <Settings size={20} color="#374151" />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Greeting with Animation */}
      <Animated.View style={[
        { marginBottom: 20 },
        greetingAnimatedStyle
      ]}>
        {dynamicMessage.greeting && (!dynamicMessage.greeting.startsWith('Hey') || userName) && (
          <Text style={{ fontSize: 16, color: '#6b7280', marginBottom: 4 }}>{dynamicMessage.greeting}</Text>
        )}
        <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#000', lineHeight: 36 }}>
          {dynamicMessage.mainMessage}
        </Text>
        {dynamicMessage.subMessage && (
          <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 4, fontStyle: 'italic' }}>
            {dynamicMessage.subMessage}
          </Text>
        )}
      </Animated.View>

      {/* Toggle Buttons with Animation */}
      <Animated.View 
        style={[
          { 
            flexDirection: 'row', 
            gap: 12,
          },
          buttonsAnimatedStyle
        ]}
      >
        <TouchableOpacity
          onPress={() => handleHeaderTabChange('for-you')}
          style={{
            paddingHorizontal: 20,
            paddingVertical: 8,
            borderRadius: 20,
            backgroundColor: activeHeaderTab === 'for-you' ? '#111827' : '#fff',
            borderWidth: activeHeaderTab === 'for-you' ? 0 : 1,
            borderColor: '#e5e7eb'
          }}
        >
          <Text style={{
            fontSize: 14,
            fontWeight: '500',
            color: activeHeaderTab === 'for-you' ? '#fff' : '#374151'
          }}>
            For you
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleHeaderTabChange('live')}
          style={{
            paddingHorizontal: 20,
            paddingVertical: 8,
            borderRadius: 20,
            backgroundColor: activeHeaderTab === 'live' ? '#111827' : '#fff',
            borderWidth: activeHeaderTab === 'live' ? 0 : 1,
            borderColor: '#e5e7eb'
          }}
        >
          <Text style={{
            fontSize: 14,
            fontWeight: '500',
            color: activeHeaderTab === 'live' ? '#fff' : '#374151'
          }}>
            Live
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#F23E2E',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
});