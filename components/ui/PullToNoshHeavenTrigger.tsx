import { ChefHat, Sparkles, Utensils } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

interface PullToNoshHeavenTriggerProps {
  isVisible: boolean;
  onTrigger: () => void;
}

export function PullToNoshHeavenTrigger({
  isVisible,
  onTrigger,
}: PullToNoshHeavenTriggerProps) {
  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  return (
    <View style={{
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 20,
      paddingHorizontal: 20,
    }}>
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
    </View>
  );
} 