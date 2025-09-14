import { Image, StyleSheet, View } from 'react-native';

export function TakeoutBox() {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/on-your-account-image-01.png')}
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );
}

// Add default export for route compatibility
export default function TakeoutBoxDefault() {
  return <TakeoutBox />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 30,
  },
  image: {
    width: '90%',
    height: '90%',
  },
});
