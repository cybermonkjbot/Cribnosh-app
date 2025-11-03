import type { ReactNode } from 'react';
import * as React from 'react';
import { StyleSheet, Text, View, ViewProps } from 'react-native';

export interface OptionsChipProps extends ViewProps {
  icon?: ReactNode;
  children?: ReactNode;
  backgroundColor?: string;
  textColor?: string;
  iconColor?: string;
}

export const OptionsChip: React.FC<OptionsChipProps> = ({ icon, children, style, backgroundColor, textColor, iconColor, ...props }) => (
  <View
    style={[
      styles.container,
      { backgroundColor: backgroundColor || '#E5E7EB' },
      style,
    ]}
    {...props}
  >
    {icon ? (
      <View style={{ marginRight: children ? 8 : 0 }}>
        {React.isValidElement(icon) && iconColor
          ? React.cloneElement(icon as React.ReactElement<any>, { ...(icon.props || {}), color: iconColor })
          : icon}
      </View>
    ) : null}
    {children ? (
      <Text style={[styles.text, { color: textColor || '#134E3A', fontFamily: 'Poppins' }]}>
        {children}
      </Text>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', // flex-row
    alignItems: 'center', // items-center
    borderRadius: 9999, // rounded-full
    paddingHorizontal: 16, // px-4
    paddingVertical: 6, // py-1.5
    minHeight: 36, // min-h-[36px]
    alignSelf: 'flex-start', // self-start
    position: 'relative', // relative
  },
  text: {
    fontWeight: '600', // font-semibold
    fontSize: 16, // text-[16px]
  },
});
