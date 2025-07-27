import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface CategoryChip {
  id: string;
  label: string;
  color: string;
}

const categories: CategoryChip[] = [
  { id: 'all', label: 'All', color: '#dc2626' }, // Cribnosh orange-red (active)
  { id: 'sushi', label: 'Sushi', color: '#7c3aed' },
  { id: 'pizza', label: 'Pizza', color: '#059669' },
  { id: 'burgers', label: 'Burgers', color: '#d97706' },
  { id: 'chinese', label: 'Chinese', color: '#db2777' },
  { id: 'italian', label: 'Italian', color: '#2563eb' },
  { id: 'indian', label: 'Indian', color: '#dc2626' },
  { id: 'mexican', label: 'Mexican', color: '#16a34a' },
  { id: 'thai', label: 'Thai', color: '#9333ea' },
  { id: 'japanese', label: 'Japanese', color: '#ea580c' }
];

export function CategoryFilterChips() {
  const [activeCategory, setActiveCategory] = useState('all');

  const handleCategoryPress = (categoryId: string) => {
    // Add subtle haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveCategory(categoryId);
  };

  return (
    <View style={{ 
      backgroundColor: 'transparent',
      paddingTop: 12, // Increased from 8 to add more top padding
      paddingBottom: 12,
    }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          gap: 8,
        }}
      >
        {categories.map((category) => {
          const isActive = activeCategory === category.id;
          
          return (
            <TouchableOpacity
              key={category.id}
              onPress={() => handleCategoryPress(category.id)}
              style={{
                borderRadius: 20,
                overflow: 'hidden',
                minWidth: 60,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isActive ? 0.25 : 0.15,
                shadowRadius: isActive ? 6 : 3,
                elevation: isActive ? 6 : 3,
              }}
              activeOpacity={0.8}
            >
              <BlurView
                intensity={isActive ? 60 : 80}
                tint="light"
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  backgroundColor: isActive 
                    ? `${category.color}40` // Semi-transparent brand color for active state
                    : 'rgba(255, 255, 255, 0.2)', // Glass-like transparent background
                  borderWidth: 1,
                  borderColor: isActive 
                    ? `${category.color}60` // Semi-transparent brand color border
                    : 'rgba(255, 255, 255, 0.3)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: isActive ? '600' : '500',
                    color: isActive ? category.color : '#374151',
                    textAlign: 'center',
                    textShadowColor: isActive ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.6)',
                    textShadowOffset: { width: 0, height: 0.5 },
                    textShadowRadius: 1,
                  }}
                >
                  {category.label}
                </Text>
              </BlurView>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
} 