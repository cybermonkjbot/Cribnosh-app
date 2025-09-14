import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TrySomethingNewScreen() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const handleStartOrdering = () => {
    // Navigate to the main ordering flow
    router.push('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ChevronLeft size={20} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Try something new</Text>
        
        <Text style={styles.description}>
          Discover amazing meals from local kitchens.{'\n'}
          Your treat is ready to use!
        </Text>

        <TouchableOpacity style={styles.startButton} onPress={handleStartOrdering}>
          <Text style={styles.startButtonText}>Start Ordering</Text>
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
  header: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    zIndex: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 100,
    alignItems: 'flex-start',
    justifyContent: 'center',
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
});
