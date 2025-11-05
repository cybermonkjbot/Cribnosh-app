import React from 'react';
import { View } from 'react-native';

export const PlayToWinSectionSkeleton: React.FC = () => {
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
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <View style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: '#E5E7EB',
              marginRight: 16,
            }} />
            <View style={{ flex: 1 }}>
              <View style={{
                width: 150,
                height: 22,
                backgroundColor: '#E5E7EB',
                borderRadius: 4,
                marginBottom: 8,
              }} />
              <View style={{
                width: 120,
                height: 16,
                backgroundColor: '#D1D5DB',
                borderRadius: 4,
              }} />
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            <View style={{
              flex: 1,
              height: 48,
              backgroundColor: '#E5E7EB',
              borderRadius: 12,
            }} />
            <View style={{
              flex: 1,
              height: 48,
              backgroundColor: '#E5E7EB',
              borderRadius: 12,
            }} />
          </View>

          <View style={{
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: '#F3F4F6',
            alignItems: 'center',
          }}>
            <View style={{
              width: 200,
              height: 32,
              backgroundColor: '#E5E7EB',
              borderRadius: 8,
            }} />
          </View>
        </View>
      </View>
    </View>
  );
};

