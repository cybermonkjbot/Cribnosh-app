import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface NotLoggedInNoticeProps {
  onSignInPress?: () => void;
}

export const NotLoggedInNotice: React.FC<NotLoggedInNoticeProps> = ({
  onSignInPress = () => {}
}) => {
  const handleSignInPress = () => {
    console.log('NotLoggedInNotice: handleSignInPress called');
    onSignInPress();
  };

  return (
    <View style={styles.container}>
      {/* Main text */}
      <Text style={styles.mainText}>Looks Good, Right?</Text>
      
      {/* Subtitle text */}
      <Text style={styles.subtitleText}>Log in to make it yours. personalize it</Text>
      
      {/* Sign in button */}
      <TouchableOpacity
        onPress={handleSignInPress}
        style={[styles.button, { backgroundColor: "#F0F3FF", borderRadius: 11 }]}
        activeOpacity={0.7}
      >
        <Text style={[styles.buttonText, { color: "#FF3B30", fontFamily: "Urbanist", fontWeight: "700" }]}>
          Sign in
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 20,
  },
  mainText: {
    fontFamily: 'Urbanist',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 32,
    color: '#094327',
    marginBottom: 8,
  },
  subtitleText: {
    fontFamily: 'Urbanist',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 26,
    color: '#000000',
    marginBottom: 20,
  },
  button: {
    width: '100%',
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    lineHeight: 27,
    textAlign: 'center',
  },
});

export default NotLoggedInNotice;