import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import HearEmoteIcon from '../HearEmoteIcon';

interface MealHeaderProps {
  onBack: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
}

export function MealHeader({ onBack, onFavorite, isFavorite = false }: MealHeaderProps) {
  return (
    <View style={styles.container}>
      {/* Drag handle bar */}
      <View style={styles.dragHandle} />
      
      {/* Header with back button and heart */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="chevron-back" size={24} color="#094327" />
          <Text style={styles.backLabel}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.heartButton} onPress={onFavorite}>
          <HearEmoteIcon width={24} height={24} liked={isFavorite} onLikeChange={onFavorite} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 10,
    paddingBottom: 15,
  },
  
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E5E5',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 15,
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  
  backLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#094327',
    marginLeft: 4,
  },
  
  heartButton: {
    padding: 8,
  },
}); 