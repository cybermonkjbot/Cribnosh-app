import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

interface OnboardingNoticeBannerProps {
  isBasicOnboardingComplete: boolean;
  isOnboardingComplete: boolean;
  onPress?: () => void;
}

// Shield icon SVG (same as VerificationBanner)
const shieldIconSVG = `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M14 2L24 6V14C24 20.0751 19.0751 25 13 25C6.92487 25 2 20.0751 2 14V6L14 2Z" stroke="#094327" stroke-width="2" fill="none"/>
  <path d="M14 2L24 6V14C24 20.0751 19.0751 25 13 25C6.92487 25 2 20.0751 2 14V6L14 2Z" fill="#094327" fill-opacity="0.1"/>
</svg>`;

export const OnboardingNoticeBanner: React.FC<OnboardingNoticeBannerProps> = ({
  isBasicOnboardingComplete,
  isOnboardingComplete,
  onPress,
}) => {
  const handlePress = () => {
    if (onPress) {
      onPress();
    }
  };

  // Determine message based on what's incomplete
  let message = '';
  if (!isBasicOnboardingComplete) {
    message = 'Complete your profile setup to start accepting orders';
  } else if (!isOnboardingComplete) {
    message = 'Complete your compliance training to go online and accept orders';
  } else {
    return null; // Don't show banner if everything is complete
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Shield icon */}
      <View style={styles.shieldContainer}>
        <SvgXml 
          xml={shieldIconSVG} 
          width={28} 
          height={28}
        />
      </View>
      
      {/* Verification text */}
      <View style={styles.textContainer}>
        <Text style={styles.verificationText}>
          {message}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 72,
    backgroundColor: '#E6FFE8',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
    // Glowing green shadow effect matching the CSS specifications
    shadowColor: '#E6FFE8',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 1,
    shadowRadius: 80,
    elevation: 20, // Android shadow equivalent
    borderWidth: 1,
    borderColor: '#D4EDDA',
  },
  shieldContainer: {
    width: 28,
    height: 28,
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 4,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  verificationText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#094327',
    flexWrap: 'wrap',
  },
});

export default OnboardingNoticeBanner;

