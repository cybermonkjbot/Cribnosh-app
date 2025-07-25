import { StyleSheet, Text, type TextProps } from 'react-native';


export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({ style, type = 'default', ...rest }: ThemedTextProps) {
  // Use static styles for now, as NativeWind className is not supported on RN Text by default
  let textStyle = [styles.default, style];
  if (type === 'title') textStyle = [styles.title, style];
  if (type === 'defaultSemiBold') textStyle = [styles.defaultSemiBold, style];
  if (type === 'subtitle') textStyle = [styles.subtitle, style];
  if (type === 'link') textStyle = [styles.link, style];
  return <Text style={textStyle} {...rest} />;
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: '#0a7ea4',
  },
});
