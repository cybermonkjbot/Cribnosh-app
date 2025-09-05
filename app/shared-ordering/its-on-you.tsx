import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ItsOnYou() {
  const handleBack = () => {
    router.back();
  };

  const handleShare = () => {
    // Navigate to choose friends screen
    console.log('Navigating to choose friends screen...');
    try {
      router.push('./choose-friends');
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const handleChange = () => {
    // Navigate back to amount selection
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with back and share */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={20} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={handleShare} 
          style={styles.shareButton}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.shareText}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title}>
          it&apos;s on you
        </Text>

        {/* Description */}
        <Text style={styles.description}>
          You are treating someone!{'\n'}
          They&apos;ll be able to order once using this link
        </Text>

        {/* Amount Display */}
        <Text style={styles.amount}>£10</Text>

        {/* Change Button */}
        <TouchableOpacity style={styles.changeButton} onPress={handleChange}>
          <Text style={styles.changeText}>Change</Text>
        </TouchableOpacity>
      </View>

      {/* Takeout box image */}
      <View style={styles.imageContainer}>
        <Image
          source={require('../../assets/images/on-your-account-image-01.png')}
          style={styles.takeoutImage}
          resizeMode="contain"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF3B30',
    
  },
  header: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
  shareButton: {
    padding: 12,
    minHeight: 44,
    minWidth: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 20,
    alignItems: 'flex-start',
    zIndex: 5,
  },
  title: {
    fontSize: 35,
    fontWeight: 'bold',
    color: '#fff',
    lineHeight: 52,
    marginBottom: 10    ,
    textShadowColor: '#22c55e',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0,
    textAlign: 'left',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  description: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 24,
    marginBottom: 10,
    textAlign: 'left',
  },
  amount: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#E43636',
    lineHeight: 70,
    marginBottom: 24,
    textShadowColor: '#22c55e',
    textShadowOffset: { width: 4, height: 4 },
    textShadowRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  changeButton: {
    backgroundColor: '#B12C00',
    borderRadius: 25,
    paddingHorizontal: 30,
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  changeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '400',
  },
  imageContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    height: '60%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: -10,
  },
  takeoutImage: {
    width: '90%',
    height: '90%',
  },
});
