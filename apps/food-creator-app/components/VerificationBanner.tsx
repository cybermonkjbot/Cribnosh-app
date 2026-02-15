import { StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

interface VerificationBannerProps {
  style?: any;
  containerStyle?: any;
  text?: string;
}

// Shield icon SVG
const shieldIconSVG = `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M14 2L24 6V14C24 20.0751 19.0751 25 13 25C6.92487 25 2 20.0751 2 14V6L14 2Z" stroke="#094327" stroke-width="2" fill="none"/>
  <path d="M14 2L24 6V14C24 20.0751 19.0751 25 13 25C6.92487 25 2 20.0751 2 14V6L14 2Z" fill="#094327" fill-opacity="0.1"/>
</svg>`;

export function VerificationBanner({ 
  style, 
  containerStyle, 
  text = "Finish your verification to help kitchens serve you better" 
}: VerificationBannerProps) {
  return (
    <View style={[styles.container, containerStyle]}>
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
          {text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 72,
    backgroundColor: '#E6FFE8',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
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
