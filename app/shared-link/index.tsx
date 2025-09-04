import { useRouter } from 'expo-router';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SharedLinkScreen() {
  const router = useRouter();

  const handleStartOrder = () => {
    // Navigate to the ordering flow
    router.push('/shared-link/Try-something-new');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Full-screen background image */}
      <View style={styles.imageContainer}>
        <Image
          source={require('../../assets/images/on-your-account-image-02.png')}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Main Title */}
        <Text style={styles.mainTitle}>
          Joshua is treating you with no limit !
        </Text>
        
        {/* Subtitle */}
        <Text style={styles.subtitle}>
          You are treating someone!{'\n'}They&apos;ll be able to order once using this link
        </Text>
        
        {/* Start Order Button */}
        <TouchableOpacity 
          style={styles.startOrderButton}
          onPress={handleStartOrder}
          activeOpacity={0.8}
        >
          <Text style={styles.startOrderButtonText}>
            Start order
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF3B30',
  },
  imageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 0,
    paddingBottom: 40,
    zIndex: 10,
  },
  mainTitle: {
    fontSize: 35,
    fontWeight: 'bold',
    color: '#E6FFE8',
    textAlign: 'left',
    textShadowColor: '#10B981',
    textShadowOffset: { width: 4, height: 4 },
    textShadowRadius: 6,
    lineHeight: 42,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'left',
    lineHeight: 24,
    marginBottom: 40,
    alignSelf: 'flex-start',
  },
  startOrderButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#094327',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    marginLeft: 20,
    marginRight: 20,
    marginBottom: 20,
    alignSelf: 'center',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  startOrderButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
