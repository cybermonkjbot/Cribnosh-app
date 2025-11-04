import React from 'react';
import { Text, View } from 'react-native';

export const UsualDinnerSectionEmpty: React.FC = () => {
  return (
    <View style={{
      marginBottom: 24,
      paddingHorizontal: 12,
      paddingVertical: 24,
      alignItems: 'center',
    }}>
      <Text style={{
        color: '#6B7280',
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center',
        marginBottom: 8,
      }}>
        No dinner favorites yet
      </Text>
      <Text style={{
        color: '#9CA3AF',
        fontSize: 14,
        textAlign: 'center',
      }}>
        Order dinner items to see your favorites here
      </Text>
    </View>
  );
};

