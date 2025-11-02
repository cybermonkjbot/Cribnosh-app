import GroupOrderMember from '@/components/GroupOrderMember';
import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';

interface GroupMember {
  name: string;
  avatarUri: string;
  top: number;
  left: number;
  status: string;
  isDone: boolean;
}

interface ScatteredGroupMembersProps {
  members: GroupMember[];
  marginTop?: number;
  refreshKey?: number;
  searchQuery?: string;
}

interface Position {
  top: number;
  left: number;
  scale: number;
}

const ScatteredGroupMembers: React.FC<ScatteredGroupMembersProps> = ({ 
  members, 
  marginTop = 24,
  refreshKey = 0,
  searchQuery = ''
}) => {
  const screenWidth = Dimensions.get('window').width;

  // Generate positions with proper overlap avoidance (deterministic but appearing random)
  // Memoized to avoid recalculating - positions are stable and don't refresh
  const positions = useMemo(() => {
    const newPositions: Position[] = [];
    const memberSize = 80; // Increased size to account for status text and done indicator
    const containerPadding = 40; // Horizontal padding to prevent clipping
    const containerWidth = screenWidth - (containerPadding * 2) - 40; // Full width minus margins and padding
    const containerHeight = 400; // Half the typical scroll view height (800/2)
    const minSpacing = memberSize + 20; // Minimum distance between member centers
    
    // Create a grid-based approach for better overlap avoidance
    const gridSize = minSpacing;
    const cols = Math.floor(containerWidth / gridSize);
    const rows = Math.floor(containerHeight / gridSize);
    
    // Create available grid positions with pseudo-random offsets
    // Positions are stable - based only on grid position, not refreshKey
    const availablePositions: Position[] = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // Use deterministic pseudo-random offsets based on row/col position
        const offsetTop = ((row * 7 + col * 13) % 21) - 10; // Pseudo-random between -10 and 10
        const offsetLeft = ((row * 11 + col * 17) % 21) - 10; // Pseudo-random between -10 and 10
        const scaleOffset = ((row * 3 + col * 5) % 41) / 100; // Pseudo-random between 0 and 0.4
        
        const top = row * gridSize + offsetTop + 40; // Account for container paddingTop
        const left = col * gridSize + offsetLeft + containerPadding; // Account for container paddingHorizontal
        const scale = 0.8 + scaleOffset;
        
        availablePositions.push({ top, left, scale });
      }
    }
    
    // Deterministic shuffle using member count only (no refreshKey to keep positions stable)
    const shuffledPositions = [...availablePositions];
    for (let i = shuffledPositions.length - 1; i > 0; i--) {
      // Use member count only to create deterministic shuffle (stable positions)
      const j = (i * 17 + members.length) % (i + 1);
      [shuffledPositions[i], shuffledPositions[j]] = [shuffledPositions[j], shuffledPositions[i]];
    }
    
    // Position members using available grid positions
    for (let i = 0; i < members.length && i < shuffledPositions.length; i++) {
      newPositions.push(shuffledPositions[i]);
    }
    
    // If we have more members than grid positions, add some with deterministic offset positioning
    if (members.length > shuffledPositions.length) {
      for (let i = shuffledPositions.length; i < members.length; i++) {
        let attempts = 0;
        // Stable positioning based on member index only (no refreshKey)
        let position: Position = {
          top: 40 + ((i * 23) % (containerHeight - memberSize)),
          left: containerPadding + ((i * 29) % (containerWidth - memberSize)),
          scale: 0.7 + ((i * 31) % 61) / 100,
        };
        let hasCollision = true;
        
        while (hasCollision && attempts < 50) {
          // Try to find a position near existing members using deterministic selection
          const referenceIndex = (i * 19 + attempts) % newPositions.length;
          const referenceMember = newPositions[referenceIndex];
          
          // Deterministic offsets based on member index and attempts
          const offsetX = (((i * 37 + attempts * 41) % 101) - 50) * minSpacing / 100;
          const offsetY = (((i * 43 + attempts * 47) % 101) - 50) * minSpacing / 100;
          
          position = {
            top: Math.max(40, Math.min(containerHeight - memberSize + 40, 
              referenceMember.top + offsetY)),
            left: Math.max(containerPadding, Math.min(containerWidth - memberSize + containerPadding, 
              referenceMember.left + offsetX)),
            scale: 0.7 + ((i * 53 + attempts * 59) % 61) / 100,
          };
          
          // Check collision with all existing positions
          hasCollision = newPositions.some(existing => {
            const distance = Math.sqrt(
              Math.pow(position.top - existing.top, 2) + 
              Math.pow(position.left - existing.left, 2)
            );
            return distance < minSpacing;
          });
          
          attempts++;
        }
        
        // If we still have collision, use deterministic fallback position (stable, no refreshKey)
        if (hasCollision) {
          position = {
            top: 40 + ((i * 67) % (containerHeight - memberSize)),
            left: containerPadding + ((i * 73) % (containerWidth - memberSize)),
            scale: 0.7 + ((i * 83) % 61) / 100,
          };
        }
        
        newPositions.push(position);
      }
    }
    
    return newPositions;
  }, [members.length, screenWidth]); // Only recalculate when member count or screen width changes - NOT on refreshKey

  return (
    <View
      style={[
        styles.container,
        { marginTop }
      ]}
    >
      {members.length === 0 && searchQuery ? (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>
            No members found matching &quot;{searchQuery}&quot;
          </Text>
          <Text style={styles.noResultsSubtext}>
            Try searching by name or status
          </Text>
        </View>
      ) : (
        members.map((member, idx) => {
          const position = positions[idx] || { top: 0, left: 0, scale: 1.0 };
          
          return (
            <View 
              key={idx}
              style={[
                styles.memberContainer,
                {
                  top: position.top,
                  left: position.left,
                  transform: [{ scale: position.scale }],
                  zIndex: members.length - idx,
                }
              ]}
            >
              <GroupOrderMember
                name={member.name}
                avatarUri={member.avatarUri}
                showMessageIcon={true}
                textColor="#E6FFE8"
              />
              
              {/* Status Text */}
              <Text style={styles.statusText}>
                {member.status}
              </Text>
              
              {/* Done Indicator */}
              {member.isDone && (
                <View style={styles.doneIndicator}>
                  <Text style={styles.doneText}>✓</Text>
                </View>
              )}
            </View>
          );
        })
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    minHeight: 400, // Reduced to half the scroll view height
    paddingBottom: 120, // Add bottom padding to ensure content is visible above floating buttons
    paddingTop: 40, // Top padding to prevent clipping of done indicators
    paddingHorizontal: 40, // Horizontal padding to prevent clipping of avatars near edges
    overflow: 'visible', // Allow absolutely positioned children to be visible
  },
  memberContainer: {
    position: 'absolute',
    alignItems: 'center',
    // Debug: uncomment to see member boundaries
    // borderWidth: 1,
    // borderColor: 'red',
  },
  statusText: {
    color: '#E6FFE8',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 80,
    lineHeight: 16,
  },
  doneIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#02120A',
  },
  doneText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    color: '#E6FFE8',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  noResultsSubtext: {
    color: '#EAEAEA',
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
  },
});

export default ScatteredGroupMembers;
