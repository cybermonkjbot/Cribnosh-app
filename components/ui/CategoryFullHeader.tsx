import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

interface CategoryFullHeaderProps {
  categoryName: string;
  categoryDescription?: string;
  onBack: () => void;
  selectedSegment?: 'forYou' | 'all';
  onSegmentChange?: (segment: 'forYou' | 'all') => void;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
}

export function CategoryFullHeader({
  categoryName,
  categoryDescription,
  onBack,
  selectedSegment = 'forYou',
  onSegmentChange,
  onSearch,
  searchPlaceholder = "Search Stans Kitchens"
}: CategoryFullHeaderProps) {
  return (
    <View style={styles.container as ViewStyle}>
      {/* Drag Handle */}
      <View style={styles.dragHandle as ViewStyle} />
      
      {/* Header Content */}
      <View style={styles.headerContent as ViewStyle}>
        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton as ViewStyle} 
          onPress={onBack}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={17} color="#094327" />
          <Text style={styles.backText as any}>Back</Text>
        </TouchableOpacity>
        
        {/* Title Section */}
        <View style={styles.titleSection as ViewStyle}>
          <Text style={styles.categoryLabel as any}>Category</Text>
          <View style={styles.titleRow as ViewStyle}>
            <Text style={styles.categoryName as any}>{categoryName}</Text>
            {categoryDescription && (
              <TouchableOpacity style={styles.infoButton as ViewStyle}>
                <Ionicons name="information-circle" size={16} color="#094327" />
              </TouchableOpacity>
            )}
          </View>
          {categoryDescription && (
            <Text style={styles.categoryDescription as any}>{categoryDescription}</Text>
          )}
        </View>
        
        {/* Segmented Control */}
        <View style={styles.segmentedControl as ViewStyle}>
          <TouchableOpacity
            style={selectedSegment === 'forYou' ? [styles.segmentButton, styles.segmentButtonActive] as any : styles.segmentButton as any}
            onPress={() => onSegmentChange?.('forYou')}
          >
            <Text style={selectedSegment === 'forYou' ? [styles.segmentText, styles.segmentTextActive] as any : styles.segmentText as any}>
              For you
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={selectedSegment === 'all' ? [styles.segmentButton, styles.segmentButtonActive] as any : styles.segmentButton as any}
            onPress={() => onSegmentChange?.('all')}
          >
            <Text style={selectedSegment === 'all' ? [styles.segmentText, styles.segmentTextActive] as any : styles.segmentText as any}>
              All
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 20,
    paddingBottom: 24,
  },
  dragHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerContent: {
    gap: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingLeft: 4,
  },
  backText: {
    fontSize: 17,
    fontWeight: '500',
    color: '#094327',
    letterSpacing: -0.02,
  },
  titleSection: {
    gap: 8,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FF3B30',
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#094327',
    lineHeight: 32,
    letterSpacing: -0.02,
  },
  infoButton: {
    padding: 4,
  },
  categoryDescription: {
    fontSize: 16,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 22,
    marginLeft: 4,
    letterSpacing: -0.01,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    alignSelf: 'flex-start',
  },
  segmentButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  segmentText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
    lineHeight: 20,
    letterSpacing: -0.01,
  },
  segmentTextActive: {
    fontWeight: '600',
    color: '#094327',
  },
}); 