import { ChevronDown } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownProps {
  options: DropdownOption[];
  selectedValue?: string;
  onSelect: (option: DropdownOption) => void;
  placeholder?: string;
  buttonStyle?: any;
  dropdownStyle?: any;
  optionStyle?: any;
  textStyle?: any;
  disabled?: boolean;
  maxHeight?: number;
}

const Dropdown: React.FC<DropdownProps> = ({
  options,
  selectedValue,
  onSelect,
  placeholder = 'Select an option',
  buttonStyle,
  dropdownStyle,
  optionStyle,
  textStyle,
  disabled = false,
  maxHeight = 200,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownLayout, setDropdownLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const buttonRef = useRef<View | null>(null);
  const animatedValue = useRef(new Animated.Value(0)).current;

  const selectedOption = options.find(option => option.value === selectedValue);

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isOpen ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isOpen, animatedValue]);

  const handleButtonPress = () => {
    if (disabled) return;
    
    buttonRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
      setDropdownLayout({ x, y: y + height, width, height });
      setIsOpen(!isOpen);
    });
  };

  const handleOptionSelect = (option: DropdownOption) => {
    onSelect(option);
    setIsOpen(false);
  };

  const handleOverlayPress = () => {
    setIsOpen(false);
  };

  const rotateInterpolate = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const opacityInterpolate = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const scaleInterpolate = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1],
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity
        ref={buttonRef}
        style={[styles.button, buttonStyle, disabled && styles.disabledButton]}
        onPress={handleButtonPress}
        disabled={disabled}
      >
        <Text style={[styles.buttonText, textStyle, disabled && styles.disabledText]}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
          <ChevronDown size={20} color={disabled ? '#999' : '#fff'} />
        </Animated.View>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent={true}
        animationType="none"
        onRequestClose={handleOverlayPress}
      >
        <TouchableWithoutFeedback onPress={handleOverlayPress}>
          <View style={styles.modalOverlay}>
            <Animated.View
              style={[
                styles.dropdown,
                {
                  top: Math.min(dropdownLayout.y, screenHeight - maxHeight - 20),
                  left: Math.max(10, Math.min(dropdownLayout.x, screenWidth - dropdownLayout.width - 10)),
                  width: Math.min(dropdownLayout.width, screenWidth - 20),
                  opacity: opacityInterpolate,
                  transform: [{ scale: scaleInterpolate }],
                  maxHeight,
                },
                dropdownStyle,
              ]}
            >
              <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={true}
                bounces={false}
                nestedScrollEnabled={true}
              >
                {options.map((option, index) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.option,
                      optionStyle,
                      selectedValue === option.value && styles.selectedOption,
                      index === options.length - 1 && styles.lastOption,
                    ]}
                    onPress={() => handleOptionSelect(option)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        textStyle,
                        selectedValue === option.value && styles.selectedOptionText,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 50,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 48,
  },
  disabledButton: {
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '400',
    flex: 1,
  },
  disabledText: {
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  dropdown: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 1001,
    minWidth: 200,
    maxWidth: screenWidth - 20,
  },
  scrollView: {
    maxHeight: '100%',
  },
  option: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: 48,
    justifyContent: 'center',
  },
  lastOption: {
    borderBottomWidth: 0,
  },
  selectedOption: {
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
  },
  optionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '400',
  },
  selectedOptionText: {
    fontWeight: '600',
    color: '#FF3B30',
  },
});

export default Dropdown;
