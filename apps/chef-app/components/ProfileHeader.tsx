import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Bell, MoreVertical, Star, CheckCircle2 } from 'lucide-react-native';

interface ProfileHeaderProps {
  name: string;
  handle: string;
  profileImage?: string;
  kitchenName?: string;
  stats: {
    likes: number;
    servings: number;
  };
  rating?: number;
  reviewCount?: number;
  isVerified?: boolean;
  specialties?: string[];
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
  specialties,
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
              <CheckCircle2 size={16} color="#059669" fill="#059669" />
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
          {specialties && specialties.length > 0 && (
            <View style={styles.specialtyChipOverlay}>
              <View style={styles.specialtyChip}>
                <Text style={styles.specialtyText}>{specialties[0]}</Text>
              </View>
            </View>
          )}
        </View>
        <Text style={styles.handle}>@{handle}</Text>
        {kitchenName && (
          <View style={styles.kitchenNameContainer}>
            <View style={styles.kitchenNameTag}>
              <Text style={styles.kitchenName}>{kitchenName}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.likes}</Text>
          <Text style={styles.statLabel}>Likes</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.servings}</Text>
          <Text style={styles.statLabel}>Servings</Text>
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
    color: '#065f46',
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
    overflow: 'visible',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    position: 'relative',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    overflow: 'hidden',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
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
  kitchenNameTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FF3B30',
  },
  kitchenName: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
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
    color: '#065f46',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '400',
    fontFamily: 'Inter',
  },
  specialtyChipOverlay: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    transform: [{ rotate: '-12deg' }],
    zIndex: 10,
  },
  specialtyChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#065f46',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  specialtyText: {
    fontSize: 11,
    color: '#065f46',
    fontWeight: '600',
    fontFamily: 'Inter',
  },
});

