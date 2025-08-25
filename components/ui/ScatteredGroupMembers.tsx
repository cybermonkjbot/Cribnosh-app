import GroupOrderMember from '@/components/GroupOrderMember';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

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
}

interface Position {
  top: number;
  left: number;
  scale: number;
}

const ScatteredGroupMembers: React.FC<ScatteredGroupMembersProps> = ({ 
  members, 
  marginTop = 24,
  refreshKey = 0
}) => {
  const [positions, setPositions] = useState<Position[]>([]);

  // Generate natural, close positions without artificial clustering
  const generateNonOverlappingPositions = () => {
    const newPositions: Position[] = [];
    const memberSize = 70;
    const containerWidth = 320;
    const containerHeight = 800;
    const topViewableHeight = 300;
    
    // Ensure at least 3 members are in the top viewable area
    const topMembers = Math.min(3, members.length);
    const remainingMembers = members.length - topMembers;
    
    // Position top members naturally in viewable area
    for (let i = 0; i < topMembers; i++) {
      let attempts = 0;
      let position: Position = {
        top: Math.random() * (topViewableHeight - memberSize),
        left: Math.random() * (containerWidth - memberSize),
        scale: 0.8 + Math.random() * 0.4,
      };
      let hasCollision = true;
      
      while (hasCollision && attempts < 100) {
        position = {
          top: Math.random() * (topViewableHeight - memberSize),
          left: Math.random() * (containerWidth - memberSize),
          scale: 0.8 + Math.random() * 0.4,
        };
        
        // Simple collision detection
        hasCollision = newPositions.some(existing => {
          const thisLeft = position.left;
          const thisRight = position.left + memberSize;
          const thisTop = position.top;
          const thisBottom = position.top + memberSize;
          
          const existingLeft = existing.left;
          const existingRight = existing.left + memberSize;
          const existingTop = existing.top;
          const existingBottom = existing.top + memberSize;
          
          return !(thisLeft > existingRight || 
                   thisRight < existingLeft || 
                   thisTop > existingBottom || 
                   thisBottom < existingTop);
        });
        
        attempts++;
      }
      
      // Use position even if there's collision
      if (attempts >= 100) {
        position = {
          top: Math.random() * (topViewableHeight - memberSize),
          left: Math.random() * (containerWidth - memberSize),
          scale: 0.8 + Math.random() * 0.4,
        };
      }
      
      newPositions.push(position);
    }
    
    // Position remaining members with natural spacing
    for (let i = topMembers; i < members.length; i++) {
      let attempts = 0;
      let position: Position = {
        top: topViewableHeight + Math.random() * (containerHeight - topViewableHeight - memberSize),
        left: Math.random() * (containerWidth - memberSize),
        scale: 0.7 + Math.random() * 0.6,
      };
      let hasCollision = true;
      
      while (hasCollision && attempts < 100) {
        // Natural distribution - prefer areas near existing members
        const nearExisting = Math.random() < 0.7; // 70% chance to be near existing
        
        if (nearExisting && newPositions.length > 0) {
          // Pick a random existing member and position near them
          const referenceMember = newPositions[Math.floor(Math.random() * newPositions.length)];
          const offsetX = (Math.random() - 0.5) * 150; // ±75px horizontal
          const offsetY = (Math.random() - 0.5) * 150; // ±75px vertical
          
          position = {
            top: Math.max(0, Math.min(containerHeight - memberSize, 
              referenceMember.top + offsetY)),
            left: Math.max(0, Math.min(containerWidth - memberSize, 
              referenceMember.left + offsetX)),
            scale: 0.7 + Math.random() * 0.6,
          };
        } else {
          // Completely random position
          position = {
            top: topViewableHeight + Math.random() * (containerHeight - topViewableHeight - memberSize),
            left: Math.random() * (containerWidth - memberSize),
            scale: 0.7 + Math.random() * 0.6,
          };
        }
        
        // Simple collision detection
        hasCollision = newPositions.some(existing => {
          const thisLeft = position.left;
          const thisRight = position.left + memberSize;
          const thisTop = position.top;
          const thisBottom = position.top + memberSize;
          
          const existingLeft = existing.left;
          const existingRight = existing.left + memberSize;
          const existingTop = existing.top;
          const existingBottom = existing.top + memberSize;
          
          return !(thisLeft > existingRight || 
                   thisRight < existingLeft || 
                   thisTop > existingBottom || 
                   thisBottom < existingTop);
        });
        
        attempts++;
      }
      
      // Use position even if there's collision
      if (attempts >= 100) {
        position = {
          top: topViewableHeight + Math.random() * (containerHeight - topViewableHeight - memberSize),
          left: Math.random() * (containerWidth - memberSize),
          scale: 0.7 + Math.random() * 0.6,
        };
      }
      
      newPositions.push(position);
    }
    
    setPositions(newPositions);
  };

  // Generate positions on mount and when refreshKey changes
  useEffect(() => {
    generateNonOverlappingPositions();
  }, [refreshKey]);

  return (
    <View
      style={[
        styles.container,
        { marginTop }
      ]}
    >
      {members.map((member, idx) => {
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
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    minHeight: 800, // Ensure minimum height for positioning
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
});

export default ScatteredGroupMembers;
