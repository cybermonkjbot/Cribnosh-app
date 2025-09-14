import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TreatPage() {
  const { treatId } = useLocalSearchParams<{ treatId: string }>();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading treat data (without deep linking)
    const loadTreatData = async () => {
      try {
        // Here you would typically fetch treat data from your backend
        // using the treatId to get details about the treat
        console.log('Loading treat data for ID:', treatId);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Navigate to shared-link page with treat data
        router.replace({
          pathname: '/shared-link',
          params: { treatId, treatName: 'Joshua' } // You can pass additional data
        });
      } catch (error) {
        console.error('Error loading treat data:', error);
        // Navigate to error page or fallback
        router.replace('/shared-link');
      } finally {
        setIsLoading(false);
      }
    };

    if (treatId) {
      loadTreatData();
    } else {
      // No treat ID provided, redirect to shared-link
      router.replace('/shared-link');
    }
  }, [treatId, router]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Loading your treat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Treat Not Found</Text>
        <Text style={styles.subtitle}>This treat link is invalid or has expired.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF3B30',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.8,
  },
});
