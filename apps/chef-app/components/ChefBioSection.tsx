import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Edit2 } from 'lucide-react-native';

interface ChefBioSectionProps {
  bio?: string;
  specialties?: string[];
  onEdit?: () => void;
  showEditButton?: boolean;
}

const MAX_BIO_LENGTH = 150;

export function ChefBioSection({
  bio,
  specialties,
  onEdit,
  showEditButton = false,
}: ChefBioSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const shouldTruncate = bio && bio.length > MAX_BIO_LENGTH;
  const displayBio = shouldTruncate && !isExpanded
    ? `${bio.substring(0, MAX_BIO_LENGTH)}...`
    : bio;

  return (
    <View style={styles.container}>
      {bio && (
        <View style={styles.bioContainer}>
          <Text style={styles.bioText}>{displayBio}</Text>
          {shouldTruncate && (
            <TouchableOpacity
              onPress={() => setIsExpanded(!isExpanded)}
              style={styles.readMoreButton}
            >
              <Text style={styles.readMoreText}>
                {isExpanded ? 'Read less' : 'Read more'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {specialties && specialties.length > 0 && (
        <View style={styles.specialtiesContainer}>
          {specialties.map((specialty, index) => (
            <View key={index} style={styles.specialtyChip}>
              <Text style={styles.specialtyText}>{specialty}</Text>
            </View>
          ))}
        </View>
      )}

      {showEditButton && onEdit && (
        <TouchableOpacity
          onPress={onEdit}
          style={styles.editButton}
          activeOpacity={0.7}
        >
          <Edit2 size={16} color="#094327" />
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FAFFFA',
  },
  bioContainer: {
    marginBottom: 12,
  },
  bioText: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
    fontWeight: '400',
    fontFamily: 'Inter',
  },
  readMoreButton: {
    marginTop: 4,
  },
  readMoreText: {
    fontSize: 14,
    color: '#094327',
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  specialtyChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  specialtyText: {
    fontSize: 12,
    color: '#094327',
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  editButtonText: {
    fontSize: 14,
    color: '#094327',
    fontWeight: '600',
    fontFamily: 'Inter',
  },
});

