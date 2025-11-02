import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type KitchenSentimentType = 
  | 'bussing' 
  | 'mid' 
  | 'notIt'
  | 'fire'
  | 'slaps'
  | 'decent'
  | 'meh'
  | 'trash'
  | 'elite'
  | 'solid'
  | 'average'
  | 'skip';

interface KitchenRatingProps {
  sentiment: KitchenSentimentType;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
  compact?: boolean;
}

const sentimentStyles = {
  // Positive sentiments
  bussing: {
    bg: '#10B981',
    text: '#FFFFFF',
    icon: 'star',
    label: 'Mostly Bussing',
    compactLabel: 'Bussing'
  },
  fire: {
    bg: '#F59E0B',
    text: '#FFFFFF',
    icon: 'flame',
    label: 'Mostly Fire',
    compactLabel: 'Fire'
  },
  slaps: {
    bg: '#3B82F6',
    text: '#FFFFFF',
    icon: 'hand-left',
    label: 'Mostly Slaps',
    compactLabel: 'Slaps'
  },
  elite: {
    bg: '#059669',
    text: '#FFFFFF',
    icon: 'diamond',
    label: 'Elite Kitchen',
    compactLabel: 'Elite'
  },
  
  // Neutral sentiments
  mid: {
    bg: '#F59E0B',
    text: '#FFFFFF',
    icon: 'star-outline',
    label: 'Mostly Mid',
    compactLabel: 'Mid'
  },
  decent: {
    bg: '#7C3AED',
    text: '#FFFFFF',
    icon: 'thumbs-up',
    label: 'Mostly Decent',
    compactLabel: 'Decent'
  },
  solid: {
    bg: '#0284C7',
    text: '#FFFFFF',
    icon: 'fitness',
    label: 'Solid Kitchen',
    compactLabel: 'Solid'
  },
  average: {
    bg: '#64748B',
    text: '#FFFFFF',
    icon: 'analytics',
    label: 'Average Kitchen',
    compactLabel: 'Average'
  },
  
  // Negative sentiments
  notIt: {
    bg: '#EF4444',
    text: '#FFFFFF',
    icon: 'star-outline',
    label: 'Mostly Not It',
    compactLabel: 'Not It'
  },
  meh: {
    bg: '#EF4444',
    text: '#FFFFFF',
    icon: 'remove-circle',
    label: 'Mostly Meh',
    compactLabel: 'Meh'
  },
  trash: {
    bg: '#DC2626',
    text: '#FFFFFF',
    icon: 'trash',
    label: 'Mostly Trash',
    compactLabel: 'Trash'
  },
  skip: {
    bg: '#EF4444',
    text: '#FFFFFF',
    icon: 'play-skip-forward',
    label: 'Skip This Kitchen',
    compactLabel: 'Skip'
  },
};

const sizeStyles = {
  small: {
    container: { paddingHorizontal: 6, paddingVertical: 2 },
    text: { fontSize: 10 },
    icon: 12,
  },
  medium: {
    container: { paddingHorizontal: 8, paddingVertical: 3 },
    text: { fontSize: 12 },
    icon: 14,
  },
  large: {
    container: { paddingHorizontal: 10, paddingVertical: 4 },
    text: { fontSize: 14 },
    icon: 16,
  },
};

export function KitchenRating({ 
  sentiment, 
  showLabel = true, 
  size = 'medium', 
  compact = false 
}: KitchenRatingProps) {
  const sentimentStyle = sentimentStyles[sentiment];
  const sizeStyle = sizeStyles[size];
  const displayLabel = compact ? sentimentStyle.compactLabel : sentimentStyle.label;

  return (
    <View style={[
      styles.container,
      sizeStyle.container,
      { backgroundColor: sentimentStyle.bg }
    ]}>
      <Ionicons
        name={sentimentStyle.icon as any}
        size={sizeStyle.icon}
        color={sentimentStyle.text}
        style={styles.icon}
      />
      {showLabel && (
        <Text style={[
          styles.text, 
          sizeStyle.text,
          { color: sentimentStyle.text }
        ]}>
          {displayLabel}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 12,
  },
  icon: {
    marginRight: 2,
  },
  text: {
    fontWeight: '600' as const,
  },
}); 