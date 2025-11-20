import { View, type ViewProps } from 'react-native';


export type ThemedViewProps = ViewProps;

export function ThemedView({ style, ...otherProps }: ThemedViewProps) {
  // Use static styles for now, as NativeWind className is not supported on RN View by default
  return <View style={style} {...otherProps} />;
}
