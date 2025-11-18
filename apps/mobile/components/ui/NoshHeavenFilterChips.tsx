import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { BookOpen, Radio, Video } from 'lucide-react-native';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

export type NoshHeavenCategory = 'all' | 'recipes' | 'stories' | 'live';

interface NoshHeavenFilterChipsProps {
  activeCategory: NoshHeavenCategory;
  onCategoryChange: (category: NoshHeavenCategory) => void;
}

interface CategoryChip {
  id: NoshHeavenCategory;
  label: string;
  icon: typeof BookOpen;
  color: string;
}

const categories: CategoryChip[] = [
  { id: 'all', label: 'All', icon: BookOpen, color: '#FF3B30' }, // Icon not displayed, but required for type
  { id: 'recipes', label: 'Recipes', icon: BookOpen, color: '#FF3B30' },
  { id: 'stories', label: 'Stories', icon: Video, color: '#3B82F6' },
  { id: 'live', label: 'Live', icon: Radio, color: '#FF3B30' },
];

export function NoshHeavenFilterChips({
  activeCategory,
  onCategoryChange,
}: NoshHeavenFilterChipsProps) {
  const handleCategoryPress = (categoryId: NoshHeavenCategory) => {
    // Add subtle haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCategoryChange(categoryId);
  };

  return (
    <View style={{ 
      backgroundColor: 'transparent',
      paddingTop: 12,
      paddingBottom: 12,
    }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingLeft: 16,
          gap: 8,
        }}
      >
        {categories.map((category) => {
          const isActive = activeCategory === category.id;
          const IconComponent = category.icon;
          
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
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  backgroundColor: isActive 
                    ? `${category.color}40` // Semi-transparent brand color for active state
                    : 'rgba(255, 255, 255, 0.2)', // Glass-like transparent background
                  borderWidth: 1,
                  borderColor: isActive 
                    ? `${category.color}60` // Semi-transparent brand color border
                    : 'rgba(255, 255, 255, 0.3)',
                  justifyContent: 'center',
                }}
              >
                {category.id !== 'all' && (
                  <IconComponent
                    size={16}
                    color={isActive ? category.color : '#374151'}
                    style={{ marginRight: 6 }}
                  />
                )}
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

