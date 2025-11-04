import React from 'react';
import { ScrollView, View } from 'react-native';

interface UsualDinnerSectionSkeletonProps {
  itemCount?: number;
}

export const UsualDinnerSectionSkeleton: React.FC<UsualDinnerSectionSkeletonProps> = ({
  itemCount = 4,
}) => {
  return (
    <View style={{ marginBottom: 24 }}>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 12,
      }}>
        <View style={{
          width: 180,
          height: 24,
          backgroundColor: '#E5E7EB',
          borderRadius: 8,
        }} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingLeft: 12,
          gap: 12,
        }}
      >
        {Array.from({ length: itemCount }).map((_, index) => (
          <View
            key={index}
            style={{
              width: 120,
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <View style={{ position: 'relative', marginBottom: 8 }}>
              <View style={{
                width: 96,
                height: 96,
                borderRadius: 12,
                backgroundColor: '#E5E7EB',
              }} />
              <View style={{
                position: 'absolute',
                top: 6,
                right: 6,
                width: 40,
                height: 20,
                backgroundColor: '#D1D5DB',
                borderRadius: 12,
              }} />
            </View>
            
            <View style={{
              width: 80,
              height: 14,
              backgroundColor: '#E5E7EB',
              borderRadius: 4,
              marginBottom: 8,
            }} />
            <View style={{
              width: 60,
              height: 16,
              backgroundColor: '#D1D5DB',
              borderRadius: 4,
            }} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

