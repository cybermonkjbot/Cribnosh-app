import React from 'react';

import { Image, View } from 'react-native';

import { LiveIndicator } from './LiveIndicator';

export function CribnoshLiveIndicator() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', height: 24 }}>
      <Image
        source={require('../../assets/images/livelogo.png')}
        style={{ width: 88, height: 24, resizeMode: 'contain' }}
        accessibilityLabel="Cribnosh Logo"
      />
      {/* LiveIndicator will now appear directly beside the logo */}
      <LiveIndicator />
    </View>
  );
}
