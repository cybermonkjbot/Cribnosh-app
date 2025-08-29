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
    borderRadius: 30,
    height: 35,
    minWidth: 150,
    paddingHorizontal: 16,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    backgroundColor: 'blue',
  },
    buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    
    
    
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