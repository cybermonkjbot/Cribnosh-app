import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface LiveCommentItemProps {
  name: string;
  comment: string;
}

export const LiveCommentItem: React.FC<LiveCommentItemProps> = ({ name, comment }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.comment} numberOfLines={2} ellipsizeMode="tail">
        {comment}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    maxWidth: '90%',
  },
  name: {
    fontWeight: 'bold',
    marginRight: 6,
    color: '#333',
  },
  comment: {
    flex: 1,
    color: '#444',
  },
});

export default LiveCommentItem;
