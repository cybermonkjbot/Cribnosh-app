import { Search } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface FilteredEmptyStateProps {
  filterName: string;
  onClearFilter: () => void;
  isFirstSection?: boolean;
}

export const FilteredEmptyState: React.FC<FilteredEmptyStateProps> = ({
  filterName,
  onClearFilter,
  isFirstSection = false,
}) => {
  const capitalizedFilter = filterName.charAt(0).toUpperCase() + filterName.slice(1);

  return (
    <View style={[styles.container, { paddingTop: isFirstSection ? 75 : 60 }]}>
      <View style={styles.iconContainer}>
        <Search size={48} color="#9CA3AF" />
      </View>
      <Text style={styles.title}>No results found</Text>
      <Text style={styles.subtitle}>
        No {capitalizedFilter} content available. Try a different filter.
      </Text>
      
      <View style={styles.buttonContainer}>
        <Pressable
          onPress={onClearFilter}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Clear Filter</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
    minHeight: 300,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#9CA3AF20',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
    color: '#11181C',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: -0.1,
    color: '#687076',
    marginBottom: 8,
  },
  buttonContainer: {
    marginTop: 32,
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

