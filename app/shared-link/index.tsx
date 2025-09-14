import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SharedLinkScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ treatId?: string; treatName?: string }>();
  const [treatData, setTreatData] = useState<{ id?: string; name?: string } | null>(null);

  useEffect(() => {
    // Handle treat parameters (without deep linking)
    if (params.treatId) {
      console.log('Treat opened with treatId:', params.treatId);
      
      // Decode the treat ID if it's URL encoded
      const decodedTreatId = decodeURIComponent(params.treatId);
      const decodedTreatName = params.treatName ? decodeURIComponent(params.treatName) : 'Someone';
      
      console.log('Decoded treatId:', decodedTreatId);
      console.log('Decoded treatName:', decodedTreatName);
      
      setTreatData({
        id: decodedTreatId,
        name: decodedTreatName
      });
    } else {
      // No treat ID provided, set default data
      setTreatData({
        id: undefined,
        name: 'Joshua' // Default name
      });
    }
  }, [params.treatId, params.treatName]);

  const handleStartOrder = () => {
    // Navigate to the ordering flow
    router.push('/shared-link/Try-something-new');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <Text style={styles.title}>
          {treatData?.name ? `${treatData.name} is treating you!` : 'Someone is treating you!'}
        </Text>
        
        <Text style={styles.description}>
          {treatData?.id 
            ? `You've been invited to order a meal using this treat link.`
            : 'You\'ve been invited to order a meal!'
          }
        </Text>

        <TouchableOpacity style={styles.startButton} onPress={handleStartOrder}>
          <Text style={styles.startButtonText}>Start Ordering</Text>
        </TouchableOpacity>
      </View>

      {/* Background image */}
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    alignItems: 'flex-start',
    zIndex: 10,
  },
  title: {
    fontSize: 35,
    fontWeight: 'bold',
    color: '#fff',
    lineHeight: 52,
    marginBottom: 10,
    textShadowColor: '#22c55e',
    textShadowOffset: { width: 6, height: 6 },
    textShadowRadius: 4,
    textAlign: 'left',
    elevation: 4,
  },
  description: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 24,
    marginBottom: 30,
    textAlign: 'left',
  },
  startButton: {
    backgroundColor: '#B12C00',
    borderRadius: 25,
    paddingHorizontal: 30,
    paddingVertical: 12,
    alignItems: 'center',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.4)',
    elevation: 4,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
