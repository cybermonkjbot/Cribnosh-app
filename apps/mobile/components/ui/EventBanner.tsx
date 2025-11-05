import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface EventBannerProps {
  onPress?: () => void;
}

export function EventBanner({ onPress }: EventBannerProps) {
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 20 }}>
      <TouchableOpacity 
        style={{ borderRadius: 16, overflow: 'hidden' }}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={{ position: 'relative', height: 100 }}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=100&fit=crop' }}
            style={{ width: '100%', height: 100 }}
            contentFit="cover"
          />
          
          {/* Dark overlay for better text readability */}
          <LinearGradient
            colors={['rgba(234, 88, 12, 0.8)', 'rgba(194, 65, 12, 0.9)']}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
          
          <View style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            justifyContent: 'center', 
            paddingHorizontal: 20 
          }}>
            <Text style={{ 
              color: '#fff', 
              fontSize: 18, 
              fontWeight: 'bold',
              marginBottom: 2
            }}>
              Get chef for an event
            </Text>
            <Text style={{ 
              color: '#fff', 
              fontSize: 14,
              opacity: 0.95
            }}>
              Make a custom meal
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
} 