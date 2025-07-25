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

export const OptionsChip: React.FC<OptionsChipProps> = ({ icon, children, style, backgroundColor, textColor, iconColor, ...props }) => (
  <View
    className="flex-row items-center rounded-full px-4 py-1.5 min-h-[36px] self-start relative"
    style={[{ backgroundColor: backgroundColor || '#E5E7EB' }, style]}
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
      <Text className="font-semibold text-[16px]" style={{ color: textColor || '#134E3A', fontFamily: 'Poppins' }}>{children}</Text>
    ) : null}
  </View>
);
