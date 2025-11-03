import React from 'react';
import { View, Text } from 'react-native';

export function LiveIndicator() {
  return (
    <View style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 0,
      width: 32,
      height: 18,
      backgroundColor: '#FF3B30',
      borderRadius: '9px',
      marginLeft: 5,
    }}>
      <Text style={{
        color: '#fff',
        fontWeight: '700',
        fontSize: 11,
        lineHeight: 15,
        fontFamily: 'inherit',
      }}>
        Live
      </Text>
    </View>
  );
}
