import { Alert, StyleSheet, View } from 'react-native';
import { SignInSocialSelectionCard } from '../../components/SignInSocialSelectionCard';

export default function SignInSocialSelectionCardDemo() {
  const handleGoogleSignIn = () => {
    Alert.alert('Google Sign In', 'Google sign in functionality would be implemented here');
  };

  const handleAppleSignIn = () => {
    Alert.alert('Apple Sign In', 'Apple sign in functionality would be implemented here');
  };

  return (
    <View style={styles.container}>
      <SignInSocialSelectionCard
        onGoogleSignIn={handleGoogleSignIn}
        onAppleSignIn={handleAppleSignIn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
