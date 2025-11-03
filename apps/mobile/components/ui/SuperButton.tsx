import { ReactNode } from 'react';
import { Pressable, Text, TextStyle, ViewStyle } from 'react-native';

interface SuperButtonProps {
  title: string | ReactNode;
  onPress: () => void;
  backgroundColor?: string;
  textColor?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function SuperButton({
  title,
  onPress,
  backgroundColor = '#094327',
  textColor = 'white',
  style,
  textStyle,
}: SuperButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor,
          paddingVertical: 20,
          paddingHorizontal: 24,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      {typeof title === 'string' ? (
        <Text
          style={[
            {
              color: textColor,
              fontSize: 18,
              fontWeight: 'bold',
              textAlign: 'center',
            },
            textStyle,
          ]}
        >
          {title}
        </Text>
      ) : (
        title
      )}
    </Pressable>
  );
}
