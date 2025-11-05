import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  style?: ViewStyle;
  titleColor?: string;
  subtitleColor?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  style,
  titleColor = '#11181C',
  subtitleColor = '#687076',
}) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: subtitleColor }]}>{subtitle}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
}); 