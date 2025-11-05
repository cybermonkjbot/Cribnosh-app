import { useAppContext } from '@/utils/AppContext';
import { BlurEffect } from '@/utils/blurEffects';
import { getCompleteDynamicHeader } from '@/utils/dynamicHeaderMessages';
import { shadowPresets } from '@/utils/platformStyles';
import { useTopPosition } from '@/utils/positioning';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { CribNoshLogo } from './CribNoshLogo';

interface HeaderProps {
  userName?: string;
  isSticky?: boolean;
  showSubtitle?: boolean;
}

export function Header({ userName = "", isSticky = false, showSubtitle = false }: HeaderProps) {
  const { activeHeaderTab, handleHeaderTabChange } = useAppContext();
  const router = useRouter();
  const topPosition = useTopPosition(0);
  const [dynamicMessage, setDynamicMessage] = useState(() => getCompleteDynamicHeader(userName, showSubtitle));
  
  // Animation values
  const logoScale = useSharedValue(isSticky ? 0.95 : 1);
  const greetingOpacity = useSharedValue(isSticky ? 0 : 1);
  const buttonsScale = useSharedValue(isSticky ? 0.95 : 1);
  const avatarScale = useSharedValue(isSticky ? 0.73 : 1);

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
        avatarScale.value = withTiming(0.73, { duration, easing });
      } else {
        // Animate to normal state - concurrent updates
        logoScale.value = withTiming(1, { duration, easing });
        greetingOpacity.value = withTiming(1, { duration, easing });
        buttonsScale.value = withTiming(1, { duration, easing });
        avatarScale.value = withTiming(1, { duration, easing });
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

  const avatarAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: avatarScale.value }],
    };
  });

  // Handle avatar press
  const handleAvatarPress = () => {
    router.push('/account-details');
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

            {/* Compact Avatar with Animation */}
            {userName && (
              <TouchableOpacity onPress={handleAvatarPress}>
                <Animated.View 
                  style={[
                    { 
                      width: 32, 
                      height: 32, 
                      borderRadius: 16, 
                      backgroundColor: '#000', 
                      overflow: 'hidden',
                    },
                    avatarAnimatedStyle
                  ]}
                >
                  <Image
                    source={{ uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=32&h=32&fit=crop&crop=face' }}
                    style={{ width: 32, height: 32 }}
                    contentFit="cover"
                  />
                </Animated.View>
              </TouchableOpacity>
            )}
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
      {/* Logo and Avatar Row with Animation */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Animated.View 
          style={[
            { alignItems: 'center' },
            logoAnimatedStyle
          ]}
        >
          <CribNoshLogo size={120} variant="default" />
        </Animated.View>
        
        {userName && (
          <TouchableOpacity onPress={handleAvatarPress}>
            <Animated.View 
              style={[
                { 
                  width: 44, 
                  height: 44, 
                  borderRadius: 22, 
                  backgroundColor: '#000', 
                  overflow: 'hidden',
                },
                avatarAnimatedStyle
              ]}
            >
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=44&h=44&fit=crop&crop=face' }}
                style={{ width: 44, height: 44 }}
                contentFit="cover"
              />
            </Animated.View>
          </TouchableOpacity>
        )}
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