import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TextInput, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';

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
        <TouchableOpacity style={styles.backButton as ViewStyle} onPress={onBack}>
          <Ionicons name="chevron-back" size={17} color="#094327" />
          <Text style={styles.backText as TextStyle}>Back</Text>
        </TouchableOpacity>
        
        {/* Title Section */}
        <View style={styles.titleSection as ViewStyle}>
          <Text style={styles.categoryLabel as TextStyle}>Category</Text>
          <View style={styles.titleRow as ViewStyle}>
            <Text style={styles.categoryName as TextStyle}>{categoryName}</Text>
            {categoryDescription && (
              <TouchableOpacity style={styles.infoButton as ViewStyle}>
                <Ionicons name="information-circle" size={16} color="#094327" />
              </TouchableOpacity>
            )}
          </View>
          {categoryDescription && (
            <Text style={styles.categoryDescription as TextStyle}>{categoryDescription}</Text>
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
        
        {/* Search Bar */}
        <View style={styles.searchContainer as ViewStyle}>
          <Ionicons name="search" size={17} color="rgba(60, 60, 67, 0.6)" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput as any}
            placeholder={searchPlaceholder}
            placeholderTextColor="rgba(60, 60, 67, 0.6)"
            onChangeText={onSearch}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 15,
    paddingBottom: 20,
  },
  dragHandle: {
    width: 85,
    height: 5.51,
    backgroundColor: '#EDEDED',
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 6.47,
  },
  headerContent: {
    gap: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 11,
    paddingLeft: 8,
  },
  backText: {
    fontSize: 17,
    fontWeight: '400',
    color: '#094327',
    letterSpacing: -0.43,
  },
  titleSection: {
    gap: 4,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: '#FF3B30',
    marginLeft: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#094327',
    lineHeight: 32,
  },
  infoButton: {
    padding: 2,
  },
  categoryDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 20,
    marginLeft: 4,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: 'rgba(120, 120, 128, 0.12)',
    borderRadius: 9,
    padding: 2,
    alignSelf: 'flex-start',
  },
  segmentButton: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 7,
    minWidth: 68.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonActive: {
    backgroundColor: '#FAFFFA',
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#000000',
    lineHeight: 18,
    letterSpacing: -0.08,
  },
  segmentTextActive: {
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(120, 120, 128, 0.12)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: '400',
    color: '#000000',
    lineHeight: 22,
    letterSpacing: -0.43,
  },
}); 