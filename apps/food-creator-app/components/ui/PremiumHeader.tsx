import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

interface PremiumHeaderProps {
  title: string;
  onInfoPress?: () => void;
  showInfoButton?: boolean;
  style?: ViewStyle;
  titleColor?: string;
}

export const PremiumHeader: React.FC<PremiumHeaderProps> = ({
  title,
  onInfoPress,
  showInfoButton = true,
  style,
  titleColor,
}) => {
  return (
    <View style={[styles.header, style]}>
      <Text style={[styles.title, titleColor && { color: titleColor }]}>{title}</Text>
      {showInfoButton && (
        <TouchableOpacity 
          style={styles.infoButton} 
          onPress={onInfoPress}
          activeOpacity={0.7}
        >
          <Ionicons name="information-circle" size={24} color="#11181C" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 36,
    color: '#031D11',
    fontFamily: 'Archivo',
  },
  infoButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});

