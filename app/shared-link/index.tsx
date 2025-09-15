import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SharedLinkScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ treatId?: string; treatName?: string }>();
  const [treatData, setTreatData] = useState<{ id?: string; name?: string } | null>(null);

  useEffect(() => {
    // Handle deep link parameters
    if (params.treatId) {
      // Decode the treat ID if it's URL encoded
      const decodedTreatId = decodeURIComponent(params.treatId);
      const decodedTreatName = params.treatName ? decodeURIComponent(params.treatName) : 'Someone';
      
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
          {treatData?.name || 'Joshua'} is treating you with no limit !
        </Text>
        
        {/* Subtitle */}
        <Text style={styles.subtitle}>
          {treatData?.id ? 
            `You have a treat waiting!${'\n'}Use this link to claim your meal` :
            `You are treating someone!${'\n'}They'll be able to order once using this link`
          }
        </Text>
        
        {/* Debug Info - Show in development */}
        {treatData?.id && __DEV__ && (
          <Text style={styles.debugText}>
            Treat ID: {treatData.id}
          </Text>
        )}
        
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
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)',
    elevation: 8,
  },
  startOrderButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  debugText: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.7,
    marginTop: 10,
    fontFamily: 'monospace',
  },
});
