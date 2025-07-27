import React from 'react';
import { Pressable, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

interface ChipButtonProps {
  text: string;
  icon?: React.ReactNode;
  backgroundColor?: string;
  textColor?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  onPress?: () => void;
}

export const ChipButton: React.FC<ChipButtonProps> = ({
  text,
  icon,
  backgroundColor = '#094327',
  textColor = '#E6FFE8',
  style,
  textStyle,
  onPress,
}) => {
  const buttonStyle = {
    ...styles.chip,
    backgroundColor: backgroundColor,
  };

  return (
    <Pressable
      style={({ pressed }) => [
        buttonStyle,
        { opacity: pressed ? 0.85 : 1 },
        style, // Custom style can override
      ]}
      onPress={onPress}
    >
      <View style={styles.contentRow}>
        <Text style={[styles.text, { color: textColor }, textStyle]}>{text}</Text>
        {icon && <View style={styles.icon}>{icon}</View>}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 30,
    height: 29,
    minWidth: 137,
    paddingHorizontal: 12,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
  },
  text: {
    fontFamily: 'Lato',
    fontWeight: '700',
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0.03,
    flexShrink: 1,
    textAlign: 'center',
  },
  icon: {
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
    height: 24,
    width: 24,
  },
});

export default ChipButton;
