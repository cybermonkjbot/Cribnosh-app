import React from 'react';
import { Image } from 'react-native';

const MessageIcon: React.FC = () => (
  <Image
    source={require('@/assets/images/Messages.png')}
    style={{ width: 20, height: 20, resizeMode: 'contain', borderRadius: 4 }}
  />
);

export default MessageIcon;