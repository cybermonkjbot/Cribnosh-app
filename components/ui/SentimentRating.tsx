import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type SentimentType = 
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

interface SentimentRatingProps {
  sentiment: SentimentType;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const sentimentStyles = {
  // Positive sentiments
  bussing: { bg: '#FEE2E2', text: '#DC2626', emoji: '🔥' },
  fire: { bg: '#FEF3C7', text: '#D97706', emoji: '🔥' },
  slaps: { bg: '#DBEAFE', text: '#2563EB', emoji: '👏' },
  elite: { bg: '#ECFDF5', text: '#059669', emoji: '👑' },
  
  // Neutral sentiments
  mid: { bg: '#FEF3C7', text: '#D97706', emoji: '😐' },
  decent: { bg: '#F3E8FF', text: '#7C3AED', emoji: '👍' },
  solid: { bg: '#E0F2FE', text: '#0284C7', emoji: '💪' },
  average: { bg: '#F1F5F9', text: '#64748B', emoji: '📊' },
  
  // Negative sentiments
  notIt: { bg: '#E5E7EB', text: '#4B5563', emoji: '😕' },
  meh: { bg: '#FEF2F2', text: '#EF4444', emoji: '😐' },
  trash: { bg: '#FEE2E2', text: '#DC2626', emoji: '🗑️' },
  skip: { bg: '#FEF2F2', text: '#EF4444', emoji: '⏭️' },
};

const sizeStyles = {
  small: {
    container: { paddingHorizontal: 6, paddingVertical: 2 },
    text: { fontSize: 10 },
  },
  medium: {
    container: { paddingHorizontal: 8, paddingVertical: 3 },
    text: { fontSize: 12 },
  },
  large: {
    container: { paddingHorizontal: 10, paddingVertical: 4 },
    text: { fontSize: 14 },
  },
};

export function SentimentRating({ 
  sentiment, 
  showLabel = true, 
  size = 'medium' 
}: SentimentRatingProps) {
  const sentimentStyle = sentimentStyles[sentiment];
  const sizeStyle = sizeStyles[size];

  return (
    <View style={[
      styles.container, 
      sizeStyle.container,
      { backgroundColor: sentimentStyle.bg }
    ]}>
      {showLabel && (
        <Text style={[
          styles.text, 
          sizeStyle.text,
          { color: sentimentStyle.text }
        ]}>
          {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600' as const,
  },
}); 