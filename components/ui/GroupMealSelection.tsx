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

interface GroupMealSelectionProps {
  quantity: number;
  onPress: () => void;
  variant?: 'select' | 'view';
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

export function GroupMealSelection({
  quantity,
  onPress,
  variant = 'select',
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
}: GroupMealSelectionProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { width: SCREEN_WIDTH } = Dimensions.get('window');
  

  const isSmallScreen = width < 375;
  const buttonWidth = SCREEN_WIDTH - 32; // 20 or 24px padding on each side

  const finalButtonText = buttonText || (variant === 'select' ? 'Select Your Meal' : 'Group Meals Selected');

  const buttonStyle = [
    styles.button,
    {
      backgroundColor,
      position,
      bottom: bottom ?? (variant === 'select' ? 0 : 30),
      left: left ?? (variant === 'select' ? 0 : 20),
      right: right ?? (variant === 'select' ? 0 : 20),
      width: variant === 'select' ? buttonWidth : undefined,
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

  if (variant === 'select' && position === 'absolute') {
    return (
      <View
        style={[
          styles.selectContainer, {marginTop:5},
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
            d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM8 15L3 10L4.41 8.59L8 12.17L15.59 4.58L17 6L8 15Z"
            fill={textColor}
          />
        </Svg>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  selectContainer: {
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
