import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Bell, MoreVertical, Star, CheckCircle2 } from 'lucide-react-native';

interface ProfileHeaderProps {
  name: string;
  handle: string;
  profileImage?: string;
  kitchenName?: string;
  stats: {
    recipes: number;
    liveSessions: number;
    videos: number;
    meals: number;
  };
  rating?: number;
  reviewCount?: number;
  isVerified?: boolean;
  onBack?: () => void;
  onNotifications?: () => void;
  onMenu?: () => void;
}

export function ProfileHeader({
  name,
  handle,
  profileImage,
  kitchenName,
  stats,
  rating,
  reviewCount,
  isVerified,
  onBack,
  onNotifications,
  onMenu,
}: ProfileHeaderProps) {
  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.iconButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        )}
        <View style={styles.nameContainer}>
          <Text style={styles.username}>{name}</Text>
          {isVerified && (
            <View style={styles.verifiedBadge}>
              <CheckCircle2 size={16} color="#0B9E58" fill="#0B9E58" />
            </View>
          )}
          {rating !== undefined && rating > 0 && (
            <View style={styles.ratingContainer}>
              <Star size={14} color="#FFB800" fill="#FFB800" />
              <Text style={styles.ratingText}>
                {rating.toFixed(1)}
                {reviewCount !== undefined && reviewCount > 0 && (
                  <Text style={styles.reviewCount}> ({reviewCount})</Text>
                )}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.rightIcons}>
          {onNotifications && (
            <TouchableOpacity onPress={onNotifications} style={styles.iconButton}>
              <Bell size={24} color="#000" />
            </TouchableOpacity>
          )}
          {onMenu && (
            <TouchableOpacity onPress={onMenu} style={styles.iconButton}>
              <MoreVertical size={24} color="#000" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Profile Section */}
      <View style={styles.profileSection}>
        <View style={styles.profileImageContainer}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderText}>
                {name?.charAt(0).toUpperCase() || 'C'}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.handle}>@{handle}</Text>
        {kitchenName && (
          <View style={styles.kitchenNameContainer}>
            <Text style={styles.kitchenName}>{kitchenName}</Text>
          </View>
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.recipes}</Text>
          <Text style={styles.statLabel}>Recipes</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.liveSessions}</Text>
          <Text style={styles.statLabel}>Live</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.videos}</Text>
          <Text style={styles.statLabel}>Videos</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.meals}</Text>
          <Text style={styles.statLabel}>Meals</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FAFFFA',
    paddingTop: 8,
    paddingBottom: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconButton: {
    padding: 4,
  },
  backIcon: {
    fontSize: 24,
    color: '#000',
    fontWeight: '600',
  },
  nameContainer: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  username: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Archivo',
    color: '#094327',
  },
  verifiedBadge: {
    marginTop: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  reviewCount: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '400',
    fontFamily: 'Inter',
  },
  rightIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#E5E5E5',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  handle: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter',
    color: '#6B7280',
    marginBottom: 4,
  },
  kitchenNameContainer: {
    marginTop: 4,
  },
  kitchenName: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
    color: '#094327',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter',
    color: '#094327',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '400',
    fontFamily: 'Inter',
  },
});

