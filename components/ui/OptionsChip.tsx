import type { ReactNode } from 'react';
import * as React from 'react';
import { Text, View, ViewProps } from 'react-native';

export interface OptionsChipProps extends ViewProps {
  icon?: ReactNode;
  children?: ReactNode;
  backgroundColor?: string;
  textColor?: string;
  iconColor?: string;
}

export const OptionsChip: React.FC<OptionsChipProps> = ({ icon, children, style, ...props }) => (
  <View
    style={[ 
      { 
        flexDirection: 'row', 
        alignItems: 'center', 
        borderRadius: 9999, 
        paddingHorizontal: 16, 
        paddingVertical: 6, 
        backgroundColor: props.backgroundColor || '#E5E7EB', // default: gray-200 
        minHeight: 36, 
        alignSelf: 'flex-start', 
        position: 'relative' as const, // ensure correct type for position
      }, 
      style, 
    ]}
    {...props}
  >
    {icon ? (
      <View style={{ marginRight: children ? 8 : 0 }}>
        {React.isValidElement(icon) && props.iconColor
          ? React.cloneElement(icon as React.ReactElement<any>, { ...(icon.props || {}), color: props.iconColor })
          : icon}
      </View>
    ) : null}
    {children ? (
      <Text style={{ color: props.textColor || '#134E3A', fontWeight: '600', fontSize: 16 }}>{children}</Text>
    ) : null}
  </View>
);
