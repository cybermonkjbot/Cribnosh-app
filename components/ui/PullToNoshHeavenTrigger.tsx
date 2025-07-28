import { ChefHat, Sparkles, Utensils } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';

interface PullToNoshHeavenTriggerProps {
  isVisible: boolean;
  onTrigger: () => void;
}

export function PullToNoshHeavenTrigger({
  isVisible,
  onTrigger,
}: PullToNoshHeavenTriggerProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      // Fade in when becoming visible
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      // Fade out when becoming invisible
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible, fadeAnim]);

  return (
    <Animated.View 
      style={{
        opacity: fadeAnim,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        paddingHorizontal: 20,
      }}
      pointerEvents={isVisible ? 'auto' : 'none'}
    >
      {/* Icons */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
      }}>
        <Utensils size={20} color="#666" />
        <ChefHat size={20} color="#666" />
        <Sparkles size={20} color="#666" />
      </View>

      {/* Simple message text only */}
      <Text style={{
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
      }}>
        Pull to Enter Nosh Heaven 🍽️
      </Text>
    </Animated.View>
  );
} 