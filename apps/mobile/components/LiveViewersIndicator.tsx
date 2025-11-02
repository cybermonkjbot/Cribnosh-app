import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface LiveViewersIndicatorProps {
  viewers: number;
  showEye?: boolean;
  style?: object;
}

const LiveViewersIndicator: React.FC<LiveViewersIndicatorProps> = ({ viewers, showEye = false, style }) => {
  return (
    <View style={[styles.container, style]}>
      {showEye && (
        <Ionicons name="eye" size={18} color="#fff" style={styles.icon} />
      )}
      <Text style={styles.text}>{viewers} viewers</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 141,
    height: 26,
    left: 75,
    top: 73,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)', // Optional: subtle background for contrast
    borderRadius: 13,
    paddingHorizontal: 10,
  },
  icon: {
    marginRight: 6,
  },
  text: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 15,
    lineHeight: 18,
    color: '#FFFFFF',
  },
});

export default LiveViewersIndicator;
