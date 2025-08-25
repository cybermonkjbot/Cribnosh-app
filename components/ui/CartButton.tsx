import {
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Path, Svg } from 'react-native-svg';

interface CartButtonProps {
  quantity: number;
  onPress: () => void;
  variant?: 'add' | 'view';
  position?: 'absolute' | 'relative';
  bottom?: number;
  left?: number;
  right?: number;
  backgroundColor?: string;
  textColor?: string;
  quantityBadgeColor?: string;
  quantityTextColor?: string;
  buttonText?: string;
  showIcon?: boolean;
  containerStyle?: any;
}

export function CartButton({
  quantity,
  onPress,
  variant = 'add',
  position = 'relative',
  bottom,
  left,
  right,
  backgroundColor = '#FF3B30',
  textColor = '#E6FFE8',
  quantityBadgeColor = '#E6FFE8',
  quantityTextColor = '#FF3B30',
  buttonText,
  showIcon = true,
  containerStyle,
}: CartButtonProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { width: SCREEN_WIDTH } = Dimensions.get('window');
  

  const isSmallScreen = width < 375;
  // const buttonWidth = width - (isSmallScreen ? 40 : 48); // 20 or 24px padding on each side
  const buttonWidth = SCREEN_WIDTH - 32; // 20 or 24px padding on each side

  const finalButtonText = buttonText || (variant === 'add' ? 'Add to Cart' : 'Items in cart');

  const buttonStyle = [
    styles.button,
    {
      backgroundColor,
      position,
      bottom: bottom ?? (variant === 'add' ? 0 : 30),
      left: left ?? (variant === 'add' ? 0 : 20),
      right: right ?? (variant === 'add' ? 0 : 20),
      width: variant === 'add' ? buttonWidth : undefined,
    },
  ];

  const quantityBadgeStyle = [
    styles.quantityBadge,
    {
      backgroundColor: quantityBadgeColor,
    },
  ];

  const quantityTextStyle = [
    styles.quantityText,
    { color: quantityTextColor },
  ];

  const buttonTextStyle = [
    styles.buttonText,
    { color: textColor },
  ];

  if (variant === 'add' && position === 'absolute') {
    return (
      <View
        style={[
          styles.addContainer, {marginTop:5},
          containerStyle ? {} : { paddingBottom: Math.max(insets.bottom, 80) },
          containerStyle, 
        ]}
      >
        <TouchableOpacity style={buttonStyle} onPress={onPress} activeOpacity={0.85}>
          <View style={quantityBadgeStyle}>
            <Text style={quantityTextStyle}>{quantity}</Text>
          </View>
          <Text style={buttonTextStyle}>{finalButtonText}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity style={buttonStyle} onPress={onPress} activeOpacity={0.85}>
      <View style={quantityBadgeStyle}>
        <Text style={quantityTextStyle}>{quantity}</Text>
      </View>
      <Text style={[buttonTextStyle, styles.viewButtonText]}>{finalButtonText}</Text>
      {showIcon && (
        <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
          <Path
            d="M16.4117 20H3.58835C3.2301 20 2.87603 19.923 2.55012 19.7743C2.22421 19.6255 1.93407 19.4085 1.69937 19.1378C1.46466 18.8671 1.29087 18.5492 1.18976 18.2055C1.08866 17.8618 1.0626 17.5004 1.11335 17.1458L2.50835 7.38163C2.53682 7.18313 2.63592 7.00155 2.78746 6.87022C2.939 6.73888 3.13282 6.6666 3.33335 6.66663H16.6667C16.8672 6.6666 17.061 6.73888 17.2126 6.87022C17.3641 7.00155 17.4632 7.18313 17.4917 7.38163L18.8867 17.1458C18.9374 17.5004 18.9114 17.8618 18.8103 18.2055C18.7092 18.5492 18.5354 18.8671 18.3007 19.1378C18.066 19.4085 17.7758 19.6255 17.4499 19.7743C17.124 19.923 16.7699 20 16.4117 20Z"
            fill={textColor}
          />
          <Path
            d="M7.49992 5V4.16667C7.49992 3.50363 7.76331 2.86774 8.23215 2.3989C8.70099 1.93006 9.33688 1.66667 9.99992 1.66667C10.663 1.66667 11.2988 1.93006 11.7677 2.3989C12.2365 2.86774 12.4999 3.50363 12.4999 4.16667V5H14.1666V4.16667C14.1666 3.0616 13.7276 2.00179 12.9462 1.22039C12.1648 0.438987 11.105 0 9.99992 0C8.89485 0 7.83504 0.438987 7.05364 1.22039C6.27224 2.00179 5.83325 3.0616 5.83325 4.16667V5H7.49992Z"
            fill={textColor}
          />
        </Svg>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  addContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 15,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  button: {
    height: 58,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 12,
    zIndex: 9999,
  },
  quantityBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 27,
    textAlign: 'center',
    fontFamily: Platform.select({
      ios: 'Poppins-Bold',
      android: 'Poppins-Bold',
      default: 'Arial',
    }),
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 27,
    textAlign: 'center',
    fontFamily: Platform.select({
      ios: 'Poppins-SemiBold',
      android: 'Poppins-SemiBold',
      default: 'Arial',
    }),
  },
  viewButtonText: {
    flex: 1,
  },
});
