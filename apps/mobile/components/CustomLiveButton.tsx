import { Pressable, StyleSheet, Text, View } from "react-native";

// // Custom Button Component for OnTheStoveBottomSheet
interface CustomButtonProps {
  text: string;
  icon?: React.ReactNode;
  backgroundColor: string;
  textColor: string;
  onPress?: () => void;
  style?: any;
}

const CustomLiveButton: React.FC<CustomButtonProps> = ({
  text,
  icon,
  backgroundColor,
  textColor,
  onPress,
  style,
}) => {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.customButton,
        style,
        {
        
          opacity: pressed ? 0.8 : 1,
        },
      ]}
      onPress={onPress}
    >
      <View style={[styles.buttonContent, { backgroundColor }]}>
        <Text style={[styles.buttonText, { color: textColor }]}>{text}</Text>
        {icon && <View style={styles.buttonIcon}>{icon}</View>}
      </View>
    </Pressable>
  );
};


export default CustomLiveButton;


const styles = StyleSheet.create({
customButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
    buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 30,
    minHeight: 35,
    width: '100%',
  },
  buttonText: {
    fontFamily: 'Lato',
    fontWeight: '700',
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0.03,
    textAlign: 'center',
  },
  buttonIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});