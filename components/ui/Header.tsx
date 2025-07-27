import { useAppContext } from '@/utils/AppContext';
import { getCompleteDynamicHeader } from '@/utils/dynamicHeaderMessages';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';

interface HeaderProps {
  userName?: string;
  isSticky?: boolean;
  showSubtitle?: boolean;
}

export function Header({ userName = "Joshua", isSticky = false, showSubtitle = false }: HeaderProps) {
  const { activeHeaderTab, handleHeaderTabChange } = useAppContext();
  const [dynamicMessage, setDynamicMessage] = useState(() => getCompleteDynamicHeader(userName, showSubtitle));
  
  // Animation values
  const logoScale = useRef(new Animated.Value(isSticky ? 0.95 : 1)).current;
  const greetingOpacity = useRef(new Animated.Value(isSticky ? 0 : 1)).current;
  const buttonsScale = useRef(new Animated.Value(isSticky ? 0.85 : 1)).current;
  const avatarScale = useRef(new Animated.Value(isSticky ? 0.73 : 1)).current;
  const containerPadding = useRef(new Animated.Value(isSticky ? 12 : 20)).current;

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

  useEffect(() => {
    const duration = 300;
    const config = {
      duration,
      useNativeDriver: false,
    };

    if (isSticky) {
      // Animate to sticky state
      Animated.parallel([
        Animated.timing(logoScale, { toValue: 0.95, ...config }),
        Animated.timing(greetingOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(buttonsScale, { toValue: 0.85, ...config }),
        Animated.timing(avatarScale, { toValue: 0.73, ...config }),
        Animated.timing(containerPadding, { toValue: 12, ...config }),
      ]).start();
    } else {
      // Animate to normal state
      Animated.parallel([
        Animated.timing(logoScale, { toValue: 1, ...config }),
        Animated.timing(greetingOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(buttonsScale, { toValue: 1, ...config }),
        Animated.timing(avatarScale, { toValue: 1, ...config }),
        Animated.timing(containerPadding, { toValue: 20, ...config }),
      ]).start();
    }
  }, [isSticky]);

  if (isSticky) {
    // Sticky/Optimized Header State
    return (
      <BlurView 
        intensity={80} 
        tint="light" 
        style={{
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255, 255, 255, 0.2)',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          paddingTop: 50,
          paddingBottom: 12,
          paddingHorizontal: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
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
            style={{ 
              flexDirection: 'row', 
              alignItems: 'center',
              transform: [{ scale: logoScale }]
            }}
          >
            <Text style={{ 
              fontSize: 22, 
              fontWeight: 'bold', 
              color: '#16a34a',
              textShadowColor: 'rgba(255, 255, 255, 0.8)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 2,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
            }}>Crib</Text>
            <Text style={{ 
              fontSize: 22, 
              fontWeight: 'bold', 
              color: '#dc2626',
              textShadowColor: 'rgba(255, 255, 255, 0.8)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 2,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
            }}>Nosh</Text>
          </Animated.View>

          {/* Right side: Tabs and Avatar grouped together */}
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center',
            gap: 4
          }}>
            {/* Compact Toggle Buttons with Animation */}
            <Animated.View 
              style={{ 
                flexDirection: 'row', 
                gap: 8,
                transform: [{ scale: buttonsScale }]
              }}
            >
              <TouchableOpacity
                onPress={() => handleHeaderTabChange('for-you')}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 6,
                  borderRadius: 16,
                  backgroundColor: activeHeaderTab === 'for-you' ? '#111827' : 'rgba(255, 255, 255, 0.8)',
                  borderWidth: activeHeaderTab === 'for-you' ? 0 : 1,
                  borderColor: 'rgba(229, 231, 235, 0.5)'
                }}
              >
                <Text style={{
                  fontSize: 12,
                  fontWeight: '500',
                  color: activeHeaderTab === 'for-you' ? '#fff' : '#374151'
                }}>
                  For you
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleHeaderTabChange('live')}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 6,
                  borderRadius: 16,
                  backgroundColor: activeHeaderTab === 'live' ? '#111827' : 'rgba(255, 255, 255, 0.8)',
                  borderWidth: activeHeaderTab === 'live' ? 0 : 1,
                  borderColor: 'rgba(229, 231, 235, 0.5)'
                }}
              >
                <Text style={{
                  fontSize: 12,
                  fontWeight: '500',
                  color: activeHeaderTab === 'live' ? '#fff' : '#374151'
                }}>
                  Live
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Compact Avatar with Animation */}
            <Animated.View 
              style={{ 
                width: 32, 
                height: 32, 
                borderRadius: 16, 
                backgroundColor: '#000', 
                overflow: 'hidden',
                transform: [{ scale: avatarScale }]
              }}
            >
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=32&h=32&fit=crop&crop=face' }}
              style={{ width: 32, height: 32 }}
              contentFit="cover"
            />
          </Animated.View>
          </View>
        </View>
      </BlurView>
    );
  }

  // Normal Header State
  return (
    <LinearGradient
      colors={['#f5e6f0', '#f9f2e8']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 }}
    >
      {/* Logo and Avatar Row with Animation */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Animated.View 
          style={{ 
            flexDirection: 'row', 
            alignItems: 'center',
            transform: [{ scale: logoScale }]
          }}
        >
          <Text style={{ 
            fontSize: 24, 
            fontWeight: 'bold', 
            color: '#16a34a',
            textShadowColor: 'rgba(255, 255, 255, 0.8)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            opacity: 0.9,
          }}>Crib</Text>
          <Text style={{ 
            fontSize: 24, 
            fontWeight: 'bold', 
            color: '#dc2626',
            textShadowColor: 'rgba(255, 255, 255, 0.8)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            opacity: 0.9,
          }}>Nosh</Text>
        </Animated.View>
        
        <Animated.View 
          style={{ 
            width: 44, 
            height: 44, 
            borderRadius: 22, 
            backgroundColor: '#000', 
            overflow: 'hidden',
            transform: [{ scale: avatarScale }]
          }}
        >
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=44&h=44&fit=crop&crop=face' }}
            style={{ width: 44, height: 44 }}
            contentFit="cover"
          />
        </Animated.View>
      </View>

      {/* Greeting with Animation */}
      <Animated.View style={{ marginBottom: 20, opacity: greetingOpacity }}>
        <Text style={{ fontSize: 16, color: '#6b7280', marginBottom: 4 }}>{dynamicMessage.greeting}</Text>
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
        style={{ 
          flexDirection: 'row', 
          gap: 12,
          transform: [{ scale: buttonsScale }]
        }}
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