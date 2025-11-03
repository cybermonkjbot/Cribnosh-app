import { Alert, StyleSheet, View } from 'react-native';
import { SocialSignIn } from '../../components/SocialSignIn';

export default function SocialSignInDemo() {
  const handleGoogleSignIn = () => {
    Alert.alert('Google Sign In', 'Google sign in functionality would be implemented here');
  };

  const handleAppleSignIn = () => {
    Alert.alert('Apple Sign In', 'Apple sign in functionality would be implemented here');
  };

  return (
    <View style={styles.container}>
      <SocialSignIn
        onGoogleSignIn={handleGoogleSignIn}
        onAppleSignIn={handleAppleSignIn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
});
