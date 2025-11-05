import React from 'react';
import { Text, View } from 'react-native';

export const PlayToWinSectionEmpty: React.FC = () => {
  return (
    <View style={{ marginBottom: 24 }}>
      <View style={{ paddingHorizontal: 12 }}>
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: '#E5E7EB',
            padding: 20,
            alignItems: 'center',
          }}
        >
          <Text style={{
            color: '#6B7280',
            fontSize: 16,
            fontWeight: '500',
            textAlign: 'center',
            marginBottom: 8,
          }}>
            No colleagues available
          </Text>
          <Text style={{
            color: '#9CA3AF',
            fontSize: 14,
            textAlign: 'center',
          }}>
            Connect with colleagues to start playing free lunch games
          </Text>
        </View>
      </View>
    </View>
  );
};

