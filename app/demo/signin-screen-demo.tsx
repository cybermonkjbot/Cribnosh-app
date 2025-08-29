import { Alert, StyleSheet, View } from 'react-native';
import { SignInScreen } from '../../components/SignInScreen';

export default function SignInScreenDemo() {
  const handleGoogleSignIn = () => {
    Alert.alert('Google Sign In', 'Google sign in functionality would be implemented here');
  };

  const handleAppleSignIn = () => {
    Alert.alert('Apple Sign In', 'Apple sign in functionality would be implemented here');
  };

  return (
    <View style={styles.container}>
      <SignInScreen
        onGoogleSignIn={handleGoogleSignIn}
        onAppleSignIn={handleAppleSignIn}
        // You can pass a custom background image here
        // backgroundImage={require('../../assets/images/your-custom-image.jpg')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
