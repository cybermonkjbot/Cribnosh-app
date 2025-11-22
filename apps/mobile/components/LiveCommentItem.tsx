import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface LiveCommentItemProps {
  name: string;
  comment: string;
}

const LiveCommentItemComponent: React.FC<LiveCommentItemProps> = ({ name, comment }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.comment} numberOfLines={2} ellipsizeMode="tail">
        {comment}
      </Text>
    </View>
  );
};

// Memoize component to prevent unnecessary re-renders
export const LiveCommentItem = React.memo(LiveCommentItemComponent);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 2,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 20,
    maxWidth: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  name: {
    fontWeight: '600',
    marginRight: 8,
    color: '#E6FFE8',
    fontSize: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  comment: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 18,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default LiveCommentItem;
